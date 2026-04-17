import { Response } from 'express';
import * as svc from './usuarios.service';
import { AuthRequest } from '../../middleware/auth';
import { CATEGORIAS_GASTO } from '../gastos/gastos.types';

export async function obtenerAhorros(_req: AuthRequest, res: Response): Promise<void> {
  res.json(await svc.obtenerAhorros());
}

export async function actualizarAhorro(req: AuthRequest, res: Response): Promise<void> {
  const { importe, nota } = req.body;
  if (typeof importe !== 'number' || importe < 0) {
    res.status(400).json({ error: 'Importe inválido' }); return;
  }
  res.json(await svc.actualizarAhorro(req.usuarioId!, importe, nota));
}

export async function obtenerHistorialAhorro(req: AuthRequest, res: Response): Promise<void> {
  res.json(await svc.obtenerHistorialAhorro(req.usuarioId!));
}

export async function obtenerPresupuestos(req: AuthRequest, res: Response): Promise<void> {
  const mes = (req.query.mes as string) || `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;
  res.json(await svc.resumenPresupuestos(req.usuarioId!, mes));
}

export async function upsertPresupuesto(req: AuthRequest, res: Response): Promise<void> {
  const { categoria, importe } = req.body;
  if (!CATEGORIAS_GASTO.includes(categoria)) {
    res.status(400).json({ error: 'Categoría inválida' }); return;
  }
  res.json(await svc.upsertPresupuesto(req.usuarioId!, categoria, Number(importe)));
}

export async function eliminarPresupuesto(req: AuthRequest, res: Response): Promise<void> {
  await svc.eliminarPresupuesto(req.usuarioId!, req.params.categoria);
  res.json({ mensaje: 'Presupuesto eliminado' });
}

export async function obtenerCategorias(req: AuthRequest, res: Response): Promise<void> {
  res.json(await svc.obtenerCategorias(req.usuarioId!));
}

export async function crearCategoria(req: AuthRequest, res: Response): Promise<void> {
  try {
    res.status(201).json(await svc.crearCategoria(req.usuarioId!, req.body));
  } catch (e: unknown) { res.status(400).json({ error: e instanceof Error ? e.message : 'Error' }); }
}

export async function eliminarCategoria(req: AuthRequest, res: Response): Promise<void> {
  try {
    await svc.eliminarCategoria(req.params.id, req.usuarioId!);
    res.json({ mensaje: 'Categoría eliminada' });
  } catch { res.status(404).json({ error: 'No encontrada' }); }
}

export async function exportar(req: AuthRequest, res: Response): Promise<void> {
  const mes = (req.query.mes as string) || `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;
  const csv = await svc.exportarDatos(req.usuarioId!, mes);
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename="economia-${mes}.csv"`);
  res.send(csv);
}
