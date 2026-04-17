import { Response } from 'express';
import * as svc from './ingresos.service';
import { CrearIngresoSchema, FiltrosIngresoSchema } from './ingresos.types';
import { AuthRequest } from '../../middleware/auth';

export async function listar(req: AuthRequest, res: Response): Promise<void> {
  const parsed = FiltrosIngresoSchema.safeParse(req.query);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.errors[0].message }); return; }
  res.json(await svc.listarIngresos(parsed.data));
}

export async function crear(req: AuthRequest, res: Response): Promise<void> {
  const parsed = CrearIngresoSchema.safeParse({ ...req.body, importe: Number(req.body.importe) });
  if (!parsed.success) { res.status(400).json({ error: parsed.error.errors[0].message }); return; }
  try {
    res.status(201).json(await svc.crearIngreso(parsed.data, req.usuarioId!));
  } catch (e: unknown) { res.status(400).json({ error: e instanceof Error ? e.message : 'Error' }); }
}

export async function actualizar(req: AuthRequest, res: Response): Promise<void> {
  const parsed = CrearIngresoSchema.partial().safeParse({ ...req.body, importe: req.body.importe ? Number(req.body.importe) : undefined });
  if (!parsed.success) { res.status(400).json({ error: parsed.error.errors[0].message }); return; }
  try {
    res.json(await svc.actualizarIngreso(req.params.id, parsed.data, req.usuarioId!));
  } catch (e: unknown) { res.status(400).json({ error: e instanceof Error ? e.message : 'Error' }); }
}

export async function eliminar(req: AuthRequest, res: Response): Promise<void> {
  try {
    await svc.eliminarIngreso(req.params.id, req.usuarioId!);
    res.json({ mensaje: 'Ingreso eliminado' });
  } catch (e: unknown) { res.status(400).json({ error: e instanceof Error ? e.message : 'Error' }); }
}

export async function resumen(req: AuthRequest, res: Response): Promise<void> {
  const mes = (req.query.mes as string) || `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;
  res.json(await svc.resumenIngresos(mes));
}
