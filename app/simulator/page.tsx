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
import { ProductIcon } from '../components/ui/Logo';

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
      setIsAuthorized(true); // eslint-disable-line react-hooks/set-state-in-effect
    }
  }, [router]);

  // Loading state while checking auth
  if (!isAuthorized) {
    return <div className="min-h-screen bg-[#F7F5F0]" />;
  }

  return (
    <main className="min-h-[100dvh] flex items-center justify-center p-0 md:p-4 bg-[#F7F5F0]">
      <div className="w-full max-w-4xl bg-white rounded-none md:rounded-[24px] overflow-hidden h-[100dvh] md:h-auto md:min-h-[600px] flex flex-col relative shadow-[0_25px_50px_-12px_rgba(42,64,54,0.12)] border-0 md:border md:border-black/[0.06]">

        {/* Header */}
        <div className={`bg-[#2A4036] p-3 md:p-6 flex justify-between items-center text-white shrink-0 ${simulator.step === 2 ? 'py-2 md:py-6' : ''}`}>
          <div className="flex items-center gap-2 md:gap-3">
            <Link href="/" className="block">
              <ProductIcon />
            </Link>
            <div>
              <h1 className={`font-sans font-medium tracking-tight text-white ${simulator.step === 2 ? 'text-lg md:text-xl' : 'text-xl md:text-xl'}`}>
                Pratiro Øving
              </h1>
              <p className={`text-white/80 ${simulator.step === 2 ? 'text-[10px] md:text-xs' : 'text-xs'}`}>
                {simulator.arena.name}
              </p>
            </div>
          </div>

          {simulator.step > 1 && (
            <button
              onClick={simulator.reset}
              className="flex items-center gap-1 md:gap-2 text-xs md:text-sm bg-white/15 hover:bg-white/25 px-3 md:px-3 py-2 md:py-1.5 min-h-[44px] rounded-lg transition font-medium"
            >
              <RefreshIcon /> <span className="hidden sm:inline">Start på nytt</span><span className="sm:hidden">Restart</span>
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
    <Suspense fallback={<div className="min-h-screen bg-[#F7F5F0]" />}>
      <SimulatorContent />
    </Suspense>
  );
}
