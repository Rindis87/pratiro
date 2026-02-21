'use client';

import { useState, useRef, useCallback } from 'react';
import Link from 'next/link';
import { chatWithGemini, chatWithGeminiImage } from '@/app/actions';

// ── Design tokens (Nordic Calm v4.1) ──
const C = {
  forest: '#2A4036', fl: '#4A6359', fd: '#1F3029',
  sage: '#E7ECEA', sand: '#F7F5F0', mist: '#FDFCFB',
  ocean: '#5B7A8C', text: '#252825', ts: '#5C5F5C',
  stone: '#7D786D', white: '#FFFFFF', green: '#2A6B45',
  greenSoft: '#3A8B5B', red: '#B04040', carry: '#C4651A',
};

// ── Typer ──
type WordPair = { original: string; translation: string };

type Phase = 'setup' | 'edit' | 'game' | 'result';

type FlashcardItem = WordPair & { status: 'unseen' | 'correct' | 'retry' };

// ── Tilgjengelige språk ──
const LANGUAGES = ['Norsk', 'Engelsk', 'Spansk', 'Tysk', 'Fransk'];

// ── Klient-ID for rate limiting ──
function getClientId(): string {
  if (typeof window === 'undefined') return 'server';
  let id = sessionStorage.getItem('pratiro_client_id');
  if (!id) {
    id = crypto.randomUUID();
    sessionStorage.setItem('pratiro_client_id', id);
  }
  return id;
}

