import React from 'react';
import { CATEGORIA_GASTO_LABELS, CategoriaGasto, CategoriaCustomInfo } from '../../types';

interface BadgeCategoriaProps {
  categoria: CategoriaGasto;
  categoriaCustom?: CategoriaCustomInfo | null;
}

export function BadgeCategoria({ categoria, categoriaCustom }: BadgeCategoriaProps) {
  // Si es personalizada y tenemos la info de la categoría custom, mostrarla
  if (categoria === 'PERSONALIZADA' && categoriaCustom) {
    return (
      <span
        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
        style={{ backgroundColor: `${categoriaCustom.color}20`, color: categoriaCustom.color }}
      >
        {categoriaCustom.emoji} {categoriaCustom.nombre}
      </span>
    );
  }

  const info = CATEGORIA_GASTO_LABELS[categoria] ?? CATEGORIA_GASTO_LABELS['OTROS'];
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
      style={{ backgroundColor: `${info.color}20`, color: info.color }}
    >
      {info.emoji} {info.label}
    </span>
  );
}

interface BadgeTipoProps {
  tipo: 'COMUN' | 'INDIVIDUAL';
}

export function BadgeTipo({ tipo }: BadgeTipoProps) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
      tipo === 'COMUN'
        ? 'bg-blue-50 text-blue-600'
        : 'bg-slate-100 text-slate-600'
    }`}>
      {tipo === 'COMUN' ? '👥 Común' : '👤 Individual'}
    </span>
  );
}
