import { prisma } from '../../lib/prisma';
import { CrearFacturaInput } from './facturas.types';

export async function listarFacturas() {
  return prisma.facturaRecurrente.findMany({
    where: { activa: true },
    include: {
      creadaPor: { select: { id: true, nombre: true, avatarColor: true } },
      afectaA: { select: { id: true, nombre: true, avatarColor: true } },
      pagos: { orderBy: [{ anio: 'desc' }, { mes: 'desc' }], take: 1 },
    },
    orderBy: { diaMes: 'asc' },
  });
}

export async function crearFactura(data: CrearFacturaInput, usuarioId: string) {
  return prisma.facturaRecurrente.create({
    data: { ...data, importe: data.importe, creadaPorId: usuarioId },
    include: {
      creadaPor: { select: { id: true, nombre: true, avatarColor: true } },
      afectaA: { select: { id: true, nombre: true, avatarColor: true } },
    },
  });
}

export async function actualizarFactura(id: string, data: Partial<CrearFacturaInput>) {
  return prisma.facturaRecurrente.update({
    where: { id },
    data,
    include: {
      creadaPor: { select: { id: true, nombre: true, avatarColor: true } },
      afectaA: { select: { id: true, nombre: true, avatarColor: true } },
    },
  });
}

export async function desactivarFactura(id: string) {
  return prisma.facturaRecurrente.update({ where: { id }, data: { activa: false } });
}

export async function marcarPagada(facturaId: string, mes: number, anio: number) {
  return prisma.pagoFactura.upsert({
    where: { facturaId_mes_anio: { facturaId, mes, anio } },
    update: { pagada: true, fechaPago: new Date() },
    create: { facturaId, mes, anio, pagada: true, fechaPago: new Date() },
  });
}

export async function facturasProximasSemana() {
  const hoy = new Date();
  const en7Dias = new Date(hoy);
  en7Dias.setDate(hoy.getDate() + 7);

  const facturas = await prisma.facturaRecurrente.findMany({
    where: { activa: true },
    include: {
      afectaA: { select: { id: true, nombre: true } },
      pagos: {
        where: { mes: hoy.getMonth() + 1, anio: hoy.getFullYear() },
      },
    },
  });

  // Filtrar las que vencen en los próximos 7 días y no están pagadas este mes
  return facturas.filter(f => {
    const vencimientoEsteMes = new Date(hoy.getFullYear(), hoy.getMonth(), f.diaMes);
    const noPagadaEsteMes = f.pagos.length === 0 || !f.pagos[0].pagada;
    return vencimientoEsteMes >= hoy && vencimientoEsteMes <= en7Dias && noPagadaEsteMes;
  });
}
