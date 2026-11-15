import { z } from 'zod'

export const serviceSchema = z.object({
  name: z.string().trim().min(2, 'El nombre debe tener al menos 2 caracteres').max(100, 'Máximo 100 caracteres'),
  category_id: z.string().uuid('Debes seleccionar una categoría válida'),
  short_description: z.string().trim().min(5, 'Descripción corta de al menos 5 caracteres').max(150, 'Máximo 150 caracteres'),
  description: z.string().trim().min(10, 'Descripción detallada de al menos 10 caracteres'),
  image_path: z.string().trim().min(1, 'La imagen es obligatoria'),
  price_amount: z.number().nonnegative('El precio debe ser mayor o igual a 0').nullable().optional(),
  currency_code: z.string().length(3).default('USD'),
  is_active: z.boolean().default(true)
})

export type ServiceInput = z.infer<typeof serviceSchema>
