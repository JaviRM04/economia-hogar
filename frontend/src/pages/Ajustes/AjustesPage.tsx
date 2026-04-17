import React, { useState, useEffect } from 'react';
import { User, Lock, Bell, Tag, BarChart2, Download, MessageCircle } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Avatar } from '../../components/ui/Avatar';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { apiClient } from '../../services/api';
import { formatCurrency, getMesActual } from '../../utils/format';
import { CATEGORIA_GASTO_LABELS, CategoriaGasto, Presupuesto } from '../../types';
import { useAuth } from '../../store/auth';

export function AjustesPage() {
  const { usuario, actualizarUsuario } = useAuth();
  const [activeTab, setActiveTab] = useState<'perfil' | 'telegram' | 'presupuestos'>('perfil');

  return (
    <div className="space-y-5 animate-fade-in">
      <h1 className="text-2xl font-bold text-slate-900">Ajustes</h1>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {[
          { id: 'perfil', label: 'Perfil', icon: User },
          { id: 'telegram', label: 'Telegram', icon: MessageCircle },
          { id: 'presupuestos', label: 'Presupuestos', icon: BarChart2 },
        ].map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => setActiveTab(id as typeof activeTab)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
              activeTab === id ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}>
            <Icon className="w-4 h-4" /> {label}
          </button>
        ))}
      </div>

      {activeTab === 'perfil' && <PerfilTab />}
      {activeTab === 'telegram' && <TelegramTab />}
      {activeTab === 'presupuestos' && <PresupuestosTab />}

      {/* Exportar datos */}
      <Card>
        <h2 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
          <Download className="w-4 h-4 text-slate-400" /> Exportar datos
        </h2>
        <ExportarSection />
      </Card>
    </div>
  );
}

function PerfilTab() {
  const { usuario, actualizarUsuario } = useAuth();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    nombre: usuario?.nombre || '',
    email: usuario?.email || '',
  });
  const [passForm, setPassForm] = useState({ passwordActual: '', passwordNueva: '', confirmar: '' });

  const handleGuardar = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const updated = await apiClient.put<typeof usuario>('/auth/perfil', form);
      if (updated) actualizarUsuario(updated as any);
      setSuccess('Perfil actualizado correctamente');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error');
    } finally { setLoading(false); }
  };

  const handleCambiarPass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passForm.passwordNueva !== passForm.confirmar) {
      setError('Las contraseñas no coinciden'); return;
    }
    setLoading(true);
    setError('');
    try {
      await apiClient.put('/auth/perfil/password', { passwordActual: passForm.passwordActual, passwordNueva: passForm.passwordNueva });
      setPassForm({ passwordActual: '', passwordNueva: '', confirmar: '' });
      setSuccess('Contraseña cambiada correctamente');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error');
    } finally { setLoading(false); }
  };

  return (
    <div className="space-y-4">
      {success && <div className="p-3 bg-green-50 border border-green-200 rounded-xl text-sm text-green-600">{success}</div>}
      {error && <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">{error}</div>}

      <Card>
        <div className="flex items-center gap-4 mb-5">
          {usuario && <Avatar nombre={usuario.nombre} color={usuario.avatarColor} size="lg" />}
          <div>
            <p className="font-semibold text-slate-900">{usuario?.nombre}</p>
            <p className="text-sm text-slate-400">{usuario?.email}</p>
          </div>
        </div>

        <form onSubmit={handleGuardar} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Nombre</label>
            <input type="text" value={form.nombre} onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))}
              className="input-field" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Email</label>
            <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              className="input-field" required />
          </div>
          <button type="submit" className="btn-primary flex items-center justify-center gap-2" disabled={loading}>
            {loading ? <LoadingSpinner size="sm" /> : 'Guardar cambios'}
          </button>
        </form>
      </Card>

      <Card>
        <h3 className="font-medium text-slate-900 mb-4 flex items-center gap-2">
          <Lock className="w-4 h-4 text-slate-400" /> Cambiar contraseña
        </h3>
        <form onSubmit={handleCambiarPass} className="space-y-3">
          <input type="password" value={passForm.passwordActual} onChange={e => setPassForm(f => ({ ...f, passwordActual: e.target.value }))}
            className="input-field" placeholder="Contraseña actual" required />
          <input type="password" value={passForm.passwordNueva} onChange={e => setPassForm(f => ({ ...f, passwordNueva: e.target.value }))}
            className="input-field" placeholder="Nueva contraseña" required />
          <input type="password" value={passForm.confirmar} onChange={e => setPassForm(f => ({ ...f, confirmar: e.target.value }))}
            className="input-field" placeholder="Confirmar nueva contraseña" required />
          <button type="submit" className="btn-secondary flex items-center justify-center gap-2 w-full" disabled={loading}>
            {loading ? <LoadingSpinner size="sm" /> : 'Cambiar contraseña'}
          </button>
        </form>
      </Card>
    </div>
  );
}

