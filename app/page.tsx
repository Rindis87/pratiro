'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Logo, PauseIcon } from './components/ui/Logo';
import { arenaList } from './config/arenas';
import { ArenaId } from './config/types';

export default function LandingPage() {
  const router = useRouter();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [selectedArena, setSelectedArena] = useState<ArenaId | null>(null);
  const [accessCode, setAccessCode] = useState('');
  const [error, setError] = useState('');

  const handleArenaClick = (arenaId: ArenaId) => {
    setSelectedArena(arenaId);
    setShowLoginModal(true);
    setError('');
    setAccessCode('');
  };

  const handleLogin = () => {
    if (accessCode === 'pratiro2024') {
      sessionStorage.setItem('pratiro_access', 'true');
      router.push(`/simulator?arena=${selectedArena}`);
    } else {
      setError('Feil tilgangskode. Prøv igjen.');
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

  // Arena data with actual examples from simulators
  const arenaData = [
    {
      id: 'familie' as ArenaId,
      name: 'Familie & Barn',
      description: 'Øv på grensesetting, skjermtid-diskusjoner eller hvordan snakke om vanskelige følelser med barna.',
      tags: ['Skjermtid', 'Følelser', 'Gaming'],
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 24 24">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
          <circle cx="9" cy="7" r="4"></circle>
          <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
          <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
        </svg>
      ),
      color: 'forest',
    },
    {
      id: 'arbeidsliv' as ArenaId,
      name: 'Arbeidsliv',
      description: 'Forbered deg til medarbeidersamtalen, lønnsforhandlinger eller krevende tilbakemeldinger på jobb.',
      tags: ['Konflikthåndtering', 'Feedback', 'Lønnssamtale'],
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 24 24">
          <rect height="14" rx="2" ry="2" width="20" x="2" y="3"></rect>
          <line x1="8" x2="16" y1="21" y2="21"></line>
          <line x1="12" x2="12" y1="17" y2="21"></line>
        </svg>
      ),
      color: 'ocean',
    },
    {
      id: 'jobbintervju' as ArenaId,
      name: 'Jobbintervju',
      description: 'Forbered deg grundig til drømmejobben. Øv på vanlige spørsmål og få konstruktiv tilbakemelding.',
      tags: ['Fortell om deg selv', 'Styrker', 'Case-intervju'],
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 24 24">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
          <polyline points="22 4 12 14.01 9 11.01"></polyline>
        </svg>
      ),
      color: 'bark',
    },
    {
      id: 'eksamen' as ArenaId,
      name: 'Eksamen & Skole',
      description: 'Test kunnskapene dine med en tålmodig AI-sensor. Tilpasset ditt fag og nivå.',
      tags: ['Muntlig eksamen', 'Naturfag', 'Historie'],
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 24 24">
          <path d="M22 10v6M2 10l10-5 10 5-10 5z"></path>
          <path d="M6 12v5c0 2 2 3 6 3s6-1 6-3v-5"></path>
        </svg>
      ),
      color: 'forest-light',
    },
  ];

  const colorMap: Record<string, string> = {
    forest: 'text-[#2D4A3E]',
    ocean: 'text-[#4A6B7C]',
    bark: 'text-[#5C4D3C]',
    'forest-light': 'text-[#3D6B5A]',
  };

  return (
    <div className="min-h-screen bg-[#F9F8F6]">
      {/* Fixed Navbar */}
      <nav className="fixed top-0 left-0 right-0 py-4 px-6 bg-[#F9F8F6]/85 backdrop-blur-md z-50 border-b border-black/[0.03]">
        <div className="max-w-[1240px] mx-auto flex justify-between items-center">
          <a href="/" className="flex items-center gap-2">
            <span
              className="text-2xl text-[#2D4A3E] tracking-tight"
              style={{ fontFamily: 'var(--font-dm-serif), Georgia, serif' }}
            >
              Pratiro
            </span>
            <PauseIcon className="w-5 h-5 text-[#3D6B5A]" />
          </a>

          <div className="hidden md:flex items-center gap-8">
            <button
              onClick={() => scrollTo('hvordan')}
              className="text-[0.95rem] font-medium text-[#4F5752] hover:text-[#2D4A3E] transition-colors"
            >
              Slik fungerer det
            </button>
            <button
              onClick={() => scrollTo('arenaer')}
              className="text-[0.95rem] font-medium text-[#4F5752] hover:text-[#2D4A3E] transition-colors"
            >
              Arenaer
            </button>
            <button
              onClick={() => scrollTo('om')}
              className="text-[0.95rem] font-medium text-[#4F5752] hover:text-[#2D4A3E] transition-colors"
            >
              Om oss
            </button>
          </div>

          <button
            onClick={() => scrollTo('arenaer')}
            className="px-5 py-2.5 bg-transparent border border-[#2D4A3E]/30 text-[#2D4A3E] rounded-full font-medium text-sm
                       hover:border-[#2D4A3E] hover:bg-[#2D4A3E]/5
                       transition-all duration-300"
          >
            Kom i gang
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-[140px] pb-32 px-6 min-h-screen flex items-center">
        <div className="max-w-[1240px] mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Hero Content */}
          <div className="text-center lg:text-left">
            <h1
              className="text-[clamp(2.5rem,5vw,4.2rem)] text-[#2D4A3E] mb-6 leading-[1.1] tracking-[-0.02em]"
              style={{ fontFamily: 'var(--font-dm-serif), Georgia, serif' }}
            >
              Prat i ro.<br />Øv på samtalene som betyr noe.
            </h1>
            <p className="text-[1.15rem] text-[#4F5752] font-light mb-10 max-w-[540px] mx-auto lg:mx-0 leading-relaxed">
              En samtale du gruer deg til? Hvordan snakker du om skjermtid uten krangel?
              Pratiro er din trygge øvingspartner for familie- og arbeidslivet. Ingen kompliserte instrukser – bare velg situasjon og start.
            </p>

            <div className="flex flex-wrap gap-4 justify-center lg:justify-start">
              <button
                onClick={() => scrollTo('arenaer')}
                className="inline-flex items-center gap-2 px-6 py-3 bg-[#2D4A3E] text-white rounded-full font-medium
                           shadow-[0_4px_14px_rgba(45,74,62,0.25)]
                           hover:bg-[#3D6B5A] hover:-translate-y-0.5
                           hover:shadow-[0_6px_20px_rgba(45,74,62,0.3)]
                           transition-all duration-300"
              >
                Start en øvelse
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
              <button
                onClick={() => scrollTo('hvordan')}
                className="px-6 py-3 bg-transparent border border-[#2D4A3E]/20 text-[#2D4A3E] rounded-full font-medium
                           hover:border-[#2D4A3E] hover:bg-[#2D4A3E]/5
                           transition-all duration-300"
              >
                Les mer
              </button>
            </div>

          </div>

          {/* App Preview Mockup */}
          <div className="bg-white rounded-[32px] shadow-[0_12px_40px_rgba(45,74,62,0.08)] border border-black/5 overflow-hidden animate-float">
            <div className="bg-[#2D4A3E] px-6 py-4 flex items-center gap-3">
              <div className="flex gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-white/30"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-white/30"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-white/30"></div>
              </div>
              <span className="text-white/90 text-sm">Pratiro Øvelse</span>
            </div>
            <div className="p-6 bg-[#FAFAFA] min-h-[320px]">
              {/* Selection Cards */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-white p-4 rounded-2xl border border-[#2D4A3E] bg-[#2D4A3E]/[0.04]">
                  <div className="text-[0.75rem] uppercase tracking-wider text-[#7D786D] mb-1">Arena</div>
                  <div className="text-[#2D4A3E] text-lg" style={{ fontFamily: 'var(--font-dm-serif), Georgia, serif' }}>
                    Familie
                  </div>
                </div>
                <div className="bg-white p-4 rounded-2xl border border-[#2D4A3E] bg-[#2D4A3E]/[0.04]">
                  <div className="text-[0.75rem] uppercase tracking-wider text-[#7D786D] mb-1">Alder</div>
                  <div className="text-[#2D4A3E] text-lg" style={{ fontFamily: 'var(--font-dm-serif), Georgia, serif' }}>
                    8 år
                  </div>
                </div>
              </div>

              {/* Chat Messages */}
              <div className="flex flex-col gap-3">
                <div className="bg-white p-4 rounded-xl border border-black/5 rounded-bl-sm max-w-[90%] text-[0.95rem] text-[#252825]">
                  Nei! Jeg vil ikke legge vekk iPaden! Alle de andre får lov til å spille så lenge de vil!
                </div>
                <div className="bg-[#2D4A3E] text-white p-4 rounded-xl rounded-br-sm max-w-[90%] self-end text-[0.95rem]">
                  Jeg skjønner at du synes det er kjedelig å stoppe midt i spillet...
                </div>
                <div className="bg-white p-4 rounded-xl border border-black/5 rounded-bl-sm max-w-[90%] text-[0.95rem] text-[#252825]">
                  Men det er så urettferdig! Hvorfor må jeg alltid slutte først?
                </div>
              </div>

              {/* Action Button */}
              <div className="mt-4 pt-4 border-t border-black/5">
                <div className="flex items-center justify-center gap-2 px-4 py-2.5 bg-[#F5F1EB] text-[#4F5752] rounded-xl text-sm font-medium border border-black/5">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  Avslutt og få veiledning
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="hvordan" className="py-24 px-6 bg-white">
        <div className="max-w-[1240px] mx-auto">
          <div className="text-center mb-16 max-w-[700px] mx-auto">
            <h2
              className="text-[2.5rem] text-[#2D4A3E] mb-4"
              style={{ fontFamily: 'var(--font-dm-serif), Georgia, serif' }}
            >
              Slik fungerer det
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {[
              { num: 1, title: 'Velg scenario', desc: 'Velg din arena og situasjonen du vil øve på.' },
              { num: 2, title: 'Prat i ro', desc: 'Ha en realistisk samtale med AI-en som tilpasser seg dine svar.' },
              { num: 3, title: 'Få innsikt', desc: 'Motta tilbakemelding og konkrete tips til forbedring.' },
            ].map((step) => (
              <div key={step.num} className="text-center">
                <div
                  className="w-16 h-16 bg-[#2D4A3E] rounded-full flex items-center justify-center mx-auto mb-6 text-white text-2xl"
                  style={{ fontFamily: 'var(--font-dm-serif), Georgia, serif' }}
                >
                  {step.num}
                </div>
                <h3
                  className="text-xl text-[#2D4A3E] mb-3"
                  style={{ fontFamily: 'var(--font-dm-serif), Georgia, serif' }}
                >
                  {step.title}
                </h3>
                <p className="text-[#4F5752] font-light">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Arenas Section */}
      <section id="arenaer" className="py-24 px-6 bg-[#F5F1EB] relative overflow-hidden">
        {/* Background decoration */}
        <svg className="absolute bottom-[-50px] right-[-100px] opacity-5 pointer-events-none text-[#2D4A3E] w-[600px] h-[600px]" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
          <path fill="currentColor" d="M45.7,-76.3C58.9,-69.3,69.1,-55.6,76.3,-41.3C83.5,-26.9,87.6,-11.9,86.2,2.4C84.8,16.7,77.8,30.3,68.6,42.4C59.4,54.5,47.9,65.1,34.8,71.3C21.7,77.5,6.9,79.3,-6.5,76.8C-19.9,74.3,-31.9,67.5,-43.3,58.8C-54.7,50.1,-65.5,39.5,-72.7,26.7C-79.9,13.9,-83.5,-1.1,-80.4,-14.8C-77.3,-28.5,-67.5,-40.9,-55.8,-48.3C-44.1,-55.7,-30.5,-58.1,-17.7,-60.9C-4.9,-63.7,7.1,-66.9,32.5,-73.4L45.7,-76.3Z" transform="translate(100 100)" />
        </svg>

        <div className="max-w-[1240px] mx-auto relative z-10">
          <div className="text-center mb-16 max-w-[700px] mx-auto">
            <h2
              className="text-[2.5rem] text-[#2D4A3E] mb-4"
              style={{ fontFamily: 'var(--font-dm-serif), Georgia, serif' }}
            >
              Hva vil du øve på i dag?
            </h2>
            <p className="text-[1.1rem] text-[#4F5752] font-light">
              Hver samtale er unik. Velg situasjonen du vil øve på, og få tilpasset veiledning underveis.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {arenaData.map((arena) => (
              <button
                key={arena.id}
                onClick={() => handleArenaClick(arena.id)}
                className="bg-white rounded-3xl p-8 text-left border border-black/[0.03] relative
                           transition-all duration-300
                           hover:-translate-y-2 hover:shadow-[0_12px_40px_rgba(45,74,62,0.08)]
                           hover:border-[#2D4A3E]/10
                           focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2D4A3E]/30"
              >
                <div className={`w-12 h-12 bg-[#F9F8F6] rounded-xl flex items-center justify-center mb-6 ${colorMap[arena.color]}`}>
                  {arena.icon}
                </div>
                <h3
                  className="text-xl text-[#2D4A3E] mb-3"
                  style={{ fontFamily: 'var(--font-dm-serif), Georgia, serif' }}
                >
                  {arena.name}
                </h3>
                <p className="text-[#4F5752] text-sm font-light mb-5 leading-relaxed">
                  {arena.description}
                </p>
                <div className="flex flex-wrap gap-2 mb-6">
                  {arena.tags.map((tag) => (
                    <span
                      key={tag}
                      className="bg-[#F9F8F6] px-3 py-1 rounded-full text-xs text-[#4F5752]"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
                <span className="inline-flex items-center gap-2 px-4 py-2 bg-[#2D4A3E] text-white rounded-full text-sm font-medium
                               hover:bg-[#3D6B5A] transition-colors">
                  Start samtale
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="om" className="py-24 px-6 bg-white">
        <div className="max-w-[800px] mx-auto text-center">
          <h2
            className="text-[2.5rem] text-[#2D4A3E] mb-6"
            style={{ fontFamily: 'var(--font-dm-serif), Georgia, serif' }}
          >
            Om Pratiro
          </h2>
          <p className="text-[1.1rem] text-[#4F5752] font-light leading-relaxed mb-8">
            Pratiro betyr &quot;prat i ro&quot; – et trygt sted å øve på livets viktige samtaler.
            Vi bruker AI-teknologi for å skape realistiske øvingsscenarioer, slik at du kan bli
            tryggere før det virkelig gjelder.
          </p>
          <p className="text-[1.1rem] text-[#4F5752] font-light leading-relaxed">
            Enten du er forelder som vil øve på grensesetting, leder som forbereder en vanskelig samtale,
            eller student som skal opp til muntlig eksamen – Pratiro gir deg et rom til å prøve og feile,
            helt uten konsekvenser.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-16 px-6 bg-[#2D4A3E] text-white">
        <div className="max-w-[1240px] mx-auto text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <span
              className="text-2xl"
              style={{ fontFamily: 'var(--font-dm-serif), Georgia, serif' }}
            >
              Pratiro
            </span>
            <PauseIcon className="w-5 h-5 text-white/80" />
          </div>
          <p className="text-white/80 font-light mb-8">
            Prat i ro – øv på samtaler som betyr noe.
          </p>

          <div className="flex justify-center gap-8 mb-8 text-sm text-white/80">
            <a href="#" className="hover:text-white transition-colors">Personvern</a>
            <a href="#" className="hover:text-white transition-colors">Vilkår</a>
            <a href="#" className="hover:text-white transition-colors">Kontakt oss</a>
          </div>

          <p className="text-white/50 text-sm">
            © 2025 Pratiro. Laget i Norge.
          </p>
        </div>
      </footer>

{/* Login Modal */}
      {showLoginModal && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setShowLoginModal(false)}
        >
          <div
            className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-center mb-8">
              <Logo size="lg" className="justify-center mb-4" />
              <h3
                className="text-2xl text-[#2D4A3E] mb-2"
                style={{ fontFamily: 'var(--font-dm-serif), Georgia, serif' }}
              >
                Logg inn
              </h3>
              <p className="text-[#5A5A5A] text-sm">
                Skriv inn tilgangskoden for å starte
                {selectedArena && (
                  <span className="font-medium"> {arenaList.find(a => a.id === selectedArena)?.name}</span>
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
                className="w-full px-4 py-3 border border-gray-300 rounded-xl
                         focus:outline-none focus:ring-2 focus:ring-[#2D4A3E]
                         text-[#2C2C2C] placeholder-gray-400"
                autoFocus
              />

              {error && (
                <p className="text-red-500 text-sm text-center">{error}</p>
              )}

              <button
                onClick={handleLogin}
                className="w-full bg-[#2D4A3E] hover:bg-[#3D6B5A] text-white
                         font-medium py-3 rounded-xl transition-colors"
              >
                Start øvingen
              </button>

              <button
                onClick={() => setShowLoginModal(false)}
                className="w-full text-[#5A5A5A] hover:text-[#2C2C2C]
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
