'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
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
type QAPair = { question: string; answer: string };
type FlashItem = QAPair & { status: 'unseen' | 'correct' | 'retry' };
type MCItem = QAPair & { options: string[]; correctIdx: number };
type WrittenResult = {
  qa: QAPair;
  userAnswer: string;
  status: 'correct' | 'partial' | 'wrong';
  feedback: string;
};
type ChatMessage = { role: 'sensor' | 'elev'; content: string };
type AILevel = 'lett' | 'middels' | 'vanskelig';
type AIGrade = { grade: string; summary: string; improvements: string };
type Phase =
  | 'setup' | 'edit' | 'modeSelect'
  | 'flashcard' | 'flashResult'
  | 'multiple' | 'multipleResult'
  | 'written' | 'writtenResult'
  | 'aiLevel' | 'aiChat' | 'aiResult';
type InputMode = 'text' | 'image' | 'file';

const STORAGE_KEY = 'pratiro_prove_session';

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

function shuffleArr<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5);
}

function buildSensorPrompt(level: AILevel, pairList: QAPair[]): string {
  const levelDesc =
    level === 'lett'
      ? 'Lett – gi hint ved feil, aksepter delvis riktige svar, bruk oppmuntrende tone'
      : level === 'middels'
      ? 'Middels – forvent presise svar, still oppfølgingsspørsmål ved ufullstendige svar'
      : 'Vanskelig – krev presise fagbegreper, still kritiske oppfølgingsspørsmål, simuler reell eksamen';

  return `Du er en vennlig men faglig streng sensor som tester en elev muntlig.
Du har disse spørsmålene og fasitsvarene:
${pairList.map((p, i) => `${i + 1}. Spørsmål: ${p.question}\n   Fasit: ${p.answer}`).join('\n')}

Nivå: ${levelDesc}

Regler:
- Still ETT spørsmål om gangen fra listen
- Vent på elevens svar før du går videre
- Vurder svaret kort (1-2 setninger): riktig, delvis riktig eller feil
- Ved delvis riktig: gi et kort hint (nivå-avhengig) og la eleven prøve igjen ELLER gå videre
- Ved feil: vis riktig svar kort og gå videre til neste
- Vær oppmuntrende men ærlig
- Bruk aldri mer enn 3 setninger per melding
- Hold oversikt over hvilke spørsmål som er stilt
- Begynn alltid med å ønske eleven velkommen og still første spørsmål umiddelbart
- Når alle ${pairList.length} spørsmål er stilt: si eksakt "Det var siste spørsmål! Trykk Avslutt for å se resultatet ditt."`;
}

function gradeColor(g: string): string {
  if (['A', 'B'].includes(g)) return C.green;
  if (['C', 'D'].includes(g)) return C.carry;
  if (g === 'E') return '#B8860B';
  return C.red;
}

function CharCount({ len, max }: { len: number; max: number }) {
  const pct = len / max;
  const color = pct >= 0.95 ? C.red : pct >= 0.8 ? C.carry : C.stone;
  return <p className="text-[11px] text-right mt-1" style={{ color }}>{len} / {max} tegn</p>;
}

