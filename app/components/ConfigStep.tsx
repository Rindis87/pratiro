'use client';

import { ArenaConfig, ConfigField, Scenario } from '../config/types';
import { Button } from './ui/Button';
import { SelectCard } from './ui/Card';

interface ConfigStepProps {
  arena: ArenaConfig;
  config: Record<string, unknown>;
  updateConfig: (key: string, value: unknown) => void;
  scenarios: Scenario[];
  scenario: string;
  setScenario: (scenario: string) => void;
  customScenario: string;
  setCustomScenario: (customScenario: string) => void;
  onStart: () => void;
  isLoading: boolean;
}

export default function ConfigStep({
  arena,
  config,
  updateConfig,
  scenarios,
  scenario,
  setScenario,
  customScenario,
  setCustomScenario,
  onStart,
  isLoading,
}: ConfigStepProps) {
  const canStart = (scenario || customScenario) && !isLoading;

  return (
    <div className="p-4 md:p-10 flex-1 flex flex-col gap-6 md:gap-8 bg-[#FDFCFB] overflow-y-auto">
      {/* Header */}
      <div className="text-center mb-4">
        <h2 className="text-3xl font-sans font-bold text-[#2A4036] mb-2">
          {arena.id === 'familie'
            ? 'Hvem skal vi øve med?'
            : arena.id === 'arbeidsliv'
            ? 'Hvilken situasjon?'
            : arena.id === 'jobbintervju'
            ? 'Forbered intervjuet'
            : 'Forbered eksamen'}
        </h2>
        <p className="text-[#5C5F5C] max-w-md mx-auto">
          {arena.tagline}
        </p>
      </div>

      {/* Config Fields */}
      <div className="bg-[#F7F5F0] p-6 rounded-2xl border border-black/[0.06]">
        <div className="grid md:grid-cols-2 gap-6">
          {arena.configFields.map((field) => (
            <ConfigFieldComponent
              key={field.id}
              field={field}
              value={config[field.id]}
              onChange={(value) => updateConfig(field.id, value)}
            />
          ))}
        </div>
      </div>

      {/* Scenarios */}
      <div className="space-y-4">
        <label className="block text-sm font-semibold text-[#5C5F5C] uppercase tracking-wide">
          Velg en situasjon
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {scenarios.map((s) => (
            <SelectCard
              key={s.id}
              title={s.title}
              description={s.description}
              selected={scenario === s.title && !customScenario}
              onClick={() => {
                setScenario(s.title);
                setCustomScenario('');
              }}
            />
          ))}
        </div>

        {/* Custom scenario input */}
        <div className="relative mt-2">
          <input
            type="text"
            value={customScenario}
            onChange={(e) => setCustomScenario(e.target.value)}
            placeholder="...eller beskriv din egen situasjon her"
            className="w-full px-4 py-3 bg-white border border-black/[0.08] rounded-xl
                     focus:ring-2 focus:ring-[#2A4036]/30 focus:border-[#2A4036]
                     outline-none text-sm text-[#252825] placeholder-[#7D786D]"
          />
        </div>
      </div>

      {/* Start Button */}
      <Button
        onClick={onStart}
        disabled={!canStart}
        isLoading={isLoading}
        size="lg"
        className="w-full mt-2"
      >
        {isLoading ? 'Starter...' : 'Start samtalen'}
      </Button>
    </div>
  );
}

// Individual config field component
interface ConfigFieldComponentProps {
  field: ConfigField;
  value: unknown;
  onChange: (value: unknown) => void;
}

function ConfigFieldComponent({ field, value, onChange }: ConfigFieldComponentProps) {
  switch (field.type) {
    case 'slider':
      return (
        <div className="space-y-3">
          <label className="block text-sm font-semibold text-[#5C5F5C] uppercase tracking-wide">
            {field.label}:{' '}
            <span className="text-[#2A4036] text-xl ml-2 normal-case">
              {value as number} {field.id === 'age' ? 'år' : ''}
            </span>
          </label>
          <input
            type="range"
            min={field.min}
            max={field.max}
            step={field.step || 1}
            value={value as number}
            onChange={(e) => onChange(Number(e.target.value))}
            className="w-full h-2 bg-[#E7ECEA] rounded-lg appearance-none cursor-pointer accent-[#2A4036]"
          />
          <div className="flex justify-between text-xs text-[#7D786D] font-medium">
            <span>{field.min}</span>
            <span>{field.max}</span>
          </div>
        </div>
      );

    case 'buttons':
      return (
        <div className="space-y-3">
          <label className="block text-sm font-semibold text-[#5C5F5C] uppercase tracking-wide">
            {field.label}
          </label>
          <div className="flex gap-2 flex-wrap">
            {field.options?.map((option) => (
              <button
                key={option.value}
                onClick={() => onChange(option.value)}
                className={`flex-1 min-w-[100px] py-3 rounded-xl font-medium transition-all ${
                  value === option.value
                    ? 'bg-[#2A4036] text-white shadow-md border border-[rgba(42,64,54,0.3)]'
                    : 'bg-white text-[#252825] border border-black/[0.08] hover:border-[rgba(42,64,54,0.3)]'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      );

    case 'dropdown':
      return (
        <div className="space-y-3">
          <label className="block text-sm font-semibold text-[#5C5F5C] uppercase tracking-wide">
            {field.label}
          </label>
          <select
            value={value as string}
            onChange={(e) => onChange(e.target.value)}
            className="w-full px-4 py-3 bg-white border border-black/[0.08] rounded-xl
                     focus:ring-2 focus:ring-[#2A4036]/30 focus:border-[#2A4036]
                     outline-none text-sm text-[#252825] cursor-pointer"
          >
            {field.options?.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      );

    case 'text':
      return (
        <div className="space-y-3">
          <label className="block text-sm font-semibold text-[#5C5F5C] uppercase tracking-wide">
            {field.label}
          </label>
          <input
            type="text"
            value={(value as string) || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.placeholder}
            className="w-full px-4 py-3 bg-white border border-black/[0.08] rounded-xl
                     focus:ring-2 focus:ring-[#2A4036]/30 focus:border-[#2A4036]
                     outline-none text-sm text-[#252825] placeholder-[#7D786D]"
          />
        </div>
      );

    default:
      return null;
  }
}
