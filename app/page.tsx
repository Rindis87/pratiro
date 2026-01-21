'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Logo, LogoCorner, PauseIcon } from './components/ui/Logo';
import { CTAButton } from './components/ui/Button';
import { ArenaCard } from './components/ui/Card';
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

  return (
    <div className="min-h-screen">
      {/* Corner Logo */}
      <LogoCorner />

      {/* Hero Section */}
      <section
        className="min-h-screen flex flex-col justify-center items-center text-center px-6 pt-20 pb-12 relative overflow-hidden"
        style={{
          background: 'linear-gradient(180deg, var(--mist) 0%, var(--sand) 50%, var(--sand-dark, #E8E2D9) 100%)',
        }}
      >
        {/* Background decoration */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `
              radial-gradient(ellipse at 20% 80%, rgba(45, 74, 62, 0.05) 0%, transparent 50%),
              radial-gradient(ellipse at 80% 20%, rgba(74, 107, 124, 0.05) 0%, transparent 50%)
            `,
          }}
        />

        {/* Main Logo */}
        <div className="flex items-center gap-4 mb-2">
          <span
            className="text-5xl md:text-7xl text-[#2D4A3E] tracking-tight"
            style={{ fontFamily: 'var(--font-dm-serif), Georgia, serif' }}
          >
            Pratiro
          </span>
          <PauseIcon className="w-12 h-12 md:w-16 md:h-16 text-[#3D6B5A]" />
        </div>

        {/* Tagline */}
        <p className="text-lg md:text-xl text-[#8B8578] font-light tracking-widest mb-8">
          Prat i ro
        </p>

        {/* Description */}
        <p className="max-w-2xl text-lg md:text-xl text-[#5A5A5A] font-light mb-10 leading-relaxed">
          Øv på livets viktige samtaler – trygt og i ditt eget tempo.
          En AI-drevet samtalepartner som hjelper deg å finne de rette ordene.
        </p>

        {/* CTA Button */}
        <CTAButton onClick={() => document.getElementById('how')?.scrollIntoView({ behavior: 'smooth' })}>
          Kom i gang
        </CTAButton>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 scroll-float">
          <svg
            className="w-6 h-6 text-[#8B8578]"
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            viewBox="0 0 24 24"
          >
            <path d="M12 5v14M19 12l-7 7-7-7" />
          </svg>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how" className="py-20 px-6 bg-[#F5F1EB]">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2
              className="text-3xl md:text-4xl text-[#2D4A3E] mb-4"
              style={{ fontFamily: 'var(--font-dm-serif), Georgia, serif' }}
            >
              Slik fungerer det
            </h2>
          </div>

          <div className="flex flex-wrap justify-center gap-12">
            {[
              { num: 1, title: 'Velg scenario', desc: 'Beskriv situasjonen du vil øve på, eller velg fra våre forslag.' },
              { num: 2, title: 'Øv samtalen', desc: 'Ha en realistisk samtale med AI-en som tilpasser seg dine svar.' },
              { num: 3, title: 'Få innsikt', desc: 'Motta tilbakemelding og konkrete tips til forbedring.' },
            ].map((step) => (
              <div key={step.num} className="flex-1 min-w-[250px] max-w-[300px] text-center">
                <div
                  className="w-12 h-12 rounded-full bg-[#2D4A3E] text-white flex items-center justify-center mx-auto mb-6 text-xl"
                  style={{ fontFamily: 'var(--font-dm-serif), Georgia, serif' }}
                >
                  {step.num}
                </div>
                <h3 className="text-lg font-semibold text-[#2C2C2C] mb-2">{step.title}</h3>
                <p className="text-sm text-[#5A5A5A]">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Arena Selection Section */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2
              className="text-3xl md:text-4xl text-[#2D4A3E] mb-4"
              style={{ fontFamily: 'var(--font-dm-serif), Georgia, serif' }}
            >
              Velg din arena
            </h2>
            <p className="text-[#5A5A5A] text-lg max-w-xl mx-auto">
              Hver samtale er unik. Velg situasjonen du vil øve på, og få tilpasset veiledning underveis.
            </p>
          </div>

          {/* Arena Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {arenaList.map((arena) => (
              <ArenaCard
                key={arena.id}
                arena={arena}
                onClick={() => handleArenaClick(arena.id)}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-16 px-6 bg-[#2D4A3E] text-white text-center">
        <div className="flex items-center justify-center gap-3 mb-2">
          <span
            className="text-2xl"
            style={{ fontFamily: 'var(--font-dm-serif), Georgia, serif' }}
          >
            Pratiro
          </span>
          <PauseIcon className="w-5 h-5 text-white/80" />
        </div>
        <p className="text-white/60 mb-6">Prat i ro – øv på samtaler som betyr noe</p>
        <p className="text-white/40 text-sm">© 2025 Pratiro. Laget i Norge.</p>
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
