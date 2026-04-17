import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  TrendingUp, TrendingDown, Wallet, Users, ChevronRight,
  Calendar, Target, X
} from 'lucide-react';
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, Legend, AreaChart, Area
} from 'recharts';
import { Card } from '../../components/ui/Card';
import { Modal } from '../../components/ui/Modal';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { Avatar } from '../../components/ui/Avatar';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { PageLoader } from '../../components/ui/LoadingSpinner';
import { useAuth } from '../../store/auth';
import { apiClient } from '../../services/api';
import { formatCurrency, getMesActual, getMesLabel, formatDateShort } from '../../utils/format';
import { CATEGORIA_GASTO_LABELS, Meta, FacturaRecurrente, Deuda } from '../../types';

interface ResumenGastos {
  porCategoria: Record<string, number>;
  totalComun: number;
  porUsuario: Record<string, number>;
  total: number;
}

interface ResumenIngresos {
  total: number;
  porUsuario: Record<string, number>;
}

interface UsuarioInfo {
  id: string;
  nombre: string;
  avatarColor: string;
  email: string;
}

interface ComparativaMes {
  mes: string;
  total: number;
  comun: number;
  individual: number;
}

export function DashboardPage() {
  const { usuario } = useAuth();
  const [loading, setLoading] = useState(true);
  const [mesActual] = useState(getMesActual());
  const [resumenGastos, setResumenGastos] = useState<ResumenGastos | null>(null);
  const [resumenIngresos, setResumenIngresos] = useState<ResumenIngresos | null>(null);
  const [usuarios, setUsuarios] = useState<UsuarioInfo[]>([]);
  const [comparativa, setComparativa] = useState<ComparativaMes[]>([]);
  const [facturas, setFacturas] = useState<FacturaRecurrente[]>([]);
  const [metas, setMetas] = useState<Meta[]>([]);
  const [deudas, setDeudas] = useState<Deuda[]>([]);
  const [resumenUsuario, setResumenUsuario] = useState<{ usuario: UsuarioInfo; gastos: any; ingresos: any } | null>(null);
  const [loadingResumen, setLoadingResumen] = useState(false);

  useEffect(() => {
    Promise.all([
      apiClient.get<ResumenGastos>(`/gastos/resumen?mes=${mesActual}`),
      apiClient.get<ResumenIngresos>(`/ingresos/resumen?mes=${mesActual}`),
      apiClient.get<UsuarioInfo[]>('/auth/usuarios'),
      apiClient.get<ComparativaMes[]>('/gastos/comparativa'),
      apiClient.get<FacturaRecurrente[]>('/facturas/proximas'),
      apiClient.get<Meta[]>('/metas'),
      apiClient.get<Deuda[]>('/deudas'),
    ]).then(([gastos, ingresos, users, comp, facts, mets, debs]) => {
      setResumenGastos(gastos);
      setResumenIngresos(ingresos);
      setUsuarios(users);
      setComparativa(comp);
      setFacturas(facts);
      setMetas(mets.filter((m: Meta) => m.estado === 'ACTIVA'));
      setDeudas(debs.filter((d: Deuda) => d.estado === 'PENDIENTE'));
    }).finally(() => setLoading(false));
  }, [mesActual]);

  const abrirResumenUsuario = async (u: UsuarioInfo) => {
    setLoadingResumen(true);
    try {
      const [gastos, ingresos] = await Promise.all([
        apiClient.get<any>(`/gastos/resumen?mes=${mesActual}&usuarioId=${u.id}`),
        apiClient.get<any>(`/ingresos/resumen?mes=${mesActual}&usuarioId=${u.id}`),
      ]);
      setResumenUsuario({ usuario: u, gastos, ingresos });
    } finally { setLoadingResumen(false); }
  };

  if (loading) return <PageLoader />;

  const balance = (resumenIngresos?.total || 0) - (resumenGastos?.total || 0);

  // Datos para gráfico de dona
  const pieData = Object.entries(resumenGastos?.porCategoria || {})
    .filter(([, v]) => v > 0)
    .map(([categoria, valor]) => ({
      name: CATEGORIA_GASTO_LABELS[categoria as keyof typeof CATEGORIA_GASTO_LABELS]?.label || categoria,
      value: Number(valor.toFixed(2)),
      color: CATEGORIA_GASTO_LABELS[categoria as keyof typeof CATEGORIA_GASTO_LABELS]?.color || '#94a3b8',
    }));

  // Datos para gráfico de barras
  const barData = comparativa.map(m => ({
    name: new Date(m.mes + '-01').toLocaleString('es-ES', { month: 'short' }),
    Común: Number(m.comun.toFixed(2)),
    Individual: Number(m.individual.toFixed(2)),
  }));

  const otroUsuario = usuarios.find(u => u.id !== usuario?.id);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Buenos días, {usuario?.nombre} 👋</h1>
        <p className="text-slate-500 mt-0.5">{getMesLabel(mesActual)}</p>
      </div>

      {/* Tarjetas KPI principales */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="col-span-2 lg:col-span-1 bg-gradient-to-br from-indigo-500 to-purple-600 text-white border-0">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-indigo-200 text-sm font-medium">Balance</p>
              <p className={`text-2xl font-bold mt-1 ${balance >= 0 ? 'text-white' : 'text-red-200'}`}>
                {formatCurrency(balance)}
              </p>
            </div>
            <div className="p-2 bg-white/20 rounded-xl">
              <Wallet className="w-5 h-5" />
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-slate-400 text-sm">Ingresos</p>
              <p className="text-xl font-bold text-green-600 mt-1">
                {formatCurrency(resumenIngresos?.total || 0)}
              </p>
            </div>
            <div className="p-2 bg-green-50 rounded-xl">
              <TrendingUp className="w-5 h-5 text-green-500" />
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-slate-400 text-sm">Gastos</p>
              <p className="text-xl font-bold text-red-500 mt-1">
                {formatCurrency(resumenGastos?.total || 0)}
              </p>
            </div>
            <div className="p-2 bg-red-50 rounded-xl">
              <TrendingDown className="w-5 h-5 text-red-500" />
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-slate-400 text-sm">Común</p>
              <p className="text-xl font-bold text-blue-600 mt-1">
                {formatCurrency(resumenGastos?.totalComun || 0)}
              </p>
            </div>
            <div className="p-2 bg-blue-50 rounded-xl">
              <Users className="w-5 h-5 text-blue-500" />
            </div>
          </div>
        </Card>
      </div>

      {/* Gastos por persona — clickables */}
      {usuarios.length > 0 && resumenGastos && (
        <div className="grid grid-cols-2 gap-4">
          {usuarios.map(u => (
            <button key={u.id} onClick={() => abrirResumenUsuario(u)} className="text-left">
              <Card className="hover:shadow-md hover:border-indigo-200 transition-all cursor-pointer active:scale-95">
                <div className="flex items-center gap-3 mb-2">
                  <Avatar nombre={u.nombre} color={u.avatarColor} size="sm" />
                  <p className="font-medium text-slate-900 text-sm">{u.nombre}</p>
                </div>
                <p className="text-xl font-bold text-slate-900">
                  {formatCurrency(resumenGastos.porUsuario[u.id] || 0)}
                </p>
                <p className="text-xs text-indigo-400 mt-0.5">ver resumen →</p>
              </Card>
            </button>
          ))}
        </div>
      )}

      {/* Gráficos */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Dona de categorías */}
        <Card>
          <h2 className="font-semibold text-slate-900 mb-4">Gastos por categoría</h2>
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3} dataKey="value">
                  {pieData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(v: number) => formatCurrency(v)} />
                <Legend iconType="circle" iconSize={8} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-56 flex items-center justify-center text-slate-400 text-sm">
              Sin gastos este mes
            </div>
          )}
        </Card>

        {/* Barras comparativa */}
        <Card>
          <h2 className="font-semibold text-slate-900 mb-4">Últimos 6 meses</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={barData} barSize={14} barGap={4}>
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `${v}€`} />
              <Tooltip formatter={(v: number) => formatCurrency(v)} />
              <Legend iconType="circle" iconSize={8} />
              <Bar dataKey="Común" fill="#6366f1" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Individual" fill="#a5b4fc" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Próximas facturas + Deudas */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Facturas próximas */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-slate-900">Próximas facturas</h2>
            <Link to="/facturas" className="text-sm text-indigo-600 flex items-center gap-1 hover:underline">
              Ver todas <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          {facturas.length > 0 ? (
            <div className="space-y-3">
              {facturas.slice(0, 4).map(f => (
                <div key={f.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="p-1.5 bg-amber-50 rounded-lg">
                      <Calendar className="w-4 h-4 text-amber-500" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-900">{f.nombre}</p>
                      <p className="text-xs text-slate-400">Día {f.diaMes}</p>
                    </div>
                  </div>
                  <span className="font-semibold text-slate-900 text-sm">{formatCurrency(f.importe)}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-400 text-center py-6">Sin facturas en los próximos 7 días</p>
          )}
        </Card>

        {/* Deudas pendientes */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-slate-900">Deudas pendientes</h2>
            <Link to="/deudas" className="text-sm text-indigo-600 flex items-center gap-1 hover:underline">
              Ver todas <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          {deudas.length > 0 ? (
            <div className="space-y-3">
              {deudas.slice(0, 4).map(d => (
                <div key={d.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <Avatar nombre={d.deudor.nombre} color={d.deudor.avatarColor} size="sm" />
                    <div>
                      <p className="text-sm text-slate-900">
                        <span className="font-medium">{d.deudor.nombre}</span> → {d.acreedor.nombre}
                      </p>
                      <p className="text-xs text-slate-400">{d.concepto}</p>
                    </div>
                  </div>
                  <span className="font-semibold text-red-500 text-sm">{formatCurrency(d.importe)}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-400 text-center py-6">Sin deudas pendientes 🎉</p>
          )}
        </Card>
      </div>

      {/* Metas de ahorro */}
      {metas.length > 0 && (
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-slate-900">Metas de ahorro</h2>
            <Link to="/metas" className="text-sm text-indigo-600 flex items-center gap-1 hover:underline">
              Ver todas <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            {metas.slice(0, 4).map(m => {
              const progreso = Math.min(Math.round((Number(m.importeActual) / Number(m.importeObjetivo)) * 100), 100);
              return (
                <div key={m.id} className="p-4 bg-slate-50 rounded-xl">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xl">{m.emoji}</span>
                    <p className="font-medium text-slate-900 text-sm">{m.nombre}</p>
                  </div>
                  <ProgressBar value={progreso} height="h-2" />
                  <div className="flex justify-between mt-1.5">
                    <span className="text-xs text-slate-400">{formatCurrency(m.importeActual)}</span>
                    <span className="text-xs text-slate-500 font-medium">{progreso}%</span>
                    <span className="text-xs text-slate-400">{formatCurrency(m.importeObjetivo)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}
      {/* Modal resumen usuario */}
      <Modal
        open={!!resumenUsuario || loadingResumen}
        onClose={() => setResumenUsuario(null)}
        title={resumenUsuario ? `Resumen de ${resumenUsuario.usuario.nombre}` : 'Cargando...'}
      >
        {loadingResumen ? (
          <div className="flex items-center justify-center py-10"><LoadingSpinner size="lg" /></div>
        ) : resumenUsuario ? (
          <ResumenUsuarioModal
            usuario={resumenUsuario.usuario}
            gastos={resumenUsuario.gastos}
            ingresos={resumenUsuario.ingresos}
            mes={mesActual}
          />
        ) : null}
      </Modal>
    </div>
  );
}

function ResumenUsuarioModal({ usuario, gastos, ingresos, mes }: {
  usuario: UsuarioInfo;
  gastos: ResumenGastos;
  ingresos: ResumenIngresos;
  mes: string;
}) {
  const balance = (ingresos?.total || 0) - (gastos?.total || 0);
  const mesLabel = new Date(mes + '-01').toLocaleString('es-ES', { month: 'long', year: 'numeric' });

  const categoriasData = Object.entries(gastos?.porCategoria || {})
    .filter(([, v]) => (v as number) > 0)
    .sort(([, a], [, b]) => (b as number) - (a as number))
    .map(([cat, val]) => ({
      cat,
      val: val as number,
      label: CATEGORIA_GASTO_LABELS[cat as keyof typeof CATEGORIA_GASTO_LABELS]?.label || cat,
      emoji: CATEGORIA_GASTO_LABELS[cat as keyof typeof CATEGORIA_GASTO_LABELS]?.emoji || '📦',
      color: CATEGORIA_GASTO_LABELS[cat as keyof typeof CATEGORIA_GASTO_LABELS]?.color || '#94a3b8',
    }));

  return (
    <div className="space-y-5">
      <p className="text-sm text-slate-400 capitalize">{mesLabel}</p>

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-3">
        <div className="p-3 bg-green-50 rounded-xl text-center">
          <p className="text-xs text-green-600 font-medium">Ingresos</p>
          <p className="text-lg font-bold text-green-700">{formatCurrency(ingresos?.total || 0)}</p>
        </div>
        <div className="p-3 bg-red-50 rounded-xl text-center">
          <p className="text-xs text-red-500 font-medium">Gastos</p>
          <p className="text-lg font-bold text-red-600">{formatCurrency(gastos?.total || 0)}</p>
        </div>
        <div className={`p-3 rounded-xl text-center ${balance >= 0 ? 'bg-indigo-50' : 'bg-orange-50'}`}>
          <p className={`text-xs font-medium ${balance >= 0 ? 'text-indigo-600' : 'text-orange-500'}`}>Balance</p>
          <p className={`text-lg font-bold ${balance >= 0 ? 'text-indigo-700' : 'text-orange-600'}`}>{formatCurrency(balance)}</p>
        </div>
      </div>

      {/* Gastos comunes vs individuales */}
      <div className="grid grid-cols-2 gap-3">
        <div className="p-3 bg-slate-50 rounded-xl">
          <p className="text-xs text-slate-500">Gastos comunes</p>
          <p className="text-base font-bold text-slate-900">{formatCurrency(gastos?.totalComun || 0)}</p>
        </div>
        <div className="p-3 bg-slate-50 rounded-xl">
          <p className="text-xs text-slate-500">Gastos individuales</p>
          <p className="text-base font-bold text-slate-900">{formatCurrency((gastos?.total || 0) - (gastos?.totalComun || 0))}</p>
        </div>
      </div>

      {/* Por categoría */}
      {categoriasData.length > 0 && (
        <div>
          <p className="text-sm font-semibold text-slate-900 mb-3">Por categoría</p>
          <div className="space-y-2">
            {categoriasData.map(({ cat, val, label, emoji, color }) => {
              const pct = gastos?.total > 0 ? Math.round((val / gastos.total) * 100) : 0;
              return (
                <div key={cat} className="flex items-center gap-3">
                  <span className="text-base w-6 text-center">{emoji}</span>
                  <div className="flex-1">
                    <div className="flex justify-between mb-1">
                      <span className="text-sm text-slate-700">{label}</span>
                      <span className="text-sm font-medium text-slate-900">{formatCurrency(val)}</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-1.5 rounded-full" style={{ width: `${pct}%`, backgroundColor: color }} />
                    </div>
                  </div>
                  <span className="text-xs text-slate-400 w-8 text-right">{pct}%</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {categoriasData.length === 0 && (
        <p className="text-sm text-slate-400 text-center py-4">Sin gastos este mes</p>
      )}
    </div>
  );
}
