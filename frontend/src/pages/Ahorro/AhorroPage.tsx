import React, { useState, useEffect } from 'react';
import { PiggyBank, Pencil, Check, X, History } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Card } from '../../components/ui/Card';
import { Avatar } from '../../components/ui/Avatar';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { apiClient } from '../../services/api';
import { useAuth } from '../../store/auth';
import { formatCurrency } from '../../utils/format';

interface AhorroUsuario {
  id: string;
  nombre: string;
  avatarColor: string;
  ahorroActual: number;
}

interface HistorialEntry {
  id: string;
  importe: number;
  nota: string | null;
  fecha: string;
}

export function AhorroPage() {
  const { usuario, actualizarUsuario } = useAuth();
  const [ahorros, setAhorros] = useState<AhorroUsuario[]>([]);
  const [historial, setHistorial] = useState<HistorialEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [valorEdicion, setValorEdicion] = useState('');
  const [notaEdicion, setNotaEdicion] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');
  const [verHistorial, setVerHistorial] = useState(false);

  const cargar = async () => {
    setLoading(true);
    try {
      const [data, hist] = await Promise.all([
        apiClient.get<AhorroUsuario[]>('/usuarios/ahorro'),
        apiClient.get<HistorialEntry[]>('/usuarios/ahorro/historial'),
      ]);
      setAhorros(data);
      setHistorial(hist);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { cargar(); }, []);

  const iniciarEdicion = (a: AhorroUsuario) => {
    setEditandoId(a.id);
    setValorEdicion(String(a.ahorroActual));
    setNotaEdicion('');
    setError('');
  };

  const cancelarEdicion = () => {
    setEditandoId(null);
    setValorEdicion('');
    setNotaEdicion('');
    setError('');
  };

  const guardar = async (id: string) => {
    const importe = parseFloat(valorEdicion.replace(',', '.'));
    if (isNaN(importe) || importe < 0) { setError('Introduce una cantidad válida'); return; }
    setGuardando(true);
    setError('');
    try {
      const updated = await apiClient.put<AhorroUsuario>('/usuarios/ahorro', { importe, nota: notaEdicion || undefined });
      setAhorros(prev => prev.map(a => a.id === id ? { ...a, ahorroActual: updated.ahorroActual } : a));
      if (usuario && usuario.id === id) actualizarUsuario({ ...usuario, ahorroActual: updated.ahorroActual });
      setEditandoId(null);
      // Recargar historial
      const hist = await apiClient.get<HistorialEntry[]>('/usuarios/ahorro/historial');
      setHistorial(hist);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al guardar');
    } finally { setGuardando(false); }
  };

  const total = ahorros.reduce((acc, a) => acc + a.ahorroActual, 0);

  // Datos para gráfica del historial propio
  const miHistorial = historial.map(h => ({
    fecha: new Date(h.fecha).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' }),
    importe: h.importe,
    nota: h.nota,
  }));

  if (loading) return (
    <div className="flex items-center justify-center py-20"><LoadingSpinner size="lg" /></div>
  );

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Ahorro</h1>
        {historial.length > 0 && (
          <button onClick={() => setVerHistorial(v => !v)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm font-medium transition-all ${verHistorial ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
            <History className="w-4 h-4" /> Historial
          </button>
        )}
      </div>

      {/* Total conjunto */}
      <Card>
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center flex-shrink-0">
            <PiggyBank className="w-6 h-6 text-white" />
          </div>
          <div>
            <p className="text-sm text-slate-500">Ahorro total conjunto</p>
            <p className="text-3xl font-bold text-slate-900">{formatCurrency(total)}</p>
          </div>
        </div>
      </Card>

      {/* Ahorro por persona */}
      <div className="space-y-3">
        {ahorros.map(a => {
          const esMio = usuario?.id === a.id;
          const editando = editandoId === a.id;

          return (
            <Card key={a.id}>
              <div className="flex items-center gap-4">
                <Avatar nombre={a.nombre} color={a.avatarColor} size="md" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-slate-900">{a.nombre}</p>
                    {esMio && <span className="text-xs bg-indigo-100 text-indigo-600 px-2 py-0.5 rounded-full font-medium">Tú</span>}
                  </div>

                  {editando ? (
                    <div className="mt-2 space-y-2">
                      <div className="flex items-center gap-2">
                        <div className="relative flex-1">
                          <input type="number" value={valorEdicion} onChange={e => setValorEdicion(e.target.value)}
                            className="input-field py-2 pr-8 text-lg font-semibold" placeholder="0" step="0.01" min="0" autoFocus
                            onKeyDown={e => { if (e.key === 'Enter') guardar(a.id); if (e.key === 'Escape') cancelarEdicion(); }} />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">€</span>
                        </div>
                        <button onClick={() => guardar(a.id)} disabled={guardando}
                          className="p-2 rounded-xl bg-emerald-500 text-white hover:bg-emerald-600">
                          {guardando ? <LoadingSpinner size="sm" /> : <Check className="w-4 h-4" />}
                        </button>
                        <button onClick={cancelarEdicion}
                          className="p-2 rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                      <input type="text" value={notaEdicion} onChange={e => setNotaEdicion(e.target.value)}
                        className="input-field py-2 text-sm" placeholder="Nota opcional (ej: incluye fondo de emergencias)" />
                      {error && <p className="text-xs text-red-500">{error}</p>}
                    </div>
                  ) : (
                    <p className="text-2xl font-bold text-emerald-600 mt-0.5">{formatCurrency(a.ahorroActual)}</p>
                  )}
                </div>

                {!editando && esMio && (
                  <button onClick={() => iniciarEdicion(a)}
                    className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 flex-shrink-0">
                    <Pencil className="w-4 h-4" />
                  </button>
                )}
              </div>

              {!editando && total > 0 && (
                <div className="mt-3">
                  <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-1.5 rounded-full transition-all duration-500"
                      style={{ width: `${Math.round((a.ahorroActual / total) * 100)}%`, backgroundColor: a.avatarColor }} />
                  </div>
                  <p className="text-xs text-slate-400 mt-1 text-right">
                    {Math.round((a.ahorroActual / total) * 100)}% del total
                  </p>
                </div>
              )}
            </Card>
          );
        })}
      </div>

      {/* Historial / Gráfica */}
      {verHistorial && miHistorial.length > 1 && (
        <Card>
          <h3 className="font-semibold text-slate-900 mb-4">Evolución de tu ahorro</h3>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={miHistorial}>
              <defs>
                <linearGradient id="ahorroGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="fecha" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `${v}€`} />
              <Tooltip formatter={(v: number) => formatCurrency(v)} />
              <Area type="monotone" dataKey="importe" stroke="#10b981" fill="url(#ahorroGrad)" strokeWidth={2} dot={{ r: 3 }} />
            </AreaChart>
          </ResponsiveContainer>
        </Card>
      )}

      {verHistorial && (
        <Card>
          <h3 className="font-semibold text-slate-900 mb-3">Historial de actualizaciones</h3>
          {miHistorial.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-4">Aún no has actualizado tu ahorro</p>
          ) : (
            <div className="space-y-2">
              {[...historial].reverse().map(h => (
                <div key={h.id} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-slate-900">{formatCurrency(h.importe)}</p>
                    {h.nota && <p className="text-xs text-slate-400">{h.nota}</p>}
                  </div>
                  <span className="text-xs text-slate-400">
                    {new Date(h.fecha).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      <p className="text-xs text-slate-400 text-center pb-4">
        Solo puedes editar tu propio ahorro. Pulsa el lápiz para actualizar.
      </p>
    </div>
  );
}
