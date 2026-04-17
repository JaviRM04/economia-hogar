import { prisma } from '../../lib/prisma';
import { CATEGORIAS_GASTO, CategoriaGasto } from '../gastos/gastos.types';

export async function obtenerAhorros() {
  const usuarios = await prisma.usuario.findMany({
    select: { id: true, nombre: true, avatarColor: true, ahorroActual: true },
    orderBy: { createdAt: 'asc' },
  });
  return usuarios.map(u => ({ ...u, ahorroActual: Number(u.ahorroActual) }));
}

export async function actualizarAhorro(usuarioId: string, importe: number, nota?: string) {
  const [usuario] = await prisma.$transaction([
    prisma.usuario.update({
      where: { id: usuarioId },
      data: { ahorroActual: importe },
      select: { id: true, nombre: true, avatarColor: true, ahorroActual: true },
    }),
    prisma.historialAhorro.create({
      data: { usuarioId, importe, nota: nota || null },
    }),
  ]);
  return { ...usuario, ahorroActual: Number(usuario.ahorroActual) };
}

export async function obtenerHistorialAhorro(usuarioId: string) {
  const historial = await prisma.historialAhorro.findMany({
    where: { usuarioId },
    orderBy: { fecha: 'asc' },
    take: 30,
  });
  return historial.map(h => ({ ...h, importe: Number(h.importe) }));
}

export async function obtenerPresupuestos(usuarioId: string) {
  return prisma.presupuesto.findMany({ where: { usuarioId } });
}

export async function upsertPresupuesto(usuarioId: string, categoria: string, importe: number) {
  return prisma.presupuesto.upsert({
    where: { usuarioId_categoria: { usuarioId, categoria } },
    update: { importe },
    create: { usuarioId, categoria, importe },
  });
}

export async function eliminarPresupuesto(usuarioId: string, categoria: string) {
  return prisma.presupuesto.deleteMany({ where: { usuarioId, categoria } });
}

export async function resumenPresupuestos(usuarioId: string, mes: string) {
  const [anio, mesNum] = mes.split('-').map(Number);
  const presupuestos = await prisma.presupuesto.findMany({ where: { usuarioId } });

  const gastadoPorCategoria = await prisma.gasto.groupBy({
    by: ['categoria'],
    where: {
      usuarioId,
      fecha: { gte: new Date(anio, mesNum - 1, 1), lt: new Date(anio, mesNum, 1) },
    },
    _sum: { importe: true },
  });

  return presupuestos.map(p => {
    const gastado = gastadoPorCategoria.find(g => g.categoria === p.categoria)?._sum.importe || 0;
    const porcentaje = Math.round((Number(gastado) / Number(p.importe)) * 100);
    return {
      ...p,
      gastado: Number(gastado),
      porcentaje,
      alerta: porcentaje >= 100 ? 'EXCEDIDO' : porcentaje >= 80 ? 'AVISO' : 'OK',
    };
  });
}

export async function obtenerCategorias(usuarioId: string) {
  return prisma.categoriaPersonalizada.findMany({ where: { usuarioId } });
}

export async function crearCategoria(usuarioId: string, data: { nombre: string; emoji: string; tipo: string; color: string }) {
  return prisma.categoriaPersonalizada.create({ data: { ...data, usuarioId } });
}

export async function eliminarCategoria(id: string, usuarioId: string) {
  const cat = await prisma.categoriaPersonalizada.findUniqueOrThrow({ where: { id } });
  if (cat.usuarioId !== usuarioId) throw new Error('Sin permiso');
  return prisma.categoriaPersonalizada.delete({ where: { id } });
}

export async function exportarDatos(usuarioId: string, mes: string) {
  const [anio, mesNum] = mes.split('-').map(Number);
  const rango = { gte: new Date(anio, mesNum - 1, 1), lt: new Date(anio, mesNum, 1) };

  const [gastos, ingresos] = await Promise.all([
    prisma.gasto.findMany({ where: { usuarioId, fecha: rango }, orderBy: { fecha: 'asc' } }),
    prisma.ingreso.findMany({ where: { usuarioId, fecha: rango }, orderBy: { fecha: 'asc' } }),
  ]);

  const filas: string[] = ['Tipo,Fecha,Descripción,Categoría,Importe,TipoGasto'];
  for (const g of gastos) {
    filas.push(`Gasto,${g.fecha.toISOString().split('T')[0]},"${g.descripcion}",${g.categoria},${g.importe},${g.tipo}`);
  }
  for (const i of ingresos) {
    filas.push(`Ingreso,${i.fecha.toISOString().split('T')[0]},"${i.descripcion}",${i.categoria},${i.importe},-`);
  }
  return filas.join('\n');
}
