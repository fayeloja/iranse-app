import React from 'react';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'success' | 'warning' | 'danger' | 'info' | 'neutral';
  size?: 'sm' | 'md';
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'neutral',
  size = 'md',
  className = '',
  style = {},
  ...props
}) => {
  const baseStyle = "inline-flex items-center justify-center font-semibold rounded-full tracking-wide";
  
  const sizes = {
    sm: "px-2 py-0.5 text-[10px]",
    md: "px-3 py-1 text-xs"
  };

  const inlineStyles: React.CSSProperties = { ...style };
  let computedClassName = `${baseStyle} ${sizes[size]} ${className}`;

  if (variant === 'success') {
    inlineStyles.background = "hsla(142, 72%, 45%, 0.15)";
    inlineStyles.color = "rgb(52, 211, 153)";
    inlineStyles.border = "1px solid hsla(142, 72%, 45%, 0.3)";
  } else if (variant === 'warning') {
    inlineStyles.background = "hsla(38, 92%, 50%, 0.15)";
    inlineStyles.color = "rgb(251, 191, 36)";
    inlineStyles.border = "1px solid hsla(38, 92%, 50%, 0.3)";
  } else if (variant === 'danger') {
    inlineStyles.background = "hsla(350, 89%, 60%, 0.15)";
    inlineStyles.color = "rgb(248, 113, 113)";
    inlineStyles.border = "1px solid hsla(350, 89%, 60%, 0.3)";
  } else if (variant === 'info') {
    inlineStyles.background = "hsla(190, 90%, 50%, 0.15)";
    inlineStyles.color = "rgb(34, 211, 238)";
    inlineStyles.border = "1px solid hsla(190, 90%, 50%, 0.3)";
  } else {
    inlineStyles.background = "rgba(255, 255, 255, 0.06)";
    inlineStyles.color = "hsl(215, 25%, 72%)";
    inlineStyles.border = "1px solid rgba(255, 255, 255, 0.1)";
  }

  return (
    <span
      className={computedClassName}
      style={inlineStyles}
      {...props}
    >
      {children}
    </span>
  );
};
export default Badge;
