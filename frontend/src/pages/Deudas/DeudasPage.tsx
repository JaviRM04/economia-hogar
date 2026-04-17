import React, { useState, useEffect } from 'react';
import { Plus, CheckCircle, SplitSquareHorizontal, Pencil, Trash2 } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Modal } from '../../components/ui/Modal';
import { Avatar } from '../../components/ui/Avatar';
import { EmptyState } from '../../components/ui/EmptyState';
import { PageLoader, LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { apiClient } from '../../services/api';
import { formatCurrency, formatDate } from '../../utils/format';
import { Deuda } from '../../types';

interface UsuarioInfo { id: string; nombre: string; avatarColor: string; }
interface BalanceNeto {
  neto: number;
  deudaU1aU2: number;
  deudaU2aU1: number;
  usuarios: UsuarioInfo[];
}

export function DeudasPage() {
  const [deudas, setDeudas] = useState<Deuda[]>([]);
  const [loading, setLoading] = useState(true);
  const [balance, setBalance] = useState<BalanceNeto | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [verHistorial, setVerHistorial] = useState(false);
  const [pagoParcialId, setPagoParcialId] = useState<string | null>(null);
  const [importeParcial, setImporteParcial] = useState('');
  const [loadingParcial, setLoadingParcial] = useState(false);
  const [editando, setEditando] = useState<Deuda | null>(null);
  const [editForm, setEditForm] = useState({ importe: '', concepto: '' });
  const [loadingEdit, setLoadingEdit] = useState(false);

  const cargar = async () => {
    setLoading(true);
    const [deudasData, balanceData] = await Promise.all([
      apiClient.get<Deuda[]>('/deudas'),
      apiClient.get<BalanceNeto>('/deudas/balance'),
    ]);
    setDeudas(deudasData);
    setBalance(balanceData);
    setLoading(false);
  };

  useEffect(() => { cargar(); }, []);

  const pendientes = deudas.filter(d => d.estado === 'PENDIENTE');
  const liquidadas = deudas.filter(d => d.estado === 'LIQUIDADA');
  const mostradas = verHistorial ? deudas : pendientes;

  const handleLiquidar = async (id: string) => {
    await apiClient.post(`/deudas/${id}/liquidar`, {});
    cargar();
  };

  const handleEditar = async () => {
    if (!editando) return;
    setLoadingEdit(true);
    try {
      await apiClient.put(`/deudas/${editando.id}`, { importe: Number(editForm.importe), concepto: editForm.concepto });
      setEditando(null);
      cargar();
    } finally { setLoadingEdit(false); }
  };

  const handleEliminar = async (id: string) => {
    if (!confirm('¿Eliminar esta deuda del historial?')) return;
    await apiClient.delete(`/deudas/${id}`);
    cargar();
  };

  const handlePagoParcial = async (id: string) => {
    const importe = parseFloat(importeParcial.replace(',', '.'));
    if (isNaN(importe) || importe <= 0) return;
    setLoadingParcial(true);
    try {
      await apiClient.post(`/deudas/${id}/pago-parcial`, { importePagado: importe });
      setPagoParcialId(null);
      setImporteParcial('');
      cargar();
    } finally { setLoadingParcial(false); }
  };

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Deudas</h1>
        <button onClick={() => setShowForm(true)} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> <span className="hidden sm:inline">Nueva</span>
        </button>
      </div>

      {/* Balance neto */}
      {balance && balance.usuarios.length >= 2 && (
        <Card className="bg-gradient-to-br from-indigo-50 to-purple-50 border-indigo-100">
          <h2 className="font-semibold text-slate-900 mb-3">Balance neto</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <Avatar nombre={balance.usuarios[0].nombre} color={balance.usuarios[0].avatarColor} size="lg" />
              <p className="font-medium text-slate-900 mt-2">{balance.usuarios[0].nombre}</p>
              <p className="text-sm text-red-500 font-medium">debe {formatCurrency(balance.deudaU1aU2)}</p>
            </div>
            <div className="text-center">
              <Avatar nombre={balance.usuarios[1].nombre} color={balance.usuarios[1].avatarColor} size="lg" />
              <p className="font-medium text-slate-900 mt-2">{balance.usuarios[1].nombre}</p>
              <p className="text-sm text-red-500 font-medium">debe {formatCurrency(balance.deudaU2aU1)}</p>
            </div>
          </div>
          {balance.neto !== 0 && (
            <div className="mt-4 text-center p-3 bg-white/60 rounded-xl">
              <p className="text-sm text-slate-600">
                Balance final:{' '}
                <span className="font-bold text-slate-900">
                  {balance.neto > 0
                    ? `${balance.usuarios[0].nombre} debe ${formatCurrency(Math.abs(balance.neto))} a ${balance.usuarios[1].nombre}`
                    : `${balance.usuarios[1].nombre} debe ${formatCurrency(Math.abs(balance.neto))} a ${balance.usuarios[0].nombre}`}
                </span>
              </p>
            </div>
          )}
          {balance.neto === 0 && balance.deudaU1aU2 === 0 && balance.deudaU2aU1 === 0 && (
            <p className="text-center text-sm text-green-600 font-medium mt-2">✨ Sin deudas pendientes</p>
          )}
        </Card>
      )}

      {/* Toggle historial */}
      <div className="flex gap-2">
        <button onClick={() => setVerHistorial(false)}
          className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${!verHistorial ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
          Pendientes ({pendientes.length})
        </button>
        <button onClick={() => setVerHistorial(true)}
          className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${verHistorial ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
          Historial ({liquidadas.length})
        </button>
      </div>

      {loading ? <PageLoader /> : mostradas.length === 0 ? (
        <EmptyState emoji="🤝" title={verHistorial ? 'Sin historial' : 'Sin deudas pendientes'} description={verHistorial ? '' : '¡Estáis al día!'} />
      ) : (
        <div className="space-y-3">
          {mostradas.map(d => (
            <Card key={d.id} className={`p-4 ${d.estado === 'LIQUIDADA' ? 'opacity-60' : ''}`}>
              <div className="flex items-start gap-3">
                <Avatar nombre={d.deudor.nombre} color={d.deudor.avatarColor} size="md" />
                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium text-slate-900">
                        <span style={{ color: d.deudor.avatarColor }}>{d.deudor.nombre}</span>
                        {' → '}
                        <span style={{ color: d.acreedor.avatarColor }}>{d.acreedor.nombre}</span>
                      </p>
                      <p className="text-sm text-slate-500 mt-0.5">{d.concepto}</p>
                    </div>
                    <p className="font-bold text-red-500 text-lg ml-2">{formatCurrency(d.importe)}</p>
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-400">{formatDate(d.fechaDeuda)}</span>
                      <button onClick={() => { setEditando(d); setEditForm({ importe: String(d.importe), concepto: d.concepto }); }}
                        className="p-1 rounded-lg hover:bg-slate-100 text-slate-300 hover:text-slate-500">
                        <Pencil className="w-3 h-3" />
                      </button>
                      <button onClick={() => handleEliminar(d.id)}
                        className="p-1 rounded-lg hover:bg-red-50 text-slate-300 hover:text-red-400">
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                    {d.estado === 'PENDIENTE' ? (
                      <div className="flex items-center gap-2">
                        {pagoParcialId === d.id ? (
                          <div className="flex items-center gap-1.5">
                            <div className="relative">
                              <input type="number" value={importeParcial} onChange={e => setImporteParcial(e.target.value)}
                                className="w-24 text-xs border border-slate-200 rounded-lg px-2 py-1.5 pr-5 focus:outline-none focus:ring-1 focus:ring-indigo-300"
                                placeholder="0" step="0.01" autoFocus />
                              <span className="absolute right-1.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs">€</span>
                            </div>
                            <button onClick={() => handlePagoParcial(d.id)} disabled={loadingParcial}
                              className="text-xs bg-amber-500 text-white px-2 py-1.5 rounded-lg hover:bg-amber-600">
                              {loadingParcial ? '...' : 'OK'}
                            </button>
                            <button onClick={() => { setPagoParcialId(null); setImporteParcial(''); }}
                              className="text-xs text-slate-400 hover:text-slate-600 px-1 py-1.5">✕</button>
                          </div>
                        ) : (
                          <>
                            <button onClick={() => { setPagoParcialId(d.id); setImporteParcial(''); }}
                              className="flex items-center gap-1 text-xs bg-amber-50 text-amber-600 px-2 py-1.5 rounded-full hover:bg-amber-100 transition-colors font-medium">
                              <SplitSquareHorizontal className="w-3 h-3" /> Parcial
                            </button>
                            <button onClick={() => handleLiquidar(d.id)}
                              className="flex items-center gap-1.5 text-xs bg-green-50 text-green-600 px-3 py-1.5 rounded-full hover:bg-green-100 transition-colors font-medium">
                              <CheckCircle className="w-3.5 h-3.5" /> Liquidar
                            </button>
                          </>
                        )}
                      </div>
                    ) : (
                      <span className="text-xs bg-green-100 text-green-600 px-2 py-0.5 rounded-full">
                        ✓ Liquidada {d.fechaLiquidacion ? formatDate(d.fechaLiquidacion) : ''}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Modal editar deuda */}
      <Modal open={!!editando} onClose={() => setEditando(null)} title="Editar deuda">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Importe (€)</label>
            <input type="number" value={editForm.importe} onChange={e => setEditForm(f => ({ ...f, importe: e.target.value }))}
              className="input-field" step="0.01" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Concepto</label>
            <input type="text" value={editForm.concepto} onChange={e => setEditForm(f => ({ ...f, concepto: e.target.value }))}
              className="input-field" required />
          </div>
          <div className="flex gap-3 pt-2">
            <button onClick={() => setEditando(null)} className="btn-secondary flex-1">Cancelar</button>
            <button onClick={handleEditar} disabled={loadingEdit}
              className="btn-primary flex-1 flex items-center justify-center gap-2">
              {loadingEdit ? <LoadingSpinner size="sm" /> : 'Guardar'}
            </button>
          </div>
        </div>
      </Modal>

      <Modal open={showForm} onClose={() => setShowForm(false)} title="Nueva deuda">
        <DeudaForm
          usuarios={balance?.usuarios || []}
          onSuccess={() => { setShowForm(false); cargar(); }}
          onCancel={() => setShowForm(false)}
        />
      </Modal>
    </div>
  );
}

function DeudaForm({ usuarios, onSuccess, onCancel }: {
  usuarios: UsuarioInfo[];
  onSuccess: () => void;
  onCancel: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    importe: '',
    concepto: '',
    deudorId: usuarios[0]?.id || '',
    acreedorId: usuarios[1]?.id || '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await apiClient.post('/deudas', { ...form, importe: Number(form.importe) });
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
          className="input-field" step="0.01" required />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">Concepto</label>
        <input type="text" value={form.concepto} onChange={e => setForm(f => ({ ...f, concepto: e.target.value }))}
          className="input-field" placeholder="Ej: Cena del sábado" required />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Deudor (quien debe)</label>
          <select value={form.deudorId} onChange={e => setForm(f => ({ ...f, deudorId: e.target.value }))} className="input-field">
            {usuarios.map(u => <option key={u.id} value={u.id}>{u.nombre}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Acreedor (a quien se debe)</label>
          <select value={form.acreedorId} onChange={e => setForm(f => ({ ...f, acreedorId: e.target.value }))} className="input-field">
            {usuarios.map(u => <option key={u.id} value={u.id}>{u.nombre}</option>)}
          </select>
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <button type="button" onClick={onCancel} className="btn-secondary flex-1">Cancelar</button>
        <button type="submit" className="btn-primary flex-1 flex items-center justify-center gap-2" disabled={loading}>
          {loading ? <LoadingSpinner size="sm" /> : 'Registrar deuda'}
        </button>
      </div>
    </form>
  );
}
