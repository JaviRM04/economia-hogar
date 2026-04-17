import React from 'react';

interface EmptyStateProps {
  emoji?: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function EmptyState({ emoji = '📭', title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="text-5xl mb-4">{emoji}</div>
      <h3 className="text-slate-700 font-semibold text-lg mb-1">{title}</h3>
      {description && <p className="text-slate-400 text-sm mb-6 max-w-xs">{description}</p>}
      {action}
    </div>
  );
}
