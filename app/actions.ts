'use server';

// Denne filen kjører KUN på serveren. Ingen nøkler lekker ut herfra.

const API_KEY = process.env.GEMINI_API_KEY;
const ACCESS_CODE = process.env.ACCESS_CODE;

// === SIKKERHETSKONFIGURASJON ===
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minutt
const MAX_REQUESTS_PER_WINDOW = 10; // Maks 10 forespørsler per minutt
const MAX_REQUESTS_PER_DAY = 100; // Maks 100 forespørsler per bruker per dag
const DAILY_GLOBAL_LIMIT = parseInt(process.env.DAILY_GLOBAL_LIMIT || '5000', 10);
const MAX_OUTPUT_TOKENS_CHAT = 1500; // AI-respons lengde for chat
const MAX_OUTPUT_TOKENS_ANALYSIS = 6000; // Komplett JSON-analyse med margin

// In-memory rate limiting (per server instance)
// I produksjon bør dette erstattes med Redis eller lignende
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const dailyLimitMap = new Map<string, { count: number; resetTime: number }>();

// Global daglig teller
let globalDailyCount = 0;
let globalDailyResetTime = getNextMidnight();
let globalWarning80Logged = false;

function getNextMidnight(): number {
  const now = new Date();
  const midnight = new Date(now);
  midnight.setHours(24, 0, 0, 0);
  return midnight.getTime();
}

// --- Kill switch ---
function checkKillSwitch(): boolean {
  const enabled = process.env.API_ENABLED;
  // Kun deaktivert hvis eksplisitt satt til 'false'
  return enabled === 'false';
}

// --- Global daglig grense ---
function checkGlobalDailyLimit(): { allowed: boolean; remaining: number } {
  const now = Date.now();
  if (now > globalDailyResetTime) {
    globalDailyCount = 0;
    globalDailyResetTime = getNextMidnight();
    globalWarning80Logged = false;
  }

  if (globalDailyCount >= DAILY_GLOBAL_LIMIT) {
    console.error(`[RATE LIMIT] Global daglig grense nådd: ${globalDailyCount}/${DAILY_GLOBAL_LIMIT}`);
    return { allowed: false, remaining: 0 };
  }

  globalDailyCount++;

  // 80%-varsel
  const threshold80 = Math.floor(DAILY_GLOBAL_LIMIT * 0.8);
  if (globalDailyCount >= threshold80 && !globalWarning80Logged) {
    console.warn(`[ADVARSEL] 80% av global daglig grense nådd: ${globalDailyCount}/${DAILY_GLOBAL_LIMIT}`);
    globalWarning80Logged = true;
  }

  return { allowed: true, remaining: DAILY_GLOBAL_LIMIT - globalDailyCount };
}

// --- Daglig grense per bruker ---
function checkDailyUserLimit(identifier: string): { allowed: boolean; remaining: number; resetInSeconds: number } {
  const now = Date.now();

  // Lazy cleanup
  if (dailyLimitMap.size > 200) {
    for (const [key, value] of dailyLimitMap.entries()) {
      if (now > value.resetTime) dailyLimitMap.delete(key);
    }
  }

  const entry = dailyLimitMap.get(identifier);

  if (!entry || now > entry.resetTime) {
    dailyLimitMap.set(identifier, { count: 1, resetTime: getNextMidnight() });
    return { allowed: true, remaining: MAX_REQUESTS_PER_DAY - 1, resetInSeconds: Math.ceil((getNextMidnight() - now) / 1000) };
  }

  if (entry.count >= MAX_REQUESTS_PER_DAY) {
    const resetInSeconds = Math.ceil((entry.resetTime - now) / 1000);
    // 80%-varsel per bruker (logges når de treffer grensen)
    console.warn(`[RATE LIMIT] Bruker ${identifier.substring(0, 8)}... har brukt opp daglig grense (${MAX_REQUESTS_PER_DAY})`);
    return { allowed: false, remaining: 0, resetInSeconds };
  }

  entry.count++;

  // 80%-varsel per bruker
  const threshold80 = Math.floor(MAX_REQUESTS_PER_DAY * 0.8);
  if (entry.count === threshold80) {
    console.warn(`[ADVARSEL] Bruker ${identifier.substring(0, 8)}... har nådd 80% av daglig grense: ${entry.count}/${MAX_REQUESTS_PER_DAY}`);
  }

  const resetInSeconds = Math.ceil((entry.resetTime - now) / 1000);
  return { allowed: true, remaining: MAX_REQUESTS_PER_DAY - entry.count, resetInSeconds };
}

// --- Burst rate limit (per minutt) ---
function cleanupRateLimitMap() {
  const now = Date.now();
  for (const [key, value] of rateLimitMap.entries()) {
    if (now > value.resetTime) {
      rateLimitMap.delete(key);
    }
  }
}

