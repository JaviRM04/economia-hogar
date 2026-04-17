import { z } from 'zod';

export const CrearDeudaSchema = z.object({
  importe: z.number().positive(),
  concepto: z.string().min(1),
  deudorId: z.string(),
  acreedorId: z.string(),
});

export type CrearDeudaInput = z.infer<typeof CrearDeudaSchema>;
