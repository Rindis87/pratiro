# Pratiro Arena System - Arkitekturplan

## Oversikt

Denne planen beskriver arkitekturen for å utvide Pratiro til å støtte fire arenaer:
- **Familie** (eksisterende, fungerer bra)
- **Arbeidsliv** (ny)
- **Jobbintervju** (ny)
- **Eksamen** (ny)

---

## Nåværende Arkitektur

```
app/
├── page.tsx              # Landingsside med login
├── layout.tsx            # Root layout
├── actions.ts            # Server actions (Gemini API)
├── globals.css           # Tailwind + globale stiler
└── simulator/
    └── page.tsx          # Monolittisk 507-linjers komponent
```

**Problemer:**
1. Alt hardkodet for "Familie"-arena
2. Ingen arena-valg
3. Scenarioer, prompts og analyse i samme komponent
4. Design bruker teal-farger, ikke Pratiro design system

---

## Foreslått Ny Arkitektur

```
app/
├── page.tsx                    # Ny landingsside (Pratiro design)
├── layout.tsx                  # Root layout med fonter
├── actions.ts                  # Server actions (uendret)
├── globals.css                 # Oppdatert med Pratiro CSS-variabler
│
├── config/
│   ├── arenas.ts              # Arena-definisjoner
│   ├── prompts.ts             # System prompts per arena
│   └── types.ts               # TypeScript types
│
├── components/
│   ├── ui/
│   │   ├── Button.tsx         # Pratiro-knapper
│   │   ├── Card.tsx           # Arena-kort
│   │   ├── Logo.tsx           # Pratiro logo med pause-symbol
│   │   └── Icons.tsx          # Alle ikoner
│   │
│   ├── ArenaSelector.tsx      # Velg arena (ny Step 0)
│   ├── ConfigStep.tsx         # Konfigurasjon per arena
│   ├── ChatStep.tsx           # Chat-interface (gjenbrukbar)
│   └── AnalysisStep.tsx       # Analyse-visning (gjenbrukbar)
│
├── hooks/
│   └── useSimulator.ts        # All simulator-logikk
│
└── simulator/
    └── page.tsx               # Wrapper som bruker komponentene
```

---

## Arena Type Definisjon

```typescript
// config/types.ts

export type ArenaId = 'familie' | 'arbeidsliv' | 'jobbintervju' | 'eksamen';

export interface Scenario {
  id: string;
  title: string;
  description: string;
}

export interface ArenaConfig {
  id: ArenaId;
  name: string;
  tagline: string;
  description: string;
  icon: 'family' | 'work' | 'interview' | 'exam';
  color: 'forest' | 'ocean' | 'bark' | 'forest-light';

  // Konfigurasjon
  configFields: ConfigField[];
  getScenarios: (config: ArenaState) => Scenario[];

  // AI Prompts
  getRolePrompt: (config: ArenaState) => string;
  getStartPrompt: (config: ArenaState, scenario: string) => string;
  getContinuePrompt: (config: ArenaState, history: string) => string;
  getAnalysisPrompt: (config: ArenaState, history: string, scenario: string) => string;

  // Tips
  getTips: (config: ArenaState) => string;
}

export interface ConfigField {
  id: string;
  type: 'slider' | 'buttons' | 'dropdown';
  label: string;
  options?: { value: string; label: string }[];
  min?: number;
  max?: number;
  default: string | number;
}

export interface ArenaState {
  [key: string]: string | number;
}

export interface Message {
  role: 'user' | 'ai' | 'system';
  content: string;
}

export interface Analysis {
  mainFeedback: string;
  strengths: string[];
  improvements: string[];
  perspectiveTitle: string;  // "Barnets opplevelse" / "Kollegaens perspektiv" etc.
  perspective: string;
  score: number;
}
```

---

## Arena Konfigurasjoner

### Familie (eksisterende logikk, ny struktur)