function checkRateLimit(identifier: string): { allowed: boolean; remainingRequests: number; resetInSeconds: number } {
  // Lazy cleanup: rens gamle entries ved behov
  if (rateLimitMap.size > 100) cleanupRateLimitMap();

  const now = Date.now();
  const entry = rateLimitMap.get(identifier);

  if (!entry || now > entry.resetTime) {
    // Nytt vindu
    rateLimitMap.set(identifier, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS });
    return { allowed: true, remainingRequests: MAX_REQUESTS_PER_WINDOW - 1, resetInSeconds: 60 };
  }

  if (entry.count >= MAX_REQUESTS_PER_WINDOW) {
    const resetInSeconds = Math.ceil((entry.resetTime - now) / 1000);
    return { allowed: false, remainingRequests: 0, resetInSeconds };
  }

  entry.count++;
  const resetInSeconds = Math.ceil((entry.resetTime - now) / 1000);
  return { allowed: true, remainingRequests: MAX_REQUESTS_PER_WINDOW - entry.count, resetInSeconds };
}

export async function validateAccessCode(code: string): Promise<boolean> {
  if (!ACCESS_CODE) {
    console.error('ACCESS_CODE miljøvariabel mangler');
    return false;
  }
  return code === ACCESS_CODE;
}

export type ChatResult = {
  text?: string;
  error?: string;
  errorCode?: 'RATE_LIMIT' | 'DAILY_LIMIT' | 'SERVICE_DISABLED' | 'INPUT_TOO_LONG' | 'API_ERROR' | 'NO_RESPONSE' | 'NETWORK_ERROR';
  remainingRequests?: number;
  resetInSeconds?: number;
};

export async function chatWithGemini(
  prompt: string,
  systemInstruction: string,
  clientId?: string,
  isAnalysis?: boolean
): Promise<ChatResult> {
  // Bruk clientId eller fallback til 'anonymous'
  const identifier = clientId || 'anonymous';

  // Bruk høyere token-grense for analyse
  const maxOutputTokens = isAnalysis ? MAX_OUTPUT_TOKENS_ANALYSIS : MAX_OUTPUT_TOKENS_CHAT;

  // 1. Kill switch — sjekk om API er deaktivert
  if (checkKillSwitch()) {
    return {
      error: 'Pratiro er midlertidig deaktivert for vedlikehold. Prøv igjen senere.',
      errorCode: 'SERVICE_DISABLED'
    };
  }

  // 2. Global daglig grense
  const globalCheck = checkGlobalDailyLimit();
  if (!globalCheck.allowed) {
    return {
      error: 'Pratiro har nådd sin daglige kapasitet. Kom tilbake i morgen!',
      errorCode: 'DAILY_LIMIT'
    };
  }

  // 3. Daglig grense per bruker
  const dailyCheck = checkDailyUserLimit(identifier);
  if (!dailyCheck.allowed) {
    return {
      error: `Du har brukt opp dagens samtaler. Kom tilbake i morgen!`,
      errorCode: 'DAILY_LIMIT',
      remainingRequests: 0,
      resetInSeconds: dailyCheck.resetInSeconds
    };
  }

  // 4. Burst rate limit (per minutt)
  const rateCheck = checkRateLimit(identifier);
  if (!rateCheck.allowed) {
    return {
      error: `Du sender meldinger for raskt. Vent ${rateCheck.resetInSeconds} sekunder.`,
      errorCode: 'RATE_LIMIT',
      remainingRequests: 0,
      resetInSeconds: rateCheck.resetInSeconds
    };
  }

  // 5. Valider input-lengde (prompten inkluderer samtalehistorikk, så vi gir romslig grense)
  if (prompt.length > 200_000) {
    return {
      error: 'Samtalen er for lang. Avslutt for å få veiledning.',
      errorCode: 'INPUT_TOO_LONG'
    };
  }

  // 6. Sjekk API-nøkkel
  if (!API_KEY) {
    console.error('[Gemini] API_KEY is missing!');
    return { error: 'API-nøkkel mangler på serveren.', errorCode: 'API_ERROR' };
  }

  try {

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': API_KEY,
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          systemInstruction: { parts: [{ text: systemInstruction }] },
          generationConfig: {
            maxOutputTokens: maxOutputTokens,
            temperature: 0.8,
          },
        }),
      }
    );

    if (!response.ok) {
      const errorBody = await response.text();
      console.error('Gemini API Error:', response.status, errorBody);

      if (response.status === 429) {
        return {
          error: 'Pratiro trenger en liten tenkepause. Vent litt og prøv igjen.',
          errorCode: 'RATE_LIMIT'
        };
      }
      if (response.status === 404) {
        return { error: 'AI-modellen er ikke tilgjengelig. Prøv igjen senere.', errorCode: 'API_ERROR' };
      }
      return { error: `API error: ${response.status}`, errorCode: 'API_ERROR' };
    }

    const data = await response.json();

    // Sjekk om responsen ble blokkert av sikkerhetsfiltre
    const candidate = data.candidates?.[0];
    if (!candidate) {
      console.error('Gemini: No candidates in response', data.promptFeedback);
      return { error: 'AI kunne ikke generere et svar. Prøv igjen.', errorCode: 'NO_RESPONSE' };
    }

    // Sjekk finishReason
    if (candidate.finishReason && candidate.finishReason !== 'STOP') {
      console.error('Gemini: Unexpected finishReason', candidate.finishReason);
      if (candidate.finishReason === 'SAFETY') {
        return { error: 'AI kunne ikke svare på grunn av innholdsfiltre. Prøv en annen tilnærming.', errorCode: 'NO_RESPONSE' };
      }
      if (candidate.finishReason === 'MAX_TOKENS') {
        // Fortsatt returner teksten hvis vi har noe
        const partialText = candidate.content?.parts?.[0]?.text;
        if (partialText) {
          return {
            text: partialText,
            remainingRequests: rateCheck.remainingRequests,
            resetInSeconds: rateCheck.resetInSeconds
          };
        }
      }
    }

    const text = candidate.content?.parts?.[0]?.text;

    if (!text) {
      console.error('Gemini: No text in response', data.candidates?.[0]?.finishReason);
      return { error: 'Ingen respons fra AI.', errorCode: 'NO_RESPONSE' };
    }

    return {
      text,
      remainingRequests: rateCheck.remainingRequests,
      resetInSeconds: rateCheck.resetInSeconds
    };

  } catch (error) {
    console.error('Server Action Error:', error);
    return { error: 'Kunne ikke koble til AI-tjenesten.', errorCode: 'NETWORK_ERROR' };
  }
}

