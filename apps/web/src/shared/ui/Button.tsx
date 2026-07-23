import React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  fullWidth = false,
  className = '',
  disabled,
  ...props
}) => {
  const displayStyle = fullWidth ? "w-full flex" : "inline-flex";
  const baseStyle = `${displayStyle} items-center justify-center font-semibold transition-all duration-200 focus:outline-none rounded-xl active:scale-95 disabled:opacity-50 disabled:pointer-events-none disabled:transform-none`;

  const sizes = {
    sm: "px-4 py-2.5 text-xs min-h-[38px]",
    md: "px-5 py-3.5 text-sm min-h-[46px]",
    lg: "px-7 py-4 text-base min-h-[52px]",
  };

  // Build inline styles to ensure custom gradients and colors resolve perfectly 
  const inlineStyles: React.CSSProperties = {};
  let computedClassName = `${baseStyle} ${sizes[size]} `;

  if (variant === 'primary') {
    computedClassName += "text-white ";
    inlineStyles.background = "linear-gradient(135deg, hsl(250, 84%, 67%) 0%, hsl(190, 90%, 50%) 100%)";
    inlineStyles.boxShadow = "0 8px 30px -10px hsla(250, 84%, 67%, 0.4)";
    inlineStyles.border = "none";
  } else if (variant === 'secondary') {
    computedClassName += "text-white ";
    inlineStyles.background = "rgba(15, 23, 42, 0.45)";
    inlineStyles.border = "1px solid rgba(255, 255, 255, 0.08)";
    inlineStyles.backdropFilter = "blur(16px)";
  } else if (variant === 'danger') {
    computedClassName += "text-white ";
    inlineStyles.background = "hsl(350, 89%, 60%)";
    inlineStyles.boxShadow = "0 8px 30px -10px hsla(350, 89%, 60%, 0.3)";
    inlineStyles.border = "none";
  } else if (variant === 'ghost') {
    computedClassName += "text-slate-300 hover:text-white ";
    inlineStyles.background = "transparent";
    inlineStyles.border = "none";
  }

  return (
    <button
      disabled={disabled || isLoading}
      className={`${computedClassName} ${className}`}
      style={inlineStyles}
      {...props}
    >
      {isLoading ? (
        <span className="flex items-center gap-2">
          <svg className="animate-spin h-4 w-4 text-current" fill="none" viewBox="0 0 24 24" style={{ animation: 'spin 1s linear infinite' }}>
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          Loading...
        </span>
      ) : children}
    </button>
  );
};
export default Button;
