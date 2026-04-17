import { z } from 'zod';

export const LoginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Contraseña mínimo 6 caracteres'),
});

export const RegisterSchema = z.object({
  nombre: z.string().min(2, 'Nombre mínimo 2 caracteres'),
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Contraseña mínimo 6 caracteres'),
});

export const CambiarPasswordSchema = z.object({
  passwordActual: z.string().min(6),
  passwordNueva: z.string().min(6, 'Nueva contraseña mínimo 6 caracteres'),
});

export type LoginInput = z.infer<typeof LoginSchema>;
export type RegisterInput = z.infer<typeof RegisterSchema>;
export type CambiarPasswordInput = z.infer<typeof CambiarPasswordSchema>;
