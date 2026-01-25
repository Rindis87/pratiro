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

FAGLIG UTFORDRING:
- Test dybdeforståelse: "Kan du forklare hvorfor det er slik?"
- Utfordre svarene: "Stemmer det alltid?", "Hva med...?", "Finnes det unntak?"
- Be om eksempler: "Kan du gi et konkret eksempel på det?"
- Koble til annet stoff: "Hvordan henger dette sammen med...?"
- Hvis svaret er upresist eller feil, led eleven på rett spor uten å gi fasit

VIKTIG - GJØR DETTE:
- Vær faglig presis og korrekt
- Hold svarene korte (1-2 setninger + nytt spørsmål)
- Anerkjenn riktige elementer kort før du går videre
- Vær vennlig men profesjonell

IKKE GJØR DETTE:
- Ikke gi fasitsvar underveis
- Ikke godta faglig feil informasjon uten å utfordre det
- Ikke vær overdrevent positiv til svake svar
- Ikke still ledende spørsmål som avslører svaret
- Ikke skriv lange svar - vær kortfattet som en ekte sensor`;
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

Finn på et vanlig norsk navn til deg selv (f.eks. Hansen, Olsen, Berg). Ønsk eleven velkommen, presenter deg kort med etternavn, og forklar hvordan eksamen vil foregå før du stiller det første spørsmålet.

Eksempel på god åpning: "Hei og velkommen! Jeg er Hansen, og jeg skal være sensor i dag. Du får god tid til å tenke, og jeg kommer til å stille noen oppfølgingsspørsmål underveis. La oss begynne..."

Svar på norsk. Vær vennlig men profesjonell. Ikke bruk placeholder-tekst.`;
  },

  getContinuePrompt: (config: Record<string, unknown>, history: string): string => {
    const level = (config.level as string) || 'videregaende';

    return `EKSAMENSHISTORIKK:
${history}

Eleven ga akkurat det siste svaret. Som sensor på ${level}-nivå:

REAGER PÅ SVARET:
- Hvis svaret var faglig korrekt og utfyllende, anerkjenn kort og gå videre til nytt tema
- Hvis svaret var delvis riktig, be eleven utdype eller presisere
- Hvis svaret var upresist eller feil, utfordre forsiktig ("Er du sikker på det?", "Hva mener du med...?")
- Ikke gjenta spørsmål du allerede har stilt
- Bygg videre på det eleven har sagt - koble til relaterte emner

Hold svarene korte (1-2 setninger totalt). Ikke gi fasitsvar. Svar på norsk.`;
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

SCORING (vær støttende og konstruktiv):
- 1-3: Eksamen var krevende. Muntlig eksamen er vanskelig - her er det gode muligheter for læring.
- 4-5: Grunnleggende forståelse, med tydelig potensial for utvikling. Du er på rett spor.
- 6-7: God faglig innsats! Noen områder kan styrkes for å heve prestasjonen.
- 8-9: Veldig god faglig forståelse og formidling. Imponerende innsats.
- 10: Eksemplarisk prestasjon - dyp forståelse og fremragende formidling.

Gi tilbakemelding i JSON format:
{
  "mainFeedback": "2-3 setninger som oppsummerer eksaminasjonen. Vær konkret, oppmuntrende og konstruktiv.",
  "strengths": ["Hva eleven viste god forståelse for 1", "Hva eleven gjorde bra 2"],
  "improvements": ["Konstruktivt læringstips 1", "Konkret forbedringsområde 2"],
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
