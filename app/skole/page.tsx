'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { Metadata } from 'next';

// Modulkort-data
const modules = [
  {
    href: '/skole/matte',
    variant: 'matte' as const,
    icon: '\u{1F4D0}',
    title: 'MatteMester',
    desc: 'Se hvordan regnestykker settes opp p\u00e5 papiret \u2013 steg for steg med veiledning. Addisjon, subtraksjon, multiplikasjon, divisjon og br\u00f8k. Pluss en gangetester!',
    tags: [
      { label: 'Klar', type: 'live' as const },
      { label: 'Ingen API', type: 'default' as const },
    ],
  },
  {
    href: '/skole/gloser',
    variant: 'glose' as const,
    icon: '\u{1F30D}',
    title: 'Gloser',
    desc: 'Lim inn gloser eller ta bilde av glosearket. AI oversetter og lager \u00f8vingskort du kan bla gjennom med flashcard-systemet.',
    tags: [
      { label: 'Klar', type: 'live' as const },
      { label: 'Engelsk \u00b7 Spansk \u00b7 Tysk \u00b7 Fransk', type: 'default' as const },
    ],
  },
  {
    href: '/skole/prove',
    variant: 'prove' as const,
    icon: '\u{1F4DD}',
    title: 'Pr\u00f8veforberedelse',
    desc: 'Lim inn pensum eller sp\u00f8rsm\u00e5l fra l\u00e6reren. AI finner presise svar og lager en quiz du kan bruke til \u00e5 \u00f8ve f\u00f8r pr\u00f8ven.',
    tags: [
      { label: 'Kommer snart', type: 'soon' as const },
      { label: 'Alle fag', type: 'default' as const },
    ],
  },
];

const features = [
  { icon: '\u{1F512}', title: 'Trygt og gratis', desc: 'Ingen reklame, ingen innlogging, ingen persondata som lagres.' },
  { icon: '\u{1F468}\u200D\u{1F469}\u200D\u{1F467}', title: 'For hele familien', desc: 'Mattemetodene f\u00f8lger dagens pensum \u2013 du slipper \u00e5 l\u00e6re bort 90-tallsmetoden.' },
  { icon: '\u{1F33F}', title: 'I eget tempo', desc: 'G\u00e5 steg for steg, ta pauser, pr\u00f8v igjen. \u00d8v i ro \u2013 det er det Pratiro betyr.' },
];

// Farge-config per modulkort-variant
const variantStyles = {
  matte: {
    iconBg: 'bg-[rgba(58,139,91,0.14)]',
    glowGradient: 'radial-gradient(circle at 20% 15%, rgba(58,139,91,0.1), transparent 55%)',
  },
  glose: {
    iconBg: 'bg-[rgba(91,122,140,0.14)]',
    glowGradient: 'radial-gradient(circle at 20% 15%, rgba(91,122,140,0.1), transparent 55%)',
  },
  prove: {
    iconBg: 'bg-[rgba(196,101,26,0.12)]',
    glowGradient: 'radial-gradient(circle at 20% 15%, rgba(196,101,26,0.08), transparent 55%)',
  },
};

