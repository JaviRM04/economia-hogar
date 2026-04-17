import React, { useState, useEffect } from 'react';
import { PiggyBank, Pencil, Check, X } from 'lucide-react';
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

export function AhorroPage() {
  const { usuario, actualizarUsuario } = useAuth();
  const [ahorros, setAhorros] = useState<AhorroUsuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [valorEdicion, setValorEdicion] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');

  const cargar = async () => {
    setLoading(true);
    try {
      const data = await apiClient.get<AhorroUsuario[]>('/usuarios/ahorro');
      setAhorros(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { cargar(); }, []);

  const iniciarEdicion = (a: AhorroUsuario) => {
    setEditandoId(a.id);
    setValorEdicion(String(a.ahorroActual));
    setError('');
  };

  const cancelarEdicion = () => {
    setEditandoId(null);
    setValorEdicion('');
    setError('');
  };

  const guardar = async (id: string) => {
    const importe = parseFloat(valorEdicion.replace(',', '.'));
    if (isNaN(importe) || importe < 0) {
      setError('Introduce una cantidad válida'); return;
    }
    setGuardando(true);
    setError('');
    try {
      const updated = await apiClient.put<AhorroUsuario>('/usuarios/ahorro', { importe });
      setAhorros(prev => prev.map(a => a.id === id ? { ...a, ahorroActual: updated.ahorroActual } : a));
      // Actualizar también el estado global del usuario
      if (usuario && usuario.id === id) {
        actualizarUsuario({ ...usuario, ahorroActual: updated.ahorroActual });
      }
      setEditandoId(null);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al guardar');
    } finally {
      setGuardando(false);
    }
  };

  const total = ahorros.reduce((acc, a) => acc + a.ahorroActual, 0);

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <LoadingSpinner size="lg" />
    </div>
  );

  return (
    <div className="space-y-5 animate-fade-in">
      <h1 className="text-2xl font-bold text-slate-900">Ahorro</h1>

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
                    <div className="flex items-center gap-2 mt-2">
                      <div className="relative flex-1">
                        <input
                          type="number"
                          value={valorEdicion}
                          onChange={e => setValorEdicion(e.target.value)}
                          className="input-field py-2 pr-8 text-lg font-semibold"
                          placeholder="0"
                          step="0.01"
                          min="0"
                          autoFocus
                          onKeyDown={e => { if (e.key === 'Enter') guardar(a.id); if (e.key === 'Escape') cancelarEdicion(); }}
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">€</span>
                      </div>
                      <button onClick={() => guardar(a.id)} disabled={guardando}
                        className="p-2 rounded-xl bg-emerald-500 text-white hover:bg-emerald-600 transition-colors">
                        {guardando ? <LoadingSpinner size="sm" /> : <Check className="w-4 h-4" />}
                      </button>
                      <button onClick={cancelarEdicion}
                        className="p-2 rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <p className="text-2xl font-bold text-emerald-600 mt-0.5">{formatCurrency(a.ahorroActual)}</p>
                  )}

                  {error && editando && (
                    <p className="text-xs text-red-500 mt-1">{error}</p>
                  )}
                </div>

                {!editando && esMio && (
                  <button onClick={() => iniciarEdicion(a)}
                    className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors flex-shrink-0">
                    <Pencil className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Barra visual de proporción */}
              {!editando && total > 0 && (
                <div className="mt-3">
                  <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-1.5 rounded-full transition-all duration-500"
                      style={{ width: `${Math.round((a.ahorroActual / total) * 100)}%`, backgroundColor: a.avatarColor }}
                    />
                  </div>
                  <p className="text-xs text-slate-400 mt-1 text-right">
                    {total > 0 ? Math.round((a.ahorroActual / total) * 100) : 0}% del total
                  </p>
                </div>
              )}
            </Card>
          );
        })}
      </div>

      <p className="text-xs text-slate-400 text-center pb-4">
        Solo puedes editar tu propio ahorro. Pulsa el icono del lápiz para actualizar la cantidad.
      </p>
    </div>
  );
}
