import React from 'react';

interface ProgressBarProps {
  value: number; // 0-100
  color?: string;
  height?: string;
  showLabel?: boolean;
}

export function ProgressBar({ value, color, height = 'h-2', showLabel = false }: ProgressBarProps) {
  const clampedValue = Math.min(Math.max(value, 0), 100);

  const getColor = () => {
    if (color) return color;
    if (clampedValue >= 100) return 'bg-red-500';
    if (clampedValue >= 80) return 'bg-amber-500';
    return 'bg-gradient-to-r from-indigo-500 to-purple-500';
  };

  return (
    <div className="w-full">
      <div className={`w-full ${height} bg-slate-100 rounded-full overflow-hidden`}>
        <div
          className={`${height} ${getColor()} rounded-full transition-all duration-500`}
          style={{ width: `${clampedValue}%` }}
        />
      </div>
      {showLabel && (
        <span className="text-xs text-slate-500 mt-1 block text-right">{clampedValue}%</span>
      )}
    </div>
  );
}