export default function SkolePage() {
  const [copied, setCopied] = useState(false);

  const handleCopyLink = () => {
    navigator.clipboard.writeText('https://pratiro.no/skole').then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  return (
    <div
      className="min-h-screen text-[var(--sand)]"
      style={{
        background: 'var(--forest-dark)',
      }}
    >
      {/* Ambient glow */}
      <div
        className="fixed inset-0 pointer-events-none z-0"
        aria-hidden="true"
        style={{
          background: `
            radial-gradient(ellipse 70% 40% at 30% 0%, rgba(58,139,91,0.08), transparent),
            radial-gradient(ellipse 50% 35% at 75% 15%, rgba(91,122,140,0.06), transparent),
            radial-gradient(ellipse 60% 30% at 50% 100%, rgba(42,64,54,0.3), transparent)
          `,
        }}
      />

      <div className="relative z-[1]">

        {/* ══ NAV ══ */}
        <nav
          aria-label="Hovednavigasjon"
          className="sticky top-0 z-50 flex items-center justify-between px-6 py-3.5 border-b border-[rgba(231,236,234,0.06)]"
          style={{
            background: 'rgba(31,48,41,0.8)',
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
          }}
        >
          {/* Toppstripe */}
          <div
            className="absolute top-0 left-0 right-0 h-[2px]"
            style={{ background: 'linear-gradient(90deg, rgba(58,139,91,0.5), rgba(91,122,140,0.25), rgba(58,139,91,0.5))' }}
            aria-hidden="true"
          />

          <Link href="/skole" className="flex items-center gap-2.5 no-underline">
            <div className="flex gap-[3px]" aria-hidden="true">
              <span className="block w-1 h-[18px] bg-[rgba(231,236,234,0.45)] rounded-[1px]" />
              <span className="block w-1 h-[18px] bg-[rgba(231,236,234,0.45)] rounded-[1px]" />
            </div>
            <span className="font-serif text-[1.15rem] text-[var(--sage)]">
              Pratiro<em className="not-italic text-[var(--green-soft)] text-[0.85rem] ml-0.5">Skole</em>
            </span>
          </Link>

          <div className="flex items-center gap-5">
            <Link
              href="/"
              className="text-[0.78rem] font-semibold uppercase tracking-[1.5px] text-[rgba(231,236,234,0.35)] hover:text-[rgba(231,236,234,0.75)] transition-colors no-underline"
            >
              &larr; Samtale&oslash;ving
            </Link>
          </div>
        </nav>

        {/* ══ HERO ══ */}
        <section className="text-center py-[72px] px-6 max-w-[660px] mx-auto md:py-[72px] py-[52px]">
          <div className="inline-flex items-center gap-1.5 px-[18px] py-[7px] rounded-full bg-[rgba(58,139,91,0.1)] border border-[rgba(58,139,91,0.18)] text-[0.72rem] font-bold uppercase tracking-[2px] text-[var(--green-soft)] mb-7">
            {'\u{1F4DA}'} Gratis l&aelig;ringsverkt&oslash;y
          </div>
          <h1 className="text-[clamp(2.2rem,5vw,3rem)] text-[var(--mist)] mb-3.5 font-serif font-normal leading-[1.15] tracking-[-0.01em]">
            L&aelig;r mer, stress mindre
          </h1>
          <p className="text-[1.05rem] text-[var(--sage-dim)] max-w-[500px] mx-auto leading-[1.7]">
            Smarte verkt&oslash;y som hjelper elever og foreldre med matte, gloser og pr&oslash;veforberedelse &ndash; uten reklame og uten innlogging.
          </p>
        </section>

        {/* ══ MODULKORT ══ */}
        <div className="max-w-[960px] mx-auto px-6 pb-[72px] grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-[18px] md:px-6 px-4 md:pb-[72px] pb-[52px]">
          {modules.map((mod, i) => {
            const styles = variantStyles[mod.variant];
            return (
              <Link
                key={mod.href}
                href={mod.href}
                className="group relative block rounded-[22px] p-[34px_30px_30px] border border-[rgba(231,236,234,0.09)] bg-[rgba(231,236,234,0.07)] backdrop-blur-[10px] no-underline transition-all duration-[350ms] ease-[cubic-bezier(0.4,0,0.2,1)] hover:-translate-y-[3px] hover:border-[rgba(231,236,234,0.16)] hover:bg-[rgba(231,236,234,0.11)] hover:shadow-[0_24px_64px_-16px_rgba(0,0,0,0.35)] overflow-hidden md:p-[34px_30px_30px] p-[26px_22px_24px]"
                style={{
                  animation: `fadeInUp 0.5s ease both`,
                  animationDelay: `${i * 0.08}s`,
                }}
              >
                {/* Hover glow */}
                <div
                  className="absolute inset-0 rounded-[22px] opacity-0 group-hover:opacity-100 transition-opacity duration-[350ms]"
                  style={{ background: styles.glowGradient }}
                  aria-hidden="true"
                />

                {/* Pil */}
                <div className="absolute top-[34px] right-[30px] w-8 h-8 rounded-full bg-[rgba(231,236,234,0.06)] flex items-center justify-center text-[rgba(231,236,234,0.25)] text-[0.85rem] transition-all duration-[350ms] group-hover:bg-[rgba(231,236,234,0.12)] group-hover:text-[rgba(231,236,234,0.6)] group-hover:translate-x-[3px]">
                  &rarr;
                </div>

                {/* Ikon */}
                <div className={`relative z-[1] w-[54px] h-[54px] rounded-2xl flex items-center justify-center text-2xl mb-[18px] ${styles.iconBg}`}>
                  {mod.icon}
                </div>

                {/* Tekst */}
                <h3 className="relative z-[1] text-[1.45rem] text-[var(--mist)] mb-2 font-serif font-normal leading-[1.15]">{mod.title}</h3>
                <p className="relative z-[1] text-[0.9rem] text-[var(--sage-dim)] leading-[1.65] mb-5">{mod.desc}</p>

                {/* Tags */}
                <div className="relative z-[1] flex gap-2 flex-wrap">
                  {mod.tags.map((tag) => (
                    <span
                      key={tag.label}
                      className={`text-[0.68rem] font-bold uppercase tracking-[1.2px] px-3 py-1 rounded-full border ${
                        tag.type === 'live'
                          ? 'border-[rgba(58,139,91,0.3)] text-[var(--green-soft)] bg-[rgba(58,139,91,0.08)]'
                          : tag.type === 'soon'
                          ? 'border-[rgba(196,101,26,0.2)] text-[var(--carry)] bg-[rgba(196,101,26,0.06)]'
                          : 'border-[rgba(231,236,234,0.1)] text-[var(--sage-dim)]'
                      }`}
                    >
                      {tag.label}
                    </span>
                  ))}
                </div>
              </Link>
            );
          })}
        </div>

        {/* ══ FEATURES ══ */}
        <div className="max-w-[960px] mx-auto mb-[72px] px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-[rgba(231,236,234,0.06)] rounded-[20px] overflow-hidden border border-[rgba(231,236,234,0.06)]">
            {features.map((feat) => (
              <div
                key={feat.title}
                className="p-[30px_26px] backdrop-blur-[6px]"
                style={{ background: 'rgba(31,48,41,0.7)' }}
              >
                <span className="text-[1.3rem] mb-2.5 block">{feat.icon}</span>
                <h4 className="text-[0.95rem] text-[var(--sage)] mb-1.5 font-sans font-bold leading-[1.15]">{feat.title}</h4>
                <p className="text-[0.84rem] text-[rgba(231,236,234,0.4)] leading-[1.6]">{feat.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ══ TIPS TIL FORELDRE ══ */}
        <div className="max-w-[700px] mx-auto mb-[72px] px-6">
          <div className="bg-[rgba(247,245,240,0.05)] border border-[rgba(247,245,240,0.08)] rounded-[20px] p-9 flex gap-6 items-start md:flex-row flex-col md:p-9 p-7">
            <div className="w-12 h-12 bg-[rgba(247,245,240,0.06)] rounded-[14px] flex items-center justify-center text-[1.4rem] shrink-0">
              {'\u{1F4A1}'}
            </div>
            <div>
              <h3 className="text-[1.2rem] text-[var(--sand)] mb-2 font-serif font-normal leading-[1.15]">Tips til foreldre</h3>
              <p className="text-[0.9rem] text-[var(--sage-dim)] leading-[1.65]">
                Sett dere ned sammen med barnet og bruk MatteMester til &aring; se oppstillingen steg for steg. Mange foreldre oppdager at metodene har endret seg &ndash; og MatteMester viser n&aring;tidens metode slik den brukes p&aring; skolen i dag.
              </p>
            </div>
          </div>
        </div>

        {/* ══ CTA ══ */}
        <div className="text-center px-6 pb-[72px] max-w-[560px] mx-auto">
          <h2 className="text-[1.7rem] text-[var(--sage)] mb-2.5 font-serif font-normal leading-[1.15]">Del med noen som trenger det</h2>
          <p className="text-[rgba(231,236,234,0.4)] mb-6 text-[0.92rem] leading-[1.65]">
            Kjenner du foreldre eller elever som kunne hatt nytte av dette? Verkt&oslash;yene er gratis og klare til bruk.
          </p>
          <button
            onClick={handleCopyLink}
            className="inline-flex items-center gap-2 px-8 py-3.5 bg-[var(--green)] text-white font-bold text-[0.92rem] rounded-xl border-none cursor-pointer transition-all duration-[250ms] shadow-[0_4px_20px_rgba(58,139,91,0.2)] hover:bg-[var(--green-soft)] hover:-translate-y-px hover:shadow-[0_8px_30px_rgba(58,139,91,0.25)] font-sans"
          >
            {copied ? '\u2713 Lenke kopiert!' : '\u{1F4CB} Kopier pratiro.no/skole'}
          </button>
          <span className="block mt-3.5 text-[0.8rem] font-medium text-[rgba(231,236,234,0.25)]">
            Trenger du &aring; &oslash;ve p&aring; en vanskelig samtale?{' '}
            <Link href="/" className="text-[rgba(231,236,234,0.35)] underline underline-offset-2 hover:text-[rgba(231,236,234,0.6)] transition-colors">
              &rarr; pratiro.no
            </Link>
          </span>
        </div>

        {/* ══ FOOTER ══ */}
        <footer className="border-t border-[rgba(231,236,234,0.05)] py-8 px-6 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <div className="flex gap-[2px]" aria-hidden="true">
              <span className="block w-[3px] h-[13px] bg-[rgba(231,236,234,0.2)] rounded-[1px]" />
              <span className="block w-[3px] h-[13px] bg-[rgba(231,236,234,0.2)] rounded-[1px]" />
            </div>
            <span className="font-serif text-[0.9rem] text-[rgba(231,236,234,0.3)]">Pratiro</span>
          </div>
          <p className="text-[0.75rem] text-[rgba(231,236,234,0.15)]">
            <Link href="/" className="text-[rgba(231,236,234,0.22)] no-underline hover:text-[rgba(231,236,234,0.45)] transition-colors">Samtale&oslash;ving</Link>
            {' \u00b7 '}
            <Link href="/skole" className="text-[rgba(231,236,234,0.22)] no-underline hover:text-[rgba(231,236,234,0.45)] transition-colors">Skole</Link>
            {' \u00b7 '}
            <Link href="/personvern" className="text-[rgba(231,236,234,0.22)] no-underline hover:text-[rgba(231,236,234,0.45)] transition-colors">Personvern</Link>
            {' \u00b7 \u00a9 2026'}
          </p>
        </footer>

      </div>
    </div>
  );
}
