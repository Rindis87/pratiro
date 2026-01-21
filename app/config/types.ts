import { ComponentType } from 'react';

export type ArenaId = 'familie' | 'arbeidsliv' | 'jobbintervju' | 'eksamen';

export interface Scenario {
  id: string;
  title: string;
  description: string;
}

export interface ConfigFieldOption {
  value: string;
  label: string;
}

export interface ConfigField {
  id: string;
  type: 'slider' | 'buttons' | 'dropdown' | 'text';
  label: string;
  options?: ConfigFieldOption[];
  min?: number;
  max?: number;
  step?: number;
  default: string | number;
  placeholder?: string;
}

export interface ArenaConfig {
  id: ArenaId;
  name: string;
  tagline: string;
  description: string;
  icon: ComponentType<{ className?: string }>;
  color: string;
  tags: string[];

  configFields: ConfigField[];
  getScenarios: (config: Record<string, unknown>) => Scenario[];

  getRolePrompt: (config: Record<string, unknown>) => string;
  getStartPrompt: (config: Record<string, unknown>, scenario: string) => string;
  getContinuePrompt: (config: Record<string, unknown>, history: string) => string;
  getAnalysisPrompt: (config: Record<string, unknown>, history: string, scenario: string) => string;
  getAnalysisSystemPrompt: () => string;

  getTips: (config: Record<string, unknown>) => string;

  chatLabels: {
    user: string;
    ai: string;
    userDynamic?: (config: Record<string, unknown>) => string;
    aiDynamic?: (config: Record<string, unknown>) => string;
  };
  perspectiveTitle: string;
}

export interface Message {
  role: 'user' | 'ai' | 'system';
  content: string;
}

export interface Analysis {
  mainFeedback: string;
  strengths: string[];
  improvements: string[];
  perspective: string;
  score: number;
}

export interface SimulatorState {
  step: 1 | 2 | 3;
  config: Record<string, unknown>;
  scenario: string;
  customScenario: string;
  messages: Message[];
  analysis: Analysis | null;
  isLoading: boolean;
  isTyping: boolean;
  isAnalyzing: boolean;
}
