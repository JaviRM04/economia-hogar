import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Trash2, Edit2 } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Modal } from '../../components/ui/Modal';
import { Avatar } from '../../components/ui/Avatar';
import { EmptyState } from '../../components/ui/EmptyState';
import { PageLoader, LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { apiClient } from '../../services/api';
import { formatCurrency, formatDateShort, getMesActual } from '../../utils/format';
import { Ingreso, CategoriaIngreso, CATEGORIA_INGRESO_LABELS } from '../../types';
import { useAuth } from '../../store/auth';

interface IngresosResponse { ingresos: Ingreso[]; total: number; }
interface UsuarioInfo { id: string; nombre: string; avatarColor: string; }
interface ResumenIngresos { total: number; porUsuario: Record<string, number>; }

export function IngresosPage() {
  const { usuario } = useAuth();
  const [ingresos, setIngresos] = useState<Ingreso[]>([]);
  const [loading, setLoading] = useState(true);
  const [mes, setMes] = useState(getMesActual());
  const [usuarios, setUsuarios] = useState<UsuarioInfo[]>([]);
  const [resumen, setResumen] = useState<ResumenIngresos | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editando, setEditando] = useState<Ingreso | null>(null);

  const cargar = useCallback(async () => {
    setLoading(true);
    const [data, resData] = await Promise.all([
      apiClient.get<IngresosResponse>(`/ingresos?mes=${mes}`),
      apiClient.get<ResumenIngresos>(`/ingresos/resumen?mes=${mes}`),
    ]);
    setIngresos(data.ingresos);
    setResumen(resData);
    setLoading(false);
  }, [mes]);

  useEffect(() => { cargar(); }, [cargar]);
  useEffect(() => { apiClient.get<UsuarioInfo[]>('/auth/usuarios').then(setUsuarios); }, []);

  const handleEliminar = async (id: string) => {
    if (!confirm('¿Eliminar este ingreso?')) return;
    await apiClient.delete(`/ingresos/${id}`);
    cargar();
  };

  // Selector de meses (3 futuros + mes actual + 11 pasados)
  const meses: string[] = [];
  const ahora = new Date();
  for (let i = -3; i < 12; i++) {
    const f = new Date(ahora.getFullYear(), ahora.getMonth() - i, 1);
    meses.push(`${f.getFullYear()}-${String(f.getMonth() + 1).padStart(2, '0')}`);
  }

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Ingresos</h1>
          <p className="text-slate-500 text-sm mt-0.5">Total: {formatCurrency(resumen?.total || 0)}</p>
        </div>
        <button onClick={() => setShowForm(true)} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> <span className="hidden sm:inline">Añadir</span>
        </button>
      </div>

      {/* Resumen por persona */}
      {usuarios.length > 0 && resumen && (
        <div className="grid grid-cols-2 gap-4">
          {usuarios.map(u => (
            <Card key={u.id}>
              <div className="flex items-center gap-2.5 mb-1">
                <Avatar nombre={u.nombre} color={u.avatarColor} size="sm" />
                <span className="font-medium text-slate-900 text-sm">{u.nombre}</span>
              </div>
              <p className="text-xl font-bold text-green-600">{formatCurrency(resumen.porUsuario[u.id] || 0)}</p>
            </Card>
          ))}
        </div>
      )}

      {/* Filtro mes */}
      <select value={mes} onChange={e => setMes(e.target.value)} className="input-field max-w-xs">
        {meses.map(m => (
          <option key={m} value={m}>
            {new Date(m + '-01').toLocaleString('es-ES', { month: 'long', year: 'numeric' })}
          </option>
        ))}
      </select>

      {/* Lista */}
      {loading ? <PageLoader /> : ingresos.length === 0 ? (
        <EmptyState emoji="💰" title="Sin ingresos" description="Registra tus ingresos del mes" />
      ) : (
        <div className="space-y-2">
          {ingresos.map(ingreso => {
            const catInfo = CATEGORIA_INGRESO_LABELS[ingreso.categoria];
            return (
              <Card key={ingreso.id} className="p-4">
                <div className="flex items-center gap-3">
                  <Avatar nombre={ingreso.usuario.nombre} color={ingreso.usuario.avatarColor} size="md" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <p className="font-medium text-slate-900 truncate">{ingreso.descripcion}</p>
                      <p className="font-bold text-green-600 text-lg whitespace-nowrap ml-2">
                        +{formatCurrency(ingreso.importe)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs bg-green-50 text-green-600 px-2 py-0.5 rounded-full">
                        {catInfo.emoji} {catInfo.label}
                      </span>
                      <span className="text-xs text-slate-400">{formatDateShort(ingreso.fecha)}</span>
                    </div>
                  </div>
                  {ingreso.usuarioId === usuario?.id && (
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button onClick={() => setEditando(ingreso)}
                        className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleEliminar(ingreso.id)}
                        className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Modal formulario */}
      <Modal open={showForm || !!editando} onClose={() => { setShowForm(false); setEditando(null); }}
        title={editando ? 'Editar ingreso' : 'Nuevo ingreso'}>
        <IngresoForm
          ingreso={editando}
          usuarios={usuarios}
          defaultMes={mes}
          onSuccess={() => { setShowForm(false); setEditando(null); cargar(); }}
          onCancel={() => { setShowForm(false); setEditando(null); }}
        />
      </Modal>
    </div>
  );
}

function IngresoForm({ ingreso, usuarios, defaultMes, onSuccess, onCancel }: {
  ingreso?: Ingreso | null;
  usuarios: UsuarioInfo[];
  defaultMes?: string;
  onSuccess: () => void;
  onCancel: () => void;
}) {
  const { usuario } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    importe: ingreso ? String(ingreso.importe) : '',
    descripcion: ingreso?.descripcion || '',
    categoria: ingreso?.categoria || 'SALARIO' as CategoriaIngreso,
    fecha: ingreso ? ingreso.fecha.split('T')[0] : (() => {
      const hoy = new Date().toISOString().split('T')[0];
      if (defaultMes && defaultMes > hoy.substring(0, 7)) return `${defaultMes}-01`;
      return hoy;
    })(),
    usuarioId: ingreso?.usuarioId || usuario?.id || '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (ingreso) await apiClient.put(`/ingresos/${ingreso.id}`, { ...form, importe: Number(form.importe) });
      else await apiClient.post('/ingresos', { ...form, importe: Number(form.importe) });
      onSuccess();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error');
    } finally { setLoading(false); }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">{error}</div>}

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">Importe (€)</label>
        <input type="number" value={form.importe} onChange={e => setForm(f => ({ ...f, importe: e.target.value }))}
          className="input-field" step="0.01" min="0.01" required />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">Descripción</label>
        <input type="text" value={form.descripcion} onChange={e => setForm(f => ({ ...f, descripcion: e.target.value }))}
          className="input-field" required />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Categoría</label>
          <select value={form.categoria} onChange={e => setForm(f => ({ ...f, categoria: e.target.value as CategoriaIngreso }))}
            className="input-field">
            {Object.entries(CATEGORIA_INGRESO_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v.emoji} {v.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Fecha</label>
          <input type="date" value={form.fecha} onChange={e => setForm(f => ({ ...f, fecha: e.target.value }))}
            className="input-field" required />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">Usuario</label>
        <select value={form.usuarioId} onChange={e => setForm(f => ({ ...f, usuarioId: e.target.value }))}
          className="input-field">
          {usuarios.map(u => <option key={u.id} value={u.id}>{u.nombre}</option>)}
        </select>
      </div>

      <div className="flex gap-3 pt-2">
        <button type="button" onClick={onCancel} className="btn-secondary flex-1">Cancelar</button>
        <button type="submit" className="btn-primary flex-1 flex items-center justify-center gap-2" disabled={loading}>
          {loading ? <LoadingSpinner size="sm" /> : (ingreso ? 'Guardar' : 'Añadir')}
        </button>
      </div>
    </form>
  );
}
