'use client';

import { useState, useCallback, useMemo } from 'react';
import { ArenaId, Message, Analysis, ArenaConfig } from '../config/types';
import { getArena } from '../config/arenas';
import { chatWithGemini } from '../actions';

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
  sendMessage: (text: string) => Promise<void>;
  runAnalysis: () => Promise<void>;
  reset: () => void;

  // Helpers
  getChatLabel: (role: 'user' | 'ai') => string;
  getTips: () => string;
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
    setStep(2);
    setMessages([
      { role: 'system', content: `Simulering startet: ${finalScenario}` },
    ]);
    setIsTyping(true);

    try {
      const rolePrompt = arena.getRolePrompt(config);
      const startPrompt = arena.getStartPrompt(config, finalScenario);

      const result = await chatWithGemini(startPrompt, rolePrompt);

      if (result.error) {
        const errorMsg =
          result.error === 'RATE_LIMIT'
            ? 'Pratiro trenger en liten tenkepause. Vent 1 minutt og prøv igjen.'
            : 'Beklager, noe gikk galt. Prøv igjen.';
        setMessages((prev) => [...prev, { role: 'ai', content: errorMsg }]);
      } else {
        setMessages((prev) => [...prev, { role: 'ai', content: result.text }]);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: 'ai', content: 'Beklager, noe gikk galt. Prøv igjen.' },
      ]);
    }

    setIsTyping(false);
    setIsLoading(false);
  }, [arena, config, customScenario, scenario, isLoading]);

  // Send message
  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim() || isTyping) return;

      const userMsg: Message = { role: 'user', content: text };
      setMessages((prev) => [...prev, userMsg]);
      setIsTyping(true);

      try {
        const allMessages = [...messages, userMsg];
        const historyText = buildHistoryText(allMessages);

        const rolePrompt = arena.getRolePrompt(config);
        const continuePrompt = arena.getContinuePrompt(config, historyText);

        const result = await chatWithGemini(continuePrompt, rolePrompt);

        if (result.error) {
          const errorMsg =
            result.error === 'RATE_LIMIT'
              ? 'Vent 1 minutt...'
              : 'Feil. Prøv igjen.';
          setMessages((prev) => [...prev, { role: 'ai', content: errorMsg }]);
        } else {
          setMessages((prev) => [...prev, { role: 'ai', content: result.text }]);
        }
      } catch {
        setMessages((prev) => [
          ...prev,
          { role: 'ai', content: 'Feil. Prøv igjen.' },
        ]);
      }

      setIsTyping(false);
    },
    [arena, config, messages, isTyping, buildHistoryText]
  );

  // Run analysis
  const runAnalysis = useCallback(async () => {
    setIsAnalyzing(true);
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

      const result = await chatWithGemini(analysisPrompt, systemPrompt);

      if (result.error) {
        setAnalysis({
          mainFeedback: 'Feil ved analyse. Prøv igjen.',
          strengths: [],
          improvements: [],
          perspective: '',
          score: 0,
        });
      } else {
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

    // Helpers
    getChatLabel,
    getTips,
  };
}
