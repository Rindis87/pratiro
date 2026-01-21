import { ArenaConfig, Scenario } from '../types';

const ArbeidslivIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 24 24">
    <rect height="14" rx="2" ry="2" width="20" x="2" y="3"></rect>
    <line x1="8" x2="16" y1="21" y2="21"></line>
    <line x1="12" x2="12" y1="17" y2="21"></line>
  </svg>
);

export const arbeidslivArena: ArenaConfig = {
  id: 'arbeidsliv',
  name: 'Arbeidsliv',
  tagline: 'Bli tryggere på jobb',
  description: 'Bli tryggere i krevende samtaler på arbeidsplassen. For ledere og medarbeidere som vil utvikle seg.',
  icon: ArbeidslivIcon,
  color: 'ocean',
  tags: ['Konflikthåndtering', 'Medarbeidersamtale', 'Feedback'],

  configFields: [
    {
      id: 'role',
      type: 'buttons',
      label: 'Din rolle',
      options: [
        { value: 'leder', label: 'Leder' },
        { value: 'medarbeider', label: 'Medarbeider' },
      ],
      default: 'leder',
    },
    {
      id: 'difficulty',
      type: 'buttons',
      label: 'Vanskelighetsgrad',
      options: [
        { value: 'lett', label: 'Lett' },
        { value: 'middels', label: 'Middels' },
        { value: 'utfordrende', label: 'Utfordrende' },
      ],
      default: 'middels',
    },
  ],

  getScenarios: (config: Record<string, unknown>): Scenario[] => {
    const role = (config.role as string) || 'leder';

    if (role === 'leder') {
      return [
        { id: 'sickness', title: 'Sykefraværssamtale', description: 'Oppfølging av ansatt med høyt fravær.' },
        { id: 'annual', title: 'Medarbeidersamtale', description: 'Årlig utviklingssamtale med en ansatt.' },
        { id: 'feedback', title: 'Vanskelig tilbakemelding', description: 'Gi negativ feedback på en konstruktiv måte.' },
        { id: 'conflict', title: 'Konflikthåndtering', description: 'Megle mellom ansatte eller håndtere en klage.' },
        { id: 'termination', title: 'Oppsigelse/nedbemanning', description: 'Formidle en vanskelig beskjed.' },
        { id: 'salary', title: 'Lønnssamtale', description: 'Håndtere lønnskrav fra ansatt.' },
        { id: 'concern', title: 'Bekymringssamtale', description: 'Ansatt som sliter privat eller faglig.' },
      ];
    } else {
      return [
        { id: 'raise', title: 'Be om lønnsøkning', description: 'Forberede og gjennomføre lønnssamtale.' },
        { id: 'problem', title: 'Ta opp et problem', description: 'Si fra om noe som ikke fungerer.' },
        { id: 'colleague', title: 'Konflikt med kollega', description: 'Håndtere vanskelig samarbeid.' },
        { id: 'no', title: 'Si nei til oppgaver', description: 'Sette grenser uten å virke vanskelig.' },
        { id: 'flexibility', title: 'Be om fleksibilitet', description: 'Hjemmekontor, tilpasset arbeidstid.' },
      ];
    }
  },

  getRolePrompt: (config: Record<string, unknown>): string => {
    const role = (config.role as string) || 'leder';
    const difficulty = (config.difficulty as string) || 'middels';

    const otherRole = role === 'leder' ? 'medarbeider' : 'leder/sjef';

    let difficultyGuidelines = '';
    if (difficulty === 'lett') {
      difficultyGuidelines = 'Du er åpen, litt overrasket, men lytter og tar imot. Samarbeidsvillig.';
    } else if (difficulty === 'middels') {
      difficultyGuidelines = 'Du blir først defensiv ("men jeg har jo..."), men roer deg hvis den andre er tydelig og respektfull.';
    } else {
      difficultyGuidelines = 'Du avbryter, kommer med unnskyldninger, skylder på andre, blir kanskje emosjonell eller avvisende.';
    }

    return `Du er en ${otherRole} i en samtale på arbeidsplassen.

Vanskelighetsgrad: ${difficulty}
${difficultyGuidelines}

Ikke gjør det umulig, men gjør det realistisk. Når ${role === 'leder' ? 'lederen' : 'medarbeideren'} bruker gode teknikker (aktiv lytting, jeg-budskap, konkrete eksempler), bli gradvis mer mottakelig.`;
  },

  getStartPrompt: (config: Record<string, unknown>, scenario: string): string => {
    const role = (config.role as string) || 'leder';
    const otherRole = role === 'leder' ? 'medarbeider' : 'leder';

    return `Start rollespillet. Du er en ${otherRole} som er i en samtale om: "${scenario}".

${role === 'leder'
  ? 'Medarbeideren (deg) er blitt kalt inn til samtale. Start med å komme inn på kontoret og si noe som "Hei, du ville snakke med meg?" eller lignende.'
  : 'Du er leder og har fått en henvendelse fra medarbeideren. Start med å ønske velkommen og spørre hva det gjelder.'}

Svar på norsk. Gi en kort, realistisk replikk (1-2 setninger).`;
  },

  getContinuePrompt: (config: Record<string, unknown>, history: string): string => {
    const role = (config.role as string) || 'leder';
    const otherRole = role === 'leder' ? 'medarbeideren' : 'lederen';

    return `Her er samtalen så langt:
${history}

${role === 'leder' ? 'Lederen' : 'Medarbeideren'} sa akkurat det siste over. Svar som ${otherRole}. Hold deg i karakter. Vær kort (1-3 setninger). Svar på norsk.`;
  },

  getAnalysisPrompt: (config: Record<string, unknown>, history: string, scenario: string): string => {
    const role = (config.role as string) || 'leder';

    return `Analyser denne samtalen mellom en ${role} og en ${role === 'leder' ? 'medarbeider' : 'leder'}.
Situasjon: ${scenario}.

Samtale:
${history}

Du er en ekspert i arbeidslivspsykologi og kommunikasjon.
Gi tilbakemelding i JSON format:
{
  "mainFeedback": "Hovedinntrykk (bruk 'Pratiro' sin stemme: støttende og profesjonell)",
  "strengths": ["Bra ting 1", "Bra ting 2"],
  "improvements": ["Tips 1", "Tips 2"],
  "perspective": "Hva ${role === 'leder' ? 'medarbeideren' : 'lederen'} trolig følte og tenkte",
  "score": 1-10
}
Svar på norsk. Kun JSON, ingen annen tekst.`;
  },

  getAnalysisSystemPrompt: (): string => {
    return 'Du er ekspert i arbeidslivspsykologi og kommunikasjon. Gi konstruktiv tilbakemelding som hjelper folk å kommunisere bedre på arbeidsplassen.';
  },

  getTips: (config: Record<string, unknown>): string => {
    const role = (config.role as string) || 'leder';

    if (role === 'leder') {
      return 'Bruk "jeg-budskap" og konkrete eksempler. Lytt aktivt før du responderer.';
    } else {
      return 'Vær tydelig på hva du ønsker. Bruk fakta og eksempler, ikke følelser.';
    }
  },

  chatLabels: {
    user: 'Deg',
    ai: 'Motpart',
    aiDynamic: (config: Record<string, unknown>) => {
      const role = (config.role as string) || 'leder';
      return role === 'leder' ? 'Medarbeider' : 'Leder';
    },
  },
  perspectiveTitle: 'Motpartens opplevelse',
};
