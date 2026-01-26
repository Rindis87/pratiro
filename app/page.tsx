'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Logo } from './components/ui/Logo';
import { arenaList } from './config/arenas';
import { ArenaId } from './config/types';
import { validateAccessCode } from './actions';

// New Speech Bubble Logo Component
const SpeechBubbleLogo = ({ className = '' }: { className?: string }) => (
  <div className={`flex items-center gap-2.5 group ${className}`}>
    <div className="w-8 h-7 bg-emerald-500 rounded-tl-lg rounded-tr-lg rounded-br-lg flex items-center justify-center gap-0.5 shadow-lg shadow-emerald-500/20 group-hover:bg-emerald-400 transition-colors">
      <div className="w-1 h-3.5 bg-white rounded-full"></div>
      <div className="w-1 h-3.5 bg-white rounded-full"></div>
    </div>
    <span className="text-xl font-brand font-bold text-white tracking-tight group-hover:text-emerald-50 transition-colors">
      Pratiro
    </span>
  </div>
);

// Mini logo for cards
const MiniLogo = () => (
  <div className="w-6 h-5 bg-emerald-500 rounded-tl-md rounded-tr-md rounded-br-md flex items-center justify-center gap-0.5">
    <div className="w-0.5 h-3 bg-white rounded-full"></div>
    <div className="w-0.5 h-3 bg-white rounded-full"></div>
  </div>
);