```typescript
// config/arenas.ts

export const familieArena: ArenaConfig = {
  id: 'familie',
  name: 'Familie',
  tagline: 'Øv på samtaler med barna',
  description: 'Øv på vanskelige, men viktige samtaler med barna dine. Fra grensesetting til livets store spørsmål.',
  icon: 'family',
  color: 'forest',

  configFields: [
    {
      id: 'age',
      type: 'slider',
      label: 'Barnets alder',
      min: 3,
      max: 18,
      default: 8
    },
    {
      id: 'gender',
      type: 'buttons',
      label: 'Kjønn',
      options: [
        { value: 'Gutt', label: 'Gutt' },
        { value: 'Jente', label: 'Jente' }
      ],
      default: 'Gutt'
    }
  ],

  getScenarios: (config) => {
    const age = config.age as number;
    const gender = config.gender as string;

    if (age >= 3 && age <= 5) {
      return [
        { id: 'dress', title: 'Vil ikke kle på seg', description: 'Morgenkaos. Nekter å ta på parkdressen.' },
        { id: 'food', title: 'Mat-trass', description: 'Liker plutselig ikke maten. Kaster mat på gulvet.' },
        { id: 'bedtime', title: 'Leggetid', description: 'Kommer ut av sengen for 14. gang.' },
        { id: 'store', title: 'Butikk-hyling', description: 'Kaster seg ned fordi hen ikke fikk sjokolade.' },
      ];
    }
    // ... resten av alders-logikken
  },

  getRolePrompt: (config) => {
    return `Du er et barn på ${config.age} år (${config.gender}). Oppfør deg realistisk utfra alder. Ikke gi deg med en gang.`;
  },

  getStartPrompt: (config, scenario) => {
    return `Start rollespillet. Du er et barn på ${config.age} år (${config.gender}). Situasjonen er: "${scenario}". Du starter samtalen/konflikten med en replikk som passer din alder og situasjonen. Vær vanskelig eller emosjonell. Svar på norsk.`;
  },

  getContinuePrompt: (config, history) => {
    return `Her er samtalen så langt:\n${history}\n\nForelderen sa akkurat det siste over. Svar som barnet (${config.age} år). Hold deg i karakter. Vær kort (1-3 setninger).`;
  },

  getAnalysisPrompt: (config, history, scenario) => {
    return `Analyser denne samtalen mellom en forelder og et barn på ${config.age} år (${config.gender}).
Situasjon: ${scenario}.

Samtale:
${history}

Du er en ekspert i barnepsykologi og pedagogikk.
Gi tilbakemelding i JSON format:
{
  "mainFeedback": "Hovedinntrykk",
  "strengths": ["Bra ting 1", "Bra ting 2"],
  "improvements": ["Tips 1", "Tips 2"],
  "perspectiveTitle": "Barnets opplevelse",
  "perspective": "Hva barnet følte",
  "score": 1-10
}
Svar på norsk.`;
  },

  getTips: (config) => {
    const age = config.age as number;
    if (age < 6) return "Anerkjenn følelsen først, så sett grensen.";
    if (age < 13) return "Lytt til argumentene, men vær tydelig voksen.";
    return "Pust med magen. Ikke la deg provosere.";
  }
};
```

### Arbeidsliv

```typescript
export const arbeidslivArena: ArenaConfig = {
  id: 'arbeidsliv',
  name: 'Arbeidsliv',
  tagline: 'Øv på krevende jobbsamtaler',
  description: 'Bli tryggere i vanskelige samtaler på arbeidsplassen. For ledere og medarbeidere.',
  icon: 'work',
  color: 'ocean',

  configFields: [
    {
      id: 'role',
      type: 'buttons',
      label: 'Din rolle',
      options: [
        { value: 'leder', label: 'Leder' },
        { value: 'medarbeider', label: 'Medarbeider' }
      ],
      default: 'leder'
    },
    {
      id: 'difficulty',
      type: 'buttons',
      label: 'Vanskelighetsgrad',
      options: [
        { value: 'lett', label: 'Lett' },
        { value: 'middels', label: 'Middels' },
        { value: 'utfordrende', label: 'Utfordrende' }
      ],
      default: 'middels'
    }
  ],

  getScenarios: (config) => {
    if (config.role === 'leder') {
      return [
        { id: 'sickness', title: 'Sykefraværssamtale', description: 'Oppfølging av ansatt med fravær.' },
        { id: 'feedback', title: 'Vanskelig tilbakemelding', description: 'Gi negativ feedback konstruktivt.' },
        { id: 'conflict', title: 'Konflikthåndtering', description: 'Megle mellom ansatte eller håndtere klage.' },
        { id: 'termination', title: 'Oppsigelse/nedbemanning', description: 'Formidle vanskelige beskjeder.' },
      ];
    } else {
      return [
        { id: 'raise', title: 'Be om lønnsøkning', description: 'Forberede og gjennomføre lønnssamtale.' },
        { id: 'problem', title: 'Ta opp et problem', description: 'Si fra om noe som ikke fungerer.' },
        { id: 'colleague', title: 'Konflikt med kollega', description: 'Håndtere vanskelig samarbeid.' },
        { id: 'boundaries', title: 'Si nei til oppgaver', description: 'Sette grenser uten å virke vanskelig.' },
      ];
    }
  },

  getRolePrompt: (config) => {
    const otherRole = config.role === 'leder' ? 'medarbeider' : 'leder';
    const difficulty = config.difficulty as string;

    return `Du er en ${otherRole} i en jobbsamtale.

