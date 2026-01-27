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

    return `Du er en ${otherRole} i en profesjonell samtale på arbeidsplassen.

Vanskelighetsgrad: ${difficulty}
${difficultyGuidelines}

VIKTIG - GJØR DETTE:
- Ha egne mål og bekymringer i samtalen - du er en ekte person
- Når ${role === 'leder' ? 'lederen' : 'medarbeideren'} bruker gode teknikker (aktiv lytting, jeg-budskap, konkrete eksempler), bli gradvis mer mottakelig
- Reager naturlig på tonen - hvis de er aggressive, trekk deg tilbake eller bli defensiv

IKKE GJØR DETTE:
- Ikke vær en karikatur eller overdrevent vanskelig
- Ikke gi deg umiddelbart uten god grunn
- Ikke plutselig bli helt enig uten at den andre har gjort noe for å fortjene det
- Ikke løs problemet for dem - la dem jobbe for løsningen
- ALDRI bruk plassholdere som [navn], [lederens navn] osv. - snakk naturlig uten å navngi noen`;
  },

  getStartPrompt: (config: Record<string, unknown>, scenario: string): string => {
    const role = (config.role as string) || 'leder';
    const otherRole = role === 'leder' ? 'medarbeider' : 'leder';

    return `Start rollespillet. Du spiller rollen som ${otherRole}.

Situasjon: "${scenario}"

${role === 'leder'
  ? 'Du (medarbeideren) er blitt kalt inn til lederens kontor. Kom inn og si noe som "Hei, du ville snakke med meg?" eller vis litt usikkerhet om hva det gjelder.'
  : 'Du (lederen) har fått beskjed om at en medarbeider vil snakke med deg. Ønsk velkommen og spør hva det gjelder.'}

Svar på norsk. Gi en kort, realistisk replikk (1-2 setninger).`;
  },

  getContinuePrompt: (config: Record<string, unknown>, history: string): string => {
    const role = (config.role as string) || 'leder';
    const otherRole = role === 'leder' ? 'medarbeideren' : 'lederen';

    return `SAMTALEHISTORIKK:
${history}

${role === 'leder' ? 'Lederen' : 'Medarbeideren'} sa akkurat det siste. Svar som ${otherRole}.

REAGER PÅ DET SOM BLE SAGT:
- Hvis de lyttet aktivt og oppsummerte, vis at du føler deg hørt
- Hvis de brukte jeg-budskap og var konkrete, vær mer åpen
- Hvis de var anklagende eller generaliserende, bli defensiv
- Hvis de stilte et spørsmål, svar på det (men kan være nølende eller defensiv avhengig av tone)
- Bygg på det som er sagt tidligere - ikke gjenta deg selv

Hold deg i karakter. Vær kort (1-3 setninger). Svar på norsk.`;
  },

  getAnalysisPrompt: (config: Record<string, unknown>, history: string, scenario: string): string => {
    const role = (config.role as string) || 'leder';

    return `Analyser denne samtalen mellom en ${role} og en ${role === 'leder' ? 'medarbeider' : 'leder'}.
Situasjon: ${scenario}.

Samtale:
${history}

Du er en ekspert i arbeidslivspsykologi og kommunikasjon.

SE ETTER DISSE TEKNIKKENE:
- Jeg-budskap vs. du-budskap ("Jeg opplever at..." vs. "Du gjør alltid...")
- Aktiv lytting (oppsummering, speiling, oppklarende spørsmål)
- Konkrete eksempler vs. generaliseringer ("I møtet tirsdag..." vs. "Du er alltid...")
- Løsningsfokus vs. problemfokus (fremover vs. bakover)
- Respekt og profesjonalitet (tone, ordvalg)
- Tydelighet på forventninger og behov
- Åpenhet for den andres perspektiv

SCORING (vær støttende og konstruktiv):
- 1-3: Samtalen ble krevende. Arbeidsplassamtaler er vanskelige - her er det gode læringsmuligheter.
- 4-5: Gode forsøk, med tydelige muligheter for vekst. Du er på rett vei.
- 6-7: Solid innsats! Noen justeringer kan styrke kommunikasjonen ytterligere.
- 8-9: Veldig god håndtering. Du viser trygghet i krevende samtaler.
- 10: Eksemplarisk profesjonell kommunikasjon.

Gi tilbakemelding i JSON format. VIKTIG: Hold alle felter korte og konsise.
{
  "mainFeedback": "1-2 korte setninger som oppsummerer samtalen.",
  "strengths": ["Kort punkt 1", "Kort punkt 2"],
  "improvements": ["Kort tips 1", "Kort tips 2"],
  "perspective": "1-2 setninger om ${role === 'leder' ? 'medarbeiderens' : 'lederens'} opplevelse.",
  "score": 1-10
}
Maks 2 punkter per liste. Svar på norsk. Kun JSON, ingen annen tekst.`;
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
