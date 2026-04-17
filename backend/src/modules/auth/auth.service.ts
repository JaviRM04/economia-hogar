import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../../lib/prisma';
import { LoginInput, RegisterInput, CambiarPasswordInput } from './auth.types';

function generarToken(id: string, nombre: string): string {
  return jwt.sign({ id, nombre }, process.env.JWT_SECRET!, { expiresIn: '30d' });
}

function omitirPassword(usuario: any) {
  const { password: _, ...resto } = usuario;
  return resto;
}

export async function login(data: LoginInput) {
  const usuario = await prisma.usuario.findUnique({ where: { email: data.email } });
  if (!usuario) throw new Error('Credenciales incorrectas');

  const valida = await bcrypt.compare(data.password, usuario.password);
  if (!valida) throw new Error('Credenciales incorrectas');

  return {
    token: generarToken(usuario.id, usuario.nombre),
    usuario: omitirPassword(usuario),
  };
}

export async function registrar(data: RegisterInput) {
  const existe = await prisma.usuario.findUnique({ where: { email: data.email } });
  if (existe) throw new Error('Ya existe una cuenta con ese email');

  const totalUsuarios = await prisma.usuario.count();
  if (totalUsuarios >= 2) throw new Error('Esta app solo permite 2 usuarios');

  const hash = await bcrypt.hash(data.password, 12);
  const colores = ['#6366f1', '#ec4899'];
  const color = colores[totalUsuarios] || '#6366f1';

  const usuario = await prisma.usuario.create({
    data: {
      nombre: data.nombre,
      email: data.email,
      password: hash,
      avatarColor: color,
    },
  });

  return {
    token: generarToken(usuario.id, usuario.nombre),
    usuario: omitirPassword(usuario),
  };
}

export async function obtenerPerfil(usuarioId: string) {
  const usuario = await prisma.usuario.findUniqueOrThrow({ where: { id: usuarioId } });
  return omitirPassword(usuario);
}

export async function actualizarPerfil(usuarioId: string, data: { nombre?: string; email?: string; telegramId?: string; avatarColor?: string }) {
  if (data.email) {
    const existe = await prisma.usuario.findFirst({ where: { email: data.email, NOT: { id: usuarioId } } });
    if (existe) throw new Error('Ese email ya está en uso');
  }

  const usuario = await prisma.usuario.update({
    where: { id: usuarioId },
    data,
  });
  return omitirPassword(usuario);
}

export async function cambiarPassword(usuarioId: string, data: CambiarPasswordInput) {
  const usuario = await prisma.usuario.findUniqueOrThrow({ where: { id: usuarioId } });
  const valida = await bcrypt.compare(data.passwordActual, usuario.password);
  if (!valida) throw new Error('Contraseña actual incorrecta');

  const hash = await bcrypt.hash(data.passwordNueva, 12);
  await prisma.usuario.update({ where: { id: usuarioId }, data: { password: hash } });
}

export async function obtenerUsuarios() {
  const usuarios = await prisma.usuario.findMany({ orderBy: { createdAt: 'asc' } });
  return usuarios.map(omitirPassword);
}