function TelegramTab() {
  const { usuario, actualizarUsuario } = useAuth();
  const [telegramId, setTelegramId] = useState(usuario?.telegramId || '');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');

  const handleGuardar = async () => {
    setLoading(true);
    try {
      const updated = await apiClient.put<typeof usuario>('/auth/perfil', { telegramId });
      if (updated) actualizarUsuario(updated as any);
      setSuccess('Telegram ID guardado');
      setTimeout(() => setSuccess(''), 3000);
    } finally { setLoading(false); }
  };

  return (
    <Card>
      <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
        <MessageCircle className="w-4 h-4 text-blue-500" /> Configuración de Telegram
      </h3>
      {success && <div className="mb-3 p-3 bg-green-50 border border-green-200 rounded-xl text-sm text-green-600">{success}</div>}

      <div className="p-4 bg-blue-50 rounded-xl mb-4 text-sm text-blue-700">
        <p className="font-medium mb-1">Cómo obtener tu Telegram ID:</p>
        <ol className="list-decimal list-inside space-y-1">
          <li>Abre Telegram y busca <strong>@userinfobot</strong></li>
          <li>Escríbele cualquier mensaje</li>
          <li>Te responderá con tu ID numérico</li>
        </ol>
      </div>

      <div className="space-y-3">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Tu Telegram ID</label>
          <input type="text" value={telegramId} onChange={e => setTelegramId(e.target.value)}
            className="input-field" placeholder="Ej: 123456789" />
        </div>
        <button onClick={handleGuardar} className="btn-primary flex items-center justify-center gap-2 w-full" disabled={loading}>
          {loading ? <LoadingSpinner size="sm" /> : 'Guardar Telegram ID'}
        </button>
      </div>
    </Card>
  );
}

