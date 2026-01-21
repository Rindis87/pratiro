import { ArenaConfig, Scenario } from '../types';

const EksamenIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 24 24">
    <path d="M22 10v6M2 10l10-5 10 5-10 5z"></path>
    <path d="M6 12v5c0 2 2 3 6 3s6-1 6-3v-5"></path>
  </svg>
);

export const eksamenArena: ArenaConfig = {
  id: 'eksamen',
  name: 'Eksamen',
  tagline: 'Tren på muntlig eksamen',
  description: 'Tren på muntlig eksamen med en tålmodig AI-sensor. Tilpasset ditt fag og nivå.',
  icon: EksamenIcon,
  color: 'forest-light',
  tags: ['Fagspørsmål', 'Presentasjon', 'Oppfølgingsspørsmål'],

  configFields: [
    {
      id: 'level',
      type: 'buttons',
      label: 'Nivå',
      options: [
        { value: 'barneskole', label: 'Barneskole' },
        { value: 'ungdomsskole', label: 'Ungdomsskole' },
        { value: 'videregaende', label: 'Videregående' },
        { value: 'hoyskole', label: 'Høyskole/Uni' },
      ],
      default: 'videregaende',
    },
    {
      id: 'subject',
      type: 'dropdown',
      label: 'Fag',
      options: [
        { value: 'norsk', label: 'Norsk' },
        { value: 'matematikk', label: 'Matematikk' },
        { value: 'naturfag', label: 'Naturfag' },
        { value: 'samfunnsfag', label: 'Samfunnsfag' },
        { value: 'engelsk', label: 'Engelsk' },
        { value: 'historie', label: 'Historie' },
        { value: 'biologi', label: 'Biologi' },
        { value: 'kjemi', label: 'Kjemi' },
        { value: 'fysikk', label: 'Fysikk' },
        { value: 'rettslare', label: 'Rettslære' },
        { value: 'okonomi', label: 'Økonomistyring' },
        { value: 'krle', label: 'KRLE' },
        { value: 'annet', label: 'Annet fag' },
      ],
      default: 'naturfag',
    },
    {
      id: 'topic',
      type: 'text',
      label: 'Tema/Emne',
      placeholder: 'F.eks. "Fotosyntesen" eller "Andre verdenskrig"',
      default: '',
    },
    {
      id: 'examType',
      type: 'buttons',
      label: 'Type',
      options: [
        { value: 'muntlig', label: 'Muntlig eksamen' },
        { value: 'prove', label: 'Muntlig prøve' },
        { value: 'presentasjon', label: 'Presentasjon' },
      ],
      default: 'muntlig',
    },
  ],

  getScenarios: (config: Record<string, unknown>): Scenario[] => {
    const subject = (config.subject as string) || 'naturfag';
    const level = (config.level as string) || 'videregaende';

    // Generelle scenarioer som tilpasses basert på fag og nivå
    const scenarios: Scenario[] = [
      { id: 'overview', title: 'Overblikk først', description: 'Start med å gi et overblikk over temaet, deretter dypere spørsmål.' },
      { id: 'deep', title: 'Rett på sak', description: 'Sensor går rett på konkrete fagspørsmål.' },
      { id: 'connection', title: 'Sammenhenger', description: 'Fokus på å koble temaet til andre deler av pensum.' },
    ];

    // Legg til nivåspesifikke scenarioer
    if (level === 'hoyskole') {
      scenarios.push({ id: 'critical', title: 'Kritisk drøfting', description: 'Sensor utfordrer deg til å problematisere og vurdere kilder.' });
    }

    return scenarios;
  },

  getRolePrompt: (config: Record<string, unknown>): string => {
    const level = (config.level as string) || 'videregaende';
    const subject = (config.subject as string) || 'naturfag';
    const topic = (config.topic as string) || '';
    const examType = (config.examType as string) || 'muntlig';

    const subjectMap: Record<string, string> = {
      norsk: 'norsk',
      matematikk: 'matematikk',
      naturfag: 'naturfag',
      samfunnsfag: 'samfunnsfag',
      engelsk: 'engelsk',
      historie: 'historie',
      biologi: 'biologi',
      kjemi: 'kjemi',
      fysikk: 'fysikk',
      rettslare: 'rettslære',
      okonomi: 'økonomistyring',
      krle: 'KRLE',
      annet: topic || 'det valgte faget',
    };

    const subjectName = subjectMap[subject] || subject;

    const levelGuidelines: Record<string, string> = {
      barneskole: 'Enkle, konkrete spørsmål. "Kan du fortelle meg hva [begrep] er?" Bruk et enkelt språk.',
      ungdomsskole: 'Be om forklaringer. "Hvorfor tror du det er sånn?" Bruk tydeligere fagspråk.',
      videregaende: 'Drøftingsspørsmål. "Sammenlign...", "Vurder...", "Diskuter..." Forvent fagterminologi.',
      hoyskole: 'Akademiske spørsmål. "Hvilke teorier...", "Hvordan kan man kritisere...", "Forklar sammenhengen mellom..." Forvent kritisk tenkning.',
    };

    const examTypeMap: Record<string, string> = {
      muntlig: 'muntlig eksamen',
      prove: 'muntlig prøve',
      presentasjon: 'presentasjon med spørsmål',
    };

    return `Du er en sensor/lærer som gjennomfører en ${examTypeMap[examType]} i ${subjectName} på ${level}-nivå.

${topic ? `Tema for eksamen: ${topic}` : ''}

Tilpass språk og spørsmål til ${level}:
${levelGuidelines[level]}

Når eleven svarer:
- Still oppfølgingsspørsmål for å teste dybdeforståelse
- Be om konkrete eksempler
- Utfordre svarene forsiktig ("Stemmer det alltid?", "Finnes det unntak?")

Ikke gi fasitsvar underveis. Vær faglig, men vennlig og oppmuntrende.`;
  },

  getStartPrompt: (config: Record<string, unknown>, scenario: string): string => {
    const subject = (config.subject as string) || 'naturfag';
    const topic = (config.topic as string) || '';
    const examType = (config.examType as string) || 'muntlig';

    const subjectMap: Record<string, string> = {
      norsk: 'norsk',
      matematikk: 'matematikk',
      naturfag: 'naturfag',
      samfunnsfag: 'samfunnsfag',
      engelsk: 'engelsk',
      historie: 'historie',
      biologi: 'biologi',
      kjemi: 'kjemi',
      fysikk: 'fysikk',
      rettslare: 'rettslære',
      okonomi: 'økonomistyring',
      krle: 'KRLE',
      annet: topic || 'faget',
    };

    const subjectName = subjectMap[subject] || subject;

    const examTypeMap: Record<string, string> = {
      muntlig: 'muntlig eksamen',
      prove: 'muntlig prøve',
      presentasjon: 'presentasjon',
    };

    return `Start ${examTypeMap[examType]} i ${subjectName}.
${topic ? `Tema: ${topic}` : ''}
Tilnærming: ${scenario}

Introduser eksamenssituasjonen kort og still det første spørsmålet. Vær vennlig men profesjonell.

Svar på norsk.`;
  },

  getContinuePrompt: (config: Record<string, unknown>, history: string): string => {
    const level = (config.level as string) || 'videregaende';

    return `Her er eksamenssamtalen så langt:
${history}

Eleven ga akkurat det siste svaret. Som sensor, vurder svaret og:
- Anerkjenn det som var bra (kort)
- Still et oppfølgingsspørsmål eller gå videre til nytt tema
- Tilpass nivået til ${level}

Ikke gi fasitsvar. Hold deg i rollen som sensor. Svar på norsk. Vær kortfattet.`;
  },

  getAnalysisPrompt: (config: Record<string, unknown>, history: string, scenario: string): string => {
    const level = (config.level as string) || 'videregaende';
    const subject = (config.subject as string) || 'naturfag';
    const topic = (config.topic as string) || '';

    const subjectMap: Record<string, string> = {
      norsk: 'norsk',
      matematikk: 'matematikk',
      naturfag: 'naturfag',
      samfunnsfag: 'samfunnsfag',
      engelsk: 'engelsk',
      historie: 'historie',
      biologi: 'biologi',
      kjemi: 'kjemi',
      fysikk: 'fysikk',
      rettslare: 'rettslære',
      okonomi: 'økonomistyring',
      krle: 'KRLE',
      annet: topic || 'faget',
    };

    const subjectName = subjectMap[subject] || subject;

    return `Analyser denne muntlige eksaminasjonen i ${subjectName} på ${level}-nivå.
${topic ? `Tema: ${topic}` : ''}
Tilnærming: ${scenario}

Eksaminasjon:
${history}

Du er en erfaren sensor og pedagog.
Gi tilbakemelding i JSON format:
{
  "mainFeedback": "Hovedinntrykk av elevens faglige prestasjon",
  "strengths": ["Hva eleven viste god forståelse for 1", "Hva eleven viste god forståelse for 2"],
  "improvements": ["Hva eleven bør jobbe mer med 1", "Konkret læringstips 2"],
  "perspective": "Hva sensor tenkte om elevens faglige nivå og formidlingsevne",
  "score": 1-10
}
Svar på norsk. Kun JSON, ingen annen tekst.`;
  },

  getAnalysisSystemPrompt: (): string => {
    return 'Du er en erfaren sensor og pedagog. Gi konstruktiv tilbakemelding som hjelper elever å forbedre sin faglige forståelse og muntlige fremstilling.';
  },

  getTips: (config: Record<string, unknown>): string => {
    const level = (config.level as string) || 'videregaende';

    if (level === 'barneskole' || level === 'ungdomsskole') {
      return 'Pust rolig. Hvis du ikke forstår spørsmålet, be sensor forklare. Det er lov å tenke!';
    } else if (level === 'videregaende') {
      return 'Bruk fagbegreper og forklar dem. Vis at du forstår sammenhenger, ikke bare fakta.';
    } else {
      return 'Vis kritisk tenkning. Problematiser, drøft flere perspektiver, og referer til teori.';
    }
  },

  chatLabels: {
    user: 'Deg',
    ai: 'Sensor',
  },
  perspectiveTitle: 'Sensors vurdering',
};
