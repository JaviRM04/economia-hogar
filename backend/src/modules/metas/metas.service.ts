import { prisma } from '../../lib/prisma';
import { CrearMetaInput, AportacionInput } from './metas.types';

export async function listarMetas() {
  return prisma.meta.findMany({
    include: {
      usuario: { select: { id: true, nombre: true, avatarColor: true } },
      aportaciones: {
        include: { usuario: { select: { id: true, nombre: true } } },
        orderBy: { fecha: 'desc' },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
}

export async function crearMeta(data: CrearMetaInput, usuarioId: string) {
  return prisma.meta.create({
    data: {
      nombre: data.nombre,
      emoji: data.emoji,
      importeObjetivo: data.importeObjetivo,
      fechaLimite: data.fechaLimite ? new Date(data.fechaLimite) : undefined,
      usuarioId,
    },
    include: { usuario: { select: { id: true, nombre: true, avatarColor: true } } },
  });
}

export async function agregarAportacion(metaId: string, data: AportacionInput, usuarioId: string) {
  const meta = await prisma.meta.findUniqueOrThrow({ where: { id: metaId } });
  const nuevaCantidad = Number(meta.importeActual) + data.importe;
  const completada = nuevaCantidad >= Number(meta.importeObjetivo);

  const [aportacion] = await prisma.$transaction([
    prisma.aportacion.create({
      data: { metaId, importe: data.importe, nota: data.nota, usuarioId, fecha: new Date() },
      include: { usuario: { select: { id: true, nombre: true } } },
    }),
    prisma.meta.update({
      where: { id: metaId },
      data: {
        importeActual: nuevaCantidad,
        estado: completada ? 'COMPLETADA' : undefined,
      },
    }),
  ]);

  return aportacion;
}

export async function actualizarEstadoMeta(id: string, estado: 'ACTIVA' | 'COMPLETADA' | 'PAUSADA') {
  return prisma.meta.update({ where: { id }, data: { estado } });
}

export async function eliminarMeta(id: string) {
  return prisma.meta.delete({ where: { id } });
}
