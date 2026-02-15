'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';

// ══════════════════════════════════════
//  TYPES
// ══════════════════════════════════════

type Carry = { v: number; p: number; u: boolean };
type HistEntry = { p: number; nv: number };
type DivRow = { val: number; sub: number; nv: number; dec: boolean };
type PartialProduct = { v: number; s: number; cur?: boolean };
type FracVal = { n: number; d: number };

type BaseStep = { exp: string; err?: boolean; fin?: boolean };

type AddStep = BaseStep & {
  t: 'add'; v1: number; v2: number; res: string;
  carries: Carry[]; col: number;
};
type SubStep = BaseStep & {
  t: 'sub'; v1: number; v2: number; res: string;
  hist: HistEntry[]; col: number; borrow?: boolean;
};
type MulStep = BaseStep & {
  t: 'mul'; v1: number; v2: number; res?: string;
  parts: PartialProduct[]; bi: number; ti: number;
  carries: Carry[];
};
type DivStep = BaseStep & {
  t: 'div'; cr: string; rows: DivRow[]; ad?: number;
};
type FracStep = BaseStep & {
  t?: undefined;
  vt: 'compare' | 'expanded' | 'result';
  l?: FracVal; r?: FracVal; op?: string; res?: FracVal;
};
type ErrorStep = { exp: string; err: true };

type Step = AddStep | SubStep | MulStep | DivStep | FracStep | ErrorStep;

// ══════════════════════════════════════
//  PURE MATH STEP GENERATORS
// ══════════════════════════════════════

const gcd = (a: number, b: number): number => b === 0 ? a : gcd(b, a % b);
const lcm = (a: number, b: number): number => !a || !b ? 0 : Math.abs(a * b) / gcd(a, b);

function genAdd(a: number, b: number): AddStep[] {
  const s1 = String(a).split('').reverse(), s2 = String(b).split('').reverse();
  const mx = Math.max(s1.length, s2.length);
  let carry = 0, carries: Carry[] = [], res: number[] = [], steps: AddStep[] = [];
  for (let i = 0; i < mx; i++) {
    const d1 = parseInt(s1[i] || '0'), d2 = parseInt(s2[i] || '0'), sum = d1 + d2 + carry;
    const dig = sum % 10, nc = Math.floor(sum / 10);
    carries = carries.map(c => ({ ...c, u: true }));
    if (nc > 0) carries.push({ v: nc, p: i + 1, u: false });
    res.unshift(dig);
    steps.push({ t: 'add', exp: `Kolonne ${i + 1} (fra h\u00f8yre): ${d1} + ${d2}${carry ? ' + ' + carry + ' (mente)' : ''} = ${sum}. Skriv ${dig}${nc ? ', ' + nc + ' i mente.' : '.'}`, res: res.join(''), v1: a, v2: b, carries: [...carries], col: i });
    carry = nc;
  }
  if (carry > 0) steps.push({ t: 'add', exp: `Siste mente (${carry}) flyttes ned.`, res: carry + res.join(''), v1: a, v2: b, carries: carries.map(c => ({ ...c, u: true })), col: mx, fin: true });
  else if (steps.length) steps[steps.length - 1].fin = true;
  return steps;
}

function genSub(a: number, b: number): (SubStep | ErrorStep)[] {
  if (b > a) return [{ exp: '\u00d8verste tall m\u00e5 v\u00e6re st\u00f8rst.', err: true }];
  const s1 = String(a).split('').reverse(), s2 = String(b).split('').reverse();
  const mx = s1.length;
  const digs = s1.map(Number);
  let res: number[] = [], hist: HistEntry[] = [], steps: SubStep[] = [];
  for (let i = 0; i < mx; i++) {
    let d1 = digs[i], d2 = parseInt(s2[i] || '0');
    if (d1 < d2) {
      let j = i + 1;
      while (j < mx && digs[j] === 0) j++;
      if (j === mx) break;
      hist.push({ p: j, nv: digs[j] - 1 }); digs[j] -= 1;
      for (let k = j - 1; k > i; k--) { hist.push({ p: k, nv: 9 }); digs[k] = 9; }
      steps.push({ t: 'sub', exp: `${d1} er mindre enn ${d2}. Vi l\u00e5ner fra posisjon ${j + 1} (veksling).`, v1: a, v2: b, res: res.join(''), hist: [...hist], col: i, borrow: true });
      d1 += 10; digs[i] = d1;
    }
    const diff = d1 - d2; res.unshift(diff);
    steps.push({ t: 'sub', exp: `${d1} \u2212 ${d2} = ${diff}.`, v1: a, v2: b, res: String(parseInt(res.join('')) || 0), hist: [...hist], col: i, fin: i === mx - 1 });
  }
  return steps;
}

function genMul(a: number, b: number): MulStep[] {
  const s1 = String(a).split('').reverse(), s2 = String(b).split('').reverse();
  let parts: PartialProduct[] = [], steps: MulStep[] = [];
  for (let i = 0; i < s2.length; i++) {
    const md = parseInt(s2[i]); let pc = 0, pd: number[] = [], rc: Carry[] = [];
    for (let j = 0; j < s1.length; j++) {
      const td = parseInt(s1[j]), prod = td * md + pc, rd = prod % 10, nc = Math.floor(prod / 10);
      rc = rc.map(c => ({ ...c, u: true }));
      if (nc > 0) rc.push({ v: nc, p: j + 1, u: false });
      pd.unshift(rd);
      let expText = `${md} \u00d7 ${td}`;
      if (pc > 0) expText += ` + ${pc} (mente)`;
      expText += ` = ${prod}. Skriv ${rd}`;
      if (nc > 0) expText += `, ${nc} i mente over neste kolonne`;
      expText += '.';
      steps.push({ t: 'mul', exp: expText, v1: a, v2: b, parts: [...parts, { v: parseInt(pd.join('')), s: i, cur: true }], bi: String(b).length - 1 - i, ti: String(a).length - 1 - j, carries: [...rc] });
      pc = nc;
    }
    if (pc > 0) {
      pd.unshift(pc);
      steps.push({ t: 'mul', exp: `Siste mente ${pc} skrives foran.`, v1: a, v2: b, parts: [...parts, { v: parseInt(pd.join('')), s: i, cur: true }], bi: String(b).length - 1 - i, ti: -1, carries: rc.map(c => ({ ...c, u: true })) });
    }
    parts.push({ v: parseInt(pd.join('')), s: i });
  }
  if (s2.length > 1) steps.push({ t: 'mul', exp: `Legg sammen delproduktene: ${a * b}.`, v1: a, v2: b, parts: [...parts], res: String(a * b), fin: true, carries: [], bi: -1, ti: -1 });
  else if (steps.length) { steps[steps.length - 1].fin = true; steps[steps.length - 1].res = String(a * b); }
  return steps;
}

