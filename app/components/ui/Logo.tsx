interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  color?: 'forest' | 'white';
  showText?: boolean;
  className?: string;
}

const sizeMap = {
  sm: { text: 'text-xl', icon: 'w-5 h-5' },
  md: { text: 'text-2xl', icon: 'w-6 h-6' },
  lg: { text: 'text-4xl', icon: 'w-10 h-10' },
  xl: { text: 'text-5xl', icon: 'w-12 h-12' },
};

const colorMap = {
  forest: { text: 'text-[#2D4A3E]', icon: 'text-[#3D6B5A]' },
  white: { text: 'text-white', icon: 'text-white/90' },
};

export function Logo({ size = 'md', color = 'forest', showText = true, className = '' }: LogoProps) {
  const sizes = sizeMap[size];
  const colors = colorMap[color];

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {showText && (
        <span
          className={`font-serif font-normal tracking-tight ${sizes.text} ${colors.text}`}
          style={{ fontFamily: 'var(--font-dm-serif), Georgia, serif' }}
        >
          Pratiro
        </span>
      )}
      <PauseIcon className={`${sizes.icon} ${colors.icon}`} />
    </div>
  );
}

export function PauseIcon({ className = '' }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 32 32"
      xmlns="http://www.w3.org/2000/svg"
      style={{ filter: 'drop-shadow(0 4px 8px rgba(61, 107, 90, 0.12))' }}
    >
      {/* Sharp corners (rx="0") as specified in the design */}
      <rect fill="currentColor" height="24" rx="0" width="7" x="6" y="4" />
      <rect fill="currentColor" height="24" rx="0" width="7" x="19" y="4" />
    </svg>
  );
}

export function LogoCorner({ className = '' }: { className?: string }) {
  return (
    <a
      href="/"
      className={`fixed top-4 left-4 z-20 flex items-baseline gap-2 ${className}`}
      aria-label="Pratiro – til forsiden"
    >
      <span
        className="text-xl text-[#2D4A3E] tracking-tight"
        style={{ fontFamily: 'var(--font-dm-serif), Georgia, serif' }}
      >
        Pratiro
      </span>
      <svg
        className="w-4 h-4 text-[#3D6B5A]"
        fill="none"
        viewBox="0 0 32 32"
        xmlns="http://www.w3.org/2000/svg"
        style={{ transform: 'translateY(2px)' }}
      >
        <rect fill="currentColor" height="24" rx="0" width="7" x="6" y="4" />
        <rect fill="currentColor" height="24" rx="0" width="7" x="19" y="4" />
      </svg>
    </a>
  );
}
