interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  color?: 'forest' | 'white';
  showText?: boolean;
  className?: string;
}

const sizeMap = {
  sm: { text: 'text-lg', barH: 'h-[18px]', barW: 'w-[4px]', gap: 'gap-[3px]', logoGap: 'gap-[10px]' },
  md: { text: 'text-[1.6rem]', barH: 'h-[22px]', barW: 'w-[5px]', gap: 'gap-[4px]', logoGap: 'gap-[12px]' },
  lg: { text: 'text-[2.2rem]', barH: 'h-[26px]', barW: 'w-[5px]', gap: 'gap-[4px]', logoGap: 'gap-[12px]' },
  xl: { text: 'text-[2.5rem]', barH: 'h-[30px]', barW: 'w-[6px]', gap: 'gap-[4px]', logoGap: 'gap-[12px]' },
};

const colorMap = {
  forest: { text: 'text-[#2A4036]', bar: 'bg-[#2A4036]' },
  white: { text: 'text-white', bar: 'bg-white' },
};

export function Logo({ size = 'md', color = 'forest', showText = true, className = '' }: LogoProps) {
  const sizes = sizeMap[size];
  const colors = colorMap[color];

  return (
    <div className={`flex items-center ${sizes.logoGap} ${className}`}>
      <div className={`flex ${sizes.gap} items-center`} aria-hidden="true">
        <span className={`${sizes.barW} ${sizes.barH} ${colors.bar} block rounded-[1px]`}></span>
        <span className={`${sizes.barW} ${sizes.barH} ${colors.bar} block rounded-[1px]`}></span>
      </div>
      {showText && (
        <span className={`font-serif tracking-tight ${sizes.text} ${colors.text}`}>
          Pratiro
        </span>
      )}
    </div>
  );
}

export function LogoCorner({ className = '' }: { className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-html-link-for-pages
    <a
      href="/"
      className={`fixed top-4 left-4 z-20 ${className}`}
      aria-label="Pratiro – til forsiden"
    >
      <Logo size="sm" color="forest" />
    </a>
  );
}

// Product icon for simulator header: speech bubble with pause bars
export function ProductIcon({ className = '' }: { className?: string }) {
  return (
    <div
      className={`w-9 h-9 bg-white/15 rounded-tl-[12px] rounded-tr-[12px] rounded-br-[12px] rounded-bl-[4px] flex items-center justify-center gap-[4px] ${className}`}
    >
      <span className="w-[3px] h-[14px] bg-white rounded-[1px]"></span>
      <span className="w-[3px] h-[14px] bg-white rounded-[1px]"></span>
    </div>
  );
}
