import { Response } from 'express';
import * as svc from './metas.service';
import { CrearMetaSchema, AportacionSchema } from './metas.types';
import { AuthRequest } from '../../middleware/auth';

export async function listar(_req: AuthRequest, res: Response): Promise<void> {
  res.json(await svc.listarMetas());
}

export async function crear(req: AuthRequest, res: Response): Promise<void> {
  const parsed = CrearMetaSchema.safeParse({ ...req.body, importeObjetivo: Number(req.body.importeObjetivo) });
  if (!parsed.success) { res.status(400).json({ error: parsed.error.errors[0].message }); return; }
  try {
    res.status(201).json(await svc.crearMeta(parsed.data, req.usuarioId!));
  } catch (e: unknown) { res.status(400).json({ error: e instanceof Error ? e.message : 'Error' }); }
}

export async function aportar(req: AuthRequest, res: Response): Promise<void> {
  const parsed = AportacionSchema.safeParse({ ...req.body, importe: Number(req.body.importe) });
  if (!parsed.success) { res.status(400).json({ error: parsed.error.errors[0].message }); return; }
  try {
    res.status(201).json(await svc.agregarAportacion(req.params.id, parsed.data, req.usuarioId!));
  } catch (e: unknown) { res.status(400).json({ error: e instanceof Error ? e.message : 'Error' }); }
}

export async function cambiarEstado(req: AuthRequest, res: Response): Promise<void> {
  const { estado } = req.body;
  if (!['ACTIVA', 'COMPLETADA', 'PAUSADA'].includes(estado)) {
    res.status(400).json({ error: 'Estado inválido' }); return;
  }
  try {
    res.json(await svc.actualizarEstadoMeta(req.params.id, estado));
  } catch { res.status(404).json({ error: 'Meta no encontrada' }); }
}

export async function eliminar(req: AuthRequest, res: Response): Promise<void> {
  try {
    await svc.eliminarMeta(req.params.id);
    res.json({ mensaje: 'Meta eliminada' });
  } catch { res.status(404).json({ error: 'Meta no encontrada' }); }
}
