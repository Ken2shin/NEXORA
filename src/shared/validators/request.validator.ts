import { z } from 'zod'

export const createRequestSchema = z.object({
  service_id: z.string().uuid('Debes seleccionar un servicio válido'),
  description: z.string().trim().min(10, 'La descripción debe tener al menos 10 caracteres').max(2000, 'Máximo 2000 caracteres')
})

export const updateRequestStatusSchema = z.object({
  request_id: z.string().uuid('ID de solicitud inválido'),
  status: z.enum(['pending', 'in_progress', 'completed']),
  note: z.string().trim().max(500, 'La nota no puede exceder 500 caracteres').optional()
})

export type CreateRequestInput = z.infer<typeof createRequestSchema>
export type UpdateRequestStatusInput = z.infer<typeof updateRequestStatusSchema>
