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

    return `Du er et barn på ${age} år (${gender}). Oppfør deg realistisk utfra alder.

${ageGuidelines}

Ikke gi deg med en gang. Gi realistiske reaksjoner. Når forelderen bruker gode teknikker (validering, åpne spørsmål, rolig tone), responser gradvis mer positivt.`;
  },

  getStartPrompt: (config: Record<string, unknown>, scenario: string): string => {
    const age = Number(config.age) || 8;
    const gender = (config.gender as string) || 'Gutt';

    return `Start rollespillet. Du er et barn på ${age} år (${gender}). Situasjonen er: "${scenario}". Du starter samtalen/konflikten med en replikk som passer din alder og situasjonen. Vær vanskelig eller emosjonell. Svar på norsk. Gi en kort, realistisk replikk (1-2 setninger).`;
  },

  getContinuePrompt: (config: Record<string, unknown>, history: string): string => {
    const age = Number(config.age) || 8;

    return `Her er samtalen så langt:
${history}

Forelderen sa akkurat det siste over. Svar som barnet (${age} år). Hold deg i karakter. Vær kort (1-3 setninger). Svar på norsk.`;
  },

  getAnalysisPrompt: (config: Record<string, unknown>, history: string, scenario: string): string => {
    const age = Number(config.age) || 8;
    const gender = (config.gender as string) || 'Gutt';

    return `Analyser denne samtalen mellom en forelder og et barn på ${age} år (${gender}).
Situasjon: ${scenario}.

Samtale:
${history}

Du er en ekspert i barnepsykologi og pedagogikk.
Gi tilbakemelding i JSON format:
{
  "mainFeedback": "Hovedinntrykk (bruk 'Pratiro' sin stemme: støttende og rolig)",
  "strengths": ["Bra ting 1", "Bra ting 2"],
  "improvements": ["Tips 1", "Tips 2"],
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
