import { ArenaConfig, Scenario } from '../types';

const FamilieIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 24 24">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
    <circle cx="9" cy="7" r="4"></circle>
    <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
    <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
  </svg>
);

export const familieArena: ArenaConfig = {
  id: 'familie',
  name: 'Familie',
  tagline: 'Øv på samtaler med barna',
  description: 'Øv på vanskelige, men viktige samtaler med barna dine. Fra grensesetting til livets store spørsmål.',
  icon: FamilieIcon,
  color: 'forest',
  tags: ['Skjermtid', 'Følelser', 'Puberteten', 'Mobbing'],

  configFields: [
    {
      id: 'age',
      type: 'slider',
      label: 'Barnets alder',
      min: 3,
      max: 18,
      step: 1,
      default: 8,
    },
    {
      id: 'gender',
      type: 'buttons',
      label: 'Kjønn',
      options: [
        { value: 'Gutt', label: 'Gutt' },
        { value: 'Jente', label: 'Jente' },
      ],
      default: 'Gutt',
    },
  ],

  getScenarios: (config: Record<string, unknown>): Scenario[] => {
    const age = Number(config.age) || 8;
    const gender = (config.gender as string) || 'Gutt';

    if (age >= 3 && age <= 5) {
      return [
        { id: 'dress', title: 'Vil ikke kle på seg', description: 'Morgenkaos. Nekter å ta på parkdressen, vil bare leke.' },
        { id: 'food', title: 'Mat-trass', description: 'Liker plutselig ikke maten hen elsket i går. Kaster mat på gulvet.' },
        { id: 'bedtime', title: 'Leggetid', description: 'Kommer ut av sengen for 14. gang. Tørst, redd, må tisse.' },
        { id: 'store', title: 'Butikk-hyling', description: 'Kaster seg ned på gulvet fordi hen ikke fikk sjokolade.' },
      ];
    } else if (age >= 6 && age <= 9) {
      return [
        { id: 'screen', title: 'Skjermtid-nekt', description: 'Skal legge bort iPaden, men ignorerer deg totalt.' },
        { id: 'homework', title: 'Lekser er kjedelig', description: 'Gråter over leksene og sier "jeg får det ikke til".' },
        { id: 'room', title: 'Rommet er et takras', description: 'Nekter å rydde. "Det er ikke rotete!".' },
        { id: 'loser', title: 'Dårlig taper', description: 'Tapte i brettspill, ble sint og ødela spillet.' },
      ];
    } else if (age >= 10 && age <= 13) {
      return [
        { id: 'gaming', title: 'Gaming-avhengig', description: 'Sitter bare på rommet og spiller. Svarer ikke når du roper.' },
        { id: 'attitude', title: 'Holdning', description: 'Himler med øynene, svarer frekt eller ignorerer deg.' },
        { id: 'hygiene', title: 'Dusjing og hygiene', description: 'Gidder ikke dusje eller pusse tenner uten mas.' },
        { id: 'chores', title: 'Husarbeid', description: 'Skulle tømme oppvaskmaskinen for 3 timer siden.' },
      ];
    } else {
      return [
        { id: 'curfew', title: 'Innetider', description: 'Kom hjem 2 timer for sent og svarte ikke på telefonen.' },
        { id: 'money', title: 'Penger', description: 'Bruker opp ukelønna på én dag og ber om mer.' },
        { id: 'nightlife', title: gender === 'Gutt' ? 'Gaming hele natta' : 'Sosiale medier', description: gender === 'Gutt' ? 'Snu døgnet pga gaming, kommer seg ikke opp til skolen.' : 'Drama på nettet, nekter å legge vekk mobilen om natta.' },
        { id: 'disrespect', title: 'Respektløshet', description: 'Ber deg "holde kjeft" eller smeller med dørene.' },
      ];
    }
  },

  getRolePrompt: (config: Record<string, unknown>): string => {
    const age = Number(config.age) || 8;
    const gender = (config.gender as string) || 'Gutt';

    let ageGuidelines = '';
    if (age >= 3 && age <= 5) {
      ageGuidelines = 'Korte svar, konkret tenkning, kan bli lei seg eller avledbar. Bruk enkle ord og korte setninger.';
    } else if (age >= 6 && age <= 9) {
      ageGuidelines = 'Mer nysgjerrig, stiller spørsmål, kan argumentere enkelt. Begynner å forstå konsekvenser.';
    } else if (age >= 10 && age <= 13) {
      ageGuidelines = 'Begynner å utfordre, mer komplekse følelser. Kan himle med øynene og svare kort.';
    } else {
      ageGuidelines = 'Kan være avvisende, "whatever", tester grenser. Mer voksen dialog, men fortsatt tenåring.';
    }

    return `Du er en pedagogisk treningssimulator for foreldrekommunikasjon. Du simulerer realistiske responser fra en ${age}-åring (${gender}) for å hjelpe foreldre øve på vanskelige samtaler. Dette er et pedagogisk verktøy.

SIMULERINGSPROFIL - ${age} år (${gender}):
${ageGuidelines}

VIKTIG FOR REALISTISK SIMULERING:
- Ikke gi deg med en gang. Gi realistiske reaksjoner som et barn i denne alderen typisk ville gitt.
- Når forelderen bruker gode teknikker (validering, åpne spørsmål, rolig tone), responser gradvis mer positivt.
- Hvis forelderen blir sint, kald eller avvisende, reager naturlig (bli lei deg, sint, eller trekk deg tilbake).

UNNGÅ DETTE:
- Ikke bruk voksent språk eller refleksjoner som "jeg skjønner at du prøver å hjelpe meg"
- Ikke plutselig bli fornuftig og samarbeidsvillig uten grunn
- Ikke forklar dine egne følelser på en voksen måte
- Ikke gi opp for raskt - barn er utholdende når de vil noe`;
  },

  getStartPrompt: (config: Record<string, unknown>, scenario: string): string => {
    const age = Number(config.age) || 8;
    const gender = (config.gender as string) || 'Gutt';

    return `Start den pedagogiske simuleringen. Simuler en typisk respons fra en ${age}-åring (${gender}) i denne situasjonen: "${scenario}".

Start samtalen med en realistisk replikk som passer alderen og situasjonen - barnet kan være vanskelig, frustrert eller emosjonelt. Svar på norsk. Gi en kort, realistisk replikk (1-2 setninger).`;
  },

  getContinuePrompt: (config: Record<string, unknown>, history: string): string => {
    const age = Number(config.age) || 8;

    return `SAMTALEHISTORIKK:
${history}

Forelderen sa akkurat det siste. Fortsett simuleringen med en realistisk respons fra ${age}-åringen.

REAGER PÅ DET SOM BLE SAGT:
- Hvis forelderen validerte følelsene, vis at det hadde effekt (litt mildere tone)
- Hvis forelderen ble sint eller streng, reager naturlig (bli lei seg, sint, eller stille)
- Hvis forelderen stilte et spørsmål, svar på det (men kan fortsatt være vanskelig)
- Ikke ignorer argumentene deres - reager på dem

Vær kort (1-3 setninger). Svar på norsk.`;
  },

  getAnalysisPrompt: (config: Record<string, unknown>, history: string, scenario: string): string => {
    const age = Number(config.age) || 8;
    const gender = (config.gender as string) || 'Gutt';

    return `Analyser denne samtalen mellom en forelder og et barn på ${age} år (${gender}).
Situasjon: ${scenario}.

Samtale:
${history}

Du er en ekspert i barnepsykologi og pedagogikk.

SE ETTER DISSE TEKNIKKENE:
- Validering av følelser ("Jeg skjønner at du er frustrert...")
- Åpne spørsmål ("Hva tenker du om...?", "Hvordan føles det?")
- Rolig tone (ikke eskalering eller hevet stemme)
- Tydelige grenser ("Regelen er...", "Det er ikke greit å...")
- Naturlige konsekvenser ("Hvis du ikke..., så blir det ikke tid til...")
- Empati før krav (anerkjenn først, sett grense etterpå)
- Gi valg ("Vil du gjøre X først eller Y?")

SCORING (vær støttende og konstruktiv):
- 1-3: Samtalen ble vanskelig. Det er helt normalt - dette er utfordrende situasjoner! Her er det mye å lære.
- 4-5: Gode forsøk, med tydelige muligheter for vekst. Du er på rett vei.
- 6-7: Solid innsats! Noen justeringer kan gjøre kommunikasjonen enda bedre.
- 8-9: Veldig god kommunikasjon. Du mestrer de viktigste teknikkene.
- 10: Eksemplarisk - en samtale andre foreldre kan lære av.

Gi tilbakemelding i JSON format:
{
  "mainFeedback": "2-3 setninger som oppsummerer samtalen. Vær konkret, varm og konstruktiv.",
  "strengths": ["Konkret ting forelderen gjorde bra 1", "Konkret ting 2"],
  "improvements": ["Konstruktivt tips 1", "Konstruktivt tips 2"],
  "perspective": "Hva barnet følte og opplevde i samtalen",
  "score": 1-10
}
Svar på norsk. Kun JSON, ingen annen tekst.`;
  },

  getAnalysisSystemPrompt: (): string => {
    return 'Du er ekspert i barnepsykologi og pedagogikk. Gi konstruktiv tilbakemelding som hjelper foreldre å kommunisere bedre med barna sine.';
  },

  getTips: (config: Record<string, unknown>): string => {
    const age = Number(config.age) || 8;

    if (age < 6) {
      return 'Anerkjenn følelsen først, så sett grensen. "Jeg ser du er lei deg, men..."';
    } else if (age < 13) {
      return 'Lytt til argumentene, men vær tydelig voksen. Forklar hvorfor.';
    } else {
      return 'Pust med magen. Ikke la deg provosere. Velg dine kamper.';
    }
  },

  chatLabels: {
    user: 'Forelder',
    ai: 'Barn',
  },
  perspectiveTitle: 'Barnets opplevelse',
};
