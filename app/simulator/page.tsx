'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation'; // <--- Ny import for å kunne kaste ut brukere
import { chatWithGemini } from '../actions';

// --- IKONER ---
const Icons = {
    User: () => (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/>
            <circle cx="12" cy="7" r="4"/>
        </svg>
    ),
    Child: () => (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M16.5 14.5a3.5 3.5 0 1 1-7 0"/>
            <circle cx="13" cy="7" r="4"/>
            <path d="M5.5 12.5V8.8a1.5 1.5 0 0 1 1.6-1.5h11.8a1.5 1.5 0 0 1 1.6 1.5v3.7"/>
            <path d="M5.5 12.5a6.6 6.6 0 0 0 13 0"/>
        </svg>
    ),
    Logo: () => (
        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            <path d="M8 10h.01"/>
            <path d="M12 10h.01"/>
            <path d="M16 10h.01"/>
        </svg>
    ),
    Send: () => (
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="22" y1="2" x2="11" y2="13"/>
            <polygon points="22 2 15 22 11 13 2 9 22 2"/>
        </svg>
    ),
    Brain: () => (
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
        </svg>
    ),
    Refresh: () => (
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="23 4 23 10 17 10"/>
            <polyline points="1 20 1 14 7 14"/>
            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
        </svg>
    ),
    Star: () => (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
        </svg>
    )
};

