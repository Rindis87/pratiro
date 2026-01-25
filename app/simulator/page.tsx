'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useSimulator } from '../hooks/useSimulator';
import { isValidArenaId } from '../config/arenas';
import { ArenaId } from '../config/types';
import ConfigStep from '../components/ConfigStep';
import ChatStep from '../components/ChatStep';
import AnalysisStep from '../components/AnalysisStep';
import { PauseIcon } from '../components/ui/Logo';

// Icons
const RefreshIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 4 23 10 17 10" />
    <polyline points="1 20 1 14 7 14" />
    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
  </svg>
);

function SimulatorContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isAuthorized, setIsAuthorized] = useState(false);

  // Get arena from URL params, default to 'familie'
  const arenaParam = searchParams.get('arena') || 'familie';
  const arenaId: ArenaId = isValidArenaId(arenaParam) ? arenaParam : 'familie';

  const simulator = useSimulator(arenaId);

  // Auth check
  useEffect(() => {
    const access = sessionStorage.getItem('pratiro_access');
    if (access !== 'true') {
      router.push('/');
    } else {
      setIsAuthorized(true);
    }
  }, [router]);

  // Loading state while checking auth
  if (!isAuthorized) {
    return <div className="min-h-screen bg-[#F9F8F6]" />;
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-4 bg-[#F9F8F6]">
      <div className="w-full max-w-4xl bg-white rounded-3xl shadow-xl overflow-hidden min-h-[600px] flex flex-col relative border border-gray-100">

        {/* Header */}
        <div className="bg-[#2D4A3E] p-6 flex justify-between items-center text-white">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="bg-white/20 p-2 rounded-xl text-white hover:bg-white/30 transition"
            >
              <PauseIcon className="w-6 h-6" />
            </Link>
            <div>
              <h1
                className="text-2xl md:text-3xl font-normal tracking-tight"
                style={{ fontFamily: 'var(--font-dm-serif), Georgia, serif' }}
              >
                Pratiro
              </h1>
              <p className="text-white/70 text-xs font-medium uppercase tracking-wider">
                {simulator.arena.name}
              </p>
            </div>
          </div>

          {simulator.step > 1 && (
            <button
              onClick={simulator.reset}
              className="flex items-center gap-2 text-sm bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-lg transition"
            >
              <RefreshIcon /> Start på nytt
            </button>
          )}
        </div>

        {/* Step Content */}
        {simulator.step === 1 && (
          <ConfigStep
            arena={simulator.arena}
            config={simulator.config}
            updateConfig={simulator.updateConfig}
            scenarios={simulator.scenarios}
            scenario={simulator.scenario}
            setScenario={simulator.setScenario}
            customScenario={simulator.customScenario}
            setCustomScenario={simulator.setCustomScenario}
            onStart={simulator.startSimulation}
            isLoading={simulator.isLoading}
          />
        )}

        {simulator.step === 2 && (
          <ChatStep
            messages={simulator.messages}
            isTyping={simulator.isTyping}
            getChatLabel={simulator.getChatLabel}
            getTips={simulator.getTips}
            onSendMessage={simulator.sendMessage}
            onRunAnalysis={simulator.runAnalysis}
            maxMessageLength={simulator.maxMessageLength}
            maxMessages={simulator.maxMessages}
            messageCount={simulator.messageCount}
            isAtMessageLimit={simulator.isAtMessageLimit}
            limitWarning={simulator.limitWarning}
            onClearWarning={simulator.clearLimitWarning}
          />
        )}

        {simulator.step === 3 && (
          <AnalysisStep
            analysis={simulator.analysis}
            isAnalyzing={simulator.isAnalyzing}
            perspectiveTitle={simulator.arena.perspectiveTitle}
            onReset={simulator.reset}
          />
        )}
      </div>
    </main>
  );
}

// Wrap with Suspense for useSearchParams
export default function SimulatorPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#F9F8F6]" />}>
      <SimulatorContent />
    </Suspense>
  );
}
