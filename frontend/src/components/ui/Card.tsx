import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  glass?: boolean;
  onClick?: () => void;
}

export function Card({ children, className = '', glass = false, onClick }: CardProps) {
  const base = glass
    ? 'bg-white/70 backdrop-blur-sm border border-white/50'
    : 'bg-white border border-slate-100';

  return (
    <div
      className={`${base} rounded-2xl shadow-sm p-5 ${onClick ? 'cursor-pointer hover:shadow-md transition-shadow duration-200' : ''} ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
}
