import React from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'glass' | 'glow' | 'simple';
  interactive?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  variant = 'glass',
  interactive = false,
  className = '',
  style = {},
  ...props
}) => {
  let computedClassName = className;
  const inlineStyles: React.CSSProperties = { ...style };

  if (variant === 'glass') {
    computedClassName += " glass-card ";
  } else if (variant === 'glow') {
    computedClassName += " glow-card ";
    inlineStyles.background = "rgba(15, 23, 42, 0.7)";
    inlineStyles.borderRadius = "1.25rem";
    inlineStyles.border = "1px solid hsla(250, 84%, 67%, 0.3)";
    inlineStyles.boxShadow = "0 0 20px hsla(250, 84%, 67%, 0.1)";
  } else if (variant === 'simple') {
    computedClassName += " simple-card ";
    inlineStyles.background = "rgba(15, 23, 42, 0.6)";
    inlineStyles.borderRadius = "1.25rem";
    inlineStyles.border = "1px solid rgba(255, 255, 255, 0.04)";
  }

  if (interactive) {
    computedClassName += " cursor-pointer interactive ";
  }

  return (
    <div
      className={computedClassName}
      style={inlineStyles}
      {...props}
    >
      {children}
    </div>
  );
};
export default Card;
