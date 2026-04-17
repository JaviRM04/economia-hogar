// ─── Usuarios ─────────────────────────────────────────────────────────────────

export interface Usuario {
  id: string;
  nombre: string;
  email: string;
  telegramId: string | null;
  avatarColor: string;
  ahorroActual: number;
  createdAt: string;
}

// ─── Gastos ───────────────────────────────────────────────────────────────────

export type CategoriaGasto =
  | 'ALIMENTACION' | 'HOGAR' | 'TRANSPORTE' | 'OCIO'
  | 'SALUD' | 'ROPA' | 'RESTAURANTES' | 'SUSCRIPCIONES'
  | 'OTROS' | 'PERSONALIZADA';

export type TipoGasto = 'COMUN' | 'INDIVIDUAL';

export interface CategoriaCustomInfo {
  id: string;
  nombre: string;
  emoji: string;
  color: string;
}

export interface Gasto {
  id: string;
  importe: number;
  descripcion: string;
  categoria: CategoriaGasto;
  categoriaCustomId: string | null;
  categoriaCustom: CategoriaCustomInfo | null;
  tipo: TipoGasto;
  fecha: string;
  ticketUrl: string | null;
  usuarioId: string;
  usuario: Pick<Usuario, 'id' | 'nombre' | 'avatarColor'>;
}

// ─── Ingresos ─────────────────────────────────────────────────────────────────

export type CategoriaIngreso = 'SALARIO' | 'EXTRA' | 'FREELANCE' | 'INVERSION' | 'OTRO';

export interface Ingreso {
  id: string;
  importe: number;
  descripcion: string;
  categoria: CategoriaIngreso;
  fecha: string;
  usuarioId: string;
  usuario: Pick<Usuario, 'id' | 'nombre' | 'avatarColor'>;
}

// ─── Facturas ─────────────────────────────────────────────────────────────────

export interface FacturaRecurrente {
  id: string;
  nombre: string;
  importe: number;
  diaMes: number;
  categoria: CategoriaGasto;
  tipo: TipoGasto;
  activa: boolean;
  creadaPorId: string;
  afectaAId: string | null;
  creadaPor: Pick<Usuario, 'id' | 'nombre' | 'avatarColor'>;
  afectaA: Pick<Usuario, 'id' | 'nombre' | 'avatarColor'> | null;
  pagos: PagoFactura[];
}

export interface PagoFactura {
  id: string;
  facturaId: string;
  mes: number;
  anio: number;
  pagada: boolean;
  fechaPago: string | null;
}

// ─── Deudas ───────────────────────────────────────────────────────────────────

export type EstadoDeuda = 'PENDIENTE' | 'LIQUIDADA';

export interface Deuda {
  id: string;
  importe: number;
  concepto: string;
  estado: EstadoDeuda;
  deudorId: string;
  acreedorId: string;
  deudor: Pick<Usuario, 'id' | 'nombre' | 'avatarColor'>;
  acreedor: Pick<Usuario, 'id' | 'nombre' | 'avatarColor'>;
  fechaDeuda: string;
  fechaLiquidacion: string | null;
}

// ─── Metas ────────────────────────────────────────────────────────────────────

export type EstadoMeta = 'ACTIVA' | 'COMPLETADA' | 'PAUSADA';

export interface Meta {
  id: string;
  nombre: string;
  emoji: string;
  importeObjetivo: number;
  importeActual: number;
  fechaLimite: string | null;
  estado: EstadoMeta;
  usuarioId: string;
  usuario: Pick<Usuario, 'id' | 'nombre' | 'avatarColor'>;
  aportaciones: Aportacion[];
}

export interface Aportacion {
  id: string;
  metaId: string;
  importe: number;
  nota: string | null;
  fecha: string;
  usuario: Pick<Usuario, 'id' | 'nombre'>;
}

// ─── Presupuesto ──────────────────────────────────────────────────────────────

export interface Presupuesto {
  id: string;
  categoria: CategoriaGasto;
  importe: number;
  gastado: number;
  porcentaje: number;
  alerta: 'OK' | 'AVISO' | 'EXCEDIDO';
}

// ─── Paginación ───────────────────────────────────────────────────────────────

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  paginas: number;
}

// ─── Labels UI ────────────────────────────────────────────────────────────────

export const CATEGORIA_GASTO_LABELS: Record<CategoriaGasto, { label: string; emoji: string; color: string }> = {
  ALIMENTACION:  { label: 'Alimentación',  emoji: '🛒', color: '#22c55e' },
  HOGAR:         { label: 'Hogar',          emoji: '🏠', color: '#3b82f6' },
  TRANSPORTE:    { label: 'Transporte',     emoji: '🚗', color: '#f59e0b' },
  OCIO:          { label: 'Ocio',           emoji: '🎬', color: '#8b5cf6' },
  SALUD:         { label: 'Salud',          emoji: '💊', color: '#ef4444' },
  ROPA:          { label: 'Ropa',           emoji: '👗', color: '#ec4899' },
  RESTAURANTES:  { label: 'Restaurantes',   emoji: '🍽️', color: '#f97316' },
  SUSCRIPCIONES: { label: 'Suscripciones',  emoji: '📱', color: '#06b6d4' },
  OTROS:         { label: 'Otros',          emoji: '📦', color: '#94a3b8' },
  PERSONALIZADA: { label: 'Personalizada',  emoji: '⭐', color: '#6366f1' },
};

export const CATEGORIA_INGRESO_LABELS: Record<CategoriaIngreso, { label: string; emoji: string }> = {
  SALARIO:   { label: 'Salario',   emoji: '💼' },
  EXTRA:     { label: 'Extra',     emoji: '🎁' },
  FREELANCE: { label: 'Freelance', emoji: '💻' },
  INVERSION: { label: 'Inversión', emoji: '📈' },
  OTRO:      { label: 'Otro',      emoji: '💰' },
};