function genDiv(a: number, b: number): (DivStep | ErrorStep)[] {
  if (b === 0) return [{ exp: 'Kan ikke dele p\u00e5 0.', err: true }];
  const s = String(a); let cv = '', r = '', rows: DivRow[] = [], dec = false, steps: DivStep[] = [], i = 0;
  let decCount = 0;
  const maxDecimalPlaces = 2;
  while (i < s.length || (parseInt(cv) !== 0 && decCount < maxDecimalPlaces)) {
    const isDec = i >= s.length;
    const nd = isDec ? '0' : s[i];
    if (isDec && !dec) { dec = true; r += ','; }
    if (isDec) decCount++;
    cv += nd;
    const val = parseInt(cv), cnt = Math.floor(val / b), sub = cnt * b, nv = val - sub;
    let dr: string;
    if (!dec) dr = String(parseInt(r + cnt) || 0); else dr = r + cnt;
    rows = [...rows, { val, sub, nv, dec: isDec }];

    // Sjekk om vi har n\u00e5dd desimalgrensen med rest
    if (isDec && decCount >= maxDecimalPlaces && nv !== 0) {
      steps.push({ t: 'div', exp: `${b} g\u00e5r i ${val} ${cnt} gang${cnt !== 1 ? 'er' : ''} (${cnt} \u00d7 ${b} = ${sub}). Rest: ${nv}. Vi stopper her og avrunder. I de fleste oppgaver holder det med to desimaler.`, cr: '\u2248 ' + dr, rows: [...rows], ad: -1, fin: true });
      if (!dec) r = String(parseInt(r + cnt) || ''); else r += cnt;
      break;
    }

    steps.push({ t: 'div', exp: isDec ? `Rest ${val / 10}. Sett komma og trekk ned 0. ${b} g\u00e5r i ${val} ${cnt} gang${cnt !== 1 ? 'er' : ''} (${cnt} \u00d7 ${b} = ${sub}). Rest: ${nv}.` : `${b} g\u00e5r i ${val} ${cnt} gang${cnt !== 1 ? 'er' : ''} (${cnt} \u00d7 ${b} = ${sub}). Rest: ${nv}.`, cr: dr, rows: [...rows], ad: isDec ? -1 : i });
    if (!dec) r = String(parseInt(r + cnt) || (i === s.length - 1 && cnt === 0 ? '0' : '')); else r += cnt;
    cv = String(nv); i++;
    if (isDec && nv === 0) break;
  }
  if (steps.length && !steps[steps.length - 1].fin) steps[steps.length - 1].fin = true;
  return steps;
}

function genFrac(n1: number, d1: number, n2: number, d2: number, op: string): FracStep[] {
  const steps: FracStep[] = [];
  if (op === '+' || op === '-') {
    const cd = lcm(d1, d2), nn1 = n1 * (cd / d1), nn2 = n2 * (cd / d2);
    steps.push({ exp: `Finn fellesnevner: minste felles multiplum av ${d1} og ${d2} er ${cd}.`, vt: 'compare', l: { n: n1, d: d1 }, r: { n: n2, d: d2 } });
    steps.push({ exp: `Utvid br\u00f8kene: ${n1}/${d1} = ${nn1}/${cd} og ${n2}/${d2} = ${nn2}/${cd}.`, vt: 'expanded', l: { n: nn1, d: cd }, r: { n: nn2, d: cd }, op });
    const rn = op === '+' ? nn1 + nn2 : nn1 - nn2;
    steps.push({ exp: `Regn ut tellerne: ${nn1} ${op} ${nn2} = ${rn}. Svar: ${rn}/${cd}.`, vt: 'result', res: { n: rn, d: cd } });
    const g = Math.abs(gcd(rn, cd));
    if (g > 1) steps.push({ exp: `Forkort med ${g}: ${rn / g}/${cd / g}.`, vt: 'result', res: { n: rn / g, d: cd / g }, fin: true });
    else steps[steps.length - 1].fin = true;
  } else if (op === '*') {
    const rn = n1 * n2, rd = d1 * d2, g = Math.abs(gcd(rn, rd));
    steps.push({ exp: `Gang teller med teller og nevner med nevner: (${n1}\u00d7${n2}) / (${d1}\u00d7${d2}) = ${rn}/${rd}.`, vt: 'result', res: { n: rn, d: rd } });
    if (g > 1) steps.push({ exp: `Forkort med ${g}: ${rn / g}/${rd / g}.`, vt: 'result', res: { n: rn / g, d: rd / g }, fin: true });
    else steps[steps.length - 1].fin = true;
  }
  return steps;
}

// ══════════════════════════════════════
//  FRACTION PIE VISUALIZATION
// ══════════════════════════════════════

function FractionPie({ num, den, active }: { num: number; den: number; active?: boolean }) {
  if (den > 12) return <div className="text-2xl font-mono font-bold text-[var(--forest)]">{num}/{den}</div>;
  const r = 42, cx = 50, cy = 50;
  const slices = [];
  for (let i = 0; i < den; i++) {
    const s = (i / den) * Math.PI * 2 - Math.PI / 2;
    const e = ((i + 1) / den) * Math.PI * 2 - Math.PI / 2;
    const d = `M ${cx} ${cy} L ${cx + r * Math.cos(s)} ${cy + r * Math.sin(s)} A ${r} ${r} 0 ${1 / den > 0.5 ? 1 : 0} 1 ${cx + r * Math.cos(e)} ${cy + r * Math.sin(e)} Z`;
    slices.push(<path key={i} d={d} fill={i < num ? (active ? 'var(--forest)' : 'var(--forest-light)') : 'var(--sage)'} stroke="white" strokeWidth="2.5" />);
  }
  return (
    <div className="flex flex-col items-center gap-2">
      <svg viewBox="0 0 100 100" className="w-20 h-20">{slices}</svg>
      <span className="font-mono font-bold text-[var(--forest)]">{num}/{den}</span>
    </div>
  );
}

