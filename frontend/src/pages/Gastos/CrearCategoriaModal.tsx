import React, { useState } from 'react';
import { Modal } from '../../components/ui/Modal';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { apiClient } from '../../services/api';

interface Sugerencia {
  descripcion: string;
  meses: number;
  veces: number;
  importeMedio: number;
  categoriaActual: string;
}

interface Props {
  sugerencia: Sugerencia;
  onSuccess: () => void;
  onCancel: () => void;
}

const EMOJIS = ['🏷️', '🛒', '🏠', '🚗', '🎬', '💊', '👗', '🍽️', '📱', '📦', '✈️', '🎓', '💼', '🎮', '🐾', '🌿', '🍕', '☕'];
const COLORES = ['#6366f1', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#ef4444', '#8b5cf6', '#f97316', '#06b6d4', '#84cc16'];

export function CrearCategoriaModal({ sugerencia, onSuccess, onCancel }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [nombre, setNombre] = useState(sugerencia.descripcion);
  const [emoji, setEmoji] = useState('🏷️');
  const [color, setColor] = useState('#6366f1');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await apiClient.post('/usuarios/categorias', { nombre, emoji, tipo: 'GASTO', color });
      onSuccess();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al crear la categoría');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open onClose={onCancel} title="Nueva categoría personalizada" size="sm">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Contexto */}
        <div className="p-3 bg-indigo-50 rounded-xl text-sm text-indigo-700">
          Detectado en <strong>{sugerencia.veces} gastos</strong> durante{' '}
          <strong>{sugerencia.meses} meses</strong>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">{error}</div>
        )}

        {/* Nombre */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Nombre de la categoría</label>
          <input
            type="text"
            value={nombre}
            onChange={e => setNombre(e.target.value)}
            className="input-field"
            required
          />
        </div>

        {/* Preview */}
        <div className="flex items-center gap-3 p-3 rounded-xl border border-slate-100">
          <span className="text-2xl">{emoji}</span>
          <span
            className="text-sm font-medium px-3 py-1 rounded-full"
            style={{ backgroundColor: `${color}20`, color }}
          >
            {nombre || 'Nombre categoría'}
          </span>
        </div>

        {/* Emoji */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Emoji</label>
          <div className="flex flex-wrap gap-2">
            {EMOJIS.map(e => (
              <button
                key={e}
                type="button"
                onClick={() => setEmoji(e)}
                className={`text-xl p-1.5 rounded-lg transition-all ${emoji === e ? 'bg-indigo-100 ring-2 ring-indigo-400' : 'hover:bg-slate-100'}`}
              >
                {e}
              </button>
            ))}
          </div>
        </div>

        {/* Color */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Color</label>
          <div className="flex gap-2 flex-wrap">
            {COLORES.map(c => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                className={`w-8 h-8 rounded-full transition-all ${color === c ? 'ring-2 ring-offset-2 ring-slate-400 scale-110' : 'hover:scale-105'}`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <button type="button" onClick={onCancel} className="btn-secondary flex-1">Cancelar</button>
          <button type="submit" className="btn-primary flex-1 flex items-center justify-center gap-2" disabled={loading}>
            {loading ? <LoadingSpinner size="sm" /> : 'Crear categoría'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