// === Gemini med bilde (multimodal) ===
export async function chatWithGeminiImage(
  prompt: string,
  imageBase64: string,
  mimeType: string,
  clientId?: string
): Promise<ChatResult> {
  const identifier = clientId || 'anonymous';

  if (checkKillSwitch()) {
    return { error: 'Pratiro er midlertidig deaktivert for vedlikehold. Prøv igjen senere.', errorCode: 'SERVICE_DISABLED' };
  }

  const globalCheck = checkGlobalDailyLimit();
  if (!globalCheck.allowed) {
    return { error: 'Pratiro har nådd sin daglige kapasitet. Kom tilbake i morgen!', errorCode: 'DAILY_LIMIT' };
  }

  const dailyCheck = checkDailyUserLimit(identifier);
  if (!dailyCheck.allowed) {
    return { error: 'Du har brukt opp dagens samtaler. Kom tilbake i morgen!', errorCode: 'DAILY_LIMIT', remainingRequests: 0, resetInSeconds: dailyCheck.resetInSeconds };
  }

  const rateCheck = checkRateLimit(identifier);
  if (!rateCheck.allowed) {
    return { error: `Du sender meldinger for raskt. Vent ${rateCheck.resetInSeconds} sekunder.`, errorCode: 'RATE_LIMIT', remainingRequests: 0, resetInSeconds: rateCheck.resetInSeconds };
  }

  // Begrens bildestørrelse (ca 10 MB base64)
  if (imageBase64.length > 10_000_000) {
    return { error: 'Bildet er for stort. Prøv et mindre bilde.', errorCode: 'INPUT_TOO_LONG' };
  }

  if (!API_KEY) {
    console.error('[Gemini] API_KEY is missing!');
    return { error: 'API-nøkkel mangler på serveren.', errorCode: 'API_ERROR' };
  }

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': API_KEY,
        },
        body: JSON.stringify({
          contents: [{
            parts: [
              { text: prompt },
              { inlineData: { mimeType, data: imageBase64 } }
            ]
          }],
          generationConfig: {
            maxOutputTokens: 2000,
            temperature: 0.3,
          },
        }),
      }
    );

    if (!response.ok) {
      const errorBody = await response.text();
      console.error('Gemini Image API Error:', response.status, errorBody);
      if (response.status === 429) {
        return { error: 'Pratiro trenger en liten tenkepause. Vent litt og prøv igjen.', errorCode: 'RATE_LIMIT' };
      }
      return { error: `API error: ${response.status}`, errorCode: 'API_ERROR' };
    }

    const data = await response.json();
    const candidate = data.candidates?.[0];

    if (!candidate) {
      console.error('Gemini Image: No candidates', data.promptFeedback);
      return { error: 'Bildet kunne ikke behandles. Last opp et bilde av en gloseliste.', errorCode: 'NO_RESPONSE' };
    }

    if (candidate.finishReason === 'SAFETY') {
      return { error: 'Bildet kunne ikke behandles. Last opp et bilde av en gloseliste.', errorCode: 'NO_RESPONSE' };
    }

    const text = candidate.content?.parts?.[0]?.text;
    if (!text) {
      return { error: 'Ingen respons fra AI.', errorCode: 'NO_RESPONSE' };
    }

    return { text, remainingRequests: rateCheck.remainingRequests, resetInSeconds: rateCheck.resetInSeconds };
  } catch (error) {
    console.error('Gemini Image Error:', error);
    return { error: 'Kunne ikke koble til AI-tjenesten.', errorCode: 'NETWORK_ERROR' };
  }
}