// ══════════════════════════════════════
//  GANGETEST – med gamification
// ══════════════════════════════════════

const LEVELS = [
  { min: 0, name: 'Nybegynner', emoji: '\u{1F331}' },
  { min: 10, name: 'Regnehelt', emoji: '\u{1F4AA}' },
  { min: 20, name: 'Gangemester', emoji: '\u{2B50}' },
  { min: 30, name: 'Lynregner', emoji: '\u26A1' },
  { min: 40, name: 'Mattegeni', emoji: '\u{1F9E0}' },
];

function getLevel(score: number) {
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (score >= LEVELS[i].min) return LEVELS[i];
  }
  return LEVELS[0];
}

function getStars(score: number) {
  if (score >= 30) return 3;
  if (score >= 15) return 2;
  return 1;
}

function GangeTest() {
  const [st, setSt] = useState<'menu' | 'tips' | 'play' | 'done'>('menu');
  const [tbl, setTbl] = useState<string>('mix');
  const [q, setQ] = useState({ a: 0, b: 0 });
  const [ans, setAns] = useState('');
  const [score, setScore] = useState(0);
  const [time, setTime] = useState(60);
  const [combo, setCombo] = useState(0);
  const [bestCombo, setBestCombo] = useState(0);
  const [fb, setFb] = useState<'ok' | 'no' | 'show' | null>(null);
  const [correctAns, setCorrectAns] = useState(0);
  const [prevLevel, setPrevLevel] = useState('Nybegynner');
  const [levelUp, setLevelUp] = useState(false);
  const [pointAnim, setPointAnim] = useState(false);
  const [isNewRecord, setIsNewRecord] = useState(false);
  const inp = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (st !== 'play' || time <= 0) return;
    const t = setInterval(() => setTime(p => {
      if (p <= 1) { setSt('done'); return 0; }
      return p - 1;
    }), 1000);
    return () => clearInterval(t);
  }, [st, time]);

  // Sjekk ny rekord ved game over
  useEffect(() => {
    if (st !== 'done') return;
    const key = `pratiro_gange_best_${tbl}`;
    const prev = parseInt(localStorage.getItem(key) || '0');
    if (score > prev) {
      localStorage.setItem(key, String(score));
      setIsNewRecord(true);
    } else {
      setIsNewRecord(false);
    }
  }, [st, score, tbl]);

  const gen = useCallback((t: string) => {
    let a: number, b: number;
    if (t === 'mix') {
      a = Math.floor(Math.random() * 9) + 2;
      b = Math.floor(Math.random() * 9) + 2;
    } else {
      a = parseInt(t);
      b = Math.floor(Math.random() * 10) + 1;
    }
    if (Math.random() > 0.5) [a, b] = [b, a];
    setQ({ a, b }); setAns(''); setFb(null);
    setTimeout(() => inp.current?.focus(), 50);
  }, []);

  const go = (t: string) => {
    setTbl(t); setScore(0); setCombo(0); setBestCombo(0);
    setTime(60); setPrevLevel('Nybegynner'); setSt('play'); gen(t);
  };

  const sub = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ans || fb === 'show') return;
    const correct = parseInt(ans) === q.a * q.b;
    if (correct) {
      const newScore = score + 1;
      const newCombo = combo + 1;
      setScore(newScore);
      setCombo(newCombo);
      if (newCombo > bestCombo) setBestCombo(newCombo);
      setFb('ok');
      setPointAnim(true);
      setTimeout(() => setPointAnim(false), 600);

      // Sjekk nivå-opp
      const oldLevel = getLevel(score).name;
      const newLevel = getLevel(newScore).name;
      if (newLevel !== oldLevel) {
        setPrevLevel(newLevel);
        setLevelUp(true);
        setTimeout(() => setLevelUp(false), 1200);
      }

      setTimeout(() => { setFb(null); gen(tbl); }, 300);
    } else {
      setCombo(0);
      setFb('no');
      setCorrectAns(q.a * q.b);
      // Vis riktig svar i 1 sekund
      setTimeout(() => {
        setFb('show');
        setTimeout(() => { setFb(null); gen(tbl); }, 1000);
      }, 300);
    }
  };

  // MENY
  if (st === 'menu') return (
    <div className="text-center py-6 px-4">
      <h2 className="text-2xl font-bold mb-1 text-[var(--forest)] font-serif">Gangetesteren</h2>
      <p className="text-sm mb-5 text-[var(--text-soft)]">Velg tabell og sett rekord!</p>
      <div className="grid grid-cols-3 gap-2 max-w-xs mx-auto">
        {[2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => {
          const best = typeof window !== 'undefined' ? localStorage.getItem(`pratiro_gange_best_${n}`) : null;
          return (
            <button key={n} onClick={() => go(String(n))}
              className="py-3 rounded-xl font-bold text-lg border border-[rgba(42,64,54,0.1)] bg-white text-[var(--forest)] transition-all hover:shadow-md active:scale-95 relative">
              {n}
              {best && <span className="absolute top-1 right-2 text-[0.6rem] font-semibold text-[var(--stone)]">{best}</span>}
            </button>
          );
        })}
        <button onClick={() => go('mix')} className="col-span-3 py-3 rounded-xl font-bold text-white bg-[var(--forest)] active:scale-95 shadow-md">
          MIX (Alle)
        </button>
      </div>
      <button onClick={() => setSt('tips')} className="mt-4 text-xs font-semibold text-[var(--stone)] mx-auto flex items-center gap-1">
        {'\u{1F4A1}'} Huskeregler
      </button>
    </div>
  );

  // TIPS
  if (st === 'tips') return (
    <div className="p-4 max-w-sm mx-auto">
      <div className="flex items-center gap-3 mb-4">
        <button onClick={() => setSt('menu')} className="p-2 rounded-full bg-white border border-black/5 shadow-sm text-sm">&larr;</button>
        <h2 className="font-bold text-[var(--forest)]">Huskeregler</h2>
      </div>
      {[
        ['2-gangen', 'Tenk dobbel! 2 \u00d7 6 = 6 + 6 = 12'],
        ['4-gangen', 'Dobbel-dobbel. 4 \u00d7 6? Doble 6\u219212, doble 12\u219224'],
        ['5-gangen', 'Alle svar slutter p\u00e5 0 eller 5'],
        ['9-gangen', 'Fingertrikset! B\u00f8y finger nr. du ganger med'],
      ].map(([t, d], i) => (
        <div key={i} className="p-3 rounded-xl border border-[rgba(42,64,54,0.06)] bg-white mb-2">
          <h3 className="font-bold text-sm text-[var(--forest)]">{t}</h3>
          <p className="text-sm text-[var(--text-soft)]">{d}</p>
        </div>
      ))}
    </div>
  );

  // RESULTAT
  if (st === 'done') {
    const level = getLevel(score);
    const stars = getStars(score);
    return (
      <div className="text-center py-8 px-4 relative overflow-hidden">
        {/* Konfetti ved ny rekord */}
        {isNewRecord && (
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {Array.from({ length: 30 }).map((_, i) => (
              <div key={i} className="absolute animate-confetti rounded-sm" style={{
                left: `${Math.random() * 100}%`,
                width: `${6 + Math.random() * 6}px`,
                height: `${6 + Math.random() * 6}px`,
                background: ['#3A8B5B', '#C4651A', '#5B7A8C', '#2A4036', '#FFD700'][i % 5],
                animationDelay: `${Math.random() * 0.5}s`,
                animationDuration: `${1.5 + Math.random() * 1.5}s`,
              }} />
            ))}
          </div>
        )}

        <div className="text-5xl mb-3">{'\u{1F3C6}'}</div>
        <h2 className="text-3xl font-bold mb-1 text-[var(--forest)] font-serif">{score} poeng!</h2>

        {isNewRecord && (
          <div className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-[rgba(196,101,26,0.1)] border border-[rgba(196,101,26,0.2)] text-[var(--carry)] text-sm font-bold mb-3 animate-bounce">
            {'\u{1F389}'} Ny rekord!
          </div>
        )}

        {/* Niv\u00e5 */}
        <div className="text-lg font-semibold text-[var(--forest-light)] mb-1">{level.emoji} {level.name}</div>

        {/* Stjerner */}
        <div className="text-3xl mb-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <span key={i} className={i < stars ? '' : 'opacity-20'}>{'\u2B50'}</span>
          ))}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 max-w-xs mx-auto mb-6">
          <div className="p-4 rounded-xl bg-white border border-[rgba(42,64,54,0.06)]">
            <div className="text-2xl font-bold text-[var(--forest)]">{score}</div>
            <div className="text-[0.65rem] font-bold uppercase tracking-wider text-[var(--stone)]">Poeng</div>
          </div>
          <div className="p-4 rounded-xl bg-white border border-[rgba(42,64,54,0.06)]">
            <div className="text-2xl font-bold text-[var(--carry)]">{bestCombo}x</div>
            <div className="text-[0.65rem] font-bold uppercase tracking-wider text-[var(--stone)]">Beste combo</div>
          </div>
        </div>

        <button onClick={() => go(tbl)} className="px-8 py-3 rounded-full text-white font-bold shadow-md bg-[var(--forest)] mb-3">
          Pr&oslash;v igjen
        </button>
        <br />
        <button onClick={() => setSt('menu')} className="text-sm font-semibold text-[var(--stone)]">Velg tabell</button>
      </div>
    );
  }

  // SPILL
  const level = getLevel(score);
  return (
    <div className="max-w-xs mx-auto py-4 px-2">
      <style>{`
        @keyframes shake { 0%,100%{transform:translateX(0)} 25%{transform:translateX(-6px)} 75%{transform:translateX(6px)} }
        @keyframes flyUp { 0%{opacity:1;transform:translateY(0)} 100%{opacity:0;transform:translateY(-40px)} }
        @keyframes levelPop { 0%{transform:scale(1)} 50%{transform:scale(1.3)} 100%{transform:scale(1)} }
        @keyframes confetti { 0%{opacity:1;transform:translateY(-10px) rotate(0deg)} 100%{opacity:0;transform:translateY(100vh) rotate(720deg)} }
        .animate-shake { animation: shake 0.3s ease; }
        .animate-flyUp { animation: flyUp 0.6s ease forwards; }
        .animate-levelPop { animation: levelPop 0.5s ease; }
        .animate-confetti { animation: confetti 2s ease forwards; }
      `}</style>

      {/* Timer + Score */}
      <div className="flex justify-between mb-4 px-2">
        <div>
          <span className="text-[10px] font-semibold uppercase tracking-wider block text-[var(--stone)]">Tid</span>
          <span className={`text-xl font-mono font-bold ${time < 10 ? 'text-red-500 animate-pulse' : 'text-[var(--forest)]'}`}>
            0:{String(time).padStart(2, '0')}
          </span>
        </div>
        <div className="text-center">
          <span className="text-[10px] font-semibold uppercase tracking-wider block text-[var(--stone)]">Niv&aring;</span>
          <span className={`text-sm font-bold text-[var(--forest-light)] ${levelUp ? 'animate-levelPop' : ''}`}>
            {level.emoji} {level.name}
          </span>
        </div>
        <div className="text-right relative">
          <span className="text-[10px] font-semibold uppercase tracking-wider block text-[var(--stone)]">Poeng</span>
          <span className="text-xl font-mono font-bold text-[var(--forest)]">{score}</span>
          {pointAnim && <span className="absolute -top-2 right-0 text-sm font-bold text-[var(--green)] animate-flyUp">+1</span>}
        </div>
      </div>

      {/* Spillkort */}
      <div className={`relative p-4 sm:p-6 rounded-2xl border text-center transition-all ${fb === 'no' || fb === 'show' ? 'animate-shake' : ''} ${fb === 'ok' ? 'bg-green-50 border-green-400' : 'bg-white border-[rgba(42,64,54,0.08)]'}`}>
        {/* Combo */}
        {combo > 2 && (
          <div className="absolute top-2 right-3 font-bold text-[var(--carry)] animate-pulse flex items-center gap-0.5">
            <span style={{ fontSize: `${Math.min(1.2 + combo * 0.08, 2)}rem` }}>{'\u{1F525}'}</span>
            <span className="text-xs">{combo}x</span>
          </div>
        )}

        {/* Vis riktig svar ved feil */}
        {fb === 'show' ? (
          <div className="py-4">
            <div className="text-lg font-semibold text-[var(--text-soft)] mb-2">{q.a} &times; {q.b} =</div>
            <div className="text-4xl font-bold font-mono text-[var(--green)]">{correctAns}</div>
          </div>
        ) : (
          <>
            <div className="text-4xl sm:text-5xl font-bold font-mono mb-4 sm:mb-6 text-[var(--forest)]">{q.a} &times; {q.b}</div>
            <form onSubmit={sub} className="flex flex-col gap-3">
              <input
                ref={inp}
                type="tel"
                inputMode="numeric"
                value={ans}
                onChange={e => setAns(e.target.value.replace(/\D/g, ''))}
                className={`w-full p-3 text-2xl font-bold text-center rounded-xl border-2 outline-none transition-all ${
                  fb === 'ok' ? 'border-green-500 bg-green-50' :
                  fb === 'no' ? 'border-red-400 bg-red-50' :
                  'border-[rgba(42,64,54,0.15)] bg-[var(--sand)]'
                }`}
                placeholder="?"
                autoFocus
              />
              <button type="submit" className="w-full py-3 rounded-xl font-bold text-white text-lg shadow-md active:scale-95 bg-[var(--forest)]">
                SVAR
              </button>
            </form>
          </>
        )}
      </div>

      <div className="text-center mt-4">
        <button onClick={() => setSt('menu')} className="text-xs font-semibold uppercase tracking-wider text-[var(--stone)]">Avslutt</button>
      </div>
    </div>
  );
}

