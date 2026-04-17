import { z } from 'zod';
import { CATEGORIAS_GASTO, TIPOS_GASTO } from '../gastos/gastos.types';

export const CrearFacturaSchema = z.object({
  nombre: z.string().min(1),
  importe: z.number().positive(),
  diaMes: z.number().int().min(1).max(31),
  categoria: z.enum(CATEGORIAS_GASTO).default('OTROS'),
  tipo: z.enum(TIPOS_GASTO).default('COMUN'),
  afectaAId: z.string().optional(),
});

export type CrearFacturaInput = z.infer<typeof CrearFacturaSchema>;
