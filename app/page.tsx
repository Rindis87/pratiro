'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LandingPage() {
    const router = useRouter();
    const [accessCode, setAccessCode] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [error, setError] = useState(false);

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        if (accessCode.toLowerCase() === 'pratiro2024') {
            // VIKTIG: Vi lagrer adgangskortet i sessionStorage før vi går videre
            sessionStorage.setItem('pratiro_access', 'true');
            router.push('/simulator');
        } else {
            setError(true);
        }
    };

    return (
        <div className="min-h-screen bg-[#F0FDFA] text-slate-900 font-sans">
            
            {/* Navbar */}
            <nav className="fixed w-full z-50 py-6 px-6 md:px-12 flex justify-between items-center backdrop-blur-md bg-white/70 border-b border-teal-100">
                <div className="flex items-center gap-3">
                    <span className="font-serif text-3xl font-bold text-[#0F3F3B] tracking-tight">Pratiro</span>
                    <div className="flex gap-[5px] items-center h-6">
                        <div className="w-[4px] bg-teal-500 rounded-full h-5 animate-pulse"></div>
                        <div className="w-[4px] bg-teal-500 rounded-full h-5 animate-pulse delay-100"></div>
                    </div>
                </div>
                <button 
                    onClick={() => setShowModal(true)}
                    className="bg-[#0F3F3B] text-white px-6 py-2.5 rounded-full font-medium text-sm hover:bg-teal-900 transition shadow-lg hover:shadow-xl hover:-translate-y-0.5 transform"
                >
                    Logg inn
                </button>
            </nav>

            {/* Hero Section */}
            <section className="pt-40 pb-20 px-6 relative overflow-hidden">
                <div className="absolute top-20 left-[-10%] w-[500px] h-[500px] bg-teal-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
                <div className="absolute top-40 right-[-10%] w-[500px] h-[500px] bg-orange-100 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>

                <div className="max-w-4xl mx-auto text-center relative z-10">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-teal-100 shadow-sm mb-8">
                        <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                        <span className="text-xs font-bold tracking-wide text-slate-500 uppercase">Betaversjon tilgjengelig</span>
                    </div>

                    <h1 className="font-serif text-5xl md:text-7xl leading-[1.1] text-[#0F3F3B] mb-6">
                        Fra kaos til <br/>
                        <span className="italic text-teal-600">indre ro</span> i <br/>
                        en samtale.
                    </h1>
                    
                    <p className="text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed mb-10">
                        Pratiro er din treningsarena for foreldrelivet. Øv på de vanskelige situasjonene med vår AI, før du møter dem i virkeligheten.
                    </p>

                    <div className="flex justify-center">
                        <button 
                            onClick={() => setShowModal(true)}
                            className="bg-[#0F3F3B] text-white text-lg px-10 py-4 rounded-2xl hover:bg-teal-900 transition shadow-xl hover:shadow-2xl flex items-center gap-3 transform hover:-translate-y-1"
                        >
                            Prøv simulatoren
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
                        </button>
                    </div>
                </div>
            </section>

            {/* Login Modal */}
            {showModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
                    <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl animate-in fade-in zoom-in duration-300">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-2xl font-serif font-bold text-[#0F3F3B]">Velkommen inn</h3>
                            <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                            </button>
                        </div>
                        
                        <form onSubmit={handleLogin} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Tilgangskode</label>
                                <input 
                                    type="text" 
                                    value={accessCode}
                                    onChange={(e) => {setAccessCode(e.target.value); setError(false);}}
                                    placeholder="Skriv inn koden din..."
                                    className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition text-slate-900"
                                    autoFocus
                                />
                                {error && <p className="text-red-500 text-sm mt-2">Feil kode. Prøv "pratiro2024"</p>}
                            </div>
                            <button type="submit" className="w-full bg-teal-500 text-white py-3.5 rounded-xl font-bold hover:bg-teal-600 transition shadow-lg">
                                Lås opp simulatoren
                            </button>
                        </form>
                        <p className="text-center text-xs text-slate-400 mt-6">
                            Mangler du kode? Kontakt oss for tidlig tilgang.
                        </p>
                    </div>
                </div>
            )}

        </div>
    );
}