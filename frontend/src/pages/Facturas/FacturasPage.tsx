import React, { useState, useEffect } from 'react';
import { Plus, CheckCircle, Circle, Trash2, Calendar } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Modal } from '../../components/ui/Modal';
import { BadgeCategoria } from '../../components/ui/Badge';
import { EmptyState } from '../../components/ui/EmptyState';
import { PageLoader, LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { apiClient } from '../../services/api';
import { formatCurrency, diasHastaFecha } from '../../utils/format';
import { FacturaRecurrente, CategoriaGasto, TipoGasto, CATEGORIA_GASTO_LABELS } from '../../types';
import { useAuth } from '../../store/auth';

interface UsuarioInfo { id: string; nombre: string; }

export function FacturasPage() {
  const { usuario } = useAuth();
  const [facturas, setFacturas] = useState<FacturaRecurrente[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [usuarios, setUsuarios] = useState<UsuarioInfo[]>([]);

  const cargar = async () => {
    setLoading(true);
    const data = await apiClient.get<FacturaRecurrente[]>('/facturas');
    setFacturas(data);
    setLoading(false);
  };

  useEffect(() => { cargar(); }, []);
  useEffect(() => { apiClient.get<UsuarioInfo[]>('/auth/usuarios').then(setUsuarios); }, []);

  const totalMensual = facturas.reduce((acc, f) => acc + Number(f.importe), 0);

  const handlePagar = async (id: string) => {
    const hoy = new Date();
    await apiClient.post(`/facturas/${id}/pagar`, { mes: hoy.getMonth() + 1, anio: hoy.getFullYear() });
    cargar();
  };

  const handleDesactivar = async (id: string) => {
    if (!confirm('¿Desactivar esta factura?')) return;
    await apiClient.delete(`/facturas/${id}`);
    cargar();
  };

  const estaPagadaEsteMes = (f: FacturaRecurrente) => {
    if (!f.pagos?.length) return false;
    const hoy = new Date();
    return f.pagos.some(p => p.mes === hoy.getMonth() + 1 && p.anio === hoy.getFullYear() && p.pagada);
  };

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Facturas recurrentes</h1>
          <p className="text-slate-500 text-sm mt-0.5">Total mensual: {formatCurrency(totalMensual)}</p>
        </div>
        <button onClick={() => setShowForm(true)} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> <span className="hidden sm:inline">Nueva</span>
        </button>
      </div>

      {loading ? <PageLoader /> : facturas.length === 0 ? (
        <EmptyState emoji="📋" title="Sin facturas" description="Añade tus facturas recurrentes para llevar el control" />
      ) : (
        <div className="space-y-3">
          {facturas.map(f => {
            const pagada = estaPagadaEsteMes(f);
            const diasRestantes = diasHastaFecha(f.diaMes);
            const urgente = diasRestantes <= 3 && !pagada;

            return (
              <Card key={f.id} className={`p-4 ${urgente ? 'border-amber-200 bg-amber-50/30' : ''}`}>
                <div className="flex items-start gap-3">
                  <button onClick={() => !pagada && handlePagar(f.id)}
                    className={`mt-0.5 flex-shrink-0 transition-colors ${pagada ? 'text-green-500' : 'text-slate-300 hover:text-green-400'}`}>
                    {pagada ? <CheckCircle className="w-6 h-6" /> : <Circle className="w-6 h-6" />}
                  </button>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <p className={`font-medium ${pagada ? 'text-slate-400 line-through' : 'text-slate-900'}`}>
                        {f.nombre}
                      </p>
                      <p className="font-bold text-slate-900 ml-2">{formatCurrency(f.importe)}</p>
                    </div>
                    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                      <BadgeCategoria categoria={f.categoria} />
                      <span className="text-xs text-slate-400 flex items-center gap-1">
                        <Calendar className="w-3 h-3" /> Día {f.diaMes}
                      </span>
                      {urgente && (
                        <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">
                          ⚡ {diasRestantes === 0 ? 'Hoy' : `${diasRestantes} días`}
                        </span>
                      )}
                      {pagada && (
                        <span className="text-xs bg-green-100 text-green-600 px-2 py-0.5 rounded-full">
                          ✓ Pagada este mes
                        </span>
                      )}
                    </div>
                  </div>

                  <button onClick={() => handleDesactivar(f.id)}
                    className="p-1.5 rounded-lg hover:bg-red-50 text-slate-300 hover:text-red-500 transition-colors flex-shrink-0">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <Modal open={showForm} onClose={() => setShowForm(false)} title="Nueva factura recurrente">
        <FacturaForm
          usuarios={usuarios}
          onSuccess={() => { setShowForm(false); cargar(); }}
          onCancel={() => setShowForm(false)}
        />
      </Modal>
    </div>
  );
}

function FacturaForm({ usuarios, onSuccess, onCancel }: {
  usuarios: UsuarioInfo[];
  onSuccess: () => void;
  onCancel: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    nombre: '',
    importe: '',
    diaMes: '1',
    categoria: 'HOGAR' as CategoriaGasto,
    tipo: 'COMUN' as TipoGasto,
    afectaAId: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await apiClient.post('/facturas', { ...form, importe: Number(form.importe), diaMes: Number(form.diaMes), afectaAId: form.afectaAId || undefined });
      onSuccess();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error');
    } finally { setLoading(false); }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">{error}</div>}

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">Nombre</label>
        <input type="text" value={form.nombre} onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))}
          className="input-field" placeholder="Ej: Netflix, Alquiler..." required />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Importe (€)</label>
          <input type="number" value={form.importe} onChange={e => setForm(f => ({ ...f, importe: e.target.value }))}
            className="input-field" step="0.01" required />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Día del mes</label>
          <input type="number" value={form.diaMes} onChange={e => setForm(f => ({ ...f, diaMes: e.target.value }))}
            className="input-field" min="1" max="31" required />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Categoría</label>
          <select value={form.categoria} onChange={e => setForm(f => ({ ...f, categoria: e.target.value as CategoriaGasto }))}
            className="input-field">
            {Object.entries(CATEGORIA_GASTO_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v.emoji} {v.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Tipo</label>
          <select value={form.tipo} onChange={e => setForm(f => ({ ...f, tipo: e.target.value as TipoGasto }))}
            className="input-field">
            <option value="COMUN">👥 Común</option>
            <option value="INDIVIDUAL">👤 Individual</option>
          </select>
        </div>
      </div>
      {form.tipo === 'INDIVIDUAL' && (
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Afecta a</label>
          <select value={form.afectaAId} onChange={e => setForm(f => ({ ...f, afectaAId: e.target.value }))}
            className="input-field">
            <option value="">Seleccionar usuario</option>
            {usuarios.map(u => <option key={u.id} value={u.id}>{u.nombre}</option>)}
          </select>
        </div>
      )}

      <div className="flex gap-3 pt-2">
        <button type="button" onClick={onCancel} className="btn-secondary flex-1">Cancelar</button>
        <button type="submit" className="btn-primary flex-1 flex items-center justify-center gap-2" disabled={loading}>
          {loading ? <LoadingSpinner size="sm" /> : 'Crear factura'}
        </button>
      </div>
    </form>
  );
}
