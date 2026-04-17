import React, { useState, useEffect } from 'react';
import { Plus, Target, PlusCircle } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Modal } from '../../components/ui/Modal';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { EmptyState } from '../../components/ui/EmptyState';
import { PageLoader, LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { Avatar } from '../../components/ui/Avatar';
import { apiClient } from '../../services/api';
import { formatCurrency, formatDate, calcularProgreso } from '../../utils/format';
import { Meta, EstadoMeta } from '../../types';

export function MetasPage() {
  const [metas, setMetas] = useState<Meta[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [aportando, setAportando] = useState<Meta | null>(null);

  const cargar = async () => {
    setLoading(true);
    const data = await apiClient.get<Meta[]>('/metas');
    setMetas(data);
    setLoading(false);
  };

  useEffect(() => { cargar(); }, []);

  const activas = metas.filter(m => m.estado === 'ACTIVA');
  const completadas = metas.filter(m => m.estado === 'COMPLETADA');
  const pausadas = metas.filter(m => m.estado === 'PAUSADA');

  const handleCambiarEstado = async (id: string, estado: EstadoMeta) => {
    await apiClient.patch(`/metas/${id}/estado`, { estado });
    cargar();
  };

  const handleEliminar = async (id: string) => {
    if (!confirm('¿Eliminar esta meta?')) return;
    await apiClient.delete(`/metas/${id}`);
    cargar();
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Metas de ahorro</h1>
          <p className="text-slate-500 text-sm mt-0.5">{activas.length} activa{activas.length !== 1 ? 's' : ''}</p>
        </div>
        <button onClick={() => setShowForm(true)} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> <span className="hidden sm:inline">Nueva meta</span>
        </button>
      </div>

      {loading ? <PageLoader /> : metas.length === 0 ? (
        <EmptyState emoji="🎯" title="Sin metas" description="Define tus objetivos de ahorro" />
      ) : (
        <>
          {/* Metas activas */}
          {activas.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">Activas</h2>
              <div className="grid sm:grid-cols-2 gap-4">
                {activas.map(m => (
                  <MetaCard key={m.id} meta={m}
                    onAportar={() => setAportando(m)}
                    onPausar={() => handleCambiarEstado(m.id, 'PAUSADA')}
                    onCompletar={() => handleCambiarEstado(m.id, 'COMPLETADA')}
                    onEliminar={() => handleEliminar(m.id)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Metas completadas */}
          {completadas.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">Completadas 🎉</h2>
              <div className="grid sm:grid-cols-2 gap-4">
                {completadas.map(m => (
                  <MetaCard key={m.id} meta={m} completada />
                ))}
              </div>
            </div>
          )}

          {/* Metas pausadas */}
          {pausadas.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">Pausadas</h2>
              <div className="grid sm:grid-cols-2 gap-4 opacity-60">
                {pausadas.map(m => (
                  <MetaCard key={m.id} meta={m}
                    onAportar={() => setAportando(m)}
                    onCompletar={() => handleCambiarEstado(m.id, 'ACTIVA')}
                  />
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Modal nueva meta */}
      <Modal open={showForm} onClose={() => setShowForm(false)} title="Nueva meta de ahorro">
        <MetaForm onSuccess={() => { setShowForm(false); cargar(); }} onCancel={() => setShowForm(false)} />
      </Modal>

      {/* Modal aportación */}
      <Modal open={!!aportando} onClose={() => setAportando(null)} title={`Aportar a "${aportando?.nombre}"`}>
        {aportando && (
          <AportacionForm meta={aportando}
            onSuccess={() => { setAportando(null); cargar(); }}
            onCancel={() => setAportando(null)}
          />
        )}
      </Modal>
    </div>
  );
}

function MetaCard({ meta, onAportar, onPausar, onCompletar, onEliminar, completada }: {
  meta: Meta;
  onAportar?: () => void;
  onPausar?: () => void;
  onCompletar?: () => void;
  onEliminar?: () => void;
  completada?: boolean;
}) {
  const progreso = calcularProgreso(Number(meta.importeActual), Number(meta.importeObjetivo));
  const falta = Math.max(0, Number(meta.importeObjetivo) - Number(meta.importeActual));

  return (
    <Card className="p-5">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <span className="text-2xl">{meta.emoji}</span>
          <div>
            <p className="font-semibold text-slate-900">{meta.nombre}</p>
            <div className="flex items-center gap-1 mt-0.5">
              <Avatar nombre={meta.usuario.nombre} color={meta.usuario.avatarColor} size="sm" />
              <span className="text-xs text-slate-400">{meta.usuario.nombre}</span>
            </div>
          </div>
        </div>
        {completada && <span className="text-lg">🏆</span>}
      </div>

      <ProgressBar value={progreso} height="h-3" showLabel />

      <div className="flex justify-between mt-2 mb-3 text-sm">
        <span className="text-slate-900 font-semibold">{formatCurrency(meta.importeActual)}</span>
        <span className="text-slate-400">{formatCurrency(meta.importeObjetivo)}</span>
      </div>

      {!completada && falta > 0 && (
        <p className="text-xs text-slate-400 mb-3">Faltan {formatCurrency(falta)}</p>
      )}

      {meta.fechaLimite && (
        <p className="text-xs text-slate-400 mb-3">🗓️ Hasta {formatDate(meta.fechaLimite)}</p>
      )}

      {/* Últimas aportaciones */}
      {meta.aportaciones.length > 0 && (
        <div className="space-y-1 mb-3">
          {meta.aportaciones.slice(0, 3).map(a => (
            <div key={a.id} className="flex justify-between text-xs">
              <span className="text-slate-500">{a.nota || 'Aportación'} · {a.usuario.nombre}</span>
              <span className="text-green-600 font-medium">+{formatCurrency(a.importe)}</span>
            </div>
          ))}
        </div>
      )}

      {/* Acciones */}
      {!completada && (
        <div className="flex gap-2 mt-2">
          {onAportar && (
            <button onClick={onAportar}
              className="flex-1 flex items-center justify-center gap-1.5 text-xs font-medium bg-indigo-50 text-indigo-600 py-2 rounded-xl hover:bg-indigo-100 transition-colors">
              <PlusCircle className="w-3.5 h-3.5" /> Aportar
            </button>
          )}
          {onPausar && (
            <button onClick={onPausar}
              className="px-3 text-xs text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors">
              Pausar
            </button>
          )}
          {onEliminar && (
            <button onClick={onEliminar}
              className="px-3 text-xs text-red-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors">
              Eliminar
            </button>
          )}
        </div>
      )}
    </Card>
  );
}

function MetaForm({ onSuccess, onCancel }: { onSuccess: () => void; onCancel: () => void }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ nombre: '', emoji: '🎯', importeObjetivo: '', fechaLimite: '' });

  const emojis = ['🎯', '🏖️', '🚗', '🏠', '✈️', '💻', '📱', '🛡️', '💰', '🎓'];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await apiClient.post('/metas', { ...form, importeObjetivo: Number(form.importeObjetivo), fechaLimite: form.fechaLimite || undefined });
      onSuccess();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error');
    } finally { setLoading(false); }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">{error}</div>}

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">Emoji</label>
        <div className="flex gap-2 flex-wrap">
          {emojis.map(e => (
            <button key={e} type="button" onClick={() => setForm(f => ({ ...f, emoji: e }))}
              className={`text-2xl p-2 rounded-xl transition-all ${form.emoji === e ? 'bg-indigo-100 ring-2 ring-indigo-400' : 'hover:bg-slate-100'}`}>
              {e}
            </button>
          ))}
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">Nombre de la meta</label>
        <input type="text" value={form.nombre} onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))}
          className="input-field" placeholder="Ej: Vacaciones de verano" required />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Importe objetivo (€)</label>
          <input type="number" value={form.importeObjetivo} onChange={e => setForm(f => ({ ...f, importeObjetivo: e.target.value }))}
            className="input-field" step="0.01" required />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Fecha límite (opcional)</label>
          <input type="date" value={form.fechaLimite} onChange={e => setForm(f => ({ ...f, fechaLimite: e.target.value }))}
            className="input-field" />
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <button type="button" onClick={onCancel} className="btn-secondary flex-1">Cancelar</button>
        <button type="submit" className="btn-primary flex-1 flex items-center justify-center gap-2" disabled={loading}>
          {loading ? <LoadingSpinner size="sm" /> : 'Crear meta'}
        </button>
      </div>
    </form>
  );
}

function AportacionForm({ meta, onSuccess, onCancel }: { meta: Meta; onSuccess: () => void; onCancel: () => void }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ importe: '', nota: '' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await apiClient.post(`/metas/${meta.id}/aportar`, { importe: Number(form.importe), nota: form.nota || undefined });
      onSuccess();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error');
    } finally { setLoading(false); }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">{error}</div>}

      <div className="p-4 bg-slate-50 rounded-xl">
        <div className="flex justify-between text-sm">
          <span className="text-slate-500">Progreso actual</span>
          <span className="font-medium">{formatCurrency(meta.importeActual)} / {formatCurrency(meta.importeObjetivo)}</span>
        </div>
        <ProgressBar value={calcularProgreso(Number(meta.importeActual), Number(meta.importeObjetivo))} height="h-2" className="mt-2" />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">Importe a aportar (€)</label>
        <input type="number" value={form.importe} onChange={e => setForm(f => ({ ...f, importe: e.target.value }))}
          className="input-field" step="0.01" required />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">Nota (opcional)</label>
        <input type="text" value={form.nota} onChange={e => setForm(f => ({ ...f, nota: e.target.value }))}
          className="input-field" placeholder="Ej: Ahorro de enero" />
      </div>

      <div className="flex gap-3 pt-2">
        <button type="button" onClick={onCancel} className="btn-secondary flex-1">Cancelar</button>
        <button type="submit" className="btn-primary flex-1 flex items-center justify-center gap-2" disabled={loading}>
          {loading ? <LoadingSpinner size="sm" /> : 'Aportar'}
        </button>
      </div>
    </form>
  );
}
