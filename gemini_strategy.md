# Gemini API Strategi og Konfigurasjon

Denne filen beskriver oppdatert konfigurasjon for samtalesimulatoren.

## 1. Modellvalg
**Endring:** Bytt fra preview-modell til stabil produksjonsmodell.
- **Gammel:** `gemini-2.5-flash-preview`
- **Ny (skal brukes):** `gemini-2.5-flash`

Begrunnelse: Preview-modeller er ustabile og kan ha utløpsdatoer. 2.5 Flash er raskest, billigst og best egnet for chat-applikasjoner.

## 2. Token-strategi (Dynamisk begrensning)
Vi skal ikke bruke en global begrensning for `maxOutputTokens`. Vi må skille mellom "chat-modus" og "analyse-modus".

### Scenario A: Under samtalen (Chat)
Når brukeren snakker med simulatoren.
- **Mål:** Raske, korte svar. Hindre at boten skriver lange avhandlinger.
- **Konfigurasjon:** Sett `maxOutputTokens` til **ca. 300**.

### Scenario B: Etter samtalen (Analyse/Feedback)
Når samtalen er over og vi ber om en oppsummering/analyse.
- **Mål:** En grundig og komplett analyserapport.
- **Input:** Send hele samtaleloggen (ingen begrensning på input-lengde, Gemini 2.5 Flash håndterer dette fint).
- **Konfigurasjon:** Overstyr `maxOutputTokens` til **4000** for akkurat dette kallet.

## 3. Implementeringslogikk (Eksempel)

Bruk logikk tilsvarende dette ved kall til API-et for analysen:

```javascript
// Ved vanlig chat: Bruk standard config (lav maxOutputTokens)

// Ved slutt-analyse:
const result = await model.generateContent({
    contents: [
        { role: "user", parts: [{ text: "Her er samtaleloggen: " + JSON.stringify(chatHistory) + ". Gi meg en analyse." }]}
    ],
    generationConfig: {
        maxOutputTokens: 4000, // VIKTIG: Gi plass til hele analysen her
        temperature: 0.7 
    }
});