export default function PratiroSimulator() {
    const router = useRouter(); // <--- Ruter for å sende folk tilbake
    const [isAuthorized, setIsAuthorized] = useState(false); // <--- Sjekk om lov til å se
    const [step, setStep] = useState(1); 
    const [age, setAge] = useState(8);
    const [gender, setGender] = useState("Gutt");
    const [scenario, setScenario] = useState("");
    const [customScenario, setCustomScenario] = useState("");
    
    const [messages, setMessages] = useState<{role: string, content: string}[]>([]);
    const [input, setInput] = useState("");
    const [isTyping, setIsTyping] = useState(false);
    
    const [analysis, setAnalysis] = useState<any>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // --- SIKKERHETSSJEKK ---
    useEffect(() => {
        // Sjekk om brukeren har "adgangskortet" i sessionStorage
        const access = sessionStorage.getItem('pratiro_access');
        if (access !== 'true') {
            // Hvis ikke, send dem tilbake til forsiden
            router.push('/');
        } else {
            // Hvis ja, vis innholdet
            setIsAuthorized(true);
        }
    }, [router]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, isTyping]);

    // --- DYNAMIC SCENARIOS ---
    const currentScenarios = useMemo(() => {
        const ageNum = Number(age);
        if (ageNum >= 3 && ageNum <= 5) {
            return [
                { title: "Vil ikke kle på seg", desc: "Morgenkaos. Nekter å ta på parkdressen, vil bare leke." },
                { title: "Mat-trass", desc: "Liker plutselig ikke maten hen elsket i går. Kaster mat på gulvet." },
                { title: "Leggetid", desc: "Kommer ut av sengen for 14. gang. Tørst, redd, må tisse." },
                { title: "Butikk-hyling", desc: "Kaster seg ned på gulvet fordi hen ikke fikk sjokolade." },
            ];
        } else if (ageNum >= 6 && ageNum <= 9) {
            return [
                { title: "Skjermtid-nekt", desc: "Skal legge bort iPaden, men ignorerer deg totalt." },
                { title: "Lekser er kjedelig", desc: "Gråter over leksene og sier 'jeg får det ikke til'." },
                { title: "Rommet er et takras", desc: "Nekter å rydde. 'Det er ikke rotete!'." },
                { title: "Dårlig taper", desc: "Tapte i brettspill, ble sint og ødela spillet." },
            ];
        } else if (ageNum >= 10 && ageNum <= 13) {
            return [
                { title: "Gaming-avhengig", desc: "Sitter bare på rommet og spiller. Svarer ikke når du roper." },
                { title: "Holdning", desc: "Himler med øynene, svarer frekt eller ignorerer deg." },
                { title: "Dusjing og hygiene", desc: "Gidder ikke dusje eller pusse tenner uten mas." },
                { title: "Husarbeid", desc: "Skulle tømme oppvaskmaskinen for 3 timer siden." },
            ];
        } else { 
            return [
                { title: "Innetider", desc: "Kom hjem 2 timer for sent og svarte ikke på telefonen." },
                { title: "Penger", desc: "Bruker opp ukelønna på én dag og ber om mer." },
                { title: gender === 'Gutt' ? "Gaming hele natta" : "Sosiale medier", desc: gender === 'Gutt' ? "Snu døgnet pga gaming, kommer seg ikke opp til skolen." : "Drama på nettet, nekter å legge vekk mobilen om natta." },
                { title: "Respektløshet", desc: "Ber deg 'holde kjeft' eller smeller med dørene." }
            ];
        }
    }, [age, gender]);

    // START SIMULATION
    const startSimulation = async () => {
        const finalScenario = customScenario || scenario;
        if (!finalScenario) return;

        setStep(2);
        setMessages([
            { role: 'system', content: `Simulering startet: ${finalScenario} (${age} år, ${gender})` },
        ]);
        setIsTyping(true);

        const prompt = `Start rollespillet. Du er et barn på ${age} år (${gender}). Situasjonen er: "${finalScenario}". Du starter samtalen/konflikten med en replikk som passer din alder og situasjonen. Vær vanskelig eller emosjonell. Svar på norsk.`;
        const systemPrompt = `Du er en rollespill-bot som spiller et barn på ${age} år (${gender}). Oppfør deg realistisk utfra alder. Ikke gi deg med en gang.`;

        // Kaller server-funksjonen (action) i stedet for fetch direkte
        const result = await chatWithGemini(prompt, systemPrompt);

        if (result.error) {
            setMessages(prev => [...prev, { role: 'ai', content: result.error === "RATE_LIMIT" ? "Pratiro trenger en liten tenkepause. Vent 1 minutt og prøv igjen." : result.error }]);
        } else {
            setMessages(prev => [...prev, { role: 'ai', content: result.text }]);
        }
        setIsTyping(false);
    };

    // SEND MESSAGE
    const sendMessage = async () => {
        if (!input.trim()) return;
        
        const userMsg = { role: 'user', content: input };
        setMessages(prev => [...prev, userMsg]);
        setInput("");
        setIsTyping(true);

        const historyText = messages.concat(userMsg).filter(m => m.role !== 'system').map(m => 
            `${m.role === 'user' ? 'Forelder' : 'Barn'}: ${m.content}`
        ).join("\n");

        const prompt = `Her er samtalen så langt:\n${historyText}\n\nForelderen sa akkurat det siste over. Svar som barnet (${age} år). Hold deg i karakter. Vær kort (1-3 setninger).`;
        const systemPrompt = `Du er et barn på ${age} år. Fortsett konflikten/samtalen naturlig. Reager på det forelderen sier.`;

        // Kaller server-funksjonen
        const result = await chatWithGemini(prompt, systemPrompt);

        if (result.error) {
            setMessages(prev => [...prev, { role: 'ai', content: result.error === "RATE_LIMIT" ? "Vent 1 minutt..." : "Feil." }]);
        } else {
            setMessages(prev => [...prev, { role: 'ai', content: result.text }]);
        }
        setIsTyping(false);
    };

    // ANALYZE
    const runAnalysis = async () => {
        setIsAnalyzing(true);
        setStep(3);

        const historyText = messages.filter(m => m.role !== 'system').map(m => 
            `${m.role === 'user' ? 'Forelder' : 'Barn'}: ${m.content}`
        ).join("\n");

        const prompt = `
        Analyser denne samtalen mellom en forelder og et barn på ${age} år (${gender}).
        Situasjon: ${customScenario || scenario}.
        
        Samtale:
        ${historyText}

        Du er en ekspert i barnepsykologi og pedagogikk.
        Gi tilbakemelding i JSON format:
        {
            "mainFeedback": "Hovedinntrykk (bruk 'Pratiro' sin stemme: støttende og rolig)",
            "strengths": ["Bra ting 1", "Bra ting 2"],
            "improvements": ["Tips 1", "Tips 2"],
            "childPerspective": "Hva barnet følte",
            "score": 1-10
        }
        Svar på norsk.`;

        // Kaller server-funksjonen
        const result = await chatWithGemini(prompt, "Du er ekspert i barnepsykologi.");

        if (result.error) {
            setAnalysis({ mainFeedback: "Feil ved analyse.", strengths: [], improvements: [], score: 0, childPerspective: "" });
        } else {
            try {
                setAnalysis(JSON.parse(result.text.replace(/```json/g, '').replace(/```/g, '')));
            } catch {
                setAnalysis({ mainFeedback: "Kunne ikke lese analysen.", strengths: [], improvements: [], score: 0, childPerspective: "" });
            }
        }
        setIsAnalyzing(false);
    };

    const reset = () => {
        setMessages([]);
        setAnalysis(null);
        setStep(1);
    };

    // Hvis ikke autorisert ennå, vis ingenting (eller en spinner) for å unngå "flash"
    if (!isAuthorized) {
        return <div className="min-h-screen bg-[#F0FDFA]"></div>;
    }

    return (
        <main className="min-h-screen flex items-center justify-center p-4 bg-[#F0FDFA]">
            <div className="w-full max-w-4xl bg-white rounded-3xl shadow-2xl shadow-teal-100 overflow-hidden min-h-[600px] flex flex-col relative border border-teal-100">
                
                {/* Header - BRANDED */}
                <div className="bg-teal-500 p-6 flex justify-between items-center text-white">
                    <div className="flex items-center gap-3 cursor-default">
                        <Link href="/" className="bg-white/20 p-2 rounded-xl text-white hover:bg-white/30 transition"><Icons.Logo /></Link>
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight font-serif">Pratiro</h1>
                            <p className="text-teal-100 text-xs font-medium uppercase tracking-wider opacity-90">Simulatoren</p>
                        </div>
                    </div>
                    {step > 1 && (
                        <button onClick={reset} className="flex items-center gap-2 text-sm bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-lg transition">
                            <Icons.Refresh /> Start på nytt
                        </button>
                    )}
                </div>

                {/* STEP 1: CONFIGURATION */}
                {step === 1 && (
                    <div className="p-8 md:p-12 flex-1 flex flex-col gap-8 bg-white">
                        <div className="text-center mb-6">
                            <h2 className="text-3xl text-slate-800 font-bold mb-2 font-serif">Hvem skal vi øve med?</h2>
                            <p className="text-slate-500 max-w-md mx-auto">Velg alder og situasjon. Pratiro hjelper deg å finne roen i samtalen.</p>
                        </div>

                        {/* Age & Gender */}
                        <div className="bg-teal-50 p-6 rounded-2xl border border-teal-100 grid md:grid-cols-2 gap-8">
                            <div className="space-y-4">
                                <label className="block text-sm font-bold text-slate-700 uppercase tracking-wide">Barnets Alder: <span className="text-teal-600 text-xl ml-2">{age} år</span></label>
                                <input 
                                    type="range" min="3" max="18" value={age} 
                                    onChange={(e) => {
                                        setAge(Number(e.target.value));
                                        setScenario("");
                                    }}
                                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-teal-500"
                                />
                                <div className="flex justify-between text-xs text-slate-400 font-medium">
                                    <span>3 år</span>
                                    <span>10 år</span>
                                    <span>18 år</span>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <label className="block text-sm font-bold text-slate-700 uppercase tracking-wide">Kjønn</label>
                                <div className="flex gap-2">
                                    {['Gutt', 'Jente'].map(g => (
                                        <button 
                                            key={g}
                                            onClick={() => setGender(g)}
                                            className={`flex-1 py-3 rounded-xl font-medium transition-all ${
                                                gender === g ? 'bg-teal-500 text-white shadow-md' : 'bg-white text-slate-600 border border-slate-200 hover:border-teal-300'
                                            }`}
                                        >
                                            {g}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Scenarios */}
                        <div className="space-y-4">
                            <label className="block text-sm font-bold text-slate-700 uppercase tracking-wide">
                                Velg en utfordring
                            </label>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {currentScenarios.map((s) => (
                                    <button 
                                        key={s.title}
                                        onClick={() => { setScenario(s.title); setCustomScenario(""); }}
                                        className={`p-4 rounded-xl border text-left transition-all ${
                                            scenario === s.title && !customScenario
                                            ? 'border-teal-500 bg-teal-50 ring-1 ring-teal-500 shadow-sm' 
                                            : 'border-slate-200 hover:border-teal-300 hover:bg-slate-50'
                                        }`}
                                    >
                                        <div className="font-bold text-slate-800">{s.title}</div>
                                        <div className="text-xs text-slate-500 mt-1">{s.desc}</div>
                                    </button>
                                ))}
                            </div>
                            
                            <div className="relative mt-2">
                                <input 
                                    type="text" 
                                    value={customScenario}
                                    onChange={(e) => setCustomScenario(e.target.value)}
                                    placeholder="...eller beskriv din egen situasjon her"
                                    className="w-full pl-4 pr-4 py-3 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none text-sm text-slate-900 placeholder-slate-400"
                                />
                            </div>
                        </div>

                        <button 
                            onClick={startSimulation}
                            disabled={(!scenario && !customScenario)}
                            className="w-full bg-slate-900 hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed text-white text-lg font-bold py-4 rounded-xl shadow-xl shadow-slate-200 transition-all mt-2"
                        >
                            Start Pratiro
                        </button>
                    </div>
                )}

                {/* STEP 2: CHAT */}
                {step === 2 && (
                    <div className="flex flex-col h-[600px] bg-slate-50">
                        
                        <div className="bg-teal-50 px-4 py-2 text-xs text-teal-900 flex justify-center text-center border-b border-teal-100">
                            <span>
                                <b>Pratiro-tips:</b> 
                                {age < 6 ? " Anerkjenn følelsen først, så sett grensen." : 
                                 age < 13 ? " Lytt til argumentene, men vær tydelig voksen." : 
                                 " Pust med magen. Ikke la deg provosere."}
                            </span>
                        </div>

                        {/* Chat Area */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-6">
                            {messages.filter(m => m.role !== 'system').map((msg, idx) => (
                                <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`flex gap-3 max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 shadow-sm ${
                                            msg.role === 'user' ? 'bg-slate-800 text-white' : 'bg-white text-teal-500 border border-teal-100'
                                        }`}>
                                            {msg.role === 'user' ? <Icons.User /> : <Icons.Child />}
                                        </div>
                                        <div className={`p-4 shadow-sm text-[15px] leading-relaxed font-sans font-medium ${
                                            msg.role === 'user' 
                                                ? 'bg-slate-800 text-white rounded-l-2xl rounded-tr-2xl bubble-user' 
                                                : 'bg-white text-slate-700 border border-slate-200 rounded-r-2xl rounded-bl-2xl bubble-ai'
                                        }`}>
                                            {msg.content}
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {isTyping && (
                                <div className="flex justify-start ml-14">
                                    <div className="bg-slate-200 px-4 py-2 rounded-full flex gap-1 animate-pulse">
                                        <span className="w-1.5 h-1.5 bg-slate-400 rounded-full"></span>
                                        <span className="w-1.5 h-1.5 bg-slate-400 rounded-full"></span>
                                        <span className="w-1.5 h-1.5 bg-slate-400 rounded-full"></span>
                                    </div>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input Area */}
                        <div className="p-4 bg-white border-t border-slate-200 flex flex-col gap-3">
                            <div className="flex gap-2">
                                <input 
                                    type="text" 
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                                    placeholder="Skriv svaret ditt..."
                                    className="flex-1 bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-teal-500 text-slate-900 placeholder-slate-400 font-sans"
                                    autoFocus
                                />
                                <button 
                                    onClick={sendMessage} 
                                    disabled={!input.trim() || isTyping}
                                    className="bg-teal-500 hover:bg-teal-600 text-white p-3 rounded-xl transition-colors disabled:opacity-50"
                                >
                                    <Icons.Send />
                                </button>
                            </div>
                            
                            {/* NEW ANALYSIS BUTTON STYLE */}
                            <button 
                                onClick={runAnalysis}
                                className="w-full bg-teal-50 hover:bg-teal-100 text-teal-700 font-medium py-3 rounded-xl flex items-center justify-center gap-2 transition-colors mt-2 border border-teal-100"
                            >
                                <Icons.Brain />
                                Avslutt og få veiledning
                            </button>
                        </div>
                    </div>
                )}

                {/* STEP 3: ANALYSIS */}
                {step === 3 && (
                    <div className="flex-1 p-8 overflow-y-auto bg-slate-50">
                        {isAnalyzing ? (
                            <div className="h-full flex flex-col items-center justify-center space-y-4">
                                <div className="w-16 h-16 border-4 border-teal-200 border-t-teal-500 rounded-full animate-spin"></div>
                                <p className="text-slate-500 font-medium">Pratiro analyserer samtalen...</p>
                            </div>
                        ) : analysis ? (
                            <div className="max-w-2xl mx-auto space-y-8 fade-in">
                                
                                {/* Header Score */}
                                <div className="text-center">
                                    <div className="inline-flex items-center justify-center w-20 h-20 bg-white rounded-full shadow-md mb-4 border-4 border-teal-100">
                                        <span className={`text-3xl font-bold ${analysis.score >= 8 ? 'text-green-500' : analysis.score >= 5 ? 'text-yellow-500' : 'text-teal-500'}`}>
                                            {analysis.score}
                                        </span>
                                        <span className="text-xs text-slate-400 ml-1">/10</span>
                                    </div>
                                    <h2 className="text-2xl font-bold text-slate-800 font-serif">Pratiro Veiledning</h2>
                                    <p className="text-slate-600 mt-2 italic">"{analysis.mainFeedback}"</p>
                                </div>

                                {/* Barnets Perspektiv */}
                                <div className="bg-teal-50 border border-teal-200 p-6 rounded-2xl relative overflow-hidden">
                                    <div className="absolute top-0 right-0 -mt-2 -mr-2 bg-teal-100 w-16 h-16 rounded-full blur-xl opacity-50"></div>
                                    <h3 className="text-teal-900 font-bold text-sm uppercase tracking-wide mb-2 flex items-center gap-2">
                                        <Icons.Child /> Barnets opplevelse
                                    </h3>
                                    <p className="text-teal-900 leading-relaxed">
                                        {analysis.childPerspective}
                                    </p>
                                </div>

                                {/* Strengths & Improvements */}
                                <div className="grid md:grid-cols-2 gap-6">
                                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                                        <h3 className="text-green-600 font-bold text-sm uppercase mb-4 flex items-center gap-2">
                                            <Icons.Star /> Bra jobba!
                                        </h3>
                                        <ul className="space-y-2">
                                            {analysis.strengths.map((point: string, i: number) => (
                                                <li key={i} className="flex gap-2 text-sm text-slate-700">
                                                    <span className="text-green-500">✓</span> {point}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>

                                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                                        <h3 className="text-teal-600 font-bold text-sm uppercase mb-4 flex items-center gap-2">
                                            <Icons.Brain /> Prøv dette neste gang
                                        </h3>
                                        <ul className="space-y-2">
                                            {analysis.improvements.map((point: string, i: number) => (
                                                <li key={i} className="flex gap-2 text-sm text-slate-700">
                                                    <span className="text-teal-400">→</span> {point}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>

                                <div className="text-center pt-6">
                                    <button onClick={reset} className="bg-slate-900 text-white px-8 py-3 rounded-xl font-medium hover:bg-slate-800 transition-all shadow-lg">
                                        Øv på en ny situasjon
                                    </button>
                                </div>

                            </div>
                        ) : (
                            <div className="text-center text-red-500">Noe gikk galt. Prøv igjen.</div>
                        )}
                    </div>
                )}

            </div>
        </main>
    );
}