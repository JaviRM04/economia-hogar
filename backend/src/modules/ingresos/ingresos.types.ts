import { z } from 'zod';

export const CATEGORIAS_INGRESO = ['SALARIO','EXTRA','FREELANCE','INVERSION','OTRO'] as const;
export type CategoriaIngreso = typeof CATEGORIAS_INGRESO[number];

export const CrearIngresoSchema = z.object({
  importe: z.number().positive('El importe debe ser positivo'),
  descripcion: z.string().min(1, 'La descripción es obligatoria'),
  categoria: z.enum(CATEGORIAS_INGRESO).default('SALARIO'),
  fecha: z.string().optional(),
  usuarioId: z.string().optional(),
});

export const FiltrosIngresoSchema = z.object({
  mes: z.string().regex(/^\d{4}-\d{2}$/).optional(),
  usuarioId: z.string().optional(),
  pagina: z.coerce.number().int().min(1).default(1),
  porPagina: z.coerce.number().int().min(1).max(100).default(20),
});

export type CrearIngresoInput = z.infer<typeof CrearIngresoSchema>;
export type FiltrosIngreso = z.infer<typeof FiltrosIngresoSchema>;
