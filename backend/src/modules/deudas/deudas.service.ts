import { prisma } from '../../lib/prisma';
import { CrearDeudaInput } from './deudas.types';

export async function listarDeudas() {
  return prisma.deuda.findMany({
    include: {
      deudor: { select: { id: true, nombre: true, avatarColor: true } },
      acreedor: { select: { id: true, nombre: true, avatarColor: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
}

export async function crearDeuda(data: CrearDeudaInput) {
  if (data.deudorId === data.acreedorId) throw new Error('El deudor y el acreedor no pueden ser el mismo');
  return prisma.deuda.create({
    data,
    include: {
      deudor: { select: { id: true, nombre: true, avatarColor: true } },
      acreedor: { select: { id: true, nombre: true, avatarColor: true } },
    },
  });
}

export async function liquidarDeuda(id: string) {
  return prisma.deuda.update({
    where: { id },
    data: { estado: 'LIQUIDADA', fechaLiquidacion: new Date() },
    include: {
      deudor: { select: { id: true, nombre: true, avatarColor: true } },
      acreedor: { select: { id: true, nombre: true, avatarColor: true } },
    },
  });
}

export async function balanceNeto() {
  const usuarios = await prisma.usuario.findMany({ select: { id: true, nombre: true, avatarColor: true } });
  const deudas = await prisma.deuda.findMany({ where: { estado: 'PENDIENTE' } });

  // Calcular balance neto entre los dos usuarios
  const [u1, u2] = usuarios;
  if (!u1 || !u2) return { balance: 0, deudaDeU1aU2: 0, deudaDeU2aU1: 0, usuarios };

  const deudaU1aU2 = deudas
    .filter(d => d.deudorId === u1.id && d.acreedorId === u2.id)
    .reduce((acc, d) => acc + Number(d.importe), 0);

  const deudaU2aU1 = deudas
    .filter(d => d.deudorId === u2.id && d.acreedorId === u1.id)
    .reduce((acc, d) => acc + Number(d.importe), 0);

  const neto = deudaU1aU2 - deudaU2aU1;

  return {
    neto, // positivo = u1 debe a u2, negativo = u2 debe a u1
    deudaU1aU2,
    deudaU2aU1,
    usuarios,
  };
}
