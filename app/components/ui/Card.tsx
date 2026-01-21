import { ReactNode } from 'react';
import { ArenaConfig } from '../../config/types';

interface ArenaCardProps {
  arena: ArenaConfig;
  onClick?: () => void;
  selected?: boolean;
  showStartButton?: boolean;
}

const colorMap: Record<string, { border: string; icon: string }> = {
  forest: { border: 'hover:before:bg-[#2D4A3E]', icon: 'text-[#2D4A3E]' },
  'forest-light': { border: 'hover:before:bg-[#3D6B5A]', icon: 'text-[#3D6B5A]' },
  ocean: { border: 'hover:before:bg-[#4A6B7C]', icon: 'text-[#4A6B7C]' },
  bark: { border: 'hover:before:bg-[#5C4D3C]', icon: 'text-[#5C4D3C]' },
};

export function ArenaCard({ arena, onClick, selected, showStartButton = true }: ArenaCardProps) {
  const colors = colorMap[arena.color] || colorMap.forest;
  const Icon = arena.icon;

  return (
    <button
      onClick={onClick}
      className={`
        relative flex flex-col text-left
        bg-[#F9F8F6] rounded-3xl p-6 md:p-8
        min-h-[320px]
        transition-all duration-250 ease-out
        cursor-pointer
        border border-black/8
        overflow-hidden

        before:content-[''] before:absolute before:top-0 before:left-0 before:right-0
        before:h-1 before:bg-[#2D4A3E]
        before:transform before:scale-x-0 before:origin-left
        before:transition-transform before:duration-250 before:ease-out

        hover:transform hover:-translate-y-2
        hover:shadow-[0_20px_60px_rgba(0,0,0,0.10)]
        hover:border-[rgba(45,74,62,0.20)]
        hover:before:scale-x-100

        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4A6B7C]/30 focus-visible:ring-offset-4

        ${colors.border}
        ${selected ? 'ring-2 ring-[#2D4A3E] before:scale-x-100' : ''}
      `}
    >
      {/* Icon */}
      <div className={`
        w-14 h-14 rounded-2xl
        bg-white shadow-sm
        flex items-center justify-center
        mb-6
      `}>
        <Icon className={`w-7 h-7 ${colors.icon}`} />
      </div>

      {/* Title */}
      <h3
        className="text-2xl text-[#2C2C2C] mb-3"
        style={{ fontFamily: 'var(--font-dm-serif), Georgia, serif' }}
      >
        {arena.name}
      </h3>

      {/* Description */}
      <p className="text-[#5A5A5A] text-sm leading-relaxed mb-5">
        {arena.description}
      </p>

      {/* Tags */}
      <div className="flex flex-wrap gap-2 mb-6">
        {arena.tags.map((tag) => (
          <span
            key={tag}
            className="bg-white px-3 py-1.5 rounded-full text-xs text-[#8B8578]"
          >
            {tag}
          </span>
        ))}
      </div>

      {/* Start button */}
      {showStartButton && (
        <div className="mt-auto">
          <span className="
            inline-flex items-center gap-2
            px-4 py-2.5 rounded-full
            bg-white border border-black/10
            text-[#2D4A3E] font-semibold text-sm
            shadow-sm
            group-hover:border-[rgba(45,74,62,0.22)]
            group-hover:shadow-md
          ">
            Start samtale
            <span className="font-bold">→</span>
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
          ? 'border-[#2D4A3E] bg-[#2D4A3E]/5 ring-1 ring-[#2D4A3E] shadow-sm'
          : 'border-gray-200 hover:border-[#3D6B5A] hover:bg-gray-50'
        }
      `}
    >
      <div className="font-semibold text-[#2C2C2C]">{title}</div>
      {description && (
        <div className="text-xs text-[#5A5A5A] mt-1">{description}</div>
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
    default: 'bg-white border-gray-100',
    highlight: 'bg-[#2D4A3E]/5 border-[#2D4A3E]/20',
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