export default function ProvePage() {
  // ── Basis-state ──
  const [phase, setPhase] = useState<Phase>('setup');
  const [inputMode, setInputMode] = useState<InputMode>('text');
  const [textInput, setTextInput] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [mediaData, setMediaData] = useState<{ base64: string; mimeType: string } | null>(null);
  const [pdfName, setPdfName] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pairs, setPairs] = useState<QAPair[]>([]);
  const [showResume, setShowResume] = useState(false);

  // ── Flashcard state ──
  const [deck, setDeck] = useState<FlashItem[]>([]);
  const [flashIdx, setFlashIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [flashFirstCorrect, setFlashFirstCorrect] = useState(0);
  const [flashTotal, setFlashTotal] = useState(0);

  // ── Flervalg state ──
  const [mcItems, setMcItems] = useState<MCItem[]>([]);
  const [mcIdx, setMcIdx] = useState(0);
  const [mcSelected, setMcSelected] = useState<number | null>(null);
  const [mcAnswers, setMcAnswers] = useState<{ correct: boolean; qa: QAPair }[]>([]);
  const [distractorsCache, setDistractorsCache] = useState<string[][] | null>(null);
  const [loadingDistractors, setLoadingDistractors] = useState(false);

  // ── Skriftlig state ──
  const [writtenItems, setWrittenItems] = useState<QAPair[]>([]);
  const [writtenIdx, setWrittenIdx] = useState(0);
  const [writtenInput, setWrittenInput] = useState('');
  const [writtenResults, setWrittenResults] = useState<WrittenResult[]>([]);
  const [writtenFeedback, setWrittenFeedback] = useState<WrittenResult | null>(null);
  const [loadingFeedback, setLoadingFeedback] = useState(false);

  // ── AI Chat state ──
  const [aiLevel, setAiLevel] = useState<AILevel>('middels');
  const [aiMessages, setAiMessages] = useState<ChatMessage[]>([]);
  const [aiInput, setAiInput] = useState('');
  const [aiSending, setAiSending] = useState(false);
  const [aiGrade, setAiGrade] = useState<AIGrade | null>(null);
  const [aiGrading, setAiGrading] = useState(false);

  const cameraInputRef = useRef<HTMLInputElement>(null);
  const albumInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const writtenInputRef = useRef<HTMLTextAreaElement>(null);
  const aiChatEndRef = useRef<HTMLDivElement>(null);
  const aiInputRef = useRef<HTMLInputElement>(null);

  // ── Sjekk lagret økt ──
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const data = JSON.parse(saved);
        if (data.pairs && data.pairs.length > 0) setShowResume(true);
      }
    } catch { /* ignore */ }
  }, []);

  const loadSession = useCallback(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (!saved) return;
      const data = JSON.parse(saved);
      setPairs(data.pairs || []);
      if (data.distractors) setDistractorsCache(data.distractors);
      setPhase('edit');
    } catch { /* ignore */ }
  }, []);

  const saveSession = useCallback((p: QAPair[], distractors?: string[][]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        pairs: p, distractors: distractors ?? null, savedAt: Date.now(),
      }));
    } catch { /* ignore */ }
  }, []);

  // ── Bildekomprimering ──
  const compressImage = useCallback((file: File, maxWidth = 1600): Promise<{ base64: string; mimeType: string; dataUrl: string }> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let w = img.width, h = img.height;
        if (w > maxWidth) { h = Math.round(h * (maxWidth / w)); w = maxWidth; }
        canvas.width = w; canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (!ctx) { reject(new Error('Canvas not supported')); return; }
        ctx.drawImage(img, 0, 0, w, h);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
        resolve({ base64: dataUrl.split(',')[1], mimeType: 'image/jpeg', dataUrl });
      };
      img.onerror = () => reject(new Error('Kunne ikke lese bildet'));
      img.src = URL.createObjectURL(file);
    });
  }, []);

  const handleImageSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) { setError('Bildet er for stort (maks 10 MB).'); return; }
    try {
      const compressed = await compressImage(file);
      setImagePreview(compressed.dataUrl);
      setMediaData({ base64: compressed.base64, mimeType: compressed.mimeType });
      setPdfName(null);
      setError(null);
    } catch { setError('Kunne ikke lese bildet. Prøv et annet.'); }
  }, [compressImage]);

  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) { setError('Filen er for stor (maks 10 MB).'); return; }
    if (file.type.startsWith('image/')) {
      try {
        const compressed = await compressImage(file);
        setImagePreview(compressed.dataUrl);
        setMediaData({ base64: compressed.base64, mimeType: compressed.mimeType });
        setPdfName(null);
        setError(null);
      } catch { setError('Kunne ikke lese bildet.'); }
    } else if (file.type === 'application/pdf') {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const result = ev.target?.result as string;
        setMediaData({ base64: result.split(',')[1], mimeType: 'application/pdf' });
        setImagePreview(null);
        setPdfName(file.name);
        setError(null);
      };
      reader.onerror = () => setError('Kunne ikke lese PDF-filen.');
      reader.readAsDataURL(file);
    }
  }, [compressImage]);

  const clearMedia = useCallback(() => {
    setImagePreview(null);
    setMediaData(null);
    setPdfName(null);
    if (cameraInputRef.current) cameraInputRef.current.value = '';
    if (albumInputRef.current) albumInputRef.current.value = '';
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, []);

  // ── Send til AI ──
  const handleSubmit = useCallback(async () => {
    setLoading(true);
    setError(null);
    const clientId = getClientId();
    const systemPrompt = `Du er en læringsassistent. Returner KUN gyldig JSON uten markdown-formatering.`;

    try {
      let result;
      if ((inputMode === 'image' || inputMode === 'file') && mediaData) {
        const prompt = `Dette er et bilde/dokument med prøvespørsmål eller pensum. Finn alle spørsmål og generer presise, faktabaserte svar. Returner som JSON: {"pairs": [{"question": "spørsmål", "answer": "kort presist svar"}]}. Maks 2-3 setninger per svar. Returner KUN JSON.`;
        result = await chatWithGeminiImage(prompt, mediaData.base64, mediaData.mimeType, clientId);
      } else if (inputMode === 'text' && textInput.trim()) {
        const prompt = `Her er prøvespørsmål eller pensum:\n\n${textInput}\n\nAnalyser og generer presise svar til hvert spørsmål. Hvis teksten allerede inneholder spørsmål og svar, behold dem. Returner som JSON: {"pairs": [{"question": "spørsmål", "answer": "kort presist svar"}]}. Maks 2-3 setninger per svar. Returner KUN JSON.`;
        result = await chatWithGemini(prompt, systemPrompt, clientId);
      } else {
        setError('Skriv inn spørsmål eller last opp et bilde/fil.');
        setLoading(false);
        return;
      }

      if (result.error) { setError(result.error); setLoading(false); return; }

      const text = result.text || '';
      let clean = text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
      const jsonMatch = clean.match(/\{[\s\S]*\}/);
      if (jsonMatch) clean = jsonMatch[0];
      const parsed = JSON.parse(clean);
      const pairList: QAPair[] = parsed.pairs || [];

      if (pairList.length === 0) {
        setError('Fant ingen spørsmål. Prøv igjen med tydeligere tekst eller bilde.');
        setLoading(false);
        return;
      }

      setPairs(pairList);
      setDistractorsCache(null);
      saveSession(pairList);
      setPhase('edit');
      if (mediaData) setMediaData(null);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Ukjent feil';
      setError('Kunne ikke tolke AI-svaret. Prøv igjen. (' + msg + ')');
    }
    setLoading(false);
  }, [inputMode, mediaData, textInput, saveSession]);

  // ── Rediger øveark ──
  const updatePair = useCallback((i: number, field: 'question' | 'answer', value: string) => {
    setPairs(prev => prev.map((p, idx) => idx === i ? { ...p, [field]: value } : p));
  }, []);

  const removePair = useCallback((i: number) => {
    setPairs(prev => prev.filter((_, idx) => idx !== i));
  }, []);

  const resetAll = useCallback(() => {
    setPhase('setup');
    setPairs([]);
    setTextInput('');
    clearMedia();
    setError(null);
    setDistractorsCache(null);
  }, [clearMedia]);

  const confirmEdit = useCallback(() => {
    saveSession(pairs, distractorsCache ?? undefined);
    setPhase('modeSelect');
  }, [pairs, distractorsCache, saveSession]);

  // ── Generer distraktorer (2 per spørsmål = 3 alternativer totalt) ──
  const generateDistractors = useCallback(async (pairList: QAPair[]): Promise<string[][]> => {
    if (distractorsCache && distractorsCache.length === pairList.length) return distractorsCache;

    setLoadingDistractors(true);
    const clientId = getClientId();
    const systemPrompt = `Du er en læringsassistent. Returner KUN gyldig JSON uten markdown-formatering.`;
    const prompt = `For hvert av disse spørsmål-svar-parene, generer 2 FAGLIG PLAUSIBLE men FEILAKTIGE svaralternativer på norsk.

VIKTIG:
- Bruk ALDRI "Vet ikke", "Ikke relevant", "Ingen av disse" eller metasvar
- Alternativene skal se ut som ekte svar på spørsmålet, men være faglig feil
- Lik lengde og stil som fasitsvaret
- Lag svar som en elev som ikke kan det godt nok kanskje ville svart
- Eksempel: Fasit "Mitokondrier er cellens kraftverk" → feil svar: "Ribosomer er cellens kraftverk", "Cellekjernen er cellens kraftverk"

Spørsmål og svar:
${pairList.map((p, i) => `${i + 1}. Spørsmål: "${p.question}"\n   Fasitsvar: "${p.answer}"`).join('\n\n')}

Returner som JSON: {"distractors": [["feil1", "feil2"], ["feil1", "feil2"], ...]}
Returner KUN JSON, ingen annen tekst.`;

    try {
      const result = await chatWithGemini(prompt, systemPrompt, clientId);
      if (!result.text || result.error) throw new Error('Ingen respons');
      let clean = result.text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
      const jsonMatch = clean.match(/\{[\s\S]*\}/);
      if (jsonMatch) clean = jsonMatch[0];
      const parsed = JSON.parse(clean);
      const d: string[][] = parsed.distractors || [];
      setDistractorsCache(d);
      saveSession(pairList, d);
      setLoadingDistractors(false);
      return d;
    } catch {
      setLoadingDistractors(false);
      // Smart fallback: bruk andre svar fra listen som distraktorer
      return pairList.map((_, i) => {
        const others = pairList.filter((_, j) => j !== i).map(p => p.answer);
        const picked = shuffleArr(others).slice(0, 2);
        while (picked.length < 2) picked.push('Alternativ ' + (picked.length + 1));
        return picked;
      });
    }
  }, [distractorsCache, saveSession]);

  // ── Flashcards ──
  const startFlashcards = useCallback((pairList?: QAPair[]) => {
    const list = pairList || pairs;
    setDeck(shuffleArr(list).map(p => ({ ...p, status: 'unseen' as const })));
    setFlashIdx(0);
    setFlipped(false);
    setFlashFirstCorrect(0);
    setFlashTotal(list.length);
    setPhase('flashcard');
  }, [pairs]);

  const handleFlashAnswer = useCallback((knew: boolean) => {
    const isFirst = deck[flashIdx].status === 'unseen';
    if (knew) {
      if (isFirst) setFlashFirstCorrect(prev => prev + 1);
      const newDeck = deck.filter((_, i) => i !== flashIdx);
      if (newDeck.length === 0) { setPhase('flashResult'); return; }
      setDeck(newDeck);
      setFlashIdx(prev => (prev >= newDeck.length ? 0 : prev));
    } else {
      const newDeck = [...deck];
      const card = { ...newDeck.splice(flashIdx, 1)[0], status: 'retry' as const };
      newDeck.push(card);
      setDeck(newDeck);
      setFlashIdx(prev => (prev >= newDeck.length ? 0 : prev));
    }
    setFlipped(false);
  }, [deck, flashIdx]);

  // ── Flervalg ──
  const startMultiple = useCallback(async (pairList?: QAPair[]) => {
    const list = shuffleArr(pairList || pairs);
    const distractors = await generateDistractors(list);
    const items: MCItem[] = list.map((p, i) => {
      const d = (distractors[i] || []).slice(0, 2);
      while (d.length < 2) d.push('Alternativ ' + (d.length + 1));
      const options = shuffleArr([p.answer, ...d]);
      return { ...p, options, correctIdx: options.indexOf(p.answer) };
    });
    setMcItems(items);
    setMcIdx(0);
    setMcSelected(null);
    setMcAnswers([]);
    setPhase('multiple');
  }, [pairs, generateDistractors]);

  const handleMcSelect = useCallback((optIdx: number) => {
    if (mcSelected !== null) return;
    setMcSelected(optIdx);
    const item = mcItems[mcIdx];
    const correct = optIdx === item.correctIdx;
    setMcAnswers(prev => [...prev, { correct, qa: { question: item.question, answer: item.answer } }]);
    if (correct) {
      setTimeout(() => {
        if (mcIdx + 1 >= mcItems.length) setPhase('multipleResult');
        else { setMcIdx(prev => prev + 1); setMcSelected(null); }
      }, 1500);
    }
  }, [mcSelected, mcItems, mcIdx]);

  const handleMcNext = useCallback(() => {
    if (mcIdx + 1 >= mcItems.length) setPhase('multipleResult');
    else { setMcIdx(prev => prev + 1); setMcSelected(null); }
  }, [mcIdx, mcItems.length]);

  // ── Skriftlig prøve ──
  const startWritten = useCallback((pairList?: QAPair[]) => {
    setWrittenItems(shuffleArr(pairList || pairs));
    setWrittenIdx(0);
    setWrittenInput('');
    setWrittenResults([]);
    setWrittenFeedback(null);
    setPhase('written');
  }, [pairs]);

  const handleWrittenSubmit = useCallback(async () => {
    if (loadingFeedback || !writtenInput.trim()) return;
    setLoadingFeedback(true);
    const item = writtenItems[writtenIdx];
    const clientId = getClientId();
    const systemPrompt = `Du er en sensor. Svar KUN med gyldig JSON uten markdown.`;
    const prompt = `Spørsmål: ${item.question}
Fasitsvar: ${item.answer}
Elevens svar: ${writtenInput}

Vurder om svaret er riktig, delvis riktig eller feil. Gi en kort, oppmuntrende tilbakemelding på norsk med maks 2 setninger.
Returner som JSON: {"status": "correct"|"partial"|"wrong", "feedback": "tilbakemelding"}`;

    try {
      const result = await chatWithGemini(prompt, systemPrompt, clientId);
      let status: 'correct' | 'partial' | 'wrong' = 'wrong';
      let feedback = 'Kunne ikke vurdere svaret automatisk.';
      if (result.text) {
        let clean = result.text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
        const m = clean.match(/\{[\s\S]*\}/);
        if (m) clean = m[0];
        const parsed = JSON.parse(clean);
        status = parsed.status || 'wrong';
        feedback = parsed.feedback || 'Ingen tilbakemelding.';
      } else if (result.error) { feedback = result.error; }
      const wr: WrittenResult = { qa: item, userAnswer: writtenInput, status, feedback };
      setWrittenResults(prev => [...prev, wr]);
      setWrittenFeedback(wr);
    } catch {
      const wr: WrittenResult = { qa: item, userAnswer: writtenInput, status: 'wrong', feedback: 'Kunne ikke vurdere svaret automatisk.' };
      setWrittenResults(prev => [...prev, wr]);
      setWrittenFeedback(wr);
    }
    setLoadingFeedback(false);
  }, [loadingFeedback, writtenInput, writtenItems, writtenIdx]);

  const handleWrittenNext = useCallback(() => {
    if (writtenIdx + 1 >= writtenItems.length) setPhase('writtenResult');
    else { setWrittenIdx(prev => prev + 1); setWrittenInput(''); setWrittenFeedback(null); }
  }, [writtenIdx, writtenItems.length]);

  // ── AI Chat ──
  const startAIChat = useCallback(async (level: AILevel) => {
    setAiLevel(level);
    setAiMessages([]);
    setAiInput('');
    setAiGrade(null);
    setAiSending(true);
    setPhase('aiChat');
    const clientId = getClientId();
    const systemPrompt = buildSensorPrompt(level, pairs);
    const result = await chatWithGemini('Start prøven nå.', systemPrompt, clientId);
    setAiMessages(result.text
      ? [{ role: 'sensor', content: result.text }]
      : [{ role: 'sensor', content: `Hei! La oss starte prøven. ${pairs[0]?.question || ''}` }]
    );
    setAiSending(false);
  }, [pairs]);

  const sendAIMessage = useCallback(async () => {
    if (!aiInput.trim() || aiSending) return;
    const userMsg = aiInput.trim();
    const newMessages: ChatMessage[] = [...aiMessages, { role: 'elev', content: userMsg }];
    setAiMessages(newMessages);
    setAiInput('');
    setAiSending(true);
    const clientId = getClientId();
    const systemPrompt = buildSensorPrompt(aiLevel, pairs);
    const conversationText = newMessages.map(m => `${m.role === 'sensor' ? 'Sensor' : 'Elev'}: ${m.content}`).join('\n\n');
    const result = await chatWithGemini(conversationText, systemPrompt, clientId);
    if (result.text) {
      setAiMessages(prev => [...prev, { role: 'sensor', content: result.text! }]);
    }
    setAiSending(false);
  }, [aiInput, aiSending, aiMessages, aiLevel, pairs]);

  const finishAIChat = useCallback(async () => {
    setAiGrading(true);
    const clientId = getClientId();
    const systemPrompt = `Du er en sensor. Returner KUN gyldig JSON uten markdown.`;
    const conversation = aiMessages.map(m => `${m.role === 'sensor' ? 'Sensor' : 'Elev'}: ${m.content}`).join('\n\n');
    const prompt = `Samtale mellom sensor og elev:
${conversation}

Øvingsark (fasit):
${pairs.map((p, i) => `${i + 1}. ${p.question} → ${p.answer}`).join('\n')}

Gi en samlet vurdering basert på samtalen.
Returner som JSON: {"grade": "A"|"B"|"C"|"D"|"E"|"F", "summary": "2-3 setninger om hva eleven kan godt", "improvements": "2-3 konkrete forbedrningstips"}

Vurderingsnorm: Vær oppmuntrende. F kun ved totalt fravær av kunnskap. E ved svak men synlig innsats. Ved tvil, gi høyere karakter.`;

    try {
      const result = await chatWithGemini(prompt, systemPrompt, clientId, true);
      if (result.text) {
        let clean = result.text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
        const m = clean.match(/\{[\s\S]*\}/);
        if (m) clean = m[0];
        const parsed = JSON.parse(clean);
        setAiGrade({ grade: parsed.grade || 'C', summary: parsed.summary || '', improvements: parsed.improvements || '' });
      } else {
        setAiGrade({ grade: 'C', summary: 'Kunne ikke vurdere samtalen automatisk.', improvements: '' });
      }
    } catch {
      setAiGrade({ grade: 'C', summary: 'Kunne ikke vurdere samtalen automatisk.', improvements: '' });
    }
    setAiGrading(false);
    setPhase('aiResult');
  }, [aiMessages, pairs]);

  // ── Effects ──
  useEffect(() => {
    if (phase === 'written' && !writtenFeedback && !loadingFeedback) {
      setTimeout(() => writtenInputRef.current?.focus(), 50);
    }
  }, [phase, writtenIdx, writtenFeedback, loadingFeedback]);

  useEffect(() => {
    aiChatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [aiMessages]);

  useEffect(() => {
    if (phase === 'aiChat' && !aiSending) {
      setTimeout(() => aiInputRef.current?.focus(), 50);
    }
  }, [phase, aiSending]);

  // ── Resultat-hjelpere ──
  const resultColor = (pct: number) => pct >= 80 ? C.green : pct >= 50 ? C.carry : C.red;
  const resultLabel = (pct: number) => pct >= 80 ? 'Bestått! 🎉' : pct >= 50 ? 'Nesten! Øv litt til' : 'Øv mer og prøv igjen!';

  // ── Spørsmålsteller for AI chat ──
  const aiQuestionsAnswered = aiMessages.filter(m => m.role === 'elev').length;

  // ══════════════════════════════════════
  //  RENDER
  // ══════════════════════════════════════

  return (
    <div className="min-h-screen" style={{ background: `linear-gradient(180deg, ${C.mist}, ${C.sand})` }}>
      <div className="max-w-xl mx-auto px-4 py-6">

        {/* ── Header ── */}
        <div className="rounded-2xl overflow-hidden shadow-xl mb-6" style={{ background: `linear-gradient(135deg, ${C.forest}, ${C.fd})` }}>
          <div className="px-5 py-4 flex items-center justify-between flex-wrap gap-3">
            <Link href="/skole" className="flex items-center gap-3 no-underline group" aria-label="Tilbake til Pratiro Skole">
              <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                <div style={{ width: 4, height: 18, background: 'rgba(255,255,255,0.7)', borderRadius: 1 }} />
                <div style={{ width: 4, height: 18, background: 'rgba(255,255,255,0.7)', borderRadius: 1 }} />
              </div>
              <h1 className="text-white text-xl font-bold font-serif leading-tight">
                {phase === 'aiChat' ? 'Prøveforberedelse · Øv med AI' : 'Prøveforberedelse'}
              </h1>
            </Link>
          </div>
          <div className="px-5 pb-1.5">
            <span className="text-white/40 text-[10px] font-semibold uppercase tracking-widest">Pratiro Skole</span>
          </div>
        </div>

        {/* ════════════════════════════════════ */}
        {/*  SETUP                              */}
        {/* ════════════════════════════════════ */}
        {phase === 'setup' && (
          <div className="space-y-5">

            {showResume && (
              <div className="bg-white rounded-2xl border border-black/5 shadow-sm p-4 flex items-center justify-between gap-3">
                <div>
                  <p className="font-semibold text-sm" style={{ color: C.forest }}>Fortsett forrige øving</p>
                  <p className="text-xs" style={{ color: C.stone }}>Du har et lagret øveark</p>
                </div>
                <button
                  onClick={loadSession}
                  className="px-4 py-2 rounded-xl font-bold text-white text-sm shadow-sm transition-all active:scale-[0.98]"
                  style={{ background: C.forest }}
                >
                  Fortsett →
                </button>
              </div>
            )}

            <div className="bg-white rounded-2xl border border-black/5 shadow-sm p-5">
              {/* Tab-toggle */}
              <div className="flex justify-center mb-4">
                <div className="inline-flex p-1 rounded-lg" style={{ background: C.sand, border: '1px solid rgba(42,64,54,0.06)' }}>
                  {(['text', 'image', 'file'] as InputMode[]).map(m => (
                    <button
                      key={m}
                      onClick={() => { setInputMode(m); clearMedia(); setError(null); }}
                      className="px-3 py-2 rounded-md text-xs font-semibold transition-all"
                      style={inputMode === m
                        ? { background: C.white, color: C.forest, boxShadow: '0 2px 8px rgba(42,64,54,0.08)' }
                        : { color: C.stone }}
                    >
                      {m === 'text' ? 'Skriv / Lim inn' : m === 'image' ? 'Bilde' : 'Fil'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tekst-input */}
              {inputMode === 'text' && (
                <>
                  <label className="block text-[10px] font-semibold uppercase tracking-wider mb-2" style={{ color: C.fl }}>
                    Lim inn spørsmål eller pensum
                  </label>
                  <textarea
                    value={textInput}
                    onChange={e => setTextInput(e.target.value)}
                    maxLength={3000}
                    rows={8}
                    className="w-full p-4 border rounded-xl outline-none text-sm leading-relaxed resize-none"
                    style={{ borderColor: 'rgba(42,64,54,0.12)', background: C.sand }}
                    placeholder={'F.eks:\n1. Hva er fotosyntese?\n2. Hva er cellens kraftverk?\n\nEller lim inn et avsnitt fra læreboka.'}
                  />
                  <CharCount len={textInput.length} max={3000} />
                </>
              )}

              {/* Bilde-input – bruker label+htmlFor for pålitelig kameraåpning på mobil */}
              {inputMode === 'image' && (
                <div className="space-y-3">
                  <p className="text-xs leading-relaxed p-3 rounded-lg" style={{ background: 'rgba(91,122,140,0.06)', color: C.ts }}>
                    Ta bilde av øvingsarket eller pensumsiden. Bildet sendes til en AI-tjeneste og slettes umiddelbart.
                  </p>
                  {imagePreview ? (
                    <div className="relative">
                      <img
                        src={imagePreview}
                        alt="Forhåndsvisning"
                        className="w-full rounded-xl border"
                        style={{ borderColor: 'rgba(42,64,54,0.1)', maxHeight: 300, objectFit: 'contain', background: C.sand }}
                      />
                      <button
                        onClick={clearMedia}
                        className="absolute top-2 right-2 w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold shadow-md"
                        style={{ background: 'rgba(0,0,0,0.5)' }}
                        aria-label="Fjern bilde"
                      >
                        &times;
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-3">
                      <label
                        htmlFor="prove-camera-input"
                        className="border-2 border-dashed rounded-xl p-6 text-center transition-all hover:border-[rgba(42,64,54,0.3)] cursor-pointer block"
                        style={{ borderColor: 'rgba(42,64,54,0.15)' }}
                      >
                        <div className="text-2xl mb-1.5">📷</div>
                        <p className="font-semibold text-sm" style={{ color: C.forest }}>Ta bilde</p>
                        <p className="text-xs mt-1" style={{ color: C.stone }}>Bruk kameraet</p>
                      </label>
                      <label
                        htmlFor="prove-album-input"
                        className="border-2 border-dashed rounded-xl p-6 text-center transition-all hover:border-[rgba(42,64,54,0.3)] cursor-pointer block"
                        style={{ borderColor: 'rgba(42,64,54,0.15)' }}
                      >
                        <div className="text-2xl mb-1.5">📁</div>
                        <p className="font-semibold text-sm" style={{ color: C.forest }}>Velg fra album</p>
                        <p className="text-xs mt-1" style={{ color: C.stone }}>JPG, PNG</p>
                      </label>
                      <input id="prove-camera-input" ref={cameraInputRef} type="file" accept="image/*" capture="environment" onChange={handleImageSelect} className="hidden" />
                      <input id="prove-album-input" ref={albumInputRef} type="file" accept="image/*" onChange={handleImageSelect} className="hidden" />
                    </div>
                  )}
                </div>
              )}

              {/* Fil-input */}
              {inputMode === 'file' && (
                <div className="space-y-3">
                  <p className="text-xs leading-relaxed p-3 rounded-lg" style={{ background: 'rgba(91,122,140,0.06)', color: C.ts }}>
                    Last opp et bilde eller PDF med prøvespørsmål. Filen sendes til en AI-tjeneste og slettes umiddelbart.
                  </p>
                  {(imagePreview || pdfName) ? (
                    <div className="relative">
                      {imagePreview ? (
                        <img src={imagePreview} alt="Forhåndsvisning" className="w-full rounded-xl border" style={{ borderColor: 'rgba(42,64,54,0.1)', maxHeight: 300, objectFit: 'contain', background: C.sand }} />
                      ) : (
                        <div className="flex items-center gap-3 p-4 rounded-xl border" style={{ borderColor: 'rgba(42,64,54,0.1)', background: C.sand }}>
                          <span className="text-2xl">📄</span>
                          <span className="text-sm font-semibold" style={{ color: C.forest }}>{pdfName}</span>
                        </div>
                      )}
                      <button onClick={clearMedia} className="absolute top-2 right-2 w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold shadow-md" style={{ background: 'rgba(0,0,0,0.5)' }} aria-label="Fjern fil">&times;</button>
                    </div>
                  ) : (
                    <label htmlFor="prove-file-input" className="w-full border-2 border-dashed rounded-xl p-8 text-center transition-all hover:border-[rgba(42,64,54,0.3)] cursor-pointer block" style={{ borderColor: 'rgba(42,64,54,0.15)' }}>
                      <div className="text-3xl mb-2">📎</div>
                      <p className="font-semibold text-sm" style={{ color: C.forest }}>Velg fil</p>
                      <p className="text-xs mt-1" style={{ color: C.stone }}>Bilde (JPG, PNG) eller PDF</p>
                    </label>
                  )}
                  <input id="prove-file-input" ref={fileInputRef} type="file" accept="image/*,.pdf" onChange={handleFileSelect} className="hidden" />
                </div>
              )}

              <p className="text-[11px] text-center mt-3 mb-3" style={{ color: C.stone }}>
                Teksten sendes til en AI-tjeneste. Ingen data lagres.
              </p>

              {error && (
                <div className="p-3 rounded-xl text-sm font-medium mb-3" style={{ background: 'rgba(176,64,64,0.08)', color: C.red }}>
                  {error}
                </div>
              )}

              <button
                onClick={handleSubmit}
                disabled={loading || (inputMode === 'text' ? !textInput.trim() : !mediaData)}
                className="w-full py-3.5 rounded-xl font-bold text-white text-base shadow-md disabled:opacity-40 flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
                style={{ background: C.forest }}
              >
                {loading ? (
                  <><span className="inline-block w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />Analyserer...</>
                ) : 'Analyser med AI'}
              </button>
            </div>
          </div>
        )}

        {/* ════════════════════════════════════ */}
        {/*  EDIT – Stacked Q+A cards           */}
        {/* ════════════════════════════════════ */}
        {phase === 'edit' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-bold text-lg" style={{ color: C.forest }}>Øveark</h2>
                <p className="text-xs" style={{ color: C.ts }}>{pairs.length} spørsmål</p>
              </div>
              <button onClick={resetAll} className="text-xs font-semibold px-3 py-1.5 rounded-full" style={{ background: 'rgba(176,64,64,0.08)', color: C.red }}>
                ↺ Start på nytt
              </button>
            </div>

            <div className="p-3 rounded-xl flex gap-2 items-start" style={{ background: 'rgba(196,101,26,0.08)', border: '1px solid rgba(196,101,26,0.15)' }}>
              <span className="text-base shrink-0">⚠️</span>
              <p className="text-xs leading-relaxed" style={{ color: C.carry }}>
                AI-genererte svar kan inneholde feil. Sjekk alltid mot læreboka.
              </p>
            </div>

            {/* Stacked Q+A list */}
            <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
              {pairs.map((pair, i) => (
                <div key={i} className="bg-white rounded-xl border p-3 shadow-sm" style={{ borderColor: 'rgba(42,64,54,0.08)' }}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: C.fl }}>
                      {i + 1}. Spørsmål
                    </span>
                    <button
                      onClick={() => removePair(i)}
                      className="w-6 h-6 rounded flex items-center justify-center text-sm transition-colors hover:bg-red-50 shrink-0"
                      style={{ color: C.stone }}
                      aria-label="Fjern spørsmål"
                    >
                      &times;
                    </button>
                  </div>
                  <textarea
                    value={pair.question}
                    onChange={e => updatePair(i, 'question', e.target.value)}
                    maxLength={800}
                    rows={2}
                    className="w-full px-2.5 py-2 border rounded-lg text-sm font-semibold outline-none resize-none mb-2"
                    style={{ borderColor: 'rgba(42,64,54,0.08)', background: C.sand, color: C.forest }}
                  />
                  <span className="text-[10px] font-bold uppercase tracking-wider block mb-1" style={{ color: C.greenSoft }}>Svar</span>
                  <textarea
                    value={pair.answer}
                    onChange={e => updatePair(i, 'answer', e.target.value)}
                    maxLength={1000}
                    rows={2}
                    className="w-full px-2.5 py-2 border rounded-lg text-sm outline-none resize-none"
                    style={{ borderColor: 'rgba(42,64,54,0.08)', background: C.sand, color: C.ts }}
                  />
                </div>
              ))}
            </div>

            <button
              onClick={confirmEdit}
              disabled={pairs.length === 0}
              className="w-full py-3.5 rounded-xl font-bold text-white text-base shadow-md disabled:opacity-40 flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
              style={{ background: C.forest }}
            >
              Bekreft og velg øvingsmodus
            </button>
          </div>
        )}

        {/* ════════════════════════════════════ */}
        {/*  MODE SELECT                        */}
        {/* ════════════════════════════════════ */}
        {phase === 'modeSelect' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-2">
              <h2 className="font-bold text-lg" style={{ color: C.forest }}>Velg øvingsmodus</h2>
              <button onClick={() => setPhase('edit')} className="text-xs font-semibold px-3 py-1.5 rounded-full" style={{ color: C.fl }}>← Tilbake</button>
            </div>
            <p className="text-sm" style={{ color: C.ts }}>{pairs.length} spørsmål klare – velg hvordan du vil øve:</p>

            {/* Flashcards */}
            <button onClick={() => startFlashcards()} className="w-full p-5 rounded-2xl text-left border transition-all hover:shadow-md active:scale-[0.98]" style={{ background: C.white, borderColor: 'rgba(42,64,54,0.08)' }}>
              <div className="flex items-start gap-4">
                <span className="text-3xl">📇</span>
                <div>
                  <p className="font-bold text-base" style={{ color: C.forest }}>Flashcards</p>
                  <p className="text-sm mt-0.5" style={{ color: C.ts }}>Vis spørsmål – snu kortet for å se svaret. Merk hva du kan og hva du bør øve mer på.</p>
                </div>
              </div>
            </button>

            {/* Flervalg */}
            <button onClick={() => startMultiple()} disabled={loadingDistractors} className="w-full p-5 rounded-2xl text-left border transition-all hover:shadow-md active:scale-[0.98] disabled:opacity-60" style={{ background: C.white, borderColor: 'rgba(42,64,54,0.08)' }}>
              <div className="flex items-start gap-4">
                <span className="text-3xl">🔘</span>
                <div className="flex-1">
                  <p className="font-bold text-base" style={{ color: C.forest }}>Flervalg</p>
                  <p className="text-sm mt-0.5" style={{ color: C.ts }}>Velg riktig svar blant tre alternativer. AI lager faglig plausible feilalternativer.</p>
                  {loadingDistractors && (
                    <div className="flex items-center gap-2 mt-2">
                      <span className="inline-block w-4 h-4 border-2 border-[rgba(42,64,54,0.2)] border-t-[#2A4036] rounded-full animate-spin" />
                      <span className="text-xs" style={{ color: C.stone }}>Genererer alternativer...</span>
                    </div>
                  )}
                </div>
              </div>
            </button>

            {/* Skriftlig */}
            <button onClick={() => startWritten()} className="w-full p-5 rounded-2xl text-left border transition-all hover:shadow-md active:scale-[0.98]" style={{ background: C.white, borderColor: 'rgba(42,64,54,0.08)' }}>
              <div className="flex items-start gap-4">
                <span className="text-3xl">📝</span>
                <div>
                  <p className="font-bold text-base" style={{ color: C.forest }}>Skriftlig prøve</p>
                  <p className="text-sm mt-0.5" style={{ color: C.ts }}>Skriv svar med egne ord. AI vurderer hvert svar og gir tilbakemelding.</p>
                  <p className="text-xs mt-1.5 px-2 py-1 rounded-lg inline-block" style={{ background: 'rgba(196,101,26,0.08)', color: C.carry }}>Bruker AI-kvote per spørsmål</p>
                </div>
              </div>
            </button>

            {/* Øv med AI */}
            <button onClick={() => setPhase('aiLevel')} className="w-full p-5 rounded-2xl text-left border transition-all hover:shadow-md active:scale-[0.98]" style={{ background: C.white, borderColor: 'rgba(42,64,54,0.08)' }}>
              <div className="flex items-start gap-4">
                <span className="text-3xl">💬</span>
                <div>
                  <p className="font-bold text-base" style={{ color: C.forest }}>Øv med AI</p>
                  <p className="text-sm mt-0.5" style={{ color: C.ts }}>En AI-sensor stiller deg spørsmålene og gir veiledning underveis. Simulerer muntlig prøve.</p>
                  <p className="text-xs mt-1.5 px-2 py-1 rounded-lg inline-block" style={{ background: 'rgba(196,101,26,0.08)', color: C.carry }}>Bruker AI-kvote</p>
                </div>
              </div>
            </button>
          </div>
        )}

        {/* ════════════════════════════════════ */}
        {/*  FLASHCARD                          */}
        {/* ════════════════════════════════════ */}
        {phase === 'flashcard' && deck.length > 0 && (
          <div className="space-y-4">
            <div className="flex justify-between text-xs font-semibold uppercase tracking-wider" style={{ color: C.stone }}>
              <span>Kort {flashTotal - deck.length + 1} / {flashTotal}</span>
              <button onClick={() => setPhase('modeSelect')} className="hover:underline" style={{ color: C.fl }}>Avslutt</button>
            </div>
            <div className="h-2 rounded-full overflow-hidden" style={{ background: C.sage }}>
              <div className="h-full rounded-full transition-all duration-500" style={{ width: `${((flashTotal - deck.length) / flashTotal) * 100}%`, background: `linear-gradient(90deg, ${C.forest}, ${C.ocean})` }} />
            </div>

            <div className="relative w-full cursor-pointer" style={{ perspective: 1000, minHeight: 280 }} onClick={() => setFlipped(!flipped)}>
              <div className="relative w-full transition-transform duration-500" style={{ transformStyle: 'preserve-3d', transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)', minHeight: 280 }}>
                <div className="absolute inset-0 rounded-3xl p-8 flex flex-col items-center justify-center text-center shadow-xl border border-black/5" style={{ background: C.white, backfaceVisibility: 'hidden' }}>
                  <span className="absolute top-5 left-5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider" style={{ background: C.sage, color: C.forest }}>Spørsmål</span>
                  <p className="text-lg sm:text-xl font-bold leading-snug" style={{ color: C.text }}>{deck[flashIdx]?.question}</p>
                  <p className="absolute bottom-5 text-xs font-semibold uppercase tracking-wider" style={{ color: C.stone }}>Trykk for å se svaret</p>
                </div>
                <div className="absolute inset-0 rounded-3xl p-8 flex flex-col items-center justify-center text-center shadow-xl" style={{ background: C.forest, backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}>
                  <span className="absolute top-5 left-5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider" style={{ background: 'rgba(255,255,255,0.15)', color: 'white' }}>Svar</span>
                  <p className="text-base sm:text-lg font-semibold text-white leading-relaxed">{deck[flashIdx]?.answer}</p>
                </div>
              </div>
            </div>

            {!flipped ? (
              <button onClick={e => { e.stopPropagation(); setFlipped(true); }} className="w-full py-3 rounded-xl font-bold text-white shadow-md transition-all active:scale-[0.98]" style={{ background: C.forest }}>Se svaret</button>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <button onClick={e => { e.stopPropagation(); handleFlashAnswer(false); }} className="py-3.5 rounded-xl font-bold text-white shadow-md flex items-center justify-center gap-2 transition-all active:scale-[0.98]" style={{ background: C.carry }}>↻ Øv mer</button>
                <button onClick={e => { e.stopPropagation(); handleFlashAnswer(true); }} className="py-3.5 rounded-xl font-bold text-white shadow-md flex items-center justify-center gap-2 transition-all active:scale-[0.98]" style={{ background: C.green }}>✓ Kunne den</button>
              </div>
            )}
            {deck.length > 1 && <p className="text-center text-xs" style={{ color: C.stone }}>{deck.length} kort igjen i bunken</p>}
          </div>
        )}

        {/* ════════════════════════════════════ */}
        {/*  FLASHCARD RESULT                   */}
        {/* ════════════════════════════════════ */}
        {phase === 'flashResult' && (
          <div className="text-center py-8">
            <div className="text-5xl mb-4">🏆</div>
            <h2 className="text-3xl font-bold mb-2 font-serif" style={{ color: C.forest }}>Bra jobba!</h2>
            <p className="mb-8" style={{ color: C.ts }}>Du har gått gjennom alle {flashTotal} spørsmålene.</p>
            <div className="grid grid-cols-2 gap-4 max-w-xs mx-auto mb-8">
              <div className="p-5 rounded-2xl border bg-white" style={{ borderColor: 'rgba(42,64,54,0.06)' }}>
                <div className="text-4xl font-bold mb-1" style={{ color: C.green }}>{flashFirstCorrect}</div>
                <div className="text-[10px] font-bold uppercase tracking-wider" style={{ color: C.stone }}>Riktige på 1. forsøk</div>
              </div>
              <div className="p-5 rounded-2xl border bg-white" style={{ borderColor: 'rgba(42,64,54,0.06)' }}>
                <div className="text-4xl font-bold mb-1" style={{ color: C.forest }}>{flashTotal}</div>
                <div className="text-[10px] font-bold uppercase tracking-wider" style={{ color: C.stone }}>Totalt antall kort</div>
              </div>
            </div>
            <div className="space-y-3 max-w-xs mx-auto">
              <button onClick={() => startFlashcards()} className="w-full py-3 rounded-xl font-bold text-white shadow-md transition-all active:scale-[0.98]" style={{ background: C.forest }}>↻ Øv på nytt</button>
              <button onClick={() => setPhase('modeSelect')} className="w-full py-3 rounded-xl font-semibold transition-colors" style={{ color: C.stone }}>Bytt øvingsmodus</button>
            </div>
          </div>
        )}

        {/* ════════════════════════════════════ */}
        {/*  FLERVALG (3 alternativer)          */}
        {/* ════════════════════════════════════ */}
        {phase === 'multiple' && mcItems.length > 0 && (
          <div className="space-y-4">
            <div className="flex justify-between text-xs font-semibold uppercase tracking-wider" style={{ color: C.stone }}>
              <span>Spørsmål {mcIdx + 1} av {mcItems.length}</span>
              <button onClick={() => setPhase('modeSelect')} className="hover:underline" style={{ color: C.fl }}>Avslutt</button>
            </div>
            <div className="h-2 rounded-full overflow-hidden" style={{ background: C.sage }}>
              <div className="h-full rounded-full transition-all duration-500" style={{ width: `${(mcIdx / mcItems.length) * 100}%`, background: `linear-gradient(90deg, ${C.forest}, ${C.ocean})` }} />
            </div>

            <div className="bg-white rounded-3xl p-7 shadow-xl border border-black/5">
              <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: C.fl }}>Spørsmål</p>
              <p className="text-lg font-bold leading-snug" style={{ color: C.text }}>{mcItems[mcIdx]?.question}</p>
            </div>

            <div className="space-y-2.5">
              {mcItems[mcIdx]?.options.map((opt, i) => {
                const isCorrect = i === mcItems[mcIdx].correctIdx;
                const isSelected = mcSelected === i;
                let bg = C.white, border = 'rgba(42,64,54,0.1)', color = C.text;
                if (mcSelected !== null) {
                  if (isCorrect) { bg = 'rgba(42,107,69,0.08)'; border = C.green; color = C.green; }
                  else if (isSelected) { bg = 'rgba(176,64,64,0.08)'; border = C.red; color = C.red; }
                }
                return (
                  <button
                    key={i}
                    onClick={() => handleMcSelect(i)}
                    disabled={mcSelected !== null}
                    className="w-full p-4 rounded-2xl border-2 text-left font-semibold text-sm transition-all disabled:cursor-default"
                    style={{ background: bg, borderColor: border, color }}
                  >
                    <span className="inline-flex items-center gap-3">
                      <span className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0" style={{
                        background: mcSelected !== null && isCorrect ? C.green : mcSelected !== null && isSelected ? C.red : C.sage,
                        color: mcSelected !== null && (isCorrect || isSelected) ? 'white' : C.forest
                      }}>
                        {mcSelected !== null && isCorrect ? '✓' : mcSelected !== null && isSelected ? '✗' : String.fromCharCode(65 + i)}
                      </span>
                      {opt}
                    </span>
                  </button>
                );
              })}
            </div>

            {mcSelected !== null && mcSelected !== mcItems[mcIdx].correctIdx && (
              <button onClick={handleMcNext} className="w-full py-3 rounded-xl font-bold text-white shadow-md transition-all active:scale-[0.98]" style={{ background: C.forest }}>Neste →</button>
            )}
          </div>
        )}

        {/* ════════════════════════════════════ */}
        {/*  FLERVALG RESULTAT                  */}
        {/* ════════════════════════════════════ */}
        {phase === 'multipleResult' && (() => {
          const correctCount = mcAnswers.filter(a => a.correct).length;
          const total = mcAnswers.length;
          const pct = total > 0 ? Math.round((correctCount / total) * 100) : 0;
          const wrong = mcAnswers.filter(a => !a.correct);
          return (
            <div className="text-center py-8">
              <div className="text-5xl mb-2">{pct >= 80 ? '🏆' : pct >= 50 ? '👍' : '💪'}</div>
              <h2 className="text-4xl font-bold mb-1 font-serif" style={{ color: resultColor(pct) }}>{pct}%</h2>
              <p className="text-xl font-bold mb-1" style={{ color: resultColor(pct) }}>{resultLabel(pct)}</p>
              <p className="mb-6" style={{ color: C.ts }}>{correctCount} av {total} riktige</p>
              {wrong.length > 0 && (
                <div className="text-left max-w-sm mx-auto mb-6 space-y-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: C.stone }}>Feil svar</h3>
                  {wrong.map((a, i) => (
                    <div key={i} className="p-3 rounded-xl bg-white border" style={{ borderColor: 'rgba(42,64,54,0.06)' }}>
                      <p className="text-xs font-semibold mb-1" style={{ color: C.forest }}>{a.qa.question}</p>
                      <p className="text-xs" style={{ color: C.ts }}>Riktig: <strong style={{ color: C.green }}>{a.qa.answer}</strong></p>
                    </div>
                  ))}
                </div>
              )}
              <div className="space-y-3 max-w-xs mx-auto">
                {wrong.length > 0 && <button onClick={() => startMultiple(wrong.map(a => a.qa))} className="w-full py-3 rounded-xl font-bold text-white shadow-md transition-all active:scale-[0.98]" style={{ background: C.ocean }}>Prøv igjen (kun feil)</button>}
                <button onClick={() => startMultiple()} className="w-full py-3 rounded-xl font-bold text-white shadow-md transition-all active:scale-[0.98]" style={{ background: C.forest }}>Prøv alle igjen</button>
                <button onClick={() => setPhase('modeSelect')} className="w-full py-3 rounded-xl font-semibold transition-colors" style={{ color: C.stone }}>Bytt øvingsmodus</button>
              </div>
            </div>
          );
        })()}

        {/* ════════════════════════════════════ */}
        {/*  SKRIFTLIG PRØVE                    */}
        {/* ════════════════════════════════════ */}
        {phase === 'written' && writtenItems.length > 0 && (
          <div className="space-y-4">
            <div className="flex justify-between text-xs font-semibold uppercase tracking-wider" style={{ color: C.stone }}>
              <span>Spørsmål {writtenIdx + 1} av {writtenItems.length}</span>
              <button onClick={() => setPhase('modeSelect')} className="hover:underline" style={{ color: C.fl }}>Avslutt</button>
            </div>
            <div className="h-2 rounded-full overflow-hidden" style={{ background: C.sage }}>
              <div className="h-full rounded-full transition-all duration-500" style={{ width: `${(writtenIdx / writtenItems.length) * 100}%`, background: `linear-gradient(90deg, ${C.ocean}, ${C.forest})` }} />
            </div>

            <div className="bg-white rounded-3xl p-7 shadow-xl border border-black/5">
              <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider inline-block mb-3" style={{ background: C.sage, color: C.forest }}>Spørsmål</span>
              <p className="text-lg font-bold leading-snug mb-5" style={{ color: C.text }}>{writtenItems[writtenIdx]?.question}</p>
              <textarea
                ref={writtenInputRef}
                value={writtenInput}
                onChange={e => setWrittenInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && e.ctrlKey) handleWrittenSubmit(); }}
                disabled={!!writtenFeedback || loadingFeedback}
                maxLength={500}
                rows={4}
                placeholder="Skriv svaret ditt her..."
                className="w-full p-4 border rounded-xl text-sm outline-none resize-none disabled:opacity-60"
                style={{ borderColor: 'rgba(42,64,54,0.12)', background: C.sand }}
                autoComplete="off"
                spellCheck
              />
              {!writtenFeedback && <CharCount len={writtenInput.length} max={500} />}
              {!writtenFeedback && (
                <button
                  onClick={handleWrittenSubmit}
                  disabled={!writtenInput.trim() || loadingFeedback}
                  className="w-full mt-3 py-3 rounded-xl font-bold text-white shadow-md disabled:opacity-40 flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
                  style={{ background: C.forest }}
                >
                  {loadingFeedback ? <><span className="inline-block w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />Vurderer...</> : 'Lever svar'}
                </button>
              )}
            </div>

            {writtenFeedback && (
              <div className="rounded-2xl p-5" style={{
                background: writtenFeedback.status === 'correct' ? 'rgba(42,107,69,0.08)' : writtenFeedback.status === 'partial' ? 'rgba(196,101,26,0.08)' : 'rgba(176,64,64,0.08)',
                border: `1px solid ${writtenFeedback.status === 'correct' ? 'rgba(42,107,69,0.2)' : writtenFeedback.status === 'partial' ? 'rgba(196,101,26,0.2)' : 'rgba(176,64,64,0.2)'}`,
              }}>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xl">{writtenFeedback.status === 'correct' ? '✅' : writtenFeedback.status === 'partial' ? '🟡' : '❌'}</span>
                  <span className="font-bold text-base" style={{ color: writtenFeedback.status === 'correct' ? C.green : writtenFeedback.status === 'partial' ? C.carry : C.red }}>
                    {writtenFeedback.status === 'correct' ? 'Riktig ✓' : writtenFeedback.status === 'partial' ? 'Delvis riktig ~' : 'Feil ✗'}
                  </span>
                </div>
                <p className="text-sm leading-relaxed mb-3" style={{ color: C.ts }}>{writtenFeedback.feedback}</p>
                <p className="text-xs" style={{ color: C.stone }}>Fasitsvar: <span className="font-semibold" style={{ color: C.forest }}>{writtenFeedback.qa.answer}</span></p>
                <button onClick={handleWrittenNext} className="w-full mt-4 py-3 rounded-xl font-bold text-white shadow-md transition-all active:scale-[0.98]" style={{ background: C.forest }}>
                  {writtenIdx + 1 >= writtenItems.length ? 'Se resultat' : 'Neste spørsmål →'}
                </button>
              </div>
            )}

            <p className="text-[11px] text-center" style={{ color: C.stone }}>Teksten sendes til en AI-tjeneste. Ingen data lagres.</p>
          </div>
        )}

        {/* ════════════════════════════════════ */}
        {/*  SKRIFTLIG RESULTAT                 */}
        {/* ════════════════════════════════════ */}
        {phase === 'writtenResult' && (() => {
          const correctCount = writtenResults.filter(r => r.status === 'correct').length;
          const partialCount = writtenResults.filter(r => r.status === 'partial').length;
          const total = writtenResults.length;
          const pct = total > 0 ? Math.round(((correctCount + partialCount * 0.5) / total) * 100) : 0;
          const wrong = writtenResults.filter(r => r.status === 'wrong');
          return (
            <div className="text-center py-8">
              <div className="text-5xl mb-2">{pct >= 80 ? '🏆' : pct >= 50 ? '👍' : '💪'}</div>
              <h2 className="text-4xl font-bold mb-1 font-serif" style={{ color: resultColor(pct) }}>{pct}%</h2>
              <p className="text-xl font-bold mb-1" style={{ color: resultColor(pct) }}>{resultLabel(pct)}</p>
              <p className="mb-2" style={{ color: C.ts }}>{correctCount} riktige · {partialCount} delvis riktige · {wrong.length} feil</p>
              {wrong.length > 0 && (
                <div className="text-left max-w-sm mx-auto mb-6 space-y-2 mt-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: C.stone }}>Feil svar</h3>
                  {wrong.map((r, i) => (
                    <div key={i} className="p-3 rounded-xl bg-white border" style={{ borderColor: 'rgba(42,64,54,0.06)' }}>
                      <p className="text-xs font-semibold mb-1" style={{ color: C.forest }}>{r.qa.question}</p>
                      <p className="text-xs" style={{ color: C.ts }}>Riktig: <strong style={{ color: C.green }}>{r.qa.answer}</strong></p>
                    </div>
                  ))}
                </div>
              )}
              <div className="space-y-3 max-w-xs mx-auto">
                {wrong.length > 0 && <button onClick={() => startWritten(wrong.map(r => r.qa))} className="w-full py-3 rounded-xl font-bold text-white shadow-md transition-all active:scale-[0.98]" style={{ background: C.ocean }}>Prøv igjen (kun feil)</button>}
                <button onClick={() => startWritten()} className="w-full py-3 rounded-xl font-bold text-white shadow-md transition-all active:scale-[0.98]" style={{ background: C.forest }}>Prøv alle igjen</button>
                <button onClick={() => setPhase('modeSelect')} className="w-full py-3 rounded-xl font-semibold transition-colors" style={{ color: C.stone }}>Bytt øvingsmodus</button>
              </div>
            </div>
          );
        })()}

        {/* ════════════════════════════════════ */}
        {/*  AI CHAT – NIVÅVALG                 */}
        {/* ════════════════════════════════════ */}
        {phase === 'aiLevel' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-2">
              <h2 className="font-bold text-lg" style={{ color: C.forest }}>Velg nivå</h2>
              <button onClick={() => setPhase('modeSelect')} className="text-xs font-semibold px-3 py-1.5 rounded-full" style={{ color: C.fl }}>← Tilbake</button>
            </div>

            <div className="p-4 rounded-xl text-sm leading-relaxed" style={{ background: 'rgba(91,122,140,0.07)', color: C.ts }}>
              🎓 En sensor vil stille deg spørsmålene fra øvingsarket ditt. Svar så godt du kan – du får veiledning underveis. Lykke til!
            </div>

            {([
              { level: 'lett' as AILevel, label: 'Lett', desc: 'Sensoren gir hint ved feil og aksepterer delvis riktige svar. Oppmuntrende tone.', emoji: '🌱' },
              { level: 'middels' as AILevel, label: 'Middels', desc: 'Sensoren forventer presise svar og stiller oppfølgingsspørsmål ved ufullstendige svar.', emoji: '📚' },
              { level: 'vanskelig' as AILevel, label: 'Vanskelig', desc: 'Sensoren krever fagbegreper og stiller kritiske oppfølgingsspørsmål. Simulerer reell eksamen.', emoji: '🎯' },
            ]).map(({ level, label, desc, emoji }) => (
              <button
                key={level}
                onClick={() => startAIChat(level)}
                className="w-full p-5 rounded-2xl text-left border transition-all hover:shadow-md active:scale-[0.98]"
                style={{ background: C.white, borderColor: 'rgba(42,64,54,0.08)' }}
              >
                <div className="flex items-start gap-4">
                  <span className="text-3xl">{emoji}</span>
                  <div>
                    <p className="font-bold text-base" style={{ color: C.forest }}>{label}</p>
                    <p className="text-sm mt-0.5" style={{ color: C.ts }}>{desc}</p>
                  </div>
                </div>
              </button>
            ))}

            <p className="text-[11px] text-center" style={{ color: C.stone }}>Teksten sendes til en AI-tjeneste. Ingen data lagres.</p>
          </div>
        )}

        {/* ════════════════════════════════════ */}
        {/*  AI CHAT                            */}
        {/* ════════════════════════════════════ */}
        {phase === 'aiChat' && (
          <div className="flex flex-col" style={{ height: 'calc(100dvh - 180px)', minHeight: 400 }}>
            {/* Topplinje */}
            <div className="flex justify-between items-center mb-3 shrink-0">
              <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: C.stone }}>
                Spørsmål ~{aiQuestionsAnswered + 1} av {pairs.length}
              </span>
              <button
                onClick={finishAIChat}
                disabled={aiGrading || aiMessages.length === 0}
                className="text-xs font-bold px-3 py-1.5 rounded-full border transition-all disabled:opacity-40"
                style={{ borderColor: 'rgba(42,64,54,0.15)', color: C.forest }}
              >
                {aiGrading ? (
                  <span className="flex items-center gap-1.5">
                    <span className="inline-block w-3 h-3 border-2 border-[rgba(42,64,54,0.2)] border-t-[#2A4036] rounded-full animate-spin" />
                    Vurderer...
                  </span>
                ) : 'Avslutt prøven →'}
              </button>
            </div>

            {/* Meldinger */}
            <div className="flex-1 overflow-y-auto space-y-3 pb-3">
              {aiMessages.map((msg, i) => (
                <div key={i} className={`flex gap-2 ${msg.role === 'elev' ? 'justify-end' : 'justify-start'}`}>
                  {msg.role === 'sensor' && (
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm shrink-0 mt-0.5" style={{ background: C.sage }}>🎓</div>
                  )}
                  <div
                    className="max-w-[85%] px-4 py-3 rounded-2xl text-sm leading-relaxed"
                    style={msg.role === 'sensor'
                      ? { background: C.white, color: C.text, border: '1px solid rgba(42,64,54,0.08)', borderRadius: '4px 18px 18px 18px' }
                      : { background: C.forest, color: 'white', borderRadius: '18px 18px 4px 18px' }
                    }
                  >
                    {msg.content}
                  </div>
                </div>
              ))}

              {aiSending && (
                <div className="flex gap-2 items-start">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm shrink-0" style={{ background: C.sage }}>🎓</div>
                  <div className="px-4 py-3 rounded-2xl flex items-center gap-1.5" style={{ background: C.white, border: '1px solid rgba(42,64,54,0.08)', borderRadius: '4px 18px 18px 18px' }}>
                    {[0, 1, 2].map(j => (
                      <span key={j} className="w-2 h-2 rounded-full inline-block animate-bounce" style={{ background: C.stone, animationDelay: `${j * 0.15}s` }} />
                    ))}
                  </div>
                </div>
              )}
              <div ref={aiChatEndRef} />
            </div>

            {/* Input */}
            <div className="shrink-0 pt-3" style={{ borderTop: '1px solid rgba(42,64,54,0.08)' }}>
              <div className="flex gap-2">
                <input
                  ref={aiInputRef}
                  type="text"
                  value={aiInput}
                  onChange={e => setAiInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendAIMessage(); } }}
                  disabled={aiSending || aiGrading}
                  maxLength={500}
                  placeholder="Skriv svaret ditt..."
                  className="flex-1 px-4 py-3 border rounded-xl text-sm outline-none disabled:opacity-60"
                  style={{ borderColor: 'rgba(42,64,54,0.15)', background: C.sand }}
                  autoComplete="off"
                />
                <button
                  onClick={sendAIMessage}
                  disabled={!aiInput.trim() || aiSending || aiGrading}
                  className="px-5 py-3 rounded-xl font-bold text-white text-sm shadow-md disabled:opacity-40 transition-all active:scale-[0.98]"
                  style={{ background: C.forest }}
                >
                  Send
                </button>
              </div>
              <div className="flex items-center justify-between mt-2">
                <p className="text-[11px]" style={{ color: C.stone }}>Teksten sendes til en AI-tjeneste. Ingen data lagres.</p>
                <CharCount len={aiInput.length} max={500} />
              </div>
            </div>
          </div>
        )}

        {/* ════════════════════════════════════ */}
        {/*  AI CHAT RESULTAT                   */}
        {/* ════════════════════════════════════ */}
        {phase === 'aiResult' && aiGrade && (
          <div className="text-center py-8">
            <div
              className="text-7xl font-black mb-2 leading-none"
              style={{ color: gradeColor(aiGrade.grade) }}
            >
              {aiGrade.grade}
            </div>
            <p className="text-sm font-bold uppercase tracking-widest mb-6" style={{ color: C.stone }}>Sensor-vurdering</p>

            <div className="text-left max-w-sm mx-auto space-y-3 mb-8">
              <div className="bg-white rounded-2xl border p-4 shadow-sm" style={{ borderColor: 'rgba(42,64,54,0.08)' }}>
                <p className="text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: C.fl }}>Oppsummering</p>
                <p className="text-sm leading-relaxed" style={{ color: C.ts }}>{aiGrade.summary}</p>
              </div>
              {aiGrade.improvements && (
                <div className="bg-white rounded-2xl border p-4 shadow-sm" style={{ borderColor: 'rgba(42,64,54,0.08)' }}>
                  <p className="text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: C.carry }}>Tips til forbedring</p>
                  <p className="text-sm leading-relaxed" style={{ color: C.ts }}>{aiGrade.improvements}</p>
                </div>
              )}
            </div>

            <div className="space-y-3 max-w-xs mx-auto">
              <button onClick={() => startAIChat(aiLevel)} className="w-full py-3 rounded-xl font-bold text-white shadow-md transition-all active:scale-[0.98]" style={{ background: C.forest }}>↻ Prøv igjen</button>
              <button onClick={() => setPhase('modeSelect')} className="w-full py-3 rounded-xl font-semibold transition-colors" style={{ color: C.stone }}>Bytt øvingsmodus</button>
            </div>
          </div>
        )}

        {/* ── Footer ── */}
        <div className="text-center mt-8 pb-6">
          <div className="flex items-center justify-center gap-2 mb-2">
            <div className="flex gap-1">
              <div style={{ width: 4, height: 16, background: C.fl, borderRadius: 1 }} />
              <div style={{ width: 4, height: 16, background: C.fl, borderRadius: 1 }} />
            </div>
            <span className="text-sm font-semibold font-serif" style={{ color: C.fl }}>Pratiro Skole</span>
          </div>
          <p className="text-xs" style={{ color: C.stone }}>
            <Link href="/personvern" className="no-underline hover:underline" style={{ color: C.stone }}>Personvern</Link>
            {' \u00b7 '}pratiro.no/skole &middot; &copy; 2026
          </p>
        </div>
      </div>
    </div>
  );
}
