import React from 'react';

export interface ProgressBarProps {
  value: number; // Percentage from 0 to 100
  height?: string;
  className?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  height = '6px',
  className = ''
}) => {
  const clampedValue = Math.max(0, Math.min(100, value));

  return (
    <div
      className={`w-full overflow-hidden rounded-full ${className}`}
      style={{
        height,
        background: 'rgba(255, 255, 255, 0.08)',
        border: '1px solid rgba(255, 255, 255, 0.04)'
      }}
    >
      <div
        className="h-full rounded-full transition-all duration-500 ease-out"
        style={{
          width: `${clampedValue}%`,
          background: 'linear-gradient(135deg, hsl(250, 84%, 67%) 0%, hsl(190, 90%, 50%) 100%)',
          boxShadow: '0 0 10px hsla(190, 90%, 50%, 0.4)'
        }}
      />
    </div>
  );
};
export default ProgressBar;