export default function LandingPage() {
  const router = useRouter();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [selectedArena, setSelectedArena] = useState<ArenaId | null>(null);
  const [accessCode, setAccessCode] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

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
      router.push(`/simulator?arena=${selectedArena}`);
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

  // Arena data
  const arenaData = [
    {
      id: 'familie' as ArenaId,
      name: 'Familie & Barn',
      description: 'Grensesetting, skjermtid og samtaler om vanskelige følelser med barna.',
      icon: (
        <svg className="w-7 h-7 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
    },
    {
      id: 'arbeidsliv' as ArenaId,
      name: 'Arbeidsliv',
      description: 'Medarbeidersamtaler, lønnsforhandlinger og krevende tilbakemeldinger.',
      icon: (
        <svg className="w-7 h-7 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      ),
    },
    {
      id: 'jobbintervju' as ArenaId,
      name: 'Jobbintervju',
      description: 'Forbered deg grundig til drømmejobben med realistiske intervjuøvelser.',
      icon: (
        <svg className="w-7 h-7 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      id: 'eksamen' as ArenaId,
      name: 'Eksamen & Skole',
      description: 'Test kunnskapene dine med en tålmodig AI-sensor tilpasset ditt fag.',
      icon: (
        <svg className="w-7 h-7 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-slate-900 text-slate-50 selection:bg-emerald-500 selection:text-white">
      {/* Background with nature image - more visible */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <img
          src="https://images.unsplash.com/photo-1500382017468-9049fed747ef?q=80&w=2832&auto=format&fit=crop"
          className="w-full h-full object-cover opacity-60"
          alt=""
        />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-900/80 via-slate-900/50 to-transparent"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-transparent to-transparent"></div>
      </div>

      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass-navbar">
        <div className="max-w-7xl mx-auto px-6 h-20 flex justify-between items-center">
          <a href="/" className="flex items-center">
            <SpeechBubbleLogo />
          </a>

          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-200">
            <button onClick={() => scrollTo('hvordan')} className="hover:text-white transition-colors">
              Slik fungerer det
            </button>
            <button onClick={() => scrollTo('arenaer')} className="hover:text-white transition-colors">
              Arenaer
            </button>
            <button onClick={() => scrollTo('om')} className="hover:text-white transition-colors">
              Om oss
            </button>
          </div>

          <button
            onClick={() => scrollTo('arenaer')}
            className="px-5 py-2 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold shadow-lg shadow-emerald-900/50 transition-all hover:-translate-y-0.5 border border-emerald-500/50"
          >
            Start gratis
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="relative z-10 pt-32 pb-20 lg:pt-48 lg:pb-32 px-6 min-h-screen flex items-center">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center w-full">
          {/* Left: Content */}
          <div className="space-y-8 max-w-2xl">
            {/* Tagline */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 text-xs font-bold uppercase tracking-wider backdrop-blur-md shadow-sm">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              AI-drevet simulering
            </div>

            {/* Headline */}
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-brand font-bold text-white leading-[1.1] tracking-tight drop-shadow-lg">
              Vanskelige samtaler. <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-200">
                Enkle å øve på.
              </span>
            </h1>

            {/* Subtext */}
            <p className="text-lg text-slate-200 leading-relaxed max-w-lg font-medium">
              Pratiro gir deg et trygt rom for å mestre krevende dialoger.
              Enten du er forelder, leder, eller student – øv i ro, prester når det gjelder.
            </p>

            {/* Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 pt-2">
              <button
                onClick={() => scrollTo('arenaer')}
                className="px-8 py-4 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white font-brand font-bold text-lg transition-all shadow-[0_0_40px_-10px_rgba(16,185,129,0.5)] hover:shadow-[0_0_60px_-10px_rgba(16,185,129,0.6)] hover:-translate-y-1 border-t border-white/20"
              >
                Prøv simulatoren
              </button>
              <button
                onClick={() => scrollTo('hvordan')}
                className="px-8 py-4 rounded-full glass text-white font-brand font-semibold text-lg hover:bg-white/10 transition-all flex items-center justify-center gap-2 border border-white/20 shadow-lg"
              >
                Les mer
              </button>
            </div>
          </div>

          {/* Right: App Preview - matches real simulator */}
          <div className="hidden lg:block relative">
            {/* Ambient glows */}
            <div className="absolute -top-20 -right-20 w-96 h-96 bg-emerald-500/15 rounded-full blur-[100px] animate-pulse"></div>
            <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-teal-500/10 rounded-full blur-[80px]"></div>

            {/* Simulator Preview Card */}
            <div className="bg-white rounded-[24px] shadow-2xl overflow-hidden animate-float border border-slate-200/50">
              {/* Header - like real simulator */}
              <div className="bg-emerald-600 px-5 py-4 flex items-center gap-3">
                <div className="w-8 h-7 bg-white/20 rounded-tl-md rounded-tr-md rounded-br-md flex items-center justify-center gap-0.5">
                  <div className="w-0.5 h-3 bg-white rounded-full"></div>
                  <div className="w-0.5 h-3 bg-white rounded-full"></div>
                </div>
                <div>
                  <span className="text-white font-brand font-semibold">Pratiro</span>
                  <p className="text-white/70 text-[10px] font-medium uppercase tracking-wider">Familie & Barn</p>
                </div>
              </div>

              {/* Tips bar */}
              <div className="bg-emerald-50 px-4 py-2 text-xs text-emerald-800 flex justify-between items-center border-b border-emerald-100">
                <span><b>Tips:</b> Prøv å anerkjenne barnets følelser først</span>
                <span className="text-emerald-600 font-medium">3/50</span>
              </div>

              {/* Chat Area */}
              <div className="bg-slate-50 p-4 space-y-4 min-h-[240px]">
                {/* AI Message (Child) */}
                <div className="flex gap-3">
                  <div className="w-9 h-9 rounded-full bg-white border border-emerald-200 flex items-center justify-center shrink-0 shadow-sm">
                    <svg className="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                    </svg>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-xs font-medium text-slate-500">Emma (8 år)</span>
                    <div className="bg-white p-3 rounded-2xl rounded-tl-sm text-sm text-slate-700 border border-slate-200 shadow-sm">
                      Nei! Jeg vil ikke legge vekk iPaden! Alle de andre får spille så lenge de vil!
                    </div>
                  </div>
                </div>

                {/* User Message (Parent) */}
                <div className="flex gap-3 flex-row-reverse">
                  <div className="w-9 h-9 rounded-full bg-emerald-600 flex items-center justify-center shrink-0 shadow-sm">
                    <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                  </div>
                  <div className="flex flex-col gap-1 items-end">
                    <span className="text-xs font-medium text-slate-500">Deg</span>
                    <div className="bg-emerald-600 p-3 rounded-2xl rounded-tr-sm text-sm text-white shadow-sm">
                      Jeg skjønner at du synes det er kjedelig å stoppe...
                    </div>
                  </div>
                </div>

                {/* AI Response */}
                <div className="flex gap-3">
                  <div className="w-9 h-9 rounded-full bg-white border border-emerald-200 flex items-center justify-center shrink-0 shadow-sm">
                    <svg className="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                    </svg>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-xs font-medium text-slate-500">Emma (8 år)</span>
                    <div className="bg-white p-3 rounded-2xl rounded-tl-sm text-sm text-slate-700 border border-slate-200 shadow-sm">
                      Men det er så urettferdig! Hvorfor må jeg alltid slutte først?
                    </div>
                  </div>
                </div>
              </div>

              {/* Input Area */}
              <div className="bg-white p-4 border-t border-slate-200">
                <div className="flex gap-2 mb-3">
                  <div className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-400">
                    Skriv svaret ditt...
                  </div>
                  <div className="bg-emerald-600 p-2.5 rounded-xl">
                    <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <line x1="22" y1="2" x2="11" y2="13" />
                      <polygon points="22 2 15 22 11 13 2 9 22 2" />
                    </svg>
                  </div>
                </div>
                <button className="w-full bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-medium py-2.5 rounded-xl flex items-center justify-center gap-2 text-sm border border-emerald-200 transition-colors">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Avslutt og få veiledning
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* How It Works Section - Timeline design */}
      <section id="hvordan" className="relative z-10 py-24">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-20">
            <h2 className="text-4xl font-brand font-bold text-white mb-4">Slik fungerer det</h2>
            <p className="text-slate-300 text-lg">
              Tre enkle steg til bedre samtaler
            </p>
          </div>

          {/* Timeline */}
          <div className="relative">
            {/* Connecting line */}
            <div className="hidden md:block absolute top-8 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-emerald-500/30 to-transparent"></div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-8">
              {[
                {
                  num: '1',
                  title: 'Velg scenario',
                  desc: 'Velg din arena og situasjonen du vil øve på.',
                },
                {
                  num: '2',
                  title: 'Prat i ro',
                  desc: 'Ha en realistisk samtale med AI-en som tilpasser seg dine svar.',
                },
                {
                  num: '3',
                  title: 'Få innsikt',
                  desc: 'Motta tilbakemelding og konkrete tips til forbedring.',
                },
              ].map((step) => (
                <div key={step.num} className="text-center relative">
                  {/* Number circle */}
                  <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-emerald-500 flex items-center justify-center text-white text-2xl font-brand font-bold shadow-lg shadow-emerald-500/30 relative z-10">
                    {step.num}
                  </div>
                  <h3 className="text-xl font-brand font-semibold text-white mb-3">{step.title}</h3>
                  <p className="text-slate-400 text-sm leading-relaxed max-w-xs mx-auto">{step.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Arenas Section */}
      <section id="arenaer" className="relative z-10 py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-brand font-bold text-white mb-4">Velg din arena</h2>
            <p className="text-slate-400 text-lg max-w-2xl mx-auto">
              Hver samtale er unik. Velg situasjonen du vil øve på.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {arenaData.map((arena) => (
              <button
                key={arena.id}
                onClick={() => handleArenaClick(arena.id)}
                className="p-8 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-all group text-left
                         hover:-translate-y-2 hover:border-emerald-500/30 hover:shadow-[0_0_40px_-10px_rgba(16,185,129,0.3)]"
              >
                <div className="w-14 h-14 bg-emerald-500/20 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-inner border border-emerald-500/10">
                  {arena.icon}
                </div>
                <h3 className="text-xl font-brand font-bold text-white mb-2">{arena.name}</h3>
                <p className="text-slate-400 text-sm leading-relaxed mb-6">{arena.description}</p>
                <span className="inline-flex items-center gap-2 text-emerald-400 text-sm font-medium group-hover:text-emerald-300">
                  Start samtale
                  <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="om" className="relative z-10 py-24 px-6 bg-slate-900/80 border-t border-white/5">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-4xl font-brand font-bold text-white mb-6">Om Pratiro</h2>
          <p className="text-lg text-slate-300 leading-relaxed mb-6">
            Pratiro betyr &quot;prat i ro&quot; – et trygt sted å øve på livets viktige samtaler.
            Vi bruker AI-teknologi for å skape realistiske øvingsscenarioer, slik at du kan bli
            tryggere før det virkelig gjelder.
          </p>
          <p className="text-lg text-slate-400 leading-relaxed">
            Enten du er forelder som vil øve på grensesetting, leder som forbereder en vanskelig samtale,
            eller student som skal opp til muntlig eksamen – Pratiro gir deg et rom til å prøve og feile,
            helt uten konsekvenser.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 py-16 px-6 border-t border-white/5">
        <div className="max-w-7xl mx-auto text-center">
          <div className="flex items-center justify-center mb-4">
            <SpeechBubbleLogo />
          </div>
          <p className="text-slate-400 mb-8">
            Prat i ro – øv på samtaler som betyr noe.
          </p>

          <div className="flex flex-wrap justify-center gap-6 md:gap-8 mb-8 text-sm text-slate-400">
            <a href="#" className="hover:text-white transition-colors py-2">Personvern</a>
            <a href="#" className="hover:text-white transition-colors py-2">Vilkår</a>
            <a href="#" className="hover:text-white transition-colors py-2">Kontakt oss</a>
          </div>

          <p className="text-slate-500 text-sm">
            © 2025 Pratiro. Laget i Norge.
          </p>
        </div>
      </footer>

      {/* Login Modal */}
      {showLoginModal && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setShowLoginModal(false)}
        >
          <div
            className="glass-card rounded-3xl p-8 max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-center mb-8">
              <div className="flex justify-center mb-4">
                <SpeechBubbleLogo />
              </div>
              <h3 className="text-2xl font-brand font-bold text-white mb-2">
                Logg inn
              </h3>
              <p className="text-slate-400 text-sm">
                Skriv inn tilgangskoden for å starte
                {selectedArena && (
                  <span className="font-medium text-emerald-400"> {arenaList.find(a => a.id === selectedArena)?.name}</span>
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
                className="w-full px-4 py-3 bg-slate-800/50 border border-white/10 rounded-xl
                         focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent
                         text-white placeholder-slate-500"
                autoFocus
              />

              {error && (
                <p className="text-red-400 text-sm text-center">{error}</p>
              )}

              <button
                onClick={handleLogin}
                disabled={isLoading}
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white
                         font-bold py-3 rounded-xl transition-colors
                         disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-emerald-900/50"
              >
                {isLoading ? 'Sjekker...' : 'Start øvingen'}
              </button>

              <button
                onClick={() => setShowLoginModal(false)}
                className="w-full text-slate-400 hover:text-white
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
