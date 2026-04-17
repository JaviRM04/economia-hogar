import { z } from 'zod';

export const ESTADOS_META = ['ACTIVA', 'COMPLETADA', 'PAUSADA'] as const;
export type EstadoMeta = typeof ESTADOS_META[number];

export const CrearMetaSchema = z.object({
  nombre: z.string().min(1),
  emoji: z.string().default('🎯'),
  importeObjetivo: z.number().positive(),
  fechaLimite: z.string().optional(),
});

export const AportacionSchema = z.object({
  importe: z.number().positive(),
  nota: z.string().optional(),
});

export type CrearMetaInput = z.infer<typeof CrearMetaSchema>;
export type AportacionInput = z.infer<typeof AportacionSchema>;
