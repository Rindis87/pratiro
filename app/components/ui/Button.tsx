import { ButtonHTMLAttributes, ReactNode } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  children: ReactNode;
  isLoading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}

const variantStyles = {
  primary: `
    bg-emerald-600 hover:bg-emerald-500 text-white
    shadow-lg shadow-emerald-900/30
    hover:shadow-xl hover:shadow-emerald-900/40
    disabled:bg-emerald-600/50
    border border-emerald-500/50
  `,
  secondary: `
    bg-slate-800 hover:bg-slate-700 text-white
    border border-white/10
    hover:border-white/20
    shadow-sm
    disabled:bg-slate-800/50
  `,
  outline: `
    bg-transparent hover:bg-emerald-500/10 text-emerald-400
    border-2 border-emerald-500
    disabled:border-emerald-500/30 disabled:text-emerald-500/30
  `,
  ghost: `
    bg-transparent hover:bg-white/10 text-white
    disabled:text-white/30
  `,
};

const sizeStyles = {
  sm: 'px-4 py-2 text-sm rounded-lg gap-1.5',
  md: 'px-6 py-3 text-base rounded-xl gap-2',
  lg: 'px-8 py-4 text-lg rounded-xl gap-2.5',
};

export function Button({
  variant = 'primary',
  size = 'md',
  children,
  isLoading = false,
  leftIcon,
  rightIcon,
  className = '',
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      className={`
        inline-flex items-center justify-center
        font-bold font-brand
        transition-all duration-200
        disabled:cursor-not-allowed disabled:opacity-60
        ${variantStyles[variant]}
        ${sizeStyles[size]}
        ${className}
      `}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <Spinner className="w-5 h-5" />
      ) : (
        <>
          {leftIcon && <span className="shrink-0">{leftIcon}</span>}
          {children}
          {rightIcon && <span className="shrink-0">{rightIcon}</span>}
        </>
      )}
    </button>
  );
}

function Spinner({ className = '' }: { className?: string }) {
  return (
    <svg
      className={`animate-spin ${className}`}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
}

// CTA Button with arrow icon
export function CTAButton({
  children,
  className = '',
  ...props
}: ButtonProps) {
  return (
    <Button
      variant="primary"
      size="lg"
      className={`rounded-full ${className}`}
      rightIcon={
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          viewBox="0 0 24 24"
        >
          <path d="M5 12h14M12 5l7 7-7 7" />
        </svg>
      }
      {...props}
    >
      {children}
    </Button>
  );
}
