'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Logo, ProductIcon } from './components/ui/Logo';
import { arenaList } from './config/arenas';
import { ArenaId } from './config/types';
import { validateAccessCode } from './actions';

export default function LandingPage() {
  const router = useRouter();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [selectedArena, setSelectedArena] = useState<ArenaId | null>(null);
  const [accessCode, setAccessCode] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Scroll fade-in observer
  const observerRef = useRef<IntersectionObserver | null>(null);
  useEffect(() => {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('fade-in-up');
            observerRef.current?.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
    );

    document.querySelectorAll('.observe-fade').forEach((el) => {
      observerRef.current?.observe(el);
    });

    return () => observerRef.current?.disconnect();
  }, []);

  const handleArenaClick = (arenaId: ArenaId) => {
    setSelectedArena(arenaId);
    setShowLoginModal(true);
    setError('');
    setAccessCode('');
  };

  const handleLogin = async () => {
    setIsLoading(true);
    setError('');

    const isValid = await validateAccessCode(accessCode);

    if (isValid) {
      sessionStorage.setItem('pratiro_access', 'true');
      if (selectedArena) {
        router.push(`/simulator?arena=${selectedArena}`);
      } else {
        router.push('/simulator');
      }
    } else {
      setError('Feil tilgangskode. Prøv igjen.');
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleLogin();
    }
  };

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="landing min-h-screen bg-[#FDFCFB] text-[#252825] selection:bg-[#2A4036]/20">

      {/* ===== NAVIGATION ===== */}
      <nav
        aria-label="Hovednavigasjon"
        className="fixed top-0 w-full z-50 border-b border-black/[0.04]"
        style={{
          background: 'rgba(253,252,251,0.9)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
        }}
      >
        {/* Top stripe */}
        <div
          className="h-[2px] opacity-70"
          style={{
            background: 'linear-gradient(90deg, rgba(42,64,54,0.65), rgba(42,64,54,0.12), rgba(42,64,54,0.65))',
          }}
        />
        <div className="max-w-[1140px] mx-auto px-6 py-5 flex justify-between items-center">
          <a href="#top" aria-label="Pratiro – til toppen">
            <Logo size="md" color="forest" />
          </a>

          <div className="hidden md:flex items-center gap-8">
            <button onClick={() => scrollTo('arenaer')} className="text-[0.95rem] font-medium text-[#5C5F5C] hover:text-[#2A4036] transition-colors">
              Arenaer
            </button>
            <button onClick={() => scrollTo('slik')} className="text-[0.95rem] font-medium text-[#5C5F5C] hover:text-[#2A4036] transition-colors">
              Slik fungerer det
            </button>
            <button onClick={() => scrollTo('om')} className="text-[0.95rem] font-medium text-[#5C5F5C] hover:text-[#2A4036] transition-colors">
              Om Pratiro
            </button>
          </div>

          <button
            onClick={() => scrollTo('arenaer')}
            className="px-6 py-2.5 rounded-full bg-[#2A4036] text-white text-[0.95rem] font-medium
                       shadow-[0_4px_12px_rgba(42,64,54,0.15)] hover:bg-[#1F3029] hover:-translate-y-0.5
                       hover:shadow-[0_8px_20px_rgba(42,64,54,0.25)] transition-all duration-300"
          >
            Start i ro
          </button>
        </div>
      </nav>

      {/* ===== HERO ===== */}
      <header className="relative pt-[180px] pb-16 min-h-screen overflow-hidden" id="top" role="banner"
        style={{
          background: `
            radial-gradient(ellipse at 80% 20%, rgba(255,248,225,0.45) 0%, transparent 55%),
            radial-gradient(ellipse at 20% 80%, rgba(42,64,54,0.05) 0%, transparent 50%),
            linear-gradient(180deg, #FAF9F6 0%, #F2EFE9 100%)
          `,
        }}
      >
        <div className="max-w-[1140px] mx-auto px-6 relative z-10 grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-14 items-center">
          {/* Left: Text */}
          <div>
            <h1 className="text-[clamp(2.8rem,5.2vw,4.2rem)] leading-[1.12] tracking-[-0.025em] mb-5">
              Prat i ro.<br />
              &Oslash;v p&aring; samtalene som <span className="text-[#4A6359]">betyr noe.</span>
            </h1>
            <p className="text-[1.08rem] text-[#5C5F5C] leading-[1.72] mb-8 max-w-[48ch]">
              Pratiro gj&oslash;r det enkelt &aring; &oslash;ve p&aring; vanskelige samtaler.
              Ingen kompliserte instruksjoner &ndash; bare velg situasjon og start.
            </p>

            <div className="flex items-center gap-3 mb-7 flex-wrap">
              <button
                onClick={() => scrollTo('arenaer')}
                className="inline-flex items-center gap-2 px-7 py-3 rounded-full bg-[#2A4036] text-white font-semibold text-[0.92rem]
                           shadow-[0_8px_24px_rgba(42,64,54,0.22)] hover:bg-[#1F3029] hover:-translate-y-0.5
                           hover:shadow-[0_12px_32px_rgba(42,64,54,0.30)] transition-all duration-300"
              >
                Start i ro
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="M12 5l7 7-7 7" /></svg>
              </button>
              <button
                onClick={() => scrollTo('slik')}
                className="inline-flex items-center gap-2 px-7 py-3 rounded-full bg-white/80 text-[#2A4036] font-semibold text-[0.92rem]
                           border border-[rgba(42,64,54,0.12)] shadow-[0_4px_16px_rgba(42,64,54,0.06)]
                           hover:bg-white hover:border-[rgba(42,64,54,0.22)] hover:-translate-y-px hover:shadow-[0_8px_24px_rgba(42,64,54,0.10)]
                           transition-all duration-300"
              >
                Les mer
              </button>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {['Trygt', 'Anonymt', 'Utviklet i Norge'].map((pill) => (
                <span key={pill} className="px-3 py-1 rounded-full text-[0.8rem] font-medium text-[#7D786D] bg-white/50 border border-black/5">
                  {pill}
                </span>
              ))}
            </div>
          </div>

          {/* Right: Simulator Preview - Arbeidsliv conversation */}
          <div className="hidden lg:block">
            <aside
              className="bg-white rounded-[24px] shadow-[0_24px_60px_rgba(42,64,54,0.12)] overflow-hidden border border-black/[0.06]"
              aria-label="Forhåndsvisning av simulator"
            >
              {/* Forest header */}
              <div className="bg-[#2A4036] px-4 py-3 flex justify-between items-center text-white">
                <div className="flex items-center gap-2.5">
                  <ProductIcon />
                  <div className="leading-tight">
                    <div className="font-sans font-medium text-[0.95rem]">Pratiro &Oslash;ving</div>
                    <div className="text-[0.7rem] opacity-80">Ny samtale</div>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 text-[0.7rem] bg-white/15 px-2 py-1 rounded-md font-medium">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10" /><polyline points="1 20 1 14 7 14" /><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" /></svg>
                  Start p&aring; nytt
                </div>
              </div>

              {/* Tips bar */}
              <div className="bg-[rgba(42,64,54,0.05)] px-3.5 py-1.5 text-[0.72rem] text-[#2A4036] flex justify-between items-center border-b border-[rgba(42,64,54,0.1)]">
                <span><b>Tips:</b> V&aelig;r konkret og bruk &laquo;og&raquo; i stedet for &laquo;men&raquo;.</span>
                <span className="text-[#7D786D]">3/20</span>
              </div>

              {/* Chat area */}
              <div className="bg-[#FDFCFB] p-3.5 flex flex-col gap-3 min-h-[320px]">
                {/* Messages */}
                <div className="flex flex-col gap-3 flex-1">
                  {/* AI message */}
                  <div className="flex gap-2">
                    <div className="w-7 h-7 rounded-full bg-[#E7ECEA] border border-black/[0.06] flex items-center justify-center shrink-0">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#2A4036" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
                    </div>
                    <div className="flex flex-col gap-0.5 max-w-[82%]">
                      <span className="text-[0.68rem] font-medium text-[#7D786D]">Leder (AI)</span>
                      <div className="bg-white border border-black/[0.05] rounded-r-[14px] rounded-bl-[14px] px-3 py-2 shadow-[0_2px_6px_rgba(0,0,0,0.02)]">
                        <span className="text-[0.82rem] leading-[1.5] text-[#252825]">Jeg ser du har booket tid for en l&oslash;nnssamtale. Hva er dine forventninger?</span>
                      </div>
                    </div>
                  </div>

                  {/* User message */}
                  <div className="flex gap-2 justify-end">
                    <div className="flex flex-col gap-0.5 items-end max-w-[82%]">
                      <span className="text-[0.68rem] font-medium text-[#7D786D]">Medarbeider (deg)</span>
                      <div className="bg-[#2A4036] text-white rounded-l-[14px] rounded-tr-[14px] px-3 py-2">
                        <span className="text-[0.82rem] leading-[1.5]">Jeg har levert sterke resultater i &aring;r, og mener det b&oslash;r reflekteres.</span>
                      </div>
                    </div>
                    <div className="w-7 h-7 rounded-full bg-[#2A4036] flex items-center justify-center shrink-0">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                    </div>
                  </div>

                  {/* AI message */}
                  <div className="flex gap-2">
                    <div className="w-7 h-7 rounded-full bg-[#E7ECEA] border border-black/[0.06] flex items-center justify-center shrink-0">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#2A4036" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
                    </div>
                    <div className="flex flex-col gap-0.5 max-w-[82%]">
                      <span className="text-[0.68rem] font-medium text-[#7D786D]">Leder (AI)</span>
                      <div className="bg-white border border-black/[0.05] rounded-r-[14px] rounded-bl-[14px] px-3 py-2 shadow-[0_2px_6px_rgba(0,0,0,0.02)]">
                        <span className="text-[0.82rem] leading-[1.5] text-[#252825]">Enig i at du har levert bra. Men budsjettet er stramt. Hva tenker du?</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Input area */}
                <div className="bg-[#F7F5F0] rounded-xl p-2.5 border border-black/[0.05]">
                  <div className="flex gap-2 items-center">
                    <div className="flex-1 px-3 py-1.5 rounded-lg border border-black/[0.07] bg-white text-[0.8rem] text-[#7D786D]">
                      Skriv svaret ditt&hellip;
                    </div>
                    <div className="w-[30px] h-[30px] rounded-lg bg-[#2A4036] flex items-center justify-center shrink-0">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" /></svg>
                    </div>
                  </div>
                  <button className="w-full mt-2 bg-[rgba(42,64,54,0.06)] text-[#2A4036] text-[0.76rem] font-medium py-1.5 rounded-lg border border-[rgba(42,64,54,0.12)] flex items-center justify-center gap-1.5">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    Avslutt og f&aring; veiledning
                  </button>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </header>


      {/* ===== SLIK FUNGERER DET (sand) ===== */}
      <section className="py-[100px] bg-[#F7F5F0]" id="slik">
        <div className="max-w-[1140px] mx-auto px-6">
          <div className="text-center max-w-[600px] mx-auto mb-[60px] observe-fade" style={{ opacity: 0 }}>
            <h2 className="text-[clamp(1.9rem,3.8vw,2.8rem)] mb-5">Slik fungerer det</h2>
            <p className="text-[1.05rem] text-[#5C5F5C] leading-relaxed">
              Tre enkle steg til bedre samtaler.
            </p>
          </div>

          <div className="flex flex-col md:flex-row justify-between max-w-[900px] mx-auto relative">
            {/* Connecting line */}
            <div className="hidden md:block absolute top-[25px] left-[10%] right-[10%] h-[2px] bg-[rgba(42,64,54,0.1)]" aria-hidden="true" />

            {[
              { num: '1', title: 'Velg scenario', desc: 'Velg din arena og situasjonen du vil \u00f8ve p\u00e5.' },
              { num: '2', title: 'Prat i ro', desc: '\u00d8v i en realistisk chat med AI som tilpasser seg svarene dine.' },
              { num: '3', title: 'F\u00e5 innsikt', desc: 'Motta tilbakemelding og konkrete tips til forbedring.' },
            ].map((step) => (
              <div key={step.num} className="text-center relative z-10 bg-[#F7F5F0] px-5 flex-1 observe-fade mb-8 md:mb-0" style={{ opacity: 0 }}>
                <div className="w-[50px] h-[50px] bg-[#2A4036] text-white rounded-full flex items-center justify-center mx-auto mb-5 font-serif text-[1.4rem]">
                  {step.num}
                </div>
                <h3 className="text-[1.2rem] mb-2.5">{step.title}</h3>
                <p className="text-[0.95rem] text-[#5C5F5C]">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== ARENAER (sage) ===== */}
      <section className="py-[100px] bg-[#E7ECEA]" id="arenaer">
        <div className="max-w-[1140px] mx-auto px-6">
          <div className="text-center max-w-[600px] mx-auto mb-[60px] observe-fade" style={{ opacity: 0 }}>
            <h2 className="text-[clamp(1.9rem,3.8vw,2.8rem)] mb-5">Velg din arena</h2>
            <p className="text-[1.05rem] text-[#5C5F5C] leading-relaxed">
              Hver samtale er unik. Velg situasjonen du vil &oslash;ve p&aring;.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {/* Arbeidsliv */}
            <button
              onClick={() => handleArenaClick('arbeidsliv')}
              className="bg-white rounded-[18px] p-6 text-left shadow-[0_10px_30px_-5px_rgba(42,64,54,0.06)]
                         border border-black/[0.03] hover:-translate-y-[6px] hover:shadow-[0_25px_50px_-12px_rgba(42,64,54,0.18)]
                         hover:border-[rgba(42,64,54,0.25)] hover:bg-[#FDFCFB] transition-all duration-300 flex flex-col observe-fade group cursor-pointer"
              style={{ opacity: 0 }}
            >
              <div className="w-[52px] h-[52px] rounded-[14px] flex items-center justify-center mb-5" style={{ color: '#5B7A8C', background: '#EFF4F6' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
                  <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
                </svg>
              </div>
              <h3 className="text-[1.3rem] mb-2">Arbeidsliv</h3>
              <p className="text-[0.95rem] text-[#5C5F5C] leading-relaxed mb-auto">
                Tren p&aring; god samtaleteknikk i jobbsituasjoner. Perfekt for ledere og medarbeidere.
              </p>
              <div className="flex flex-wrap gap-1.5 mt-4 pt-4">
                <span className="text-[0.72rem] px-2.5 py-1 bg-[#FDFCFB] rounded-[20px] text-[#5C5F5C] border border-black/5">L&oslash;nnsforhandling</span>
                <span className="text-[0.72rem] px-2.5 py-1 bg-[#FDFCFB] rounded-[20px] text-[#5C5F5C] border border-black/5">Konflikt</span>
              </div>
              <span className="inline-flex items-center gap-2 mt-4 font-semibold text-[#2A4036] text-[0.85rem]
                             bg-[rgba(42,64,54,0.05)] border border-[rgba(42,64,54,0.12)] rounded-lg px-3 py-1.5
                             group-hover:bg-[rgba(42,64,54,0.1)] group-hover:border-[rgba(42,64,54,0.2)] group-hover:gap-3 transition-all">
                Start samtale <span aria-hidden="true">&rarr;</span>
              </span>
            </button>

            {/* Jobbintervju */}
            <button
              onClick={() => handleArenaClick('jobbintervju')}
              className="bg-white rounded-[18px] p-6 text-left shadow-[0_10px_30px_-5px_rgba(42,64,54,0.06)]
                         border border-black/[0.03] hover:-translate-y-[6px] hover:shadow-[0_25px_50px_-12px_rgba(42,64,54,0.18)]
                         hover:border-[rgba(42,64,54,0.25)] hover:bg-[#FDFCFB] transition-all duration-300 flex flex-col observe-fade group cursor-pointer"
              style={{ opacity: 0 }}
            >
              <div className="w-[52px] h-[52px] rounded-[14px] flex items-center justify-center mb-5" style={{ color: '#8C705F', background: '#F4F0EE' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              </div>
              <h3 className="text-[1.3rem] mb-2">Jobbintervju</h3>
              <p className="text-[0.95rem] text-[#5C5F5C] leading-relaxed mb-auto">
                &Oslash;v p&aring; sp&oslash;rsm&aring;l og f&aring; konkrete forbedringspunkter f&oslash;r det gjelder.
              </p>
              <div className="flex flex-wrap gap-1.5 mt-4 pt-4">
                <span className="text-[0.72rem] px-2.5 py-1 bg-[#FDFCFB] rounded-[20px] text-[#5C5F5C] border border-black/5">Presentasjon</span>
                <span className="text-[0.72rem] px-2.5 py-1 bg-[#FDFCFB] rounded-[20px] text-[#5C5F5C] border border-black/5">Svakheter</span>
              </div>
              <span className="inline-flex items-center gap-2 mt-4 font-semibold text-[#2A4036] text-[0.85rem]
                             bg-[rgba(42,64,54,0.05)] border border-[rgba(42,64,54,0.12)] rounded-lg px-3 py-1.5
                             group-hover:bg-[rgba(42,64,54,0.1)] group-hover:border-[rgba(42,64,54,0.2)] group-hover:gap-3 transition-all">
                Start samtale <span aria-hidden="true">&rarr;</span>
              </span>
            </button>

            {/* Eksamen & Skole */}
            <button
              onClick={() => handleArenaClick('eksamen')}
              className="bg-white rounded-[18px] p-6 text-left shadow-[0_10px_30px_-5px_rgba(42,64,54,0.06)]
                         border border-black/[0.03] hover:-translate-y-[6px] hover:shadow-[0_25px_50px_-12px_rgba(42,64,54,0.18)]
                         hover:border-[rgba(42,64,54,0.25)] hover:bg-[#FDFCFB] transition-all duration-300 flex flex-col observe-fade group cursor-pointer"
              style={{ opacity: 0 }}
            >
              <div className="w-[52px] h-[52px] rounded-[14px] flex items-center justify-center mb-5" style={{ color: '#4A6359', background: '#E7ECEA' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M22 10v6" /><path d="M2 10l10-5 10 5-10 5z" /><path d="M6 12v5c0 2 2 3 6 3s6-1 6-3v-5" />
                </svg>
              </div>
              <h3 className="text-[1.3rem] mb-2">Eksamen &amp; Skole</h3>
              <p className="text-[0.95rem] text-[#5C5F5C] leading-relaxed mb-auto">
                Tren p&aring; eksamen eller pr&oslash;ver med en t&aring;lmodig AI-sensor tilpasset ditt fag.
              </p>
              <div className="flex flex-wrap gap-1.5 mt-4 pt-4">
                <span className="text-[0.72rem] px-2.5 py-1 bg-[#FDFCFB] rounded-[20px] text-[#5C5F5C] border border-black/5">Presentasjon</span>
                <span className="text-[0.72rem] px-2.5 py-1 bg-[#FDFCFB] rounded-[20px] text-[#5C5F5C] border border-black/5">Muntlig</span>
              </div>
              <span className="inline-flex items-center gap-2 mt-4 font-semibold text-[#2A4036] text-[0.85rem]
                             bg-[rgba(42,64,54,0.05)] border border-[rgba(42,64,54,0.12)] rounded-lg px-3 py-1.5
                             group-hover:bg-[rgba(42,64,54,0.1)] group-hover:border-[rgba(42,64,54,0.2)] group-hover:gap-3 transition-all">
                Start samtale <span aria-hidden="true">&rarr;</span>
              </span>
            </button>

            {/* Familie */}
            <button
              onClick={() => handleArenaClick('familie')}
              className="bg-white rounded-[18px] p-6 text-left shadow-[0_10px_30px_-5px_rgba(42,64,54,0.06)]
                         border border-black/[0.03] hover:-translate-y-[6px] hover:shadow-[0_25px_50px_-12px_rgba(42,64,54,0.18)]
                         hover:border-[rgba(42,64,54,0.25)] hover:bg-[#FDFCFB] transition-all duration-300 flex flex-col observe-fade group cursor-pointer"
              style={{ opacity: 0 }}
            >
              <div className="w-[52px] h-[52px] rounded-[14px] bg-[#E7ECEA] flex items-center justify-center mb-5 text-[#2A4036]">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                  <polyline points="9 22 9 12 15 12 15 22" />
                </svg>
              </div>
              <h3 className="text-[1.3rem] mb-2">Familie</h3>
              <p className="text-[0.95rem] text-[#5C5F5C] leading-relaxed mb-auto">
                &Oslash;v p&aring; viktige samtaler hjemme. Fra grensesetting og skjermtid til vanskelige f&oslash;lelser.
              </p>
              <div className="flex flex-wrap gap-1.5 mt-4 pt-4">
                <span className="text-[0.72rem] px-2.5 py-1 bg-[#FDFCFB] rounded-[20px] text-[#5C5F5C] border border-black/5">Ten&aring;ring</span>
                <span className="text-[0.72rem] px-2.5 py-1 bg-[#FDFCFB] rounded-[20px] text-[#5C5F5C] border border-black/5">Grenser</span>
              </div>
              <span className="inline-flex items-center gap-2 mt-4 font-semibold text-[#2A4036] text-[0.85rem]
                             bg-[rgba(42,64,54,0.05)] border border-[rgba(42,64,54,0.12)] rounded-lg px-3 py-1.5
                             group-hover:bg-[rgba(42,64,54,0.1)] group-hover:border-[rgba(42,64,54,0.2)] group-hover:gap-3 transition-all">
                Start samtale <span aria-hidden="true">&rarr;</span>
              </span>
            </button>
          </div>
        </div>
      </section>

      {/* ===== FOREST FEATURE BAND ===== */}
      <section
        className="py-20"
        aria-label="Hvorfor Pratiro"
        style={{
          background: `
            radial-gradient(700px 340px at 22% 20%, rgba(255,248,225,0.10), transparent 60%),
            linear-gradient(180deg, #2A4036, #1F3029)
          `,
          color: 'rgba(255,255,255,0.92)',
        }}
      >
        <div className="max-w-[1140px] mx-auto px-6">
          <div className="text-center max-w-[600px] mx-auto mb-[60px] observe-fade" style={{ opacity: 0 }}>
            <h2 className="text-[clamp(1.9rem,3.8vw,2.8rem)] mb-5 !text-white/[0.96]">
              En rolig ramme for vanskelige samtaler
            </h2>
            <p className="text-[1.05rem] text-white/70 leading-relaxed">
              Pratiro er bygget for &aring; gi deg trygghet &ndash; f&oslash;r den viktige samtalen.
            </p>
          </div>

          <div
            className="rounded-[20px] border border-white/10 p-5 grid grid-cols-1 md:grid-cols-3 gap-4
                       shadow-[0_18px_50px_rgba(0,0,0,0.18)] observe-fade"
            style={{ background: 'rgba(255,255,255,0.06)', opacity: 0 }}
            role="list"
          >
            {[
              { title: 'Trygt og anonymt', desc: 'Ingen lagrer samtalen. \u00d8v uten \u00e5 bli d\u00f8mt \u2013 i ditt eget tempo.' },
              { title: 'I ditt tempo', desc: 'Pause, spol tilbake, pr\u00f8v igjen. Ingen tidspress, ingen konsekvenser.' },
              { title: 'Konkrete setninger', desc: 'Ta med deg formuleringer og strategier du faktisk kan bruke i virkeligheten.' },
            ].map((feat) => (
              <div
                key={feat.title}
                className="rounded-[16px] border border-white/10 p-5"
                style={{ background: 'rgba(255,255,255,0.06)' }}
                role="listitem"
              >
                <b className="block mb-2 text-white/[0.94] text-[1rem] tracking-[-0.01em]">{feat.title}</b>
                <p className="text-white/70 text-[0.92rem] leading-[1.65]">{feat.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== OM PRATIRO (white) ===== */}
      <section className="py-[100px] bg-white" id="om">
        <div className="max-w-[1140px] mx-auto px-6">
          <div className="text-center max-w-[600px] mx-auto mb-[60px]">
            <h2 className="text-[clamp(1.9rem,3.8vw,2.8rem)] mb-5">Om Pratiro</h2>
          </div>
          <div className="max-w-[680px] mx-auto text-center observe-fade" style={{ opacity: 0 }}>
            <p className="text-[1.05rem] text-[#5C5F5C] leading-[1.8] mb-4">
              Pratiro betyr &laquo;prat i ro&raquo; &ndash; et trygt sted &aring; &oslash;ve p&aring; livets viktige samtaler.
              Vi bruker AI-teknologi for &aring; skape realistiske &oslash;vingsscenarioer, slik at du kan bli
              tryggere f&oslash;r det virkelig gjelder.
            </p>
            <p className="text-[1.05rem] text-[#5C5F5C] leading-[1.8]">
              Enten du er forelder som vil &oslash;ve p&aring; grensesetting, leder som forbereder en vanskelig
              tilbakemelding, eller student som skal opp til muntlig &ndash; Pratiro gir deg et rom til &aring;
              pr&oslash;ve og feile, helt uten konsekvenser.
            </p>
          </div>
        </div>
      </section>

      {/* ===== CTA ===== */}
      <section className="py-[100px] bg-[#FDFCFB] text-center">
        <div className="max-w-[1140px] mx-auto px-6">
          <h2 className="text-[2.4rem] mb-4">Klar til &aring; &oslash;ve?</h2>
          <p className="text-[1.05rem] text-[#5C5F5C] mb-8">Start din f&oslash;rste samtale i dag &ndash; helt gratis.</p>
          <button
            onClick={() => scrollTo('arenaer')}
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-[#2A4036] text-white font-medium
                       shadow-[0_4px_12px_rgba(42,64,54,0.15)] hover:bg-[#1F3029] hover:-translate-y-0.5
                       hover:shadow-[0_8px_20px_rgba(42,64,54,0.25)] transition-all duration-300"
          >
            Start i ro
          </button>
        </div>
      </section>

      {/* ===== FOOTER ===== */}
      <footer className="bg-[#2A4036] text-[#E0E5E2] py-20 text-center">
        <div className="max-w-[1140px] mx-auto px-6">
          <div className="flex items-center justify-center mb-5">
            <Logo size="lg" color="white" />
          </div>
          <p className="opacity-70 max-w-[400px] mx-auto text-[1.05rem] leading-relaxed">
            Prat i ro &ndash; &oslash;v p&aring; samtalene som betyr noe.
          </p>
          <div className="flex gap-6 justify-center mt-8 mb-6">
            <a href="#" className="text-white/50 text-[0.9rem] hover:text-white/80 transition-colors">Personvern</a>
            <a href="#" className="text-white/50 text-[0.9rem] hover:text-white/80 transition-colors">Vilk&aring;r</a>
            <a href="#" className="text-white/50 text-[0.9rem] hover:text-white/80 transition-colors">Kontakt oss</a>
          </div>
          <div className="text-[0.9rem] opacity-50">
            &copy; 2026 Pratiro. Laget i Norge.
          </div>
        </div>
      </footer>

      {/* ===== LOGIN MODAL ===== */}
      {showLoginModal && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setShowLoginModal(false)}
        >
          <div
            className="bg-white rounded-[20px] p-8 max-w-md w-full shadow-[0_25px_50px_-12px_rgba(42,64,54,0.25)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-center mb-8">
              <div className="flex justify-center mb-4">
                <Logo size="md" color="forest" />
              </div>
              <h3 className="text-2xl mb-2">
                Logg inn
              </h3>
              <p className="text-[#5C5F5C] text-sm">
                Skriv inn tilgangskoden for &aring; starte
                {selectedArena && (
                  <span className="font-medium text-[#2A4036]"> {arenaList.find(a => a.id === selectedArena)?.name}</span>
                )}
              </p>
            </div>

            <div className="space-y-4">
              <input
                type="password"
                value={accessCode}
                onChange={(e) => setAccessCode(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Tilgangskode"
                className="w-full px-4 py-3 bg-[#F7F5F0] border border-[#E7ECEA] rounded-xl
                           focus:outline-none focus:ring-2 focus:ring-[#2A4036]/30 focus:border-[#2A4036]
                           text-[#252825] placeholder-[#7D786D]"
                autoFocus
              />

              {error && (
                <p className="text-red-600 text-sm text-center">{error}</p>
              )}

              <button
                onClick={handleLogin}
                disabled={isLoading}
                className="w-full bg-[#2A4036] hover:bg-[#1F3029] text-white
                           font-medium py-3 rounded-xl transition-colors
                           disabled:opacity-50 disabled:cursor-not-allowed
                           shadow-[0_4px_12px_rgba(42,64,54,0.15)]"
              >
                {isLoading ? 'Sjekker...' : 'Start i ro'}
              </button>

              <button
                onClick={() => setShowLoginModal(false)}
                className="w-full text-[#5C5F5C] hover:text-[#2A4036]
                           font-medium py-2 transition-colors text-sm"
              >
                Avbryt
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