function PresupuestosTab() {
  const [presupuestos, setPresupuestos] = useState<Presupuesto[]>([]);
  const [editando, setEditando] = useState<string | null>(null);
  const [valor, setValor] = useState('');
  const [mes] = useState(getMesActual());

  const cargar = async () => {
    const data = await apiClient.get<Presupuesto[]>(`/usuarios/presupuestos?mes=${mes}`);
    setPresupuestos(data);
  };

  useEffect(() => { cargar(); }, []);

  const handleGuardar = async (categoria: CategoriaGasto) => {
    await apiClient.put('/usuarios/presupuestos', { categoria, importe: Number(valor) });
    setEditando(null);
    setValor('');
    cargar();
  };

  const handleEliminar = async (categoria: CategoriaGasto) => {
    await apiClient.delete(`/usuarios/presupuestos/${categoria}`);
    cargar();
  };

  // Categorías sin presupuesto asignado
  const categoriasConPresupuesto = presupuestos.map(p => p.categoria);
  const categoriasSin = (Object.keys(CATEGORIA_GASTO_LABELS) as CategoriaGasto[]).filter(c => !categoriasConPresupuesto.includes(c));

  return (
    <div className="space-y-4">
      <Card>
        <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
          <BarChart2 className="w-4 h-4 text-slate-400" /> Presupuesto mensual por categoría
        </h3>
        <p className="text-sm text-slate-500 mb-4">Recibirás alertas al 80% y 100% de cada presupuesto.</p>

        {presupuestos.length === 0 ? (
          <p className="text-sm text-slate-400 py-4 text-center">No hay presupuestos configurados</p>
        ) : (
          <div className="space-y-3 mb-4">
            {presupuestos.map(p => {
              const info = CATEGORIA_GASTO_LABELS[p.categoria];
              return (
                <div key={p.categoria} className="flex items-center gap-3">
                  <span className="text-lg w-8 text-center">{info.emoji}</span>
                  <div className="flex-1">
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium text-slate-700">{info.label}</span>
                      <span className="text-sm text-slate-500">{formatCurrency(p.gastado)} / {formatCurrency(p.importe)}</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-1.5 rounded-full transition-all ${p.alerta === 'EXCEDIDO' ? 'bg-red-500' : p.alerta === 'AVISO' ? 'bg-amber-500' : 'bg-indigo-500'}`}
                        style={{ width: `${Math.min(p.porcentaje, 100)}%` }}
                      />
                    </div>
                    {p.alerta !== 'OK' && (
                      <p className={`text-xs mt-0.5 ${p.alerta === 'EXCEDIDO' ? 'text-red-500' : 'text-amber-500'}`}>
                        {p.alerta === 'EXCEDIDO' ? '⚠️ Presupuesto excedido' : '⚡ 80% del presupuesto alcanzado'}
                      </p>
                    )}
                  </div>
                  <button onClick={() => handleEliminar(p.categoria)}
                    className="text-xs text-red-400 hover:text-red-600 px-2 py-1 rounded-lg hover:bg-red-50">
                    Quitar
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* Añadir nuevo presupuesto */}
        <div className="pt-4 border-t border-slate-100">
          <p className="text-sm font-medium text-slate-700 mb-3">Añadir presupuesto</p>
          <div className="grid grid-cols-2 gap-3">
            <select className="input-field py-2 text-sm" id="cat-select">
              {categoriasSin.map(c => (
                <option key={c} value={c}>{CATEGORIA_GASTO_LABELS[c].emoji} {CATEGORIA_GASTO_LABELS[c].label}</option>
              ))}
            </select>
            <div className="flex gap-2">
              <input type="number" placeholder="€" value={editando ? valor : ''}
                onChange={e => { setValor(e.target.value); setEditando('new'); }}
                className="input-field py-2 text-sm" step="0.01" />
              <button
                onClick={() => {
                  const sel = document.getElementById('cat-select') as HTMLSelectElement;
                  if (sel?.value) handleGuardar(sel.value as CategoriaGasto);
                }}
                className="btn-primary px-3 py-2 text-sm">
                +
              </button>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}

function ExportarSection() {
  const [mes, setMes] = useState(getMesActual());

  const handleExportar = async () => {
    const blob = await apiClient.get<Blob>(`/usuarios/exportar?mes=${mes}`);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `economia-${mes}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const meses: string[] = [];
  const ahora = new Date();
  for (let i = 0; i < 12; i++) {
    const f = new Date(ahora.getFullYear(), ahora.getMonth() - i, 1);
    meses.push(`${f.getFullYear()}-${String(f.getMonth() + 1).padStart(2, '0')}`);
  }

  return (
    <div className="flex gap-3">
      <select value={mes} onChange={e => setMes(e.target.value)} className="input-field py-2 text-sm flex-1">
        {meses.map(m => (
          <option key={m} value={m}>
            {new Date(m + '-01').toLocaleString('es-ES', { month: 'long', year: 'numeric' })}
          </option>
        ))}
      </select>
      <button onClick={handleExportar} className="btn-secondary flex items-center gap-2 whitespace-nowrap">
        <Download className="w-4 h-4" /> CSV
      </button>
    </div>
  );
}