export default function GloserPage() {
  const [phase, setPhase] = useState<Phase>('setup');
  const [srcLang, setSrcLang] = useState('Norsk');
  const [targetLang, setTargetLang] = useState('Engelsk');
  const [inputMode, setInputMode] = useState<'text' | 'image'>('text');
  const [textInput, setTextInput] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageData, setImageData] = useState<{ base64: string; mimeType: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [words, setWords] = useState<WordPair[]>([]);

  // Flashcard state
  const [deck, setDeck] = useState<FlashcardItem[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [firstTryCorrect, setFirstTryCorrect] = useState(0);
  const [totalCards, setTotalCards] = useState(0);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Bildekomprimering ──
  const compressImage = useCallback((file: File, maxWidth = 1600): Promise<{ base64: string; mimeType: string; dataUrl: string }> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let w = img.width;
        let h = img.height;
        if (w > maxWidth) {
          h = Math.round(h * (maxWidth / w));
          w = maxWidth;
        }
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (!ctx) { reject(new Error('Canvas not supported')); return; }
        ctx.drawImage(img, 0, 0, w, h);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
        const base64 = dataUrl.split(',')[1];
        resolve({ base64, mimeType: 'image/jpeg', dataUrl });
      };
      img.onerror = () => reject(new Error('Kunne ikke lese bildet'));
      img.src = URL.createObjectURL(file);
    });
  }, []);

  // ── Bilde-håndtering ──
  const handleImageSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      setError('Bildet er for stort (maks 10 MB). Prøv et mindre bilde.');
      return;
    }

    try {
      const compressed = await compressImage(file);
      setImagePreview(compressed.dataUrl);
      setImageData({ base64: compressed.base64, mimeType: compressed.mimeType });
      setError(null);
    } catch {
      setError('Kunne ikke lese bildet. Prøv et annet bilde.');
    }
  }, [compressImage]);

  const clearImage = useCallback(() => {
    setImagePreview(null);
    setImageData(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, []);

  // ── Send til AI ──
  const handleSubmit = useCallback(async () => {
    if (srcLang === targetLang) {
      setError('Velg to forskjellige språk.');
      return;
    }

    setLoading(true);
    setError(null);

    const clientId = getClientId();
    const systemPrompt = `Du er en språklærer-assistent. Returner KUN gyldig JSON uten markdown-formatering.`;

    try {
      let result;

      if (inputMode === 'image' && imageData) {
        const prompt = `Dette er et bilde av en gloseliste. Gjenkjenn alle ordene og oversett dem fra ${srcLang} til ${targetLang}. Returner som JSON: {"words": [{"original": "ord på ${srcLang}", "translation": "ord på ${targetLang}"}]}. Returner KUN JSON, ingen annen tekst.`;
        result = await chatWithGeminiImage(prompt, imageData.base64, imageData.mimeType, clientId);
      } else if (inputMode === 'text' && textInput.trim()) {
        const prompt = `Oversett følgende gloser/ordliste fra ${srcLang} til ${targetLang}. Hvis teksten allerede inneholder ordpar (f.eks. "dog - hund"), behold dem. Hvis det er enkeltord, oversett dem. Returner som JSON: {"words": [{"original": "ord på ${srcLang}", "translation": "ord på ${targetLang}"}]}. Returner KUN JSON, ingen annen tekst.\n\nTekst:\n${textInput}`;
        result = await chatWithGemini(prompt, systemPrompt, clientId);
      } else {
        setError('Skriv inn gloser eller last opp et bilde.');
        setLoading(false);
        return;
      }

      if (result.error) {
        if (result.errorCode === 'NO_RESPONSE') {
          setError('Bildet kunne ikke behandles. Last opp et bilde av en gloseliste.');
        } else {
          setError(result.error);
        }
        setLoading(false);
        return;
      }

      const text = result.text || '';
      // Strip markdown code fences and find JSON object
      let clean = text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
      // If there's extra text around the JSON, extract just the JSON object
      const jsonMatch = clean.match(/\{[\s\S]*\}/);
      if (jsonMatch) clean = jsonMatch[0];
      const parsed = JSON.parse(clean);
      const wordList: WordPair[] = parsed.words || parsed.items || [];

      if (wordList.length === 0) {
        setError('Fant ingen gloser. Prøv igjen med tydeligere tekst eller bilde.');
        setLoading(false);
        return;
      }

      setWords(wordList);
      setPhase('edit');

      if (imageData) {
        setImageData(null);
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Ukjent feil';
      setError('Kunne ikke tolke AI-svaret. Prøv igjen. (' + msg + ')');
    }

    setLoading(false);
  }, [inputMode, imageData, textInput, srcLang, targetLang]);

  // ── Start flashcard-spill ──
  const startGame = useCallback(() => {
    const shuffled = [...words]
      .sort(() => Math.random() - 0.5)
      .map(w => ({ ...w, status: 'unseen' as const }));
    setDeck(shuffled);
    setCurrentIdx(0);
    setFlipped(false);
    setFirstTryCorrect(0);
    setTotalCards(words.length);
    setPhase('game');
  }, [words]);

  // ── Flashcard: Kunne den / Øv mer ──
  const handleCardAnswer = useCallback((knew: boolean) => {
    const current = deck[currentIdx];
    const isFirstAttempt = current.status === 'unseen';

    if (knew) {
      if (isFirstAttempt) setFirstTryCorrect(prev => prev + 1);
      const newDeck = deck.filter((_, i) => i !== currentIdx);
      if (newDeck.length === 0) {
        setPhase('result');
        return;
      }
      const nextIdx = currentIdx >= newDeck.length ? 0 : currentIdx;
      setDeck(newDeck);
      setCurrentIdx(nextIdx);
    } else {
      const newDeck = [...deck];
      const card = { ...newDeck.splice(currentIdx, 1)[0], status: 'retry' as const };
      newDeck.push(card);
      const nextIdx = currentIdx >= newDeck.length ? 0 : currentIdx;
      setDeck(newDeck);
      setCurrentIdx(nextIdx);
    }
    setFlipped(false);
  }, [deck, currentIdx]);

  // ── Tilbake til start ──
  const resetAll = useCallback(() => {
    setPhase('setup');
    setWords([]);
    setTextInput('');
    clearImage();
    setError(null);
  }, [clearImage]);

  // ── Oppdater glose i editor ──
  const updateWord = useCallback((index: number, field: 'original' | 'translation', value: string) => {
    setWords(prev => prev.map((w, i) => i === index ? { ...w, [field]: value } : w));
  }, []);

  const removeWord = useCallback((index: number) => {
    setWords(prev => prev.filter((_, i) => i !== index));
  }, []);

  // ══════════════════════════════════════
  //  RENDER
  // ══════════════════════════════════════

  return (
    <div className="min-h-screen" style={{ background: `linear-gradient(180deg, ${C.mist}, ${C.sand})` }}>

      {/* ── Header ── */}
      <div className="rounded-b-2xl overflow-hidden shadow-xl" style={{ background: `linear-gradient(135deg, ${C.forest}, ${C.fd})` }}>
        <div className="max-w-3xl mx-auto px-5 py-4 flex items-center justify-between flex-wrap gap-3">
          <Link href="/skole" className="flex items-center gap-3 no-underline group" aria-label="Tilbake til Pratiro Skole">
            <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
              <div style={{ width: 4, height: 18, background: 'rgba(255,255,255,0.7)', borderRadius: 1 }} />
              <div style={{ width: 4, height: 18, background: 'rgba(255,255,255,0.7)', borderRadius: 1 }} />
            </div>
            <h1 className="text-white text-xl font-bold font-serif leading-tight">Gloser</h1>
          </Link>
        </div>
        <div className="max-w-3xl mx-auto px-5 pb-1.5">
          <span className="text-white/40 text-[10px] font-semibold uppercase tracking-widest">Pratiro Skole</span>
        </div>
      </div>

      <div className="max-w-xl mx-auto px-4 py-6">

        {/* ════════════════════════════════════ */}
        {/*  SETUP                              */}
        {/* ════════════════════════════════════ */}
        {phase === 'setup' && (
          <div className="space-y-5">

            {/* Språkvalg – to kolonner */}
            <div className="bg-white rounded-2xl border border-black/5 shadow-sm p-5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-semibold uppercase tracking-wider mb-2" style={{ color: C.fl }}>
                    Fra
                  </label>
                  <select
                    value={srcLang}
                    onChange={e => setSrcLang(e.target.value)}
                    className="w-full p-3 border rounded-xl font-semibold text-base cursor-pointer"
                    style={{ borderColor: 'rgba(42,64,54,0.12)', background: C.sand, color: C.forest }}
                  >
                    {LANGUAGES.map(lang => (
                      <option key={lang} value={lang}>{lang}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-semibold uppercase tracking-wider mb-2" style={{ color: C.greenSoft }}>
                    Til
                  </label>
                  <select
                    value={targetLang}
                    onChange={e => setTargetLang(e.target.value)}
                    className="w-full p-3 border rounded-xl font-semibold text-base cursor-pointer"
                    style={{ borderColor: 'rgba(42,64,54,0.12)', background: C.sand, color: C.forest }}
                  >
                    {LANGUAGES.filter(l => l !== srcLang).map(lang => (
                      <option key={lang} value={lang}>{lang}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Input-modus toggle */}
            <div className="bg-white rounded-2xl border border-black/5 shadow-sm p-5">
              <div className="flex justify-center mb-4">
                <div className="inline-flex p-1 rounded-lg" style={{ background: C.sand, border: '1px solid rgba(42,64,54,0.06)' }}>
                  {(['text', 'image'] as const).map(m => (
                    <button
                      key={m}
                      onClick={() => setInputMode(m)}
                      className="px-4 py-2 rounded-md text-xs font-semibold transition-all"
                      style={inputMode === m
                        ? { background: C.white, color: C.forest, boxShadow: '0 2px 8px rgba(42,64,54,0.08)' }
                        : { color: C.stone }}
                    >
                      {m === 'text' ? 'Skriv / Lim inn' : 'Bilde'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tekst-input */}
              {inputMode === 'text' && (
                <>
                  <label className="block text-[10px] font-semibold uppercase tracking-wider mb-2" style={{ color: C.fl }}>
                    Skriv inn eller lim inn gloser
                  </label>
                  <textarea
                    value={textInput}
                    onChange={e => setTextInput(e.target.value)}
                    rows={8}
                    className="w-full p-4 border rounded-xl outline-none text-sm leading-relaxed resize-none"
                    style={{ borderColor: 'rgba(42,64,54,0.12)', background: C.sand }}
                    placeholder={`F.eks:\ndog - hund\ncat - katt\nhouse - hus\n\nEller bare skriv ordene:\ndog\ncat\nhouse`}
                  />
                </>
              )}

              {/* Bilde-input */}
              {inputMode === 'image' && (
                <div className="space-y-3">
                  <p className="text-xs leading-relaxed p-3 rounded-lg" style={{ background: 'rgba(91,122,140,0.06)', color: C.ts }}>
                    Ta bilde av gloselisten din. Bildet sendes til en AI-tjeneste for tekstgjenkjenning og slettes umiddelbart. Ikke last opp bilder med personlig informasjon.
                  </p>

                  {imagePreview ? (
                    <div className="relative">
                      <img
                        src={imagePreview}
                        alt="Forhåndsvisning av gloseliste"
                        className="w-full rounded-xl border"
                        style={{ borderColor: 'rgba(42,64,54,0.1)', maxHeight: 300, objectFit: 'contain', background: C.sand }}
                      />
                      <button
                        onClick={clearImage}
                        className="absolute top-2 right-2 w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold shadow-md"
                        style={{ background: 'rgba(0,0,0,0.5)' }}
                        aria-label="Fjern bilde"
                      >
                        &times;
                      </button>
                    </div>
                  ) : (
                    <label className="block cursor-pointer">
                      <div
                        className="border-2 border-dashed rounded-xl p-10 text-center transition-all hover:border-[rgba(42,64,54,0.3)]"
                        style={{ borderColor: 'rgba(42,64,54,0.15)' }}
                      >
                        <div className="text-3xl mb-2">📸</div>
                        <p className="font-semibold text-sm" style={{ color: C.forest }}>Ta bilde eller velg fra album</p>
                        <p className="text-xs mt-1" style={{ color: C.stone }}>JPG, PNG – maks 5 MB</p>
                      </div>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        capture="environment"
                        onChange={handleImageSelect}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
              )}

              {/* Personvern-linje + Send-knapp */}
              <p className="text-[11px] text-center mt-3 mb-3" style={{ color: C.stone }}>
                {inputMode === 'text' ? 'Teksten' : 'Bildet'} sendes til en AI-tjeneste for oversettelse. Ingen data lagres.
              </p>

              {error && (
                <div className="p-3 rounded-xl text-sm font-medium mb-3" style={{ background: 'rgba(176,64,64,0.08)', color: C.red }}>
                  {error}
                </div>
              )}

              <button
                onClick={handleSubmit}
                disabled={loading || (inputMode === 'text' ? !textInput.trim() : !imageData)}
                className="w-full py-3.5 rounded-xl font-bold text-white text-base shadow-md disabled:opacity-40 flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
                style={{ background: C.forest }}
              >
                {loading ? (
                  <>
                    <span className="inline-block w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Oversetter...
                  </>
                ) : (
                  'Oversett med AI'
                )}
              </button>
            </div>
          </div>
        )}

        {/* ════════════════════════════════════ */}
        {/*  EDIT – To-kolonne øveark             */}
        {/* ════════════════════════════════════ */}
        {phase === 'edit' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-bold text-lg" style={{ color: C.forest }}>Øveark</h2>
                <p className="text-xs" style={{ color: C.ts }}>{words.length} gloser – {srcLang} → {targetLang}</p>
              </div>
              <button onClick={resetAll} className="text-xs font-semibold px-3 py-1.5 rounded-full transition-colors" style={{ background: 'rgba(176,64,64,0.08)', color: C.red }}>
                ↺ Start på nytt
              </button>
            </div>

            {/* Kolonneoverskrifter */}
            <div className="grid grid-cols-[1fr_1fr_28px] gap-2 px-1">
              <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: C.fl }}>{srcLang}</span>
              <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: C.greenSoft }}>{targetLang}</span>
              <span />
            </div>

            <div className="space-y-1.5 max-h-[55vh] overflow-y-auto pr-1">
              {words.map((word, i) => (
                <div key={i} className="grid grid-cols-[1fr_1fr_28px] gap-2 items-center">
                  <input
                    value={word.original}
                    onChange={e => updateWord(i, 'original', e.target.value)}
                    className="w-full px-2.5 py-2.5 border rounded-lg text-xs sm:text-sm font-semibold outline-none"
                    style={{ borderColor: 'rgba(42,64,54,0.08)', background: C.white, color: C.forest }}
                  />
                  <input
                    value={word.translation}
                    onChange={e => updateWord(i, 'translation', e.target.value)}
                    className="w-full px-2.5 py-2.5 border rounded-lg text-xs sm:text-sm outline-none"
                    style={{ borderColor: 'rgba(42,64,54,0.08)', background: C.white, color: C.ts }}
                  />
                  <button
                    onClick={() => removeWord(i)}
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-xs transition-colors hover:bg-red-50"
                    style={{ color: C.stone }}
                    aria-label="Fjern glose"
                  >
                    &times;
                  </button>
                </div>
              ))}
            </div>

            <button
              onClick={startGame}
              disabled={words.length === 0}
              className="w-full py-3.5 rounded-xl font-bold text-white text-base shadow-md disabled:opacity-40 flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
              style={{ background: C.forest }}
            >
              Start flashcards ({words.length} kort)
            </button>
          </div>
        )}

        {/* ════════════════════════════════════ */}
        {/*  GAME – Flashcards                   */}
        {/* ════════════════════════════════════ */}
        {phase === 'game' && deck.length > 0 && (
          <div className="space-y-4">
            {/* Progresjon */}
            <div className="flex justify-between text-xs font-semibold uppercase tracking-wider" style={{ color: C.stone }}>
              <span>Kort {totalCards - deck.length + 1} / {totalCards}</span>
              <button onClick={() => setPhase('edit')} className="hover:underline" style={{ color: C.fl }}>Avslutt</button>
            </div>
            <div className="h-2 rounded-full overflow-hidden" style={{ background: C.sage }}>
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${((totalCards - deck.length) / totalCards) * 100}%`,
                  background: `linear-gradient(90deg, ${C.forest}, ${C.ocean})`
                }}
              />
            </div>

            {/* Flashcard med 3D flip */}
            <div
              className="relative w-full cursor-pointer"
              style={{ perspective: 1000, minHeight: 280 }}
              onClick={() => setFlipped(!flipped)}
            >
              <div
                className="relative w-full transition-transform duration-500"
                style={{
                  transformStyle: 'preserve-3d',
                  transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
                  minHeight: 280,
                }}
              >
                {/* Front */}
                <div
                  className="absolute inset-0 rounded-3xl p-8 flex flex-col items-center justify-center text-center shadow-xl border border-black/5"
                  style={{ background: C.white, backfaceVisibility: 'hidden' }}
                >
                  <span className="absolute top-5 left-5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider" style={{ background: C.sage, color: C.forest }}>
                    {srcLang}
                  </span>
                  <h2 className="text-2xl sm:text-3xl font-bold" style={{ color: C.text }}>
                    {deck[currentIdx]?.original}
                  </h2>
                  <p className="absolute bottom-5 text-xs font-semibold uppercase tracking-wider" style={{ color: C.stone }}>
                    Trykk for å snu
                  </p>
                </div>

                {/* Back */}
                <div
                  className="absolute inset-0 rounded-3xl p-8 flex flex-col items-center justify-center text-center shadow-xl"
                  style={{
                    background: C.forest,
                    backfaceVisibility: 'hidden',
                    transform: 'rotateY(180deg)',
                  }}
                >
                  <span className="absolute top-5 left-5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider" style={{ background: 'rgba(255,255,255,0.15)', color: 'white' }}>
                    {targetLang}
                  </span>
                  <h2 className="text-2xl sm:text-3xl font-bold text-white">
                    {deck[currentIdx]?.translation}
                  </h2>
                </div>
              </div>
            </div>

            {/* Knapper */}
            {!flipped ? (
              <button
                onClick={(e) => { e.stopPropagation(); setFlipped(true); }}
                className="w-full py-3 rounded-xl font-bold text-white shadow-md transition-all active:scale-[0.98]"
                style={{ background: C.forest }}
              >
                Se svaret
              </button>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={(e) => { e.stopPropagation(); handleCardAnswer(false); }}
                  className="py-3.5 rounded-xl font-bold text-white shadow-md flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
                  style={{ background: C.carry }}
                >
                  ↻ Øv mer
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); handleCardAnswer(true); }}
                  className="py-3.5 rounded-xl font-bold text-white shadow-md flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
                  style={{ background: C.green }}
                >
                  ✓ Kunne den
                </button>
              </div>
            )}

            {deck.length > 1 && (
              <p className="text-center text-xs" style={{ color: C.stone }}>
                {deck.length} kort igjen i bunken
              </p>
            )}
          </div>
        )}

        {/* ════════════════════════════════════ */}
        {/*  RESULT                              */}
        {/* ════════════════════════════════════ */}
        {phase === 'result' && (
          <div className="text-center py-8">
            <div className="text-5xl mb-4">🏆</div>
            <h2 className="text-3xl font-bold mb-2 font-serif" style={{ color: C.forest }}>Bra jobba!</h2>
            <p className="mb-8" style={{ color: C.ts }}>Du har gått gjennom alle {totalCards} glosene.</p>

            <div className="grid grid-cols-2 gap-4 max-w-xs mx-auto mb-8">
              <div className="p-5 rounded-2xl border bg-white" style={{ borderColor: 'rgba(42,64,54,0.06)' }}>
                <div className="text-4xl font-bold mb-1" style={{ color: C.green }}>{firstTryCorrect}</div>
                <div className="text-[10px] font-bold uppercase tracking-wider" style={{ color: C.stone }}>Riktige på 1. forsøk</div>
              </div>
              <div className="p-5 rounded-2xl border bg-white" style={{ borderColor: 'rgba(42,64,54,0.06)' }}>
                <div className="text-4xl font-bold mb-1" style={{ color: C.forest }}>{totalCards}</div>
                <div className="text-[10px] font-bold uppercase tracking-wider" style={{ color: C.stone }}>Totalt antall kort</div>
              </div>
            </div>

            <div className="space-y-3 max-w-xs mx-auto">
              <button
                onClick={startGame}
                className="w-full py-3 rounded-xl font-bold text-white shadow-md transition-all active:scale-[0.98]"
                style={{ background: C.forest }}
              >
                ↻ Øv på nytt
              </button>
              <button
                onClick={resetAll}
                className="w-full py-3 rounded-xl font-semibold transition-colors"
                style={{ color: C.stone }}
              >
                Nye gloser
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Footer ── */}
      <div className="text-center mt-8 pb-6">
        <div className="flex items-center justify-center gap-2 mb-2">
          <div className="flex gap-1">
            <div style={{ width: 4, height: 16, background: C.fl, borderRadius: 1 }} />
            <div style={{ width: 4, height: 16, background: C.fl, borderRadius: 1 }} />
          </div>
          <span className="text-sm font-semibold font-serif" style={{ color: C.fl }}>Pratiro Skole</span>
        </div>
        <p className="text-xs" style={{ color: C.stone }}>pratiro.no/skole · © 2026</p>
      </div>
    </div>
  );
}
