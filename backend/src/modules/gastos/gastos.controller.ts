import { Response } from 'express';
import * as gastosService from './gastos.service';
import { CrearGastoSchema, FiltrosGastoSchema } from './gastos.types';
import { AuthRequest } from '../../middleware/auth';
import path from 'path';

export async function listar(req: AuthRequest, res: Response): Promise<void> {
  const parsed = FiltrosGastoSchema.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.errors[0].message });
    return;
  }
  const resultado = await gastosService.listarGastos(parsed.data);
  res.json(resultado);
}

export async function obtener(req: AuthRequest, res: Response): Promise<void> {
  try {
    const gasto = await gastosService.obtenerGasto(req.params.id);
    res.json(gasto);
  } catch {
    res.status(404).json({ error: 'Gasto no encontrado' });
  }
}

export async function crear(req: AuthRequest, res: Response): Promise<void> {
  const parsed = CrearGastoSchema.safeParse({
    ...req.body,
    importe: Number(req.body.importe),
  });
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.errors[0].message });
    return;
  }

  let ticketUrl: string | undefined;
  if (req.file) {
    ticketUrl = `/uploads/${req.file.filename}`;
  }

  try {
    const gasto = await gastosService.crearGasto(parsed.data, req.usuarioId!, ticketUrl);
    res.status(201).json(gasto);
  } catch (e: unknown) {
    res.status(400).json({ error: e instanceof Error ? e.message : 'Error al crear gasto' });
  }
}

export async function actualizar(req: AuthRequest, res: Response): Promise<void> {
  const parsed = CrearGastoSchema.partial().safeParse({
    ...req.body,
    importe: req.body.importe ? Number(req.body.importe) : undefined,
  });
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.errors[0].message });
    return;
  }
  try {
    const gasto = await gastosService.actualizarGasto(req.params.id, parsed.data, req.usuarioId!);
    res.json(gasto);
  } catch (e: unknown) {
    res.status(400).json({ error: e instanceof Error ? e.message : 'Error al actualizar' });
  }
}

export async function eliminar(req: AuthRequest, res: Response): Promise<void> {
  try {
    await gastosService.eliminarGasto(req.params.id, req.usuarioId!);
    res.json({ mensaje: 'Gasto eliminado' });
  } catch (e: unknown) {
    res.status(400).json({ error: e instanceof Error ? e.message : 'Error al eliminar' });
  }
}

export async function resumen(req: AuthRequest, res: Response): Promise<void> {
  const mes = (req.query.mes as string) || `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;
  const usuarioId = req.query.usuarioId as string | undefined;
  const data = await gastosService.resumenMes(mes, usuarioId);
  res.json(data);
}

export async function comparativa(_req: AuthRequest, res: Response): Promise<void> {
  const data = await gastosService.comparativaMensual();
  res.json(data);
}

export async function sugerencias(_req: AuthRequest, res: Response): Promise<void> {
  const data = await gastosService.sugerirCategorias();
  res.json(data);
}

export async function ticket(req: AuthRequest, res: Response): Promise<void> {
  const filename = req.params.filename;
  // Solo permite caracteres seguros en el nombre de archivo
  if (!/^[a-f0-9]+\.(jpg|jpeg|png|webp|heic)$/i.test(filename)) {
    res.status(400).json({ error: 'Nombre de archivo inválido' });
    return;
  }
  const filePath = path.join(process.cwd(), 'uploads', filename);
  res.sendFile(filePath, (err) => {
    if (err) res.status(404).json({ error: 'Archivo no encontrado' });
  });
}
