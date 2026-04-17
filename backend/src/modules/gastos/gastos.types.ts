import { z } from 'zod';

export const CATEGORIAS_GASTO = ['ALIMENTACION','HOGAR','TRANSPORTE','OCIO','SALUD','ROPA','RESTAURANTES','SUSCRIPCIONES','OTROS','PERSONALIZADA'] as const;
export const TIPOS_GASTO = ['COMUN','INDIVIDUAL'] as const;

export type CategoriaGasto = typeof CATEGORIAS_GASTO[number];
export type TipoGasto = typeof TIPOS_GASTO[number];

export const CrearGastoSchema = z.object({
  importe: z.number().positive('El importe debe ser positivo'),
  descripcion: z.string().min(1, 'La descripción es obligatoria'),
  categoria: z.enum(CATEGORIAS_GASTO).default('OTROS'),
  categoriaCustomId: z.string().optional(),
  tipo: z.enum(TIPOS_GASTO).default('INDIVIDUAL'),
  fecha: z.string().optional(),
  usuarioId: z.string().optional(),
});

export const FiltrosGastoSchema = z.object({
  mes: z.string().regex(/^\d{4}-\d{2}$/).optional(),
  categoria: z.enum(CATEGORIAS_GASTO).optional(),
  tipo: z.enum(TIPOS_GASTO).optional(),
  usuarioId: z.string().optional(),
  pagina: z.coerce.number().int().min(1).default(1),
  porPagina: z.coerce.number().int().min(1).max(100).default(20),
});

export type CrearGastoInput = z.infer<typeof CrearGastoSchema>;
export type FiltrosGasto = z.infer<typeof FiltrosGastoSchema>;