// ══════════════════════════════════════
//  MATTEMESTER – Oppstilling
// ══════════════════════════════════════

function MatteMester() {
  const [mode, setMode] = useState<'standard' | 'fraction'>('standard');
  const [n1, setN1] = useState('');
  const [n2, setN2] = useState('');
  const [f1n, setF1n] = useState('');
  const [f1d, setF1d] = useState('');
  const [f2n, setF2n] = useState('');
  const [f2d, setF2d] = useState('');
  const [op, setOp] = useState('+');
  const [steps, setSteps] = useState<Step[]>([]);
  const [si, setSi] = useState(-1);
  const [error, setError] = useState('');
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (steps.length && (steps[si] as DivStep)?.t === 'div')
      setTimeout(() => endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 150);
  }, [si, steps]);

  const calc = () => {
    setError('');
    let s: Step[] = [];
    if (mode === 'standard') {
      const a = parseFloat(n1.replace(',', '.')), b = parseFloat(n2.replace(',', '.'));
      if (isNaN(a) || isNaN(b)) { setError('Skriv inn gyldige tall.'); return; }
      if (op === '+' || op === '-') {
        if (!Number.isInteger(a) || !Number.isInteger(b)) { setError('Oppstilling for addisjon og subtraksjon st\u00f8tter kun heltall. Bruk hele tall.'); return; }
        if (a < 0 || b < 0) { setError('Skriv inn positive tall.'); return; }
      }
      if (op === '*') {
        if (!Number.isInteger(a) || !Number.isInteger(b)) { setError('Oppstilling for multiplikasjon st\u00f8tter kun heltall. Bruk hele tall.'); return; }
        if (a < 0 || b < 0) { setError('Skriv inn positive tall.'); return; }
      }
      if (op === '/') {
        const intA = Math.round(a), intB = Math.round(b);
        if (a !== intA || b !== intB) { setError('Divisjon st\u00f8tter kun heltall. Bruk hele tall.'); return; }
        if (intA < 0 || intB <= 0) { setError('Skriv inn positive tall (kan ikke dele p\u00e5 0).'); return; }
      }
      if (op === '+') s = genAdd(a, b);
      else if (op === '-') s = genSub(a, b) as Step[];
      else if (op === '*') s = genMul(a, b);
      else s = genDiv(a, b) as Step[];
    } else {
      const a = parseInt(f1n), b = parseInt(f1d), c = parseInt(f2n), d = parseInt(f2d);
      if ([a, b, c, d].some(isNaN)) { setError('Fyll inn alle felt i br\u00f8kene.'); return; }
      if (b === 0 || d === 0) { setError('Nevner kan ikke v\u00e6re 0.'); return; }
      s = genFrac(a, b, c, d, op);
    }
    setSteps(s); setSi(0);
  };

  const reset = () => {
    setSteps([]); setSi(-1); setN1(''); setN2('');
    setF1n(''); setF1d(''); setF2n(''); setF2d(''); setError('');
  };

  const step = steps[si] as Step | undefined;
  const isErr = step && 'err' in step && step.err;

  return (
    <>
      {/* Input */}
      <div className="bg-white rounded-2xl border border-black/[0.05] shadow-[0_10px_30px_-5px_rgba(42,64,54,0.06)] p-5 mb-4">
        <div className="flex justify-center mb-4">
          <div className="inline-flex p-1 rounded-lg bg-[var(--sand)] border border-[rgba(42,64,54,0.06)]">
            {(['standard', 'fraction'] as const).map(m => (
              <button key={m} onClick={() => { setMode(m); setSteps([]); setSi(-1); setError(''); }}
                className={`px-4 py-1.5 rounded-md text-xs font-semibold transition-all ${mode === m ? 'bg-white text-[var(--forest)] shadow-[0_2px_8px_rgba(42,64,54,0.08)]' : 'text-[var(--stone)]'}`}>
                {m === 'standard' ? 'Standard' : 'Br\u00f8k'}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 items-end justify-center">
          {mode === 'standard' ? (
            <div className="flex gap-2 items-end justify-center">
              <div className="text-center flex-1 min-w-0 max-w-[6.5rem]">
                <label className="block text-[10px] font-semibold mb-1 uppercase tracking-wider text-[var(--forest-light)]">Tall 1</label>
                <input type="text" inputMode="decimal" value={n1} onChange={e => setN1(e.target.value.replace(/[^0-9,.\-]/g, ''))}
                  className="w-full p-2.5 sm:p-3 text-lg border border-[rgba(42,64,54,0.12)] rounded-xl outline-none font-mono text-center bg-[var(--sand)] focus:border-[var(--forest)] focus:ring-1 focus:ring-[var(--forest)]/20" placeholder="0" />
              </div>
              <select value={op} onChange={e => setOp(e.target.value)}
                className="p-2.5 sm:p-3 text-lg border border-[rgba(42,64,54,0.12)] rounded-xl font-bold text-center cursor-pointer bg-[var(--sand)] text-[var(--forest)] shrink-0">
                <option value="+">+</option>
                <option value="-">&minus;</option>
                <option value="*">&times;</option>
                <option value="/">&divide;</option>
              </select>
              <div className="text-center flex-1 min-w-0 max-w-[6.5rem]">
                <label className="block text-[10px] font-semibold mb-1 uppercase tracking-wider text-[var(--forest-light)]">Tall 2</label>
                <input type="text" inputMode="decimal" value={n2} onChange={e => setN2(e.target.value.replace(/[^0-9,.\-]/g, ''))}
                  className="w-full p-2.5 sm:p-3 text-lg border border-[rgba(42,64,54,0.12)] rounded-xl outline-none font-mono text-center bg-[var(--sand)] focus:border-[var(--forest)] focus:ring-1 focus:ring-[var(--forest)]/20" placeholder="0" />
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-4 justify-center">
              <div className="flex flex-col gap-1 items-center">
                <input type="number" value={f1n} onChange={e => setF1n(e.target.value)}
                  className="w-14 p-2 text-center border border-[rgba(42,64,54,0.12)] rounded-lg bg-[var(--sand)]" placeholder="T" />
                <div className="h-0.5 w-full bg-[var(--forest)]" />
                <input type="number" value={f1d} onChange={e => setF1d(e.target.value)}
                  className="w-14 p-2 text-center border border-[rgba(42,64,54,0.12)] rounded-lg bg-[var(--sand)]" placeholder="N" />
              </div>
              <select value={op} onChange={e => setOp(e.target.value)}
                className="text-xl font-bold bg-transparent outline-none text-[var(--stone)]">
                <option value="+">+</option>
                <option value="-">&minus;</option>
                <option value="*">&times;</option>
              </select>
              <div className="flex flex-col gap-1 items-center">
                <input type="number" value={f2n} onChange={e => setF2n(e.target.value)}
                  className="w-14 p-2 text-center border border-[rgba(42,64,54,0.12)] rounded-lg bg-[var(--sand)]" placeholder="T" />
                <div className="h-0.5 w-full bg-[var(--forest)]" />
                <input type="number" value={f2d} onChange={e => setF2d(e.target.value)}
                  className="w-14 p-2 text-center border border-[rgba(42,64,54,0.12)] rounded-lg bg-[var(--sand)]" placeholder="N" />
              </div>
            </div>
          )}
          <div className="flex gap-2 w-full sm:w-auto justify-center">
            <button onClick={calc} className="px-6 py-2.5 sm:py-3 rounded-xl font-bold text-sm text-white shadow-md hover:opacity-90 bg-[var(--forest)] flex-1 sm:flex-initial">BEREGN</button>
            <button onClick={reset} className="p-2.5 sm:p-3 rounded-xl border border-[rgba(42,64,54,0.1)] text-[var(--stone)] shrink-0" title="Nullstill">{'\u21BA'}</button>
          </div>
        </div>

        {error && <p className="text-red-600 text-sm text-center mt-3 font-medium">{error}</p>}
      </div>

      {/* Visualization */}
      <div className="bg-white rounded-2xl border border-black/[0.05] shadow-[0_10px_30px_-5px_rgba(42,64,54,0.06)] overflow-hidden" style={{ minHeight: 380 }}>
        <div className="relative p-6 sm:p-10 bg-[var(--sand)]">
          <div className="absolute inset-0 pointer-events-none opacity-[0.04]" style={{
            backgroundImage: 'linear-gradient(var(--sage) 1px, transparent 1px), linear-gradient(90deg, var(--sage) 1px, transparent 1px)',
            backgroundSize: '40px 40px'
          }} />

          {si === steps.length && steps.length > 0 ? (
            /* ── Oppsummeringsskjerm ── */
            <div className="relative z-10 flex flex-col items-center py-10 text-center">
              <div className="text-4xl mb-3">{'\u{1F389}'}</div>
              <h3 className="text-xl font-bold mb-2 text-[var(--forest)] font-serif">Ferdig!</h3>

              {/* Vis regnestykke og svar */}
              <div className="bg-white rounded-xl border border-[rgba(42,64,54,0.08)] px-6 sm:px-8 py-5 mb-4 shadow-sm max-w-full overflow-auto">
                <div className="font-mono text-xl sm:text-3xl font-bold text-[var(--forest)]">
                  {mode === 'standard' ? (
                    <>
                      {n1} {op === '+' ? '+' : op === '-' ? '\u2212' : op === '*' ? '\u00d7' : ':'} {n2} ={' '}
                      <span className="text-[var(--green)]">
                        {(() => {
                          const lastStep = steps[steps.length - 1];
                          if ('cr' in lastStep) return (lastStep as DivStep).cr;
                          if ('res' in lastStep && lastStep.res) {
                            if (typeof lastStep.res === 'string') return lastStep.res;
                            if (typeof lastStep.res === 'object' && 'n' in lastStep.res) return `${lastStep.res.n}/${lastStep.res.d}`;
                          }
                          return '';
                        })()}
                      </span>
                    </>
                  ) : (
                    (() => {
                      const lastStep = steps[steps.length - 1];
                      if ('vt' in lastStep && lastStep.res) {
                        return <>{f1n}/{f1d} {op === '+' ? '+' : op === '-' ? '\u2212' : '\u00d7'} {f2n}/{f2d} = <span className="text-[var(--green)]">{lastStep.res.n}/{lastStep.res.d}</span></>;
                      }
                      return null;
                    })()
                  )}
                </div>
              </div>

              {/* Oppsummering */}
              <div className="bg-white rounded-xl border-l-4 border-l-[var(--green)] p-4 mb-6 text-left max-w-sm w-full shadow-sm">
                <p className="text-[10px] font-semibold uppercase tracking-wider mb-1 text-[var(--green)]">Oppsummering</p>
                <p className="text-sm leading-relaxed text-[var(--text)]">
                  {(() => {
                    const lastStep = steps[steps.length - 1];
                    if ('exp' in lastStep) return lastStep.exp;
                    return '';
                  })()}
                </p>
                <p className="text-xs text-[var(--stone)] mt-2">Du gikk gjennom {steps.length} steg.</p>
              </div>

              <button onClick={reset} className="px-8 py-3 rounded-xl text-white font-bold shadow-md bg-[var(--green)]">
                Ny oppgave {'\u2726'}
              </button>
              <button onClick={() => setSi(0)} className="mt-2 text-sm font-semibold text-[var(--stone)] hover:text-[var(--forest)] transition-colors">
                Se stegene p&aring; nytt
              </button>
            </div>
          ) : steps.length > 0 && !isErr ? (
            <div className="relative z-10 flex flex-col gap-5">
              {/* Paper */}
              <div className="bg-white rounded-xl border border-[rgba(42,64,54,0.06)] p-6 sm:p-10 shadow-sm overflow-auto max-h-[55vh]">
                <div className="font-mono text-2xl sm:text-4xl flex flex-col items-center w-full pt-8">

                  {/* ADD / SUB */}
                  {step && 't' in step && (step.t === 'add' || step.t === 'sub') && (
                    <div className="flex flex-col items-end relative max-w-xs mx-auto w-full">
                      <div className="absolute -top-8 right-0 flex flex-row-reverse" style={{ gap: '1ch' }}>
                        {step.t === 'add' && (step as AddStep).carries?.map((c, i) => (
                          <div key={i} className="w-[1ch] text-center text-sm transition-all" style={{
                            color: c.u ? 'var(--stone)' : 'var(--carry)',
                            fontWeight: c.u ? 400 : 700,
                            textDecoration: c.u ? 'line-through' : 'none'
                          }}>{c.v}</div>
                        ))}
                        {step.t === 'sub' && String(step.v1).split('').reverse().map((_, i) => {
                          const h = (step as SubStep).hist?.find(x => x.p === i);
                          return h ? <div key={i} className="w-[1ch] text-center text-sm font-bold text-red-600">{h.nv}</div> : <div key={i} className="w-[1ch]" />;
                        })}
                      </div>
                      <div className="tracking-[0.5ch] mr-[0.5ch] opacity-80">{step.v1}</div>
                      <div className="border-b-2 border-[var(--forest)] pb-2 mb-2 w-full text-right flex justify-end gap-4">
                        <span className="text-[var(--forest-light)]">{step.t === 'add' ? '+' : '\u2212'}</span>
                        <span className="tracking-[0.5ch] mr-[0.5ch] opacity-80">{step.v2}</span>
                      </div>
                      <div className="font-bold tracking-[0.5ch] mr-[0.5ch] text-[var(--forest)]">{step.res}</div>
                      {step.col !== undefined && (
                        <div className="absolute h-[140%] w-[1.5ch] -top-4 rounded pointer-events-none transition-all duration-300"
                          style={{ right: `${step.col * 1.5}ch`, background: 'rgba(42,64,54,0.07)' }} />
                      )}
                    </div>
                  )}

                  {/* MUL */}
                  {step && 't' in step && step.t === 'mul' && (() => {
                    const ms = step as MulStep;
                    return (
                      <div className="max-w-xs mx-auto w-full relative">
                        {ms.carries && ms.carries.length > 0 && (
                          <div className="flex justify-end pr-2 mb-1" style={{ gap: '0.3ch' }}>
                            {String(ms.v1).split('').map((_, idx) => {
                              const posFromRight = String(ms.v1).length - 1 - idx;
                              const carry = ms.carries.find(c => c.p === posFromRight + 1);
                              if (!carry) return <span key={idx} className="w-[1.5ch] text-center">&nbsp;</span>;
                              return (
                                <span key={idx} className="w-[1.5ch] text-center text-sm font-bold transition-all" style={{
                                  color: carry.u ? 'var(--stone)' : 'var(--carry)',
                                  textDecoration: carry.u ? 'line-through' : 'none',
                                  opacity: carry.u ? 0.5 : 1,
                                }}>{carry.v}</span>
                              );
                            })}
                          </div>
                        )}
                        <div className="flex justify-end gap-3 mb-2 pr-2">
                          <div className="flex">{String(ms.v1).split('').map((c, i) => (
                            <span key={i} className="w-[1.5ch] text-center" style={ms.ti === i ? { color: 'var(--forest)', fontWeight: 700, textDecoration: 'underline', textUnderlineOffset: '4px' } : { opacity: 0.8 }}>{c}</span>
                          ))}</div>
                        </div>
                        <div className="flex justify-end gap-3 pr-2 pb-2 border-b-2 border-[var(--forest)]">
                          <span className="text-[var(--forest-light)]">&times;</span>
                          <div className="flex">{String(ms.v2).split('').map((c, i) => (
                            <span key={i} className="w-[1.5ch] text-center" style={ms.bi === i ? { color: 'var(--forest)', fontWeight: 700, background: 'rgba(42,64,54,0.08)', borderRadius: 4 } : { opacity: 0.8 }}>{c}</span>
                          ))}</div>
                        </div>
                        <div className="space-y-1 text-right pr-2 mt-2">
                          {ms.parts?.map((p, i) => (
                            <div key={i} className="transition-all" style={{ color: p.cur ? 'var(--forest)' : 'var(--text-soft)', fontWeight: p.cur ? 700 : 400, opacity: p.cur ? 1 : 0.6 }}>
                              {p.v}{Array(p.s).fill(0).map((_, j) => <span key={j} style={{ opacity: 0.2 }}>0</span>)}
                            </div>
                          ))}
                        </div>
                        {ms.fin && ms.parts && ms.parts.length > 1 && (
                          <div className="mt-3 pt-3 border-t-4 border-double border-[var(--forest)] font-bold text-2xl sm:text-4xl text-right pr-2 text-[var(--forest)]">{ms.res}</div>
                        )}
                        {ms.fin && ms.parts && ms.parts.length === 1 && (
                          <div className="mt-3 pt-3 font-bold text-2xl sm:text-4xl text-right pr-2 text-[var(--forest)]">{ms.res}</div>
                        )}
                      </div>
                    );
                  })()}

                  {/* DIV */}
                  {step && 't' in step && step.t === 'div' && (() => {
                    const ds = step as DivStep;
                    return (
                      <div className="flex flex-col items-start w-full text-base sm:text-2xl">
                        <div className="flex gap-1.5 sm:gap-2 flex-wrap">
                          <span className="opacity-80">{n1}</span>
                          <span className="text-[var(--forest-light)]">:</span>
                          <span className="opacity-80">{n2}</span>
                          <span className="text-[var(--forest-light)]">=</span>
                          <span className="font-bold text-[var(--forest)]">{ds.cr}</span>
                        </div>
                        <div className="mt-3 sm:mt-4 space-y-1 w-full pb-8">
                          {ds.rows?.map((r, i) => (
                            <div key={i} className="border-l-2 border-[rgba(42,64,54,0.1)] py-1" style={{ paddingLeft: `${Math.min(i * 1.5 + 0.75, 6)}ch` }}>
                              <div className="text-red-600 opacity-70">&minus;{r.sub}</div>
                              <div className="h-px w-12 sm:w-16 my-1 bg-[rgba(42,64,54,0.15)]" />
                              <div style={{ color: r.dec ? 'var(--ocean-muted)' : 'var(--text)' }}>{r.nv}</div>
                            </div>
                          ))}
                          <div ref={endRef} />
                        </div>
                      </div>
                    );
                  })()}

                  {/* FRACTION */}
                  {step && 'vt' in step && (
                    <div className="flex items-center gap-6 sm:gap-12 flex-wrap justify-center">
                      {step.vt === 'compare' && step.l && step.r && <>
                        <FractionPie num={step.l.n} den={step.l.d} />
                        <div className="font-bold text-2xl text-[var(--forest-light)]">vs</div>
                        <FractionPie num={step.r.n} den={step.r.d} />
                      </>}
                      {step.vt === 'expanded' && step.l && step.r && <>
                        <FractionPie num={step.l.n} den={step.l.d} active />
                        <div className="font-bold text-3xl text-[var(--forest)]">{step.op}</div>
                        <FractionPie num={step.r.n} den={step.r.d} active />
                      </>}
                      {step.vt === 'result' && step.res && (
                        <div className="flex flex-col items-center">
                          <div className="text-xs uppercase font-bold mb-2 text-[var(--stone)]">Resultat</div>
                          <FractionPie num={step.res.n} den={step.res.d} active />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Explanation */}
              <div className="p-4 sm:p-5 rounded-xl border-l-4 border-l-[var(--forest)] bg-white shadow-sm">
                <div className="flex gap-3 items-start">
                  <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-xs font-bold text-white bg-[var(--forest)]">{si + 1}</div>
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wider mb-1 text-[var(--forest-light)]">Veiledning</p>
                    <p className="text-base leading-relaxed font-medium text-[var(--text)]">{step && 'exp' in step ? step.exp : ''}</p>
                  </div>
                </div>
              </div>

              {/* Nav */}
              <div className="flex justify-between gap-3">
                <button disabled={si <= 0} onClick={() => setSi(si - 1)}
                  className="px-4 sm:px-5 py-2.5 rounded-xl border border-[rgba(42,64,54,0.1)] font-semibold text-sm sm:text-base text-[var(--text-soft)] bg-white disabled:opacity-30">
                  &larr; Forrige
                </button>
                {si === steps.length - 1 ? (
                  <button onClick={() => setSi(steps.length)} className="px-5 sm:px-6 py-2.5 rounded-xl text-white font-bold text-sm sm:text-base shadow-md bg-[var(--forest)]">
                    Se svar &rarr;
                  </button>
                ) : (
                  <button onClick={() => setSi(si + 1)} className="px-5 sm:px-6 py-2.5 rounded-xl text-white font-bold text-sm sm:text-base shadow-md bg-[var(--forest)]">
                    Neste &rarr;
                  </button>
                )}
              </div>
            </div>
          ) : isErr ? (
            <div className="relative z-10 text-center py-12">
              <div className="text-4xl mb-3">{'\u26A0\uFE0F'}</div>
              <p className="font-semibold text-red-600">{step && 'exp' in step ? step.exp : ''}</p>
            </div>
          ) : (
            <div className="relative z-10 flex flex-col items-center py-20 text-center">
              <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4 border border-[rgba(42,64,54,0.06)] bg-white">
                <span className="text-2xl">{'\u{1F4D0}'}</span>
              </div>
              <h3 className="text-lg font-bold mb-1 text-[var(--forest)] font-serif">Klar for l&aelig;ring?</h3>
              <p className="text-sm text-[var(--text-soft)]">Skriv inn to tall og trykk Beregn.</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

// ══════════════════════════════════════
//  MAIN PAGE
// ══════════════════════════════════════

export default function MattePage() {
  const [tab, setTab] = useState<'oppstilling' | 'gangetest'>('oppstilling');

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(180deg, var(--mist), var(--sand))' }}>
      <div className="max-w-3xl mx-auto px-4 py-6">

        {/* Header */}
        <div className="rounded-2xl overflow-hidden shadow-xl mb-6" style={{ background: 'linear-gradient(135deg, var(--forest), var(--forest-dark))' }}>
          <div className="px-5 py-4 flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <Link href="/skole" className="flex items-center gap-1 opacity-80 hover:opacity-100 transition-opacity" aria-label="Tilbake til Pratiro Skole">
                <div className="w-1 h-[18px] bg-white/70 rounded-[1px]" />
                <div className="w-1 h-[18px] bg-white/70 rounded-[1px]" />
              </Link>
              <div>
                <Link href="/skole" className="text-white text-[10px] font-semibold uppercase tracking-widest opacity-60 hover:opacity-80 transition-opacity no-underline block">
                  Pratiro Skole
                </Link>
                <h1 className="text-white text-xl font-bold font-serif">
                  {tab === 'oppstilling' ? 'MatteMester' : 'Gangetest'}
                </h1>
              </div>
            </div>
            <div className="flex gap-1 p-1 rounded-xl bg-white/10">
              {([['oppstilling', 'Oppstilling'], ['gangetest', 'Gangetest']] as const).map(([k, l]) => (
                <button key={k} onClick={() => setTab(k)}
                  className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${tab === k ? 'bg-white shadow-sm text-[var(--forest)]' : 'text-white/70 hover:text-white'}`}>
                  {l}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Content */}
        {tab === 'oppstilling' && <MatteMester />}
        {tab === 'gangetest' && (
          <div className="bg-white rounded-2xl border border-black/[0.05] shadow-[0_10px_30px_-5px_rgba(42,64,54,0.06)]">
            <GangeTest />
          </div>
        )}

        {/* Footer */}
        <div className="text-center mt-8 pb-6">
          <div className="flex items-center justify-center gap-2 mb-2">
            <div className="flex gap-1">
              <div className="w-1 h-4 bg-[var(--forest-light)] rounded-[1px]" />
              <div className="w-1 h-4 bg-[var(--forest-light)] rounded-[1px]" />
            </div>
            <span className="text-sm font-semibold text-[var(--forest-light)] font-serif">Pratiro Skole</span>
          </div>
          <p className="text-xs text-[var(--stone)]">pratiro.no/skole/matte &middot; &copy; 2026</p>
        </div>
      </div>
    </div>
  );
}
