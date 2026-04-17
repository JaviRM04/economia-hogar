import { Response } from 'express';
import * as svc from './facturas.service';
import { CrearFacturaSchema } from './facturas.types';
import { AuthRequest } from '../../middleware/auth';

export async function listar(_req: AuthRequest, res: Response): Promise<void> {
  res.json(await svc.listarFacturas());
}

export async function crear(req: AuthRequest, res: Response): Promise<void> {
  const parsed = CrearFacturaSchema.safeParse({ ...req.body, importe: Number(req.body.importe), diaMes: Number(req.body.diaMes) });
  if (!parsed.success) { res.status(400).json({ error: parsed.error.errors[0].message }); return; }
  try {
    res.status(201).json(await svc.crearFactura(parsed.data, req.usuarioId!));
  } catch (e: unknown) { res.status(400).json({ error: e instanceof Error ? e.message : 'Error' }); }
}

export async function actualizar(req: AuthRequest, res: Response): Promise<void> {
  const parsed = CrearFacturaSchema.partial().safeParse({ ...req.body, importe: req.body.importe ? Number(req.body.importe) : undefined, diaMes: req.body.diaMes ? Number(req.body.diaMes) : undefined });
  if (!parsed.success) { res.status(400).json({ error: parsed.error.errors[0].message }); return; }
  try {
    res.json(await svc.actualizarFactura(req.params.id, parsed.data));
  } catch (e: unknown) { res.status(400).json({ error: e instanceof Error ? e.message : 'Error' }); }
}

export async function desactivar(req: AuthRequest, res: Response): Promise<void> {
  try {
    await svc.desactivarFactura(req.params.id);
    res.json({ mensaje: 'Factura desactivada' });
  } catch { res.status(404).json({ error: 'No encontrada' }); }
}

export async function pagar(req: AuthRequest, res: Response): Promise<void> {
  const { mes, anio } = req.body;
  if (!mes || !anio) { res.status(400).json({ error: 'mes y anio requeridos' }); return; }
  try {
    res.json(await svc.marcarPagada(req.params.id, Number(mes), Number(anio)));
  } catch (e: unknown) { res.status(400).json({ error: e instanceof Error ? e.message : 'Error' }); }
}

export async function proximasSemana(_req: AuthRequest, res: Response): Promise<void> {
  res.json(await svc.facturasProximasSemana());
}
