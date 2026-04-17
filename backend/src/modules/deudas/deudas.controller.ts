import { Response } from 'express';
import * as svc from './deudas.service';
import { CrearDeudaSchema } from './deudas.types';
import { AuthRequest } from '../../middleware/auth';

export async function listar(_req: AuthRequest, res: Response): Promise<void> {
  res.json(await svc.listarDeudas());
}

export async function crear(req: AuthRequest, res: Response): Promise<void> {
  const parsed = CrearDeudaSchema.safeParse({ ...req.body, importe: Number(req.body.importe) });
  if (!parsed.success) { res.status(400).json({ error: parsed.error.errors[0].message }); return; }
  try {
    res.status(201).json(await svc.crearDeuda(parsed.data));
  } catch (e: unknown) { res.status(400).json({ error: e instanceof Error ? e.message : 'Error' }); }
}

export async function liquidar(req: AuthRequest, res: Response): Promise<void> {
  try {
    res.json(await svc.liquidarDeuda(req.params.id));
  } catch { res.status(404).json({ error: 'Deuda no encontrada' }); }
}

export async function editarDeuda(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { importe, concepto } = req.body;
    res.json(await svc.editarDeuda(req.params.id, { importe: importe ? Number(importe) : undefined, concepto }));
  } catch (e: unknown) { res.status(400).json({ error: e instanceof Error ? e.message : 'Error' }); }
}

export async function eliminarDeuda(req: AuthRequest, res: Response): Promise<void> {
  try {
    await svc.eliminarDeuda(req.params.id);
    res.json({ mensaje: 'Deuda eliminada' });
  } catch { res.status(404).json({ error: 'Deuda no encontrada' }); }
}

export async function pagoParcial(req: AuthRequest, res: Response): Promise<void> {
  const importePagado = Number(req.body.importePagado);
  try {
    res.json(await svc.pagoParcial(req.params.id, importePagado));
  } catch (e: unknown) { res.status(400).json({ error: e instanceof Error ? e.message : 'Error' }); }
}

export async function balance(_req: AuthRequest, res: Response): Promise<void> {
  res.json(await svc.balanceNeto());
}
