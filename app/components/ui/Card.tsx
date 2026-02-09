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
        bg-white rounded-[20px] p-6 md:p-8
        min-h-[280px]
        transition-all duration-250 ease-out
        cursor-pointer
        border border-black/[0.04]
        overflow-hidden
        group
        shadow-[0_10px_30px_-5px_rgba(42,64,54,0.06)]

        hover:transform hover:-translate-y-2
        hover:shadow-[0_25px_50px_-12px_rgba(42,64,54,0.12)]
        hover:border-[rgba(42,64,54,0.15)]

        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2A4036]/40 focus-visible:ring-offset-4 focus-visible:ring-offset-[#F7F5F0]

        ${selected ? 'ring-2 ring-[#2A4036] border-[rgba(42,64,54,0.2)] shadow-[0_25px_50px_-12px_rgba(42,64,54,0.12)]' : ''}
      `}
    >
      {/* Icon */}
      <div className="w-14 h-14 bg-[#E7ECEA] rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform border border-black/[0.04]">
        <Icon className="w-7 h-7 text-[#2A4036]" />
      </div>

      {/* Title */}
      <h3 className="text-xl font-sans font-bold text-[#252825] mb-2">
        {arena.name}
      </h3>

      {/* Description */}
      <p className="text-[#5C5F5C] text-sm leading-relaxed mb-5">
        {arena.description}
      </p>

      {/* Tags */}
      <div className="flex flex-wrap gap-2 mb-6">
        {arena.tags.map((tag) => (
          <span
            key={tag}
            className="bg-[#FDFCFB] border border-black/5 px-3 py-1.5 rounded-full text-xs text-[#5C5F5C]"
          >
            {tag}
          </span>
        ))}
      </div>

      {/* Start button */}
      {showStartButton && (
        <div className="mt-auto">
          <span className="inline-flex items-center gap-2 text-[#2A4036] text-sm font-medium group-hover:gap-3 transition-all">
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
          ? 'border-[#2A4036] bg-[rgba(42,64,54,0.06)] ring-1 ring-[#2A4036] shadow-sm'
          : 'border-black/[0.06] bg-white hover:border-[rgba(42,64,54,0.3)] hover:bg-[#FDFCFB]'
        }
      `}
    >
      <div className="font-semibold text-[#252825]">{title}</div>
      {description && (
        <div className="text-xs text-[#5C5F5C] mt-1">{description}</div>
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
    default: 'bg-white border-black/[0.06]',
    highlight: 'bg-[rgba(42,64,54,0.04)] border-[rgba(42,64,54,0.15)]',
    success: 'bg-green-50 border-green-200',
    warning: 'bg-amber-50 border-amber-200',
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
