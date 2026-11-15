import { z } from 'zod'

export const updateProfileSchema = z.object({
  full_name: z.string().trim().min(2, 'El nombre debe tener al menos 2 caracteres').max(100, 'Máximo 100 caracteres'),
  phone: z.string().trim().max(20, 'Máximo 20 caracteres').nullable().optional(),
  avatar_path: z.string().nullable().optional()
})

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>
