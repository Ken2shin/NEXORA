import { z } from 'zod'

export const loginSchema = z.object({
  email: z.string().trim().email('Ingresa un correo electrónico válido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres')
})

export const registerSchema = z.object({
  full_name: z.string().trim().min(2, 'El nombre completo debe tener al menos 2 caracteres').max(100, 'El nombre no puede exceder 100 caracteres'),
  email: z.string().trim().email('Ingresa un correo electrónico válido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
  phone: z.string().trim().max(20, 'El teléfono no puede exceder 20 caracteres').optional().or(z.literal(''))
})

export const passwordRecoverySchema = z.object({
  email: z.string().trim().email('Ingresa un correo electrónico válido')
})

export type LoginInput = z.infer<typeof loginSchema>
export type RegisterInput = z.infer<typeof registerSchema>
export type PasswordRecoveryInput = z.infer<typeof passwordRecoverySchema>
