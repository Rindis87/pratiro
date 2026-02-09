import { ArenaConfig, Scenario } from '../types';

const JobbintervjuIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 24 24">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
    <polyline points="22 4 12 14.01 9 11.01"></polyline>
  </svg>
);

export const jobbintervjuArena: ArenaConfig = {
  id: 'jobbintervju',
  name: 'Jobbintervju',
  tagline: 'Forbered deg til drømmejobben',
  description: 'Forbered deg grundig til drømmejobben. Øv på vanlige spørsmål og få konstruktiv tilbakemelding.',
  icon: JobbintervjuIcon,
  color: 'bark',
  tags: ['Fortell om deg selv', 'Styrker og svakheter', 'Lønnsforhandling'],

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
        { value: 'fagarbeider', label: 'Fagarbeider/Håndverk' },
        { value: 'offentlig', label: 'Offentlig forvaltning' },
        { value: 'annet', label: 'Annet (spesifiser under)' },
      ],
      default: 'it',
    },
    {
      id: 'customJobType',
      type: 'text',
      label: 'Spesifiser stilling',
      placeholder: 'F.eks. "Prosjektleder i bygg"',
      default: '',
    },
    {
      id: 'interviewType',
      type: 'buttons',
      label: 'Intervjutype',
      options: [
        { value: 'first', label: 'Første intervju' },
        { value: 'second', label: 'Andre intervju' },
        { value: 'case', label: 'Case-intervju' },
      ],
      default: 'first',
    },
    {
      id: 'interviewStyle',
      type: 'buttons',
      label: 'Intervjustil',
      options: [
        { value: 'friendly', label: 'Vennlig' },
        { value: 'neutral', label: 'Nøytral' },
        { value: 'demanding', label: 'Krevende' },
      ],
      default: 'neutral',
    },
  ],

  getScenarios: (): Scenario[] => {
    // Jobbintervju har ikke scenarioer på samme måte - intervjuet følger en naturlig flyt
    return [
      { id: 'standard', title: 'Standard intervju', description: 'Et vanlig jobbintervju med de mest typiske spørsmålene.' },
      { id: 'competence', title: 'Kompetansebasert', description: 'Fokus på STAR-metoden og konkrete eksempler fra din erfaring.' },
      { id: 'motivation', title: 'Motivasjonsintervju', description: 'Fokus på hvorfor du vil ha jobben og hva som driver deg.' },
      { id: 'stress', title: 'Pressintervju', description: 'Intervjuer utfordrer deg og stiller kritiske oppfølgingsspørsmål.' },
    ];
  },

  getRolePrompt: (config: Record<string, unknown>): string => {
    const jobType = (config.jobType as string) || 'it';
    const customJobType = (config.customJobType as string) || '';
    const interviewType = (config.interviewType as string) || 'first';
    const interviewStyle = (config.interviewStyle as string) || 'neutral';

    const jobTypeMap: Record<string, string> = {
      okonomi: 'økonomi og regnskap',
      hr: 'HR og personal',
      it: 'IT og teknologi',
      salg: 'salg og markedsføring',
      helse: 'helse og omsorg',
      undervisning: 'undervisning',
      ledelse: 'ledelse',
      fagarbeider: 'fagarbeider/håndverk',
      offentlig: 'offentlig forvaltning',
      annet: customJobType || 'generell stilling',
    };

    const jobDescription = jobTypeMap[jobType] || customJobType || 'generell stilling';

    const interviewTypeMap: Record<string, string> = {
      first: 'første intervju (bli-kjent og motivasjon)',
      second: 'andre intervju (dypere faglig og kulturell fit)',
      case: 'case-intervju (løse en praktisk oppgave)',
    };

    let styleGuidelines = '';
    if (interviewStyle === 'friendly') {
      styleGuidelines = 'Vær varm og imøtekommende. Smil (i teksten), nikk anerkjennende, og gi positive tilbakemeldinger underveis.';
    } else if (interviewStyle === 'neutral') {
      styleGuidelines = 'Vær profesjonell og saklig. Lyttende, men uten å gi mye feedback på svarene underveis.';
    } else {
      styleGuidelines = 'Vær utfordrende. Still oppfølgingsspørsmål, be om konkrete eksempler, og utfordre vage svar.';
    }

    return `Du er en intervjuer som gjennomfører et ${interviewTypeMap[interviewType]} for en stilling innen ${jobDescription}.

${styleGuidelines}

INTERVJUSTRUKTUR:
- Still 5-7 hovedspørsmål totalt i intervjuet
- Start med "Fortell litt om deg selv" eller lignende åpningsspørsmål
- Inkluder 2-3 fagspesifikke spørsmål relevante for ${jobDescription}
- Avslutt med "Har du noen spørsmål til oss?" når samtalen nærmer seg slutten

VIKTIG - GJØR DETTE:
- Still spørsmål ett av gangen
- Lytt til svarene og still oppfølgingsspørsmål når det er naturlig
- Hvis kandidaten gir vage svar, be om konkrete eksempler

IKKE GJØR DETTE:
- Ikke still flere spørsmål samtidig
- Ikke gi kandidaten fasit eller hint om hva du vil høre
- Ikke vær unaturlig vennlig eller unaturlig streng - vær profesjonell
- Ikke hopp over oppfølgingsspørsmål når svaret er ufullstendig
- ALDRI bruk plassholdere som [navn], [rolle], [stilling] osv. - bruk konkrete norske navn og titler`;
  },

  getStartPrompt: (config: Record<string, unknown>, scenario: string): string => {
    const jobType = (config.jobType as string) || 'it';
    const customJobType = (config.customJobType as string) || '';

    const jobTypeMap: Record<string, string> = {
      okonomi: 'økonomi',
      hr: 'HR',
      it: 'IT',
      salg: 'salg',
      helse: 'helse',
      undervisning: 'undervisning',
      ledelse: 'ledelse',
      fagarbeider: 'fagarbeid',
      offentlig: 'offentlig sektor',
      annet: customJobType || 'denne stillingen',
    };

    const _jobArea = jobTypeMap[jobType] || 'denne stillingen';

    return `Start jobbintervjuet. Du er intervjueren.

Intervjutype: ${scenario}

Finn på et vanlig norsk navn til deg selv (f.eks. Kari, Erik, Mona, Lars) og en passende rolle basert på stillingen (f.eks. HR-leder, avdelingsleder, fagansvarlig).

Ønsk kandidaten velkommen, introduser deg med navn og rolle, og still det første spørsmålet.

Eksempel på god åpning: "Hei, velkommen! Jeg heter Kari Johansen og er HR-leder her. Fint du kunne komme. Skal vi sette i gang?"

Svar på norsk. Hold det naturlig og profesjonelt. Ikke bruk placeholder-tekst som [navn] eller [rolle].`;
  },

  getContinuePrompt: (config: Record<string, unknown>, history: string): string => {
    return `INTERVJUHISTORIKK:
${history}

Kandidaten ga akkurat det siste svaret. Som intervjuer, responser naturlig.

REAGER PÅ SVARET:
- Hvis svaret var vagt eller generelt, be om et konkret eksempel
- Hvis svaret var godt og konkret, anerkjenn kort ("Interessant", "Fint eksempel") og gå videre
- Hvis svaret avslørte noe interessant, still et oppfølgingsspørsmål om det
- Ikke gjenta spørsmål du allerede har stilt
- Hold oversikt over hvor langt i intervjuet dere er kommet

Vær kortfattet (1-2 setninger + nytt spørsmål). Svar på norsk.`;
  },

  getAnalysisPrompt: (config: Record<string, unknown>, history: string, scenario: string): string => {
    const jobType = (config.jobType as string) || 'it';
    const customJobType = (config.customJobType as string) || '';

    const jobTypeMap: Record<string, string> = {
      okonomi: 'økonomi/regnskap',
      hr: 'HR/personal',
      it: 'IT/teknologi',
      salg: 'salg/marked',
      helse: 'helse/omsorg',
      undervisning: 'undervisning',
      ledelse: 'ledelse',
      fagarbeider: 'fagarbeider/håndverk',
      offentlig: 'offentlig forvaltning',
      annet: customJobType || 'generell stilling',
    };

    const jobDescription = jobTypeMap[jobType] || customJobType || 'generell stilling';

    return `Analyser dette jobbintervjuet for en stilling innen ${jobDescription}.
Intervjutype: ${scenario}

Intervju:
${history}

Du er en erfaren rekrutterer og karriererådgiver.

SCORING (vær støttende og konstruktiv):
- 1-3: Intervjuet var utfordrende. Intervjuer er vanskelige - her er det mye å bygge videre på.
- 4-5: Gode forsøk, med tydelige muligheter for forbedring. Du har et godt utgangspunkt.
- 6-7: Solid intervju! Noen justeringer kan gjøre deg til en enda sterkere kandidat.
- 8-9: Veldig godt gjennomført. Du fremstår som en attraktiv kandidat.
- 10: Eksemplarisk intervjuprestasjon - profesjonell og overbevisende.

Gi tilbakemelding i JSON format. VIKTIG: Hold alle felter korte og konsise.
{
  "mainFeedback": "1-2 korte setninger som oppsummerer intervjuet.",
  "strengths": ["Kort punkt 1", "Kort punkt 2"],
  "improvements": ["Kort tips 1", "Kort tips 2"],
  "perspective": "1-2 setninger om intervjuerens inntrykk.",
  "score": 1-10
}
Maks 2 punkter per liste. Svar på norsk. Kun JSON, ingen annen tekst.`;
  },

  getAnalysisSystemPrompt: (): string => {
    return 'Du er en erfaren rekrutterer og karriererådgiver. Gi konstruktiv tilbakemelding som hjelper jobbsøkere å forbedre sine intervjuferdigheter.';
  },

  getTips: (config: Record<string, unknown>): string => {
    const interviewType = (config.interviewType as string) || 'first';

    if (interviewType === 'first') {
      return 'Vis entusiasme og koble din bakgrunn til stillingen. Forbered gode spørsmål til dem.';
    } else if (interviewType === 'second') {
      return 'Gå dypere i faglige eksempler. Vis at du har researched selskapet godt.';
    } else {
      return 'Tenk høyt gjennom problemet. Strukturer svaret ditt og be om oppklaring om nødvendig.';
    }
  },

  chatLabels: {
    user: 'Deg',
    ai: 'Intervjuer',
  },
  perspectiveTitle: 'Intervjuerens inntrykk',
};
