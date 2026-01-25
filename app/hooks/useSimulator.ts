'use client';

import { useState, useCallback, useMemo, useEffect } from 'react';
import { ArenaId, Message, Analysis, ArenaConfig } from '../config/types';
import { getArena } from '../config/arenas';
import { chatWithGemini } from '../actions';

// === SIKKERHETSKONFIGURASJON ===
const MAX_MESSAGES_PER_CONVERSATION = 50;
const MAX_MESSAGE_LENGTH = 1000;

// Generer en unik klient-ID for rate limiting
function getClientId(): string {
  if (typeof window === 'undefined') return 'server';

  let clientId = sessionStorage.getItem('pratiro_client_id');
  if (!clientId) {
    clientId = `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    sessionStorage.setItem('pratiro_client_id', clientId);
  }
  return clientId;
}

interface UseSimulatorReturn {
  // State
  step: 1 | 2 | 3;
  config: Record<string, unknown>;
  scenario: string;
  customScenario: string;
  messages: Message[];
  analysis: Analysis | null;
  isLoading: boolean;
  isTyping: boolean;
  isAnalyzing: boolean;
  limitWarning: string | null;

  // Arena
  arena: ArenaConfig;
  scenarios: ReturnType<ArenaConfig['getScenarios']>;

  // Config actions
  setConfig: (config: Record<string, unknown>) => void;
  updateConfig: (key: string, value: unknown) => void;
  setScenario: (scenario: string) => void;
  setCustomScenario: (customScenario: string) => void;

  // Simulation actions
  startSimulation: () => Promise<void>;
  sendMessage: (text: string) => Promise<{ success: boolean; error?: string }>;
  runAnalysis: () => Promise<void>;
  reset: () => void;
  clearLimitWarning: () => void;

  // Helpers
  getChatLabel: (role: 'user' | 'ai') => string;
  getTips: () => string;

  // Limits
  maxMessageLength: number;
  maxMessages: number;
  messageCount: number;
  isAtMessageLimit: boolean;
}

export function useSimulator(arenaId: ArenaId): UseSimulatorReturn {
  const arena = useMemo(() => getArena(arenaId), [arenaId]);

  // Initialize config with defaults from arena
  const initialConfig = useMemo(() => {
    const defaults: Record<string, unknown> = {};
    arena.configFields.forEach((field) => {
      defaults[field.id] = field.default;
    });
    return defaults;
  }, [arena]);

  // State
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [config, setConfig] = useState<Record<string, unknown>>(initialConfig);
  const [scenario, setScenario] = useState('');
  const [customScenario, setCustomScenario] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [limitWarning, setLimitWarning] = useState<string | null>(null);
  const [clientId, setClientId] = useState<string>('');

  // Hent clientId på klientsiden
  useEffect(() => {
    setClientId(getClientId());
  }, []);

  // Beregn antall bruker-meldinger (ekskluderer system og AI)
  const messageCount = useMemo(() =>
    messages.filter(m => m.role === 'user').length,
    [messages]
  );
  const isAtMessageLimit = messageCount >= MAX_MESSAGES_PER_CONVERSATION;

  // Computed
  const scenarios = useMemo(() => arena.getScenarios(config), [arena, config]);

  // Config actions
  const updateConfig = useCallback((key: string, value: unknown) => {
    setConfig((prev) => ({ ...prev, [key]: value }));
    // Reset scenario when config changes (scenarios might be different)
    setScenario('');
    setCustomScenario('');
  }, []);

  // Get chat labels (dynamic based on config)
  const getChatLabel = useCallback(
    (role: 'user' | 'ai'): string => {
      if (role === 'user') {
        return arena.chatLabels.userDynamic
          ? arena.chatLabels.userDynamic(config)
          : arena.chatLabels.user;
      } else {
        return arena.chatLabels.aiDynamic
          ? arena.chatLabels.aiDynamic(config)
          : arena.chatLabels.ai;
      }
    },
    [arena, config]
  );

  // Get tips for current config
  const getTips = useCallback(() => arena.getTips(config), [arena, config]);

  // Build history text for prompts
  const buildHistoryText = useCallback(
    (msgs: Message[]): string => {
      return msgs
        .filter((m) => m.role !== 'system')
        .map((m) => `${getChatLabel(m.role as 'user' | 'ai')}: ${m.content}`)
        .join('\n');
    },
    [getChatLabel]
  );

  // Start simulation
  const startSimulation = useCallback(async () => {
    const finalScenario = customScenario || scenario;
    if (!finalScenario || isLoading) return;

    setIsLoading(true);
    setLimitWarning(null);
    setStep(2);
    setMessages([
      { role: 'system', content: `Simulering startet: ${finalScenario}` },
    ]);
    setIsTyping(true);

    try {
      const rolePrompt = arena.getRolePrompt(config);
      const startPrompt = arena.getStartPrompt(config, finalScenario);

      const result = await chatWithGemini(startPrompt, rolePrompt, clientId);

      if (result.error) {
        setLimitWarning(result.error);
        setMessages((prev) => [...prev, { role: 'ai' as const, content: 'La oss prøve igjen om litt.' }]);
      } else if (result.text) {
        const aiResponse = result.text;
        setMessages((prev) => [...prev, { role: 'ai' as const, content: aiResponse }]);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: 'ai' as const, content: 'Beklager, noe gikk galt. Prøv igjen.' },
      ]);
    }

    setIsTyping(false);
    setIsLoading(false);
  }, [arena, config, customScenario, scenario, isLoading, clientId]);

  // Send message
  const sendMessage = useCallback(
    async (text: string): Promise<{ success: boolean; error?: string }> => {
      // Valider input
      if (!text.trim() || isTyping) {
        return { success: false, error: 'Kan ikke sende tom melding.' };
      }

      // Sjekk meldingslengde
      if (text.length > MAX_MESSAGE_LENGTH) {
        const error = `Meldingen er for lang. Maks ${MAX_MESSAGE_LENGTH} tegn.`;
        setLimitWarning(error);
        return { success: false, error };
      }

      // Sjekk maks antall meldinger
      if (isAtMessageLimit) {
        const error = `Du har nådd maks ${MAX_MESSAGES_PER_CONVERSATION} meldinger. Avslutt samtalen for å få veiledning.`;
        setLimitWarning(error);
        return { success: false, error };
      }

      setLimitWarning(null);
      const userMsg: Message = { role: 'user', content: text };
      setMessages((prev) => [...prev, userMsg]);
      setIsTyping(true);

      try {
        const allMessages = [...messages, userMsg];
        const historyText = buildHistoryText(allMessages);

        const rolePrompt = arena.getRolePrompt(config);
        const continuePrompt = arena.getContinuePrompt(config, historyText);

        const result = await chatWithGemini(continuePrompt, rolePrompt, clientId);

        if (result.error) {
          setLimitWarning(result.error);
          setMessages((prev) => [...prev, { role: 'ai' as const, content: 'La oss ta en liten pause.' }]);
          setIsTyping(false);
          return { success: false, error: result.error };
        } else if (result.text) {
          const aiResponse = result.text;
          setMessages((prev) => [...prev, { role: 'ai' as const, content: aiResponse }]);
        }
      } catch {
        setMessages((prev) => [
          ...prev,
          { role: 'ai' as const, content: 'Feil. Prøv igjen.' },
        ]);
        setIsTyping(false);
        return { success: false, error: 'Nettverksfeil' };
      }

      setIsTyping(false);
      return { success: true };
    },
    [arena, config, messages, isTyping, buildHistoryText, clientId, isAtMessageLimit]
  );

  // Clear limit warning
  const clearLimitWarning = useCallback(() => {
    setLimitWarning(null);
  }, []);

  // Run analysis
  const runAnalysis = useCallback(async () => {
    setIsAnalyzing(true);
    setLimitWarning(null);
    setStep(3);

    try {
      const historyText = buildHistoryText(messages);
      const finalScenario = customScenario || scenario;

      const analysisPrompt = arena.getAnalysisPrompt(
        config,
        historyText,
        finalScenario
      );
      const systemPrompt = arena.getAnalysisSystemPrompt();

      const result = await chatWithGemini(analysisPrompt, systemPrompt, clientId);

      if (result.error) {
        setAnalysis({
          mainFeedback: 'Feil ved analyse. Prøv igjen.',
          strengths: [],
          improvements: [],
          perspective: '',
          score: 0,
        });
      } else if (result.text) {
        try {
          // Clean the response and parse JSON
          const cleanedText = result.text
            .replace(/```json/g, '')
            .replace(/```/g, '')
            .trim();
          const parsed = JSON.parse(cleanedText);

          setAnalysis({
            mainFeedback: parsed.mainFeedback || '',
            strengths: parsed.strengths || [],
            improvements: parsed.improvements || [],
            perspective: parsed.perspective || parsed.childPerspective || '',
            score: parsed.score || 0,
          });
        } catch {
          setAnalysis({
            mainFeedback: 'Kunne ikke lese analysen. Prøv igjen.',
            strengths: [],
            improvements: [],
            perspective: '',
            score: 0,
          });
        }
      }
    } catch {
      setAnalysis({
        mainFeedback: 'Feil ved analyse. Prøv igjen.',
        strengths: [],
        improvements: [],
        perspective: '',
        score: 0,
      });
    }

    setIsAnalyzing(false);
  }, [arena, config, messages, customScenario, scenario, buildHistoryText]);

  // Reset
  const reset = useCallback(() => {
    setMessages([]);
    setAnalysis(null);
    setStep(1);
    setScenario('');
    setCustomScenario('');
    setLimitWarning(null);
  }, []);

  return {
    // State
    step,
    config,
    scenario,
    customScenario,
    messages,
    analysis,
    isLoading,
    isTyping,
    isAnalyzing,
    limitWarning,

    // Arena
    arena,
    scenarios,

    // Config actions
    setConfig,
    updateConfig,
    setScenario,
    setCustomScenario,

    // Simulation actions
    startSimulation,
    sendMessage,
    runAnalysis,
    reset,
    clearLimitWarning,

    // Helpers
    getChatLabel,
    getTips,

    // Limits
    maxMessageLength: MAX_MESSAGE_LENGTH,
    maxMessages: MAX_MESSAGES_PER_CONVERSATION,
    messageCount,
    isAtMessageLimit,
  };
}
