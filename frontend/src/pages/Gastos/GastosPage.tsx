import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Search, Trash2, Edit2, Receipt, Sparkles, Tag, X } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Modal } from '../../components/ui/Modal';
import { BadgeCategoria, BadgeTipo } from '../../components/ui/Badge';
import { Avatar } from '../../components/ui/Avatar';
import { EmptyState } from '../../components/ui/EmptyState';
import { PageLoader } from '../../components/ui/LoadingSpinner';
import { apiClient } from '../../services/api';
import { formatCurrency, formatDateShort, getMesActual } from '../../utils/format';
import { Gasto, CategoriaGasto, CATEGORIA_GASTO_LABELS } from '../../types';
import { useAuth } from '../../store/auth';
import { GastoForm } from './GastoForm';
import { CrearCategoriaModal } from './CrearCategoriaModal';

interface UsuarioInfo { id: string; nombre: string; avatarColor: string; }
interface GastosResponse { gastos: Gasto[]; total: number; paginas: number; }
interface Sugerencia {
  descripcion: string;
  meses: number;
  veces: number;
  importeMedio: number;
  categoriaActual: string;
}

export function GastosPage() {
  const { usuario } = useAuth();
  const [gastos, setGastos] = useState<Gasto[]>([]);
  const [loading, setLoading] = useState(true);
  const [mes, setMes] = useState(getMesActual());
  const [usuarios, setUsuarios] = useState<UsuarioInfo[]>([]);
  const [filtroCategoria, setFiltroCategoria] = useState('');
  const [filtroTipo, setFiltroTipo] = useState('');
  const [filtroUsuario, setFiltroUsuario] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [total, setTotal] = useState(0);
  const [showForm, setShowForm] = useState(false);
  const [editando, setEditando] = useState<Gasto | null>(null);
  const [sugerencias, setSugerencias] = useState<Sugerencia[]>([]);
  const [sugerenciaDescartada, setSugerenciaDescartada] = useState(false);
  const [creandoCategoria, setCreandoCategoria] = useState<Sugerencia | null>(null);

  const cargarGastos = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ mes, pagina: '1', porPagina: '50' });
    if (filtroCategoria) params.append('categoria', filtroCategoria);
    if (filtroTipo) params.append('tipo', filtroTipo);
    if (filtroUsuario) params.append('usuarioId', filtroUsuario);

    const data = await apiClient.get<GastosResponse>(`/gastos?${params}`);
    setGastos(data.gastos);
    setTotal(data.total);
    setLoading(false);
  }, [mes, filtroCategoria, filtroTipo, filtroUsuario]);

  const cargarSugerencias = useCallback(async () => {
    try {
      const data = await apiClient.get<Sugerencia[]>('/gastos/sugerencias');
      setSugerencias(data);
    } catch {}
  }, []);

  useEffect(() => { cargarGastos(); }, [cargarGastos]);
  useEffect(() => { cargarSugerencias(); }, [cargarSugerencias]);
  useEffect(() => {
    apiClient.get<UsuarioInfo[]>('/auth/usuarios').then(setUsuarios);
  }, []);

  const gastosFiltrados = busqueda
    ? gastos.filter(g => g.descripcion.toLowerCase().includes(busqueda.toLowerCase()))
    : gastos;

  const totalFiltrado = gastosFiltrados.reduce((acc, g) => acc + Number(g.importe), 0);

  const handleEliminar = async (id: string) => {
    if (!confirm('¿Eliminar este gasto?')) return;
    await apiClient.delete(`/gastos/${id}`);
    cargarGastos();
  };

  const meses: string[] = [];
  const ahora = new Date();
  for (let i = -3; i < 12; i++) {
    const f = new Date(ahora.getFullYear(), ahora.getMonth() - i, 1);
    meses.push(`${f.getFullYear()}-${String(f.getMonth() + 1).padStart(2, '0')}`);
  }

  const catLabel = (cat: string) =>
    CATEGORIA_GASTO_LABELS[cat as CategoriaGasto]
      ? `${CATEGORIA_GASTO_LABELS[cat as CategoriaGasto].emoji} ${CATEGORIA_GASTO_LABELS[cat as CategoriaGasto].label}`
      : cat;

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Gastos</h1>
          <p className="text-slate-500 text-sm mt-0.5">{total} registros · {formatCurrency(totalFiltrado)}</p>
        </div>
        <button onClick={() => setShowForm(true)} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> <span className="hidden sm:inline">Añadir</span>
        </button>
      </div>

      {/* Banner de sugerencias de categorías */}
      {sugerencias.length > 0 && !sugerenciaDescartada && (
        <div className="bg-gradient-to-r from-violet-50 to-indigo-50 border border-indigo-100 rounded-2xl p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-500" />
              <p className="text-sm font-semibold text-indigo-900">
                Patrones detectados — crea categorías propias
              </p>
            </div>
            <button onClick={() => setSugerenciaDescartada(true)}
              className="text-slate-400 hover:text-slate-600">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="space-y-2">
            {sugerencias.slice(0, 4).map(s => (
              <div key={s.descripcion}
                className="flex items-center justify-between bg-white/70 rounded-xl px-3 py-2.5 gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900 truncate">"{s.descripcion}"</p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {s.veces} veces en {s.meses} meses · media {formatCurrency(s.importeMedio)} · ahora en {catLabel(s.categoriaActual)}
                  </p>
                </div>
                <button
                  onClick={() => setCreandoCategoria(s)}
                  className="flex items-center gap-1.5 text-xs font-medium bg-indigo-600 text-white px-3 py-1.5 rounded-lg hover:bg-indigo-700 transition-colors whitespace-nowrap flex-shrink-0">
                  <Tag className="w-3 h-3" /> Crear categoría
                </button>
              </div>
            ))}
          </div>
          {sugerencias.length > 4 && (
            <p className="text-xs text-indigo-400 mt-2 text-center">
              +{sugerencias.length - 4} patrones más — ve a Ajustes → Categorías
            </p>
          )}
        </div>
      )}

      {/* Filtros */}
      <Card className="p-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <select value={mes} onChange={e => setMes(e.target.value)} className="input-field py-2 text-sm">
            {meses.map(m => (
              <option key={m} value={m}>
                {new Date(m + '-01').toLocaleString('es-ES', { month: 'long', year: 'numeric' })}
              </option>
            ))}
          </select>

          <select value={filtroCategoria} onChange={e => setFiltroCategoria(e.target.value)} className="input-field py-2 text-sm">
            <option value="">Todas las categorías</option>
            {Object.entries(CATEGORIA_GASTO_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v.emoji} {v.label}</option>
            ))}
          </select>

          <select value={filtroTipo} onChange={e => setFiltroTipo(e.target.value)} className="input-field py-2 text-sm">
            <option value="">Todos los tipos</option>
            <option value="COMUN">👥 Común</option>
            <option value="INDIVIDUAL">👤 Individual</option>
          </select>

          <select value={filtroUsuario} onChange={e => setFiltroUsuario(e.target.value)} className="input-field py-2 text-sm">
            <option value="">Todos los usuarios</option>
            {usuarios.map(u => (
              <option key={u.id} value={u.id}>{u.nombre}</option>
            ))}
          </select>
        </div>

        <div className="mt-3 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
            placeholder="Buscar por descripción..."
            className="input-field pl-10 py-2.5 text-sm"
          />
        </div>
      </Card>

      {/* Lista */}
      {loading ? <PageLoader /> : gastosFiltrados.length === 0 ? (
        <EmptyState emoji="💸" title="Sin gastos" description="Añade tu primer gasto del mes" />
      ) : (
        <div className="space-y-2">
          {gastosFiltrados.map(gasto => (
            <Card key={gasto.id} className="p-4">
              <div className="flex items-start gap-3">
                <Avatar nombre={gasto.usuario.nombre} color={gasto.usuario.avatarColor} size="md" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-medium text-slate-900 truncate">{gasto.descripcion}</p>
                    <p className="font-bold text-slate-900 text-lg whitespace-nowrap">
                      {formatCurrency(gasto.importe)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                    {/* Badge con info de categoría custom si existe */}
                    <BadgeCategoria
                      categoria={gasto.categoria}
                      categoriaCustom={gasto.categoriaCustom}
                    />
                    <BadgeTipo tipo={gasto.tipo} />
                    <span className="text-xs text-slate-400">{formatDateShort(gasto.fecha)}</span>
                    {gasto.ticketUrl && (
                      <a href={gasto.ticketUrl} target="_blank" rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-indigo-600 hover:underline">
                        <Receipt className="w-3 h-3" /> Ticket
                      </a>
                    )}
                  </div>
                </div>
                {gasto.usuarioId === usuario?.id && (
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button onClick={() => setEditando(gasto)}
                      className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleEliminar(gasto.id)}
                      className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Modal gasto */}
      <Modal
        open={showForm || !!editando}
        onClose={() => { setShowForm(false); setEditando(null); }}
        title={editando ? 'Editar gasto' : 'Nuevo gasto'}
      >
        <GastoForm
          gasto={editando}
          usuarios={usuarios}
          defaultMes={mes}
          onSuccess={() => { setShowForm(false); setEditando(null); cargarGastos(); }}
          onCancel={() => { setShowForm(false); setEditando(null); }}
        />
      </Modal>

      {/* Modal crear categoría desde sugerencia */}
      {creandoCategoria && (
        <CrearCategoriaModal
          sugerencia={creandoCategoria}
          onSuccess={() => {
            setCreandoCategoria(null);
            cargarSugerencias();
          }}
          onCancel={() => setCreandoCategoria(null)}
        />
      )}
    </div>
  );
}
