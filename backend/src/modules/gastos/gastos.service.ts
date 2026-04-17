import { prisma } from '../../lib/prisma';
import { CrearGastoInput, FiltrosGasto } from './gastos.types';

// Include base para todos los queries de gastos
const includeBase = {
  usuario: { select: { id: true, nombre: true, avatarColor: true } },
  categoriaCustom: { select: { id: true, nombre: true, emoji: true, color: true } },
};

export async function listarGastos(filtros: FiltrosGasto) {
  const where: Record<string, unknown> = {};

  if (filtros.mes) {
    const [anio, mes] = filtros.mes.split('-').map(Number);
    where.fecha = {
      gte: new Date(anio, mes - 1, 1),
      lt: new Date(anio, mes, 1),
    };
  }

  if (filtros.categoria) where.categoria = filtros.categoria;
  if (filtros.tipo) where.tipo = filtros.tipo;
  if (filtros.usuarioId) where.usuarioId = filtros.usuarioId;

  const [gastos, total] = await Promise.all([
    prisma.gasto.findMany({
      where,
      include: includeBase,
      orderBy: { fecha: 'desc' },
      skip: (filtros.pagina - 1) * filtros.porPagina,
      take: filtros.porPagina,
    }),
    prisma.gasto.count({ where }),
  ]);

  return { gastos, total, paginas: Math.ceil(total / filtros.porPagina) };
}

export async function obtenerGasto(id: string) {
  return prisma.gasto.findUniqueOrThrow({
    where: { id },
    include: includeBase,
  });
}

export async function crearGasto(data: CrearGastoInput, usuarioIdAuth: string, ticketUrl?: string) {
  return prisma.gasto.create({
    data: {
      importe: data.importe,
      descripcion: data.descripcion,
      categoria: data.categoria,
      categoriaCustomId: data.categoriaCustomId,
      tipo: data.tipo,
      fecha: data.fecha ? new Date(data.fecha) : new Date(),
      usuarioId: data.usuarioId || usuarioIdAuth,
      ticketUrl,
    },
    include: includeBase,
  });
}

export async function actualizarGasto(id: string, data: Partial<CrearGastoInput>, usuarioId: string) {
  const gasto = await prisma.gasto.findUniqueOrThrow({ where: { id } });
  if (gasto.usuarioId !== usuarioId) throw new Error('No tienes permiso para editar este gasto');

  return prisma.gasto.update({
    where: { id },
    data: {
      ...data,
      fecha: data.fecha ? new Date(data.fecha) : undefined,
    },
    include: includeBase,
  });
}

export async function eliminarGasto(id: string, usuarioId: string) {
  const gasto = await prisma.gasto.findUniqueOrThrow({ where: { id } });
  if (gasto.usuarioId !== usuarioId) throw new Error('No tienes permiso para eliminar este gasto');
  return prisma.gasto.delete({ where: { id } });
}

export async function resumenMes(mes: string, usuarioId?: string) {
  const [anio, mesNum] = mes.split('-').map(Number);
  const inicio = new Date(anio, mesNum - 1, 1);
  const fin = new Date(anio, mesNum, 1);

  const gastos = await prisma.gasto.findMany({
    where: { fecha: { gte: inicio, lt: fin }, ...(usuarioId ? { usuarioId } : {}) },
    include: { usuario: { select: { id: true, nombre: true } } },
  });

  const porCategoria: Record<string, number> = {};
  let totalComun = 0;
  const porUsuario: Record<string, number> = {};

  for (const g of gastos) {
    const imp = Number(g.importe);
    porCategoria[g.categoria] = (porCategoria[g.categoria] || 0) + imp;
    if (g.tipo === 'COMUN') totalComun += imp;
    porUsuario[g.usuarioId] = (porUsuario[g.usuarioId] || 0) + imp;
  }

  return { porCategoria, totalComun, porUsuario, total: gastos.reduce((acc, g) => acc + Number(g.importe), 0) };
}

export async function comparativaMensual() {
  const meses: Array<{ mes: string; total: number; comun: number; individual: number }> = [];
  const ahora = new Date();

  for (let i = 5; i >= 0; i--) {
    const fecha = new Date(ahora.getFullYear(), ahora.getMonth() - i, 1);
    const siguiente = new Date(ahora.getFullYear(), ahora.getMonth() - i + 1, 1);

    const gastos = await prisma.gasto.findMany({
      where: { fecha: { gte: fecha, lt: siguiente } },
    });

    const total = gastos.reduce((acc, g) => acc + Number(g.importe), 0);
    const comun = gastos.filter(g => g.tipo === 'COMUN').reduce((acc, g) => acc + Number(g.importe), 0);

    meses.push({
      mes: `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`,
      total,
      comun,
      individual: total - comun,
    });
  }

  return meses;
}

/**
 * Detecta patrones recurrentes en gastos sin categoría personalizada asignada.
 * Devuelve descripciones que aparecen en 2+ meses distintos.
 */
export async function sugerirCategorias() {
  // Traemos todos los gastos sin categoría personalizada
  const gastos = await prisma.gasto.findMany({
    where: { categoriaCustomId: null },
    select: { descripcion: true, fecha: true, importe: true, categoria: true },
    orderBy: { fecha: 'desc' },
  });

  // Agrupar por descripción normalizada
  const grupos = new Map<string, { descripcion: string; meses: Set<string>; count: number; totalImporte: number; categoria: string }>();

  for (const g of gastos) {
    const key = g.descripcion.toLowerCase().trim();
    const mes = `${g.fecha.getFullYear()}-${String(g.fecha.getMonth() + 1).padStart(2, '0')}`;

    if (!grupos.has(key)) {
      grupos.set(key, { descripcion: g.descripcion, meses: new Set(), count: 0, totalImporte: 0, categoria: g.categoria });
    }
    const entry = grupos.get(key)!;
    entry.meses.add(mes);
    entry.count++;
    entry.totalImporte += Number(g.importe);
  }

  // Filtrar: solo los que aparecen en 2+ meses distintos
  const sugerencias = Array.from(grupos.values())
    .filter(g => g.meses.size >= 2)
    .sort((a, b) => b.meses.size - a.meses.size || b.count - a.count)
    .slice(0, 10)
    .map(g => ({
      descripcion: g.descripcion,
      meses: g.meses.size,
      veces: g.count,
      importeMedio: Math.round(g.totalImporte / g.count * 100) / 100,
      categoriaActual: g.categoria,
    }));

  return sugerencias;
}
