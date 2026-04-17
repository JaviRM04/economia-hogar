import { prisma } from '../../lib/prisma';
import { CrearIngresoInput, FiltrosIngreso } from './ingresos.types';

export async function listarIngresos(filtros: FiltrosIngreso) {
  const where: Record<string, unknown> = {};

  if (filtros.mes) {
    const [anio, mes] = filtros.mes.split('-').map(Number);
    where.fecha = { gte: new Date(anio, mes - 1, 1), lt: new Date(anio, mes, 1) };
  }
  if (filtros.usuarioId) where.usuarioId = filtros.usuarioId;

  const [ingresos, total] = await Promise.all([
    prisma.ingreso.findMany({
      where,
      include: { usuario: { select: { id: true, nombre: true, avatarColor: true } } },
      orderBy: { fecha: 'desc' },
      skip: (filtros.pagina - 1) * filtros.porPagina,
      take: filtros.porPagina,
    }),
    prisma.ingreso.count({ where }),
  ]);

  return { ingresos, total, paginas: Math.ceil(total / filtros.porPagina) };
}

export async function crearIngreso(data: CrearIngresoInput, usuarioIdAuth: string) {
  return prisma.ingreso.create({
    data: {
      importe: data.importe,
      descripcion: data.descripcion,
      categoria: data.categoria,
      fecha: data.fecha ? new Date(data.fecha) : new Date(),
      usuarioId: data.usuarioId || usuarioIdAuth,
    },
    include: { usuario: { select: { id: true, nombre: true, avatarColor: true } } },
  });
}

export async function actualizarIngreso(id: string, data: Partial<CrearIngresoInput>, usuarioId: string) {
  const ingreso = await prisma.ingreso.findUniqueOrThrow({ where: { id } });
  if (ingreso.usuarioId !== usuarioId) throw new Error('Sin permiso');

  return prisma.ingreso.update({
    where: { id },
    data: { ...data, fecha: data.fecha ? new Date(data.fecha) : undefined },
    include: { usuario: { select: { id: true, nombre: true, avatarColor: true } } },
  });
}

export async function eliminarIngreso(id: string, usuarioId: string) {
  const ingreso = await prisma.ingreso.findUniqueOrThrow({ where: { id } });
  if (ingreso.usuarioId !== usuarioId) throw new Error('Sin permiso');
  return prisma.ingreso.delete({ where: { id } });
}

export async function resumenIngresos(mes: string) {
  const [anio, mesNum] = mes.split('-').map(Number);
  const ingresos = await prisma.ingreso.findMany({
    where: { fecha: { gte: new Date(anio, mesNum - 1, 1), lt: new Date(anio, mesNum, 1) } },
    include: { usuario: { select: { id: true, nombre: true } } },
  });

  const porUsuario: Record<string, number> = {};
  for (const i of ingresos) {
    porUsuario[i.usuarioId] = (porUsuario[i.usuarioId] || 0) + Number(i.importe);
  }

  return { total: ingresos.reduce((acc, i) => acc + Number(i.importe), 0), porUsuario };
}