Vanskelighetsgrad: ${difficulty}

Oppførsel basert på vanskelighetsgrad:
- Lett: Du er åpen, litt overrasket, men lytter og tar imot
- Middels: Du blir først defensiv, men roer deg hvis motparten er tydelig og respektfull
- Utfordrende: Du avbryter, kommer med unnskyldninger, skylder på andre

Ikke gjør det umulig, men gjør det realistisk. Når motparten bruker gode teknikker, bli gradvis mer mottakelig.`;
  },

  // ... resten av prompts
};
```

### Jobbintervju

```typescript
export const jobbintervjuArena: ArenaConfig = {
  id: 'jobbintervju',
  name: 'Jobbintervju',
  tagline: 'Forbered deg til drømmejobben',
  description: 'Øv på vanlige spørsmål og få konstruktiv tilbakemelding på svarene dine.',
  icon: 'interview',
  color: 'bark',

  configFields: [
    {
      id: 'jobType',
      type: 'dropdown',
      label: 'Stillingstype',
      options: [
        { value: 'okonomi', label: 'Økonomi/Regnskap' },
        { value: 'hr', label: 'HR/Personal' },
        { value: 'it', label: 'IT/Teknologi' },
        { value: 'salg', label: 'Salg/Marked' },
        { value: 'helse', label: 'Helse/Omsorg' },
        { value: 'undervisning', label: 'Undervisning' },
        { value: 'ledelse', label: 'Ledelse' },
        { value: 'annet', label: 'Annet' },
      ],
      default: 'it'
    },
    {
      id: 'interviewType',
      type: 'buttons',
      label: 'Intervjutype',
      options: [
        { value: 'first', label: 'Første intervju' },
        { value: 'second', label: 'Andre intervju' },
        { value: 'case', label: 'Case-intervju' }
      ],
      default: 'first'
    },
    {
      id: 'style',
      type: 'buttons',
      label: 'Intervjustil',
      options: [
        { value: 'friendly', label: 'Vennlig' },
        { value: 'neutral', label: 'Nøytral' },
        { value: 'tough', label: 'Krevende' }
      ],
      default: 'neutral'
    }
  ],

  getScenarios: (config) => [
    { id: 'general', title: 'Generelt intervju', description: 'Standard intervjuspørsmål for stillingen.' },
    { id: 'strengths', title: 'Styrker og svakheter', description: 'Fokus på selvpresentasjon.' },
    { id: 'experience', title: 'Erfaring og kompetanse', description: 'Dypere spørsmål om bakgrunn.' },
    { id: 'salary', title: 'Lønnsforhandling', description: 'Øv på å snakke om lønn.' },
  ],

  // AI spiller intervjuer, bruker svarer som seg selv
};
```

### Eksamen

```typescript
export const eksamenArena: ArenaConfig = {
  id: 'eksamen',
  name: 'Eksamen',
  tagline: 'Tren på muntlig eksamen',
  description: 'Øv på muntlig eksamen med en tålmodig AI-sensor tilpasset ditt fag og nivå.',
  icon: 'exam',
  color: 'forest-light',

  configFields: [
    {
      id: 'level',
      type: 'buttons',
      label: 'Nivå',
      options: [
        { value: 'barneskole', label: 'Barneskole' },
        { value: 'ungdomsskole', label: 'Ungdomsskole' },
        { value: 'vgs', label: 'Videregående' },
        { value: 'hoyere', label: 'Høyskole/Uni' }
      ],
      default: 'vgs'
    },
    {
      id: 'subject',
      type: 'dropdown',
      label: 'Fag',
      options: [
        { value: 'norsk', label: 'Norsk' },
        { value: 'matte', label: 'Matematikk' },
        { value: 'naturfag', label: 'Naturfag' },
        { value: 'historie', label: 'Historie' },
        { value: 'samfunn', label: 'Samfunnsfag' },
        { value: 'engelsk', label: 'Engelsk' },
        { value: 'annet', label: 'Annet fag' }
      ],
      default: 'norsk'
    }
  ],

  // Fritekst for tema legges til i UI
  // AI spiller sensor, stiller oppfølgingsspørsmål
};
```

