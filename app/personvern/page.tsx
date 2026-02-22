'use client';

import { useState } from 'react';
import Link from 'next/link';

const C = {
  forest: '#2A4036', fl: '#4A6359', fd: '#1F3029',
  sage: '#E7ECEA', sand: '#F7F5F0', mist: '#FDFCFB',
  ocean: '#5B7A8C', text: '#252825', ts: '#5C5F5C',
  stone: '#7D786D', white: '#FFFFFF', green: '#2A6B45',
};

type Tab = 'personvern' | 'vilkar' | 'cookies';

export default function PersonvernPage() {
  const [tab, setTab] = useState<Tab>('personvern');

  return (
    <div className="min-h-screen" style={{ background: C.mist }}>

      {/* ── Nav ── */}
      <nav
        className="sticky top-0 z-50 flex items-center justify-between px-6 py-3.5 border-b"
        style={{
          background: 'rgba(253,252,251,0.85)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderColor: 'rgba(42,64,54,0.06)',
        }}
      >
        <div
          className="absolute top-0 left-0 right-0 h-[2px]"
          style={{ background: 'linear-gradient(90deg, rgba(42,64,54,0.3), rgba(91,122,140,0.15), rgba(42,64,54,0.3))' }}
        />
        <Link href="/" className="flex items-center gap-2.5 no-underline">
          <div className="flex gap-[3px]">
            <span className="block w-1 h-4 rounded-[1px]" style={{ background: C.forest, opacity: 0.5 }} />
            <span className="block w-1 h-4 rounded-[1px]" style={{ background: C.forest, opacity: 0.5 }} />
          </div>
          <span className="font-serif text-[1.1rem]" style={{ color: C.forest }}>Pratiro</span>
        </Link>
        <Link href="/" className="text-[0.78rem] font-semibold no-underline hover:underline" style={{ color: C.stone }}>
          &larr; Tilbake
        </Link>
      </nav>

      {/* ── Header ── */}
      <div className="max-w-[720px] mx-auto px-6 pt-14 pb-8">
        <h1 className="text-[2rem] font-serif font-normal mb-2" style={{ color: C.forest }}>
          Personvern og vilk&aring;r
        </h1>
        <p className="text-[0.82rem]" style={{ color: C.stone }}>Sist oppdatert: februar 2026</p>
      </div>

      {/* ── Content ── */}
      <div className="max-w-[720px] mx-auto px-6 pb-20">

        {/* Tabs */}
        <div className="flex gap-1 p-1 rounded-xl mb-10" style={{ background: C.sage }}>
          {([
            ['personvern', 'Personvernerkl\u00e6ring'],
            ['vilkar', 'Bruksvilk\u00e5r'],
            ['cookies', 'Informasjonskapsler'],
          ] as [Tab, string][]).map(([id, label]) => (
            <button
              key={id}
              onClick={() => { setTab(id); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
              className="flex-1 py-2.5 px-4 rounded-lg text-[0.85rem] font-semibold transition-all"
              style={tab === id
                ? { background: C.white, color: C.forest, boxShadow: '0 2px 8px rgba(42,64,54,0.08)' }
                : { color: C.stone, background: 'transparent' }}
            >
              {label}
            </button>
          ))}
        </div>

        {/* ════ PERSONVERNERKL\u00c6RING ════ */}
        {tab === 'personvern' && (
          <div className="space-y-0">
            <Highlight>
              <p><strong>Kort oppsummert:</strong> Pratiro lagrer ikke brukerprofiler eller varige personopplysninger. Noe teknisk informasjon (som IP-adresse) behandles midlertidig for &aring; sikre stabil drift og forhindre misbruk. Tekst og bilder du sender til AI-verkt&oslash;yene behandles kun for &aring; gi deg svar, og slettes umiddelbart etterp&aring;. Vi bruker ingen sporingsteknologi og selger aldri data til tredjeparter.</p>
            </Highlight>

            <H2>1. Hvem er behandlingsansvarlig?</H2>
            <ContactCard>
              <p><strong>Pratiro</strong> &ndash; privat prosjekt</p>
              <p>E-post: <a href="mailto:pratiroinfo@gmail.com" className="underline underline-offset-2 hover:opacity-70 transition-opacity" style={{ color: C.ocean }}>pratiroinfo@gmail.com</a></p>
              <p>Sted: Skien, Norge</p>
            </ContactCard>
            <P>Pratiro er en privat nettside som tilbyr gratis &oslash;vingsverkt&oslash;y for samtaler, matte og pr&oslash;veforberedelse. Tjenesten drives som et personlig prosjekt og er ikke tilknyttet noen bedrift eller organisasjon.</P>

            <H2>2. Hvilke opplysninger behandles?</H2>
            <P>Vi behandler sv&aelig;rt lite data. Her er en fullstendig oversikt:</P>
            <DataTable headers={['Opplysning', 'Form\u00e5l', 'Lagres?']} rows={[
              ['Tekst du skriver i samtalesimulator eller glose\u00f8ving', 'Sendes til AI-tjeneste for \u00e5 generere svar', 'Nei \u2013 slettes etter API-kall'],
              ['Bilder du laster opp i pr\u00f8ve/gloseverkt\u00f8y', 'Sendes til AI-tjeneste for tekstgjenkjenning', 'Nei \u2013 slettes etter API-kall'],
              ['IP-adresse', 'Brukes kun for bruksbegrensning (rate limiting) for \u00e5 beskytte mot misbruk', 'Kun midlertidig i minne (maks 24 timer), anonymisert'],
              ['Lokal \u00f8ktdata (localStorage)', 'Huske dine innstillinger og p\u00e5g\u00e5ende \u00f8ving', 'Kun i din nettleser \u2013 vi har ikke tilgang'],
            ]} />
            <Highlight>
              <p><strong>Vi samler IKKE inn:</strong> navn, e-postadresser, telefonnummer, alder, skoledata, beliggenhet, nettleserhistorikk, eller noen annen personlig informasjon.</p>
            </Highlight>

            <H2>3. AI-tjenester og tredjeparter</H2>
            <P>Noen verkt&oslash;y p&aring; Pratiro bruker kunstig intelligens for &aring; fungere. N&aring;r du bruker disse verkt&oslash;yene, sendes teksten eller bildet du legger inn til en AI-tjeneste for behandling:</P>
            <DataTable headers={['Verkt\u00f8y', 'AI-tjeneste', 'Hva sendes?']} rows={[
              ['Samtalesimulator', 'Google Gemini API', 'Samtale-tekst'],
              ['Gloser / Pr\u00f8veforberedelse', 'Google Gemini API / Anthropic Claude API', 'Tekst eller bilde du legger inn'],
              ['MatteMester', 'Ingen (beregnes lokalt)', 'Ingenting \u2013 fungerer uten internett'],
            ]} />
            <P>Dataene sendes via v&aring;r server (som legger til API-n&oslash;kkelen) direkte til AI-tjenesten, som returnerer et svar. Vi lagrer ingen kopi av foresp&oslash;rselen eller svaret.</P>
            <P>AI-leverand&oslash;rene (Google og Anthropic) behandler data som selvstendige behandlingsansvarlige for sin del av tjenesten. Overf&oslash;ring av data kan inneb&aelig;re overf&oslash;ring til land utenfor EU/E&Oslash;S (f.eks. USA). Leverand&oslash;rene benytter godkjente overf&oslash;ringsmekanismer i henhold til GDPR.</P>
            <P>AI-tjenestenes egne personvernerkl&aelig;ringer gjelder for deres behandling av data:</P>
            <P>
              <a href="https://ai.google.dev/gemini-api/terms" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:opacity-70 transition-opacity" style={{ color: C.ocean }}>Google Gemini API &ndash; vilk&aring;r</a><br />
              <a href="https://www.anthropic.com/privacy" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:opacity-70 transition-opacity" style={{ color: C.ocean }}>Anthropic Claude &ndash; personvern</a>
            </P>

            <H2>4. Barn og mindre&aring;rige</H2>
            <P>Pratiro Skole er designet for bruk av elever i grunnskolen, ofte sammen med foreldre. Vi tar barns personvern ekstra alvorlig.</P>
            <Highlight>
              <p><strong>Viktig for foreldre:</strong> Pratiro krever ingen registrering, innlogging eller personopplysninger &ndash; heller ikke fra barn. Barnet ditt kan bruke MatteMester uten at noen data forlater nettleseren. For AI-verkt&oslash;yene (gloser/pr&oslash;ve) sendes kun den teksten barnet legger inn, og den slettes umiddelbart etter bruk.</p>
            </Highlight>
            <P>Siden vi ikke samler inn personopplysninger, utl&oslash;ses ikke kravene i personopplysningsloven &sect; 5 om foreldresamtykke for barn under 13 &aring;r. Dersom dette endrer seg i fremtiden, vil vi oppdatere denne erkl&aelig;ringen og innhente n&oslash;dvendig samtykke.</P>
            <P>Vi anbefaler likevel at foreldre sitter sammen med yngre barn n&aring;r de bruker AI-baserte verkt&oslash;y.</P>
            <Highlight>
              <p><strong>Viktig:</strong> Vi ber alle brukere &mdash; spesielt barn &mdash; om &aring; ikke skrive inn navn, adresser eller annen personlig informasjon i verkt&oslash;yene.</p>
            </Highlight>

            <H2>5. Behandlingsgrunnlag</H2>
            <P>Vi baserer den begrensede databehandlingen v&aring;r p&aring; f&oslash;lgende grunnlag (jf. GDPR artikkel 6):</P>
            <P><strong>Berettiget interesse (art. 6(1)(f)):</strong> Midlertidig lagring av anonymiserte IP-adresser for rate limiting er n&oslash;dvendig for &aring; beskytte tjenesten mot misbruk og sikre at den forblir gratis for alle brukere. Vi har vurdert at dette ikke utgj&oslash;r et uforholdsmessig inngrep i den enkeltes personvern.</P>
            <P><strong>Avtale (art. 6(1)(b)):</strong> Behandling av tekst/bilder som sendes til AI-tjenester er n&oslash;dvendig for &aring; levere tjenesten du har bedt om (&aring; f&aring; svar fra AI-verkt&oslash;yet).</P>

            <H2>6. Dine rettigheter</H2>
            <P>Etter personvernregelverket har du rett til:</P>
            <DataTable headers={['Rettighet', 'Beskrivelse']} rows={[
              ['Innsyn', 'Be om oversikt over hvilke opplysninger vi har om deg'],
              ['Retting', 'Be om at feilaktige opplysninger rettes'],
              ['Sletting', 'Be om at opplysninger slettes'],
              ['Begrensning', 'Be om at behandlingen begrenses'],
              ['Dataportabilitet', 'F\u00e5 dine data utlevert i maskinlesbart format'],
              ['Innsigelse', 'Protestere mot behandling basert p\u00e5 berettiget interesse'],
            ]} />
            <P>I praksis har vi ingen personopplysninger lagret om deg, s&aring; de fleste av disse rettighetene vil allerede v&aelig;re oppfylt. Har du likevel sp&oslash;rsm&aring;l eller &oslash;nsker &aring; ut&oslash;ve rettighetene dine, kontakt oss p&aring; <a href="mailto:pratiroinfo@gmail.com" className="underline underline-offset-2 hover:opacity-70 transition-opacity" style={{ color: C.ocean }}>pratiroinfo@gmail.com</a>. Vi svarer innen 30 dager.</P>
            <P>Du har ogs&aring; rett til &aring; klage til <a href="https://www.datatilsynet.no" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:opacity-70 transition-opacity" style={{ color: C.ocean }}>Datatilsynet</a> dersom du mener vi behandler personopplysninger i strid med regelverket.</P>

            <H2>7. Sikkerhet</H2>
            <P>Vi har iverksatt f&oslash;lgende tiltak for &aring; beskytte data:</P>
            <P>All kommunikasjon mellom din nettleser og v&aring;r server skjer over HTTPS (kryptert forbindelse). API-n&oslash;kler oppbevares p&aring; serveren og eksponeres aldri i klienten. Rate limiting begrenser antall API-kall per bruker for &aring; hindre misbruk. Vi har en n&oslash;dbrems (kill switch) som kan skru av alle AI-funksjoner umiddelbart ved behov.</P>

            <H2>8. Endringer</H2>
            <P>Vi forbeholder oss retten til &aring; oppdatere denne personvernerkl&aelig;ringen. Vesentlige endringer vil bli varslet med en tydelig melding p&aring; nettsiden. Siste oppdateringsdato vises &oslash;verst p&aring; denne siden.</P>
          </div>
        )}

        {/* ════ BRUKSVILK&Aring;R ════ */}
        {tab === 'vilkar' && (
          <div className="space-y-0">
            <Highlight>
              <p><strong>Kort oppsummert:</strong> Pratiro er gratis &aring; bruke. Verkt&oslash;yene er ment som &oslash;vingshjelp, ikke som profesjonelle tjenester. AI kan gi feil svar. Bruk sunn fornuft.</p>
            </Highlight>

            <H2 first>1. Om tjenesten</H2>
            <P>Pratiro er en gratis nettside som tilbyr &oslash;vingsverkt&oslash;y for samtaler, matematikk og pr&oslash;veforberedelse. Tjenesten drives som et personlig prosjekt og tilbys &laquo;som den er&raquo; uten garantier for tilgjengelighet, n&oslash;yaktighet eller egnethet for bestemte form&aring;l.</P>

            <H2>2. Bruksbegrensninger</H2>
            <P>For &aring; holde tjenesten gratis og tilgjengelig for alle, gjelder f&oslash;lgende begrensninger:</P>
            <P>Antall AI-foresp&oslash;rsler per bruker er begrenset per dag. Den eksakte grensen kan justeres etter behov. Overdreven eller automatisert bruk (roboter, scripts, scraping) er ikke tillatt. Tjenesten skal brukes til sitt tiltenkte form&aring;l: l&aelig;ring og &oslash;ving.</P>

            <H2>3. AI-generert innhold</H2>
            <Highlight>
              <p><strong>Viktig:</strong> AI-verkt&oslash;yene p&aring; Pratiro bruker kunstig intelligens som kan gi un&oslash;yaktige, ufullstendige eller feilaktige svar. Svarene skal ikke erstatte profesjonell r&aring;dgivning, undervisning eller medisinsk/juridisk hjelp. Brukeren er selv ansvarlig for &aring; vurdere og verifisere AI-generert innhold.</p>
            </Highlight>
            <P>Samtalesimulatorene er &oslash;vingsverkt&oslash;y &ndash; de simulerer samtaler for treningsform&aring;l og gir ikke terapeutisk, medisinsk eller juridisk r&aring;dgivning.</P>
            <P>MatteMester viser regneoperasjoner steg-for-steg basert p&aring; algoritmer. Selv om vi har kvalitetssikret logikken, kan det forekomme feil ved uvanlige tall eller kombinasjoner.</P>

            <H2>4. Ansvarsbegrensning</H2>
            <P>Pratiro er ikke ansvarlig for tap, skade eller ulempe som oppst&aring;r som f&oslash;lge av bruk av tjenesten, inkludert men ikke begrenset til: feilaktige AI-svar, utilgjengelighet av tjenesten, tap av data i nettleseren (localStorage), eller handlinger basert p&aring; innhold generert av AI-verkt&oslash;yene.</P>

            <H2>5. Immaterielle rettigheter</H2>
            <P>Innholdet p&aring; pratiro.no (design, kode, tekst, logo) er beskyttet av opphavsrett og tilh&oslash;rer Pratiro. Brukerne beholder alle rettigheter til innhold de selv legger inn i verkt&oslash;yene.</P>

            <H2>6. Endringer og avslutning</H2>
            <P>Vi forbeholder oss retten til &aring; endre, begrense eller avslutte tjenesten uten forvarsel. Siden tjenesten er gratis og ikke krever registrering, medf&oslash;rer dette ingen forpliktelser overfor brukerne.</P>
          </div>
        )}

        {/* ════ INFORMASJONSKAPSLER ════ */}
        {tab === 'cookies' && (
          <div className="space-y-0">
            <Highlight>
              <p><strong>Kort oppsummert:</strong> Pratiro bruker ingen informasjonskapsler (cookies) for sporing eller markedsf&oslash;ring. Vi bruker kun lokal lagring i nettleseren (localStorage) for &aring; huske innstillingene dine.</p>
            </Highlight>

            <H2 first>Hva bruker vi?</H2>
            <DataTable headers={['Teknologi', 'Type', 'Form\u00e5l', 'Samtykke?']} rows={[
              ['localStorage', 'Nettleserlagring', 'Huske \u00f8kt-data (p\u00e5g\u00e5ende samtale, gloser under \u00f8ving, innstillinger)', 'N\u00f8dvendig for funksjon \u2013 samtykke ikke p\u00e5krevet'],
            ]} />

            <H2>Hva bruker vi IKKE?</H2>
            <P>Pratiro bruker ikke: tredjeparts informasjonskapsler, sporingsteknologi (pixels, fingerprinting), analyseverkt&oslash;y (Google Analytics, Meta Pixel, etc.), markedsf&oslash;rings- eller annonseteknologi, eller noen form for profilering av brukere.</P>

            <H2>Hvorfor ingen cookie-banner?</H2>
            <P>If&oslash;lge den nye ekomloven (i kraft 1. januar 2025) og Datatilsynets veiledning kreves samtykke for informasjonskapsler og sporingsteknologier som ikke er strengt n&oslash;dvendige for tjenestens funksjon. Siden Pratiro kun bruker localStorage for n&oslash;dvendig funksjonalitet (og ingen cookies), er det ikke n&oslash;dvendig med et samtykkebanner.</P>
            <P>Dersom vi i fremtiden innf&oslash;rer analyseverkt&oslash;y eller andre teknologier som krever samtykke, vil vi oppdatere denne siden og innhente samtykke i henhold til gjeldende regelverk.</P>

            <H2>Slette lokal data</H2>
            <P>Du kan n&aring;r som helst slette data som er lagret lokalt i nettleseren din. G&aring; til nettleserens innstillinger &rarr; Personvern &rarr; Slett nettleserdata, og velg &laquo;Lokal lagring&raquo; eller &laquo;Nettstedsdata&raquo;. Alternativt kan du bruke &laquo;Tilbakestill&raquo;-funksjonen inne i verkt&oslash;yene for &aring; slette &oslash;kt-data.</P>
          </div>
        )}
      </div>

      {/* ── Footer ── */}
      <footer className="border-t py-7 px-6 text-center" style={{ borderColor: 'rgba(42,64,54,0.06)' }}>
        <div className="flex items-center justify-center gap-1.5 mb-1.5">
          <div className="flex gap-[2px]">
            <span className="block w-[3px] h-3 rounded-[1px]" style={{ background: C.forest, opacity: 0.25 }} />
            <span className="block w-[3px] h-3 rounded-[1px]" style={{ background: C.forest, opacity: 0.25 }} />
          </div>
          <span className="font-serif text-[0.85rem]" style={{ color: C.stone }}>Pratiro</span>
        </div>
        <p className="text-[0.72rem]" style={{ color: C.stone }}>
          <Link href="/" className="no-underline hover:underline" style={{ color: C.stone }}>Samtale&oslash;ving</Link>
          {' \u00b7 '}
          <Link href="/skole" className="no-underline hover:underline" style={{ color: C.stone }}>Skole</Link>
          {' \u00b7 '}
          <Link href="/personvern" className="no-underline hover:underline" style={{ color: C.stone }}>Personvern</Link>
          {' \u00b7 \u00a9 2026'}
        </p>
      </footer>
    </div>
  );
}

// ── Gjenbrukbare komponenter ──

function H2({ children, first }: { children: React.ReactNode; first?: boolean }) {
  return (
    <h2
      className="text-[1.35rem] font-serif font-normal pb-2 border-b"
      style={{ color: '#2A4036', borderColor: 'rgba(42,64,54,0.06)', marginTop: first ? 0 : 40, marginBottom: 12 }}
    >
      {children}
    </h2>
  );
}

function P({ children }: { children: React.ReactNode }) {
  return <p className="text-[0.92rem] leading-[1.7] mb-3" style={{ color: '#5C5F5C' }}>{children}</p>;
}

function Highlight({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="border-l-[3px] rounded-r-xl py-4 px-5 my-4 [&_p]:mb-0 [&_p]:text-[0.92rem] [&_p]:leading-[1.7] [&_strong]:text-[#2A4036]"
      style={{ background: 'rgba(42,64,54,0.04)', borderColor: '#2A4036', color: '#5C5F5C' }}
    >
      {children}
    </div>
  );
}

function ContactCard({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="rounded-2xl p-6 my-4 [&_p]:mb-1 [&_p]:text-[0.92rem] [&_p]:leading-[1.7] [&_strong]:text-[#2A4036]"
      style={{ background: '#F7F5F0', color: '#5C5F5C' }}
    >
      {children}
    </div>
  );
}

function DataTable({ headers, rows }: { headers: string[]; rows: string[][] }) {
  return (
    <div className="overflow-x-auto my-4">
      <table className="w-full border-collapse text-[0.85rem]">
        <thead>
          <tr>
            {headers.map((h, i) => (
              <th
                key={i}
                className="text-left py-2.5 px-3.5 text-[0.78rem] font-bold uppercase tracking-[0.5px]"
                style={{ background: '#E7ECEA', color: '#2A4036' }}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i}>
              {row.map((cell, j) => (
                <td
                  key={j}
                  className="py-2.5 px-3.5 border-b"
                  style={{ borderColor: 'rgba(42,64,54,0.04)', color: '#5C5F5C' }}
                  dangerouslySetInnerHTML={{ __html: cell }}
                />
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
