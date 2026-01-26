import { ReactNode } from 'react';
import { ArenaConfig } from '../../config/types';

interface ArenaCardProps {
  arena: ArenaConfig;
  onClick?: () => void;
  selected?: boolean;
  showStartButton?: boolean;
}

export function ArenaCard({ arena, onClick, selected, showStartButton = true }: ArenaCardProps) {
  const Icon = arena.icon;

  return (
    <button
      onClick={onClick}
      className={`
        relative flex flex-col text-left
        bg-white/5 rounded-2xl p-6 md:p-8
        min-h-[280px]
        transition-all duration-250 ease-out
        cursor-pointer
        border border-white/5
        overflow-hidden
        group

        hover:transform hover:-translate-y-2
        hover:bg-white/10
        hover:border-emerald-500/30
        hover:shadow-[0_0_40px_-10px_rgba(16,185,129,0.3)]

        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50 focus-visible:ring-offset-4 focus-visible:ring-offset-slate-900

        ${selected ? 'ring-2 ring-emerald-500 border-emerald-500/30 bg-white/10' : ''}
      `}
    >
      {/* Icon */}
      <div className="w-14 h-14 bg-emerald-500/20 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-inner border border-emerald-500/10">
        <Icon className="w-7 h-7 text-emerald-400" />
      </div>

      {/* Title */}
      <h3 className="text-xl font-brand font-bold text-white mb-2">
        {arena.name}
      </h3>

      {/* Description */}
      <p className="text-slate-400 text-sm leading-relaxed mb-5">
        {arena.description}
      </p>

      {/* Tags */}
      <div className="flex flex-wrap gap-2 mb-6">
        {arena.tags.map((tag) => (
          <span
            key={tag}
            className="bg-white/5 border border-white/10 px-3 py-1.5 rounded-full text-xs text-slate-300"
          >
            {tag}
          </span>
        ))}
      </div>

      {/* Start button */}
      {showStartButton && (
        <div className="mt-auto">
          <span className="inline-flex items-center gap-2 text-emerald-400 text-sm font-medium group-hover:text-emerald-300">
            Start samtale
            <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </span>
        </div>
      )}
    </button>
  );
}

// Simple card for config selections (scenarios, options)
interface SelectCardProps {
  title: string;
  description?: string;
  selected?: boolean;
  onClick?: () => void;
  children?: ReactNode;
}

export function SelectCard({ title, description, selected, onClick, children }: SelectCardProps) {
  return (
    <button
      onClick={onClick}
      className={`
        w-full p-4 rounded-xl border text-left
        transition-all duration-200
        ${selected
          ? 'border-emerald-500 bg-emerald-500/10 ring-1 ring-emerald-500 shadow-sm'
          : 'border-white/10 bg-white/5 hover:border-emerald-500/50 hover:bg-white/10'
        }
      `}
    >
      <div className="font-semibold text-white">{title}</div>
      {description && (
        <div className="text-xs text-slate-400 mt-1">{description}</div>
      )}
      {children}
    </button>
  );
}

// Card for displaying information sections
interface InfoCardProps {
  children: ReactNode;
  className?: string;
  variant?: 'default' | 'highlight' | 'success' | 'warning';
}

export function InfoCard({ children, className = '', variant = 'default' }: InfoCardProps) {
  const variantStyles = {
    default: 'bg-slate-800/50 border-white/10',
    highlight: 'bg-emerald-500/10 border-emerald-500/30',
    success: 'bg-green-500/10 border-green-500/30',
    warning: 'bg-amber-500/10 border-amber-500/30',
  };

  return (
    <div className={`
      p-6 rounded-2xl border shadow-sm
      ${variantStyles[variant]}
      ${className}
    `}>
      {children}
    </div>
  );
}
