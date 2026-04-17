import { Request, Response } from 'express';
import * as authService from './auth.service';
import { LoginSchema, RegisterSchema, CambiarPasswordSchema } from './auth.types';
import { AuthRequest } from '../../middleware/auth';

export async function login(req: Request, res: Response): Promise<void> {
  const parsed = LoginSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.errors[0].message });
    return;
  }
  try {
    const resultado = await authService.login(parsed.data);
    res.json(resultado);
  } catch (e: unknown) {
    res.status(401).json({ error: e instanceof Error ? e.message : 'Error de autenticación' });
  }
}

export async function registrar(req: Request, res: Response): Promise<void> {
  const parsed = RegisterSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.errors[0].message });
    return;
  }
  try {
    const resultado = await authService.registrar(parsed.data);
    res.status(201).json(resultado);
  } catch (e: unknown) {
    res.status(400).json({ error: e instanceof Error ? e.message : 'Error al registrar' });
  }
}

export async function perfil(req: AuthRequest, res: Response): Promise<void> {
  try {
    const usuario = await authService.obtenerPerfil(req.usuarioId!);
    res.json(usuario);
  } catch {
    res.status(404).json({ error: 'Usuario no encontrado' });
  }
}

export async function actualizarPerfil(req: AuthRequest, res: Response): Promise<void> {
  try {
    const usuario = await authService.actualizarPerfil(req.usuarioId!, req.body);
    res.json(usuario);
  } catch (e: unknown) {
    res.status(400).json({ error: e instanceof Error ? e.message : 'Error al actualizar' });
  }
}

export async function cambiarPassword(req: AuthRequest, res: Response): Promise<void> {
  const parsed = CambiarPasswordSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.errors[0].message });
    return;
  }
  try {
    await authService.cambiarPassword(req.usuarioId!, parsed.data);
    res.json({ mensaje: 'Contraseña actualizada correctamente' });
  } catch (e: unknown) {
    res.status(400).json({ error: e instanceof Error ? e.message : 'Error al cambiar contraseña' });
  }
}

export async function listarUsuarios(_req: Request, res: Response): Promise<void> {
  const usuarios = await authService.obtenerUsuarios();
  res.json(usuarios);
}

export async function subirFoto(req: AuthRequest, res: Response): Promise<void> {
  if (!req.file) { res.status(400).json({ error: 'No se recibió ninguna imagen' }); return; }
  try {
    const avatarUrl = `/uploads/${req.file.filename}`;
    const usuario = await authService.actualizarPerfil(req.usuarioId!, { avatarUrl });
    res.json(usuario);
  } catch (e: unknown) {
    res.status(400).json({ error: e instanceof Error ? e.message : 'Error al subir foto' });
  }
}
