'use server';

// Denne filen kjører KUN på serveren. Ingen nøkler lekker ut herfra.

const API_KEY = process.env.GEMINI_API_KEY;
const ACCESS_CODE = process.env.ACCESS_CODE;

export async function validateAccessCode(code: string): Promise<boolean> {
  if (!ACCESS_CODE) {
    console.error('ACCESS_CODE miljøvariabel mangler');
    return false;
  }
  return code === ACCESS_CODE;
}

export async function chatWithGemini(prompt: string, systemInstruction: string) {
  if (!API_KEY) {
    return { error: 'API-nøkkel mangler på serveren.' };
  }

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          systemInstruction: { parts: [{ text: systemInstruction }] },
        }),
      }
    );

    if (!response.ok) {
      if (response.status === 429) {
        return { error: 'RATE_LIMIT' };
      }
      return { error: `API error: ${response.status}` };
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!text) return { error: 'Ingen respons fra AI.' };
    
    return { text };

  } catch (error) {
    console.error('Server Action Error:', error);
    return { error: 'Kunne ikke koble til AI-tjenesten.' };
  }
}