---

## Brukerflyt

```
┌─────────────────────────────────────────────────────────────┐
│                      LANDINGSSIDE                           │
│  (Ny design: Pratiro design system)                        │
│  - Hero med "Prat i ro"                                    │
│  - "Slik fungerer det" (3 steg)                            │
│  - Arena-kort (4 stk)                                      │
│  - Klikk kort → /simulator?arena=X                         │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    SIMULATOR PAGE                           │
│  /simulator?arena=familie                                  │
└─────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        ▼                     ▼                     ▼
┌───────────────┐    ┌───────────────┐    ┌───────────────┐
│   STEP 1:     │    │   STEP 2:     │    │   STEP 3:     │
│   CONFIG      │ →  │   CHAT        │ →  │   ANALYSIS    │
│               │    │               │    │               │
│ - Dynamiske   │    │ - AI spiller  │    │ - Score       │
│   felter      │    │   motpart     │    │ - Styrker     │
│ - Scenarioer  │    │ - Tips        │    │ - Forbedring  │
│ - Start-knapp │    │ - Send melding│    │ - Perspektiv  │
└───────────────┘    └───────────────┘    └───────────────┘
```

---

## Design Oppdateringer

### Farger (fra design system)
```css
:root {
  --forest: #2D4A3E;
  --forest-light: #3D6B5A;
  --ocean: #4A6B7C;
  --sand: #F5F1EB;
  --mist: #F9F8F6;
  --text: #252825;
  --text-soft: #4F5752;
}
```

### Fonter
- **Overskrifter:** DM Serif Display
- **Brødtekst:** Inter

### Komponenter å oppdatere
1. **Header:** Bruk Pratiro-logo med pause-symbol (skarpe hjørner)
2. **Knapper:** Bruk `--forest` som primærfarge
3. **Kort:** Bruk arena-farge som accent (top-border on hover)
4. **Bakgrunn:** `--mist` i stedet for teal

---

## Implementeringsplan

### Fase 1: Infrastruktur
1. [ ] Opprett `config/types.ts` med alle typer
2. [ ] Opprett `config/arenas.ts` med Familie-arena
3. [ ] Opprett `components/ui/` med grunnkomponenter
4. [ ] Oppdater `globals.css` med Pratiro CSS-variabler

### Fase 2: Familie-arena migrering
1. [ ] Flytt eksisterende logikk til `familieArena` config
2. [ ] Opprett `useSimulator` hook
3. [ ] Refaktorer simulator til å bruke komponenter
4. [ ] Oppdater design til Pratiro-stil

### Fase 3: Ny landingsside
1. [ ] Implementer ny landingsside med arena-valg
2. [ ] Fjern login-modal (eller behold som opt-in)
3. [ ] Legg til URL-parameter `?arena=X`

### Fase 4: Nye arenaer
1. [ ] Implementer Arbeidsliv-arena
2. [ ] Implementer Jobbintervju-arena
3. [ ] Implementer Eksamen-arena

### Fase 5: Polish
1. [ ] Accessibility (ARIA labels, keyboard nav)
2. [ ] Animasjoner og overganger
3. [ ] Testing på tvers av arenaer

---

## Nøkkelbeslutninger

### 1. URL-struktur
**Beslutning:** `/simulator?arena=familie`
**Begrunnelse:** Enkel routing, én simulator-side som tilpasser seg

### 2. State management
**Beslutning:** Custom hook `useSimulator` med `useState`
**Begrunnelse:** Enkelt nok for nåværende behov, kan utvides til Context senere

### 3. Prompt-håndtering
**Beslutning:** Prompts definert i arena-config, ikke hardkodet
**Begrunnelse:** Lett å justere per arena, følger pratiro-prompts.md

### 4. Design
**Beslutning:** Full migrering til Pratiro design system
**Begrunnelse:** Konsistent merkevare, profesjonelt uttrykk

---

## Spørsmål til avklaring

1. **Login:** Beholde tilgangskode-systemet eller fjerne det?
2. **Eksamen:** Skal vi støtte fritekst for fag (høyskole/uni)?
3. **Analyse:** Skal struktur være identisk på tvers av arenaer, eller tilpasset?
4. **Historikk:** Skal vi lagre tidligere samtaler (localStorage)?

---

*Denne planen er basert på analyse av eksisterende kode og referanse-dokumentene (pratiro-prompts.md, design system).*
