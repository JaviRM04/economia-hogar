import React from 'react';

interface AvatarProps {
  nombre: string;
  color: string;
  size?: 'sm' | 'md' | 'lg';
}

export function Avatar({ nombre, color, size = 'md' }: AvatarProps) {
  const sizes = { sm: 'w-7 h-7 text-xs', md: 'w-9 h-9 text-sm', lg: 'w-12 h-12 text-base' };
  const inicial = nombre.charAt(0).toUpperCase();

  return (
    <div
      className={`${sizes[size]} rounded-full flex items-center justify-center font-bold text-white flex-shrink-0`}
      style={{ backgroundColor: color }}
    >
      {inicial}
    </div>
  );
}
