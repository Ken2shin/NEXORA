import { describe, it, expect } from 'vitest'
import { loginSchema, registerSchema, passwordRecoverySchema } from '../../src/shared/validators/auth.validator'
import { serviceSchema } from '../../src/shared/validators/service.validator'
import { createRequestSchema, updateRequestStatusSchema } from '../../src/shared/validators/request.validator'
import { updateProfileSchema } from '../../src/shared/validators/profile.validator'

describe('Zod Schemas Validation', () => {
  it('validates correct login credentials and catches invalid inputs', () => {
    const valid = loginSchema.safeParse({ email: 'admin@nexora.com', password: 'password123' })
    expect(valid.success).toBe(true)

    const invalidEmail = loginSchema.safeParse({ email: 'not-an-email', password: 'password123' })
    expect(invalidEmail.success).toBe(false)

    const shortPwd = loginSchema.safeParse({ email: 'admin@nexora.com', password: '123' })
    expect(shortPwd.success).toBe(false)
  })

  it('validates client registration schema', () => {
    const valid = registerSchema.safeParse({
      full_name: 'Carlos Pérez',
      email: 'carlos@gmail.com',
      password: 'password123',
      phone: '+52 55 1234 5678'
    })
    expect(valid.success).toBe(true)

    const shortName = registerSchema.safeParse({
      full_name: 'A',
      email: 'carlos@gmail.com',
      password: 'password123'
    })
    expect(shortName.success).toBe(false)
  })

  it('validates password recovery schema', () => {
    expect(passwordRecoverySchema.safeParse({ email: 'user@nexora.com' }).success).toBe(true)
    expect(passwordRecoverySchema.safeParse({ email: '' }).success).toBe(false)
  })

  it('validates service creation and updates', () => {
    const valid = serviceSchema.safeParse({
      name: 'Diseño Web',
      category_id: 'c1010000-0000-0000-0000-000000000001',
      short_description: 'Sitios web modernos.',
      description: 'Desarrollo web a medida con arquitectura modular y diseño responsive.',
      image_path: '/images/services/web-design.jpg',
      price_amount: 120,
      currency_code: 'USD',
      is_active: true
    })
    expect(valid.success).toBe(true)

    const negativePrice = serviceSchema.safeParse({
      name: 'Diseño Web',
      category_id: 'c1010000-0000-0000-0000-000000000001',
      short_description: 'Sitios web modernos.',
      description: 'Desarrollo web a medida con arquitectura modular y diseño responsive.',
      image_path: '/images/services/web-design.jpg',
      price_amount: -50
    })
    expect(negativePrice.success).toBe(false)
  })

  it('validates service request creation and status transitions', () => {
    const validReq = createRequestSchema.safeParse({
      service_id: 'c1010000-0000-0000-0000-000000000001',
      description: 'Requerimos rediseño completo de nuestro portal corporativo.'
    })
    expect(validReq.success).toBe(true)

    const shortDesc = createRequestSchema.safeParse({
      service_id: 'c1010000-0000-0000-0000-000000000001',
      description: 'Corto'
    })
    expect(shortDesc.success).toBe(false)

    const validStatus = updateRequestStatusSchema.safeParse({
      request_id: 'c1010000-0000-0000-0000-000000000001',
      status: 'in_progress',
      note: 'Asignando especialista'
    })
    expect(validStatus.success).toBe(true)
  })

  it('validates profile updates', () => {
    const valid = updateProfileSchema.safeParse({
      full_name: 'María López',
      phone: '+52 55 9876 5432'
    })
    expect(valid.success).toBe(true)
  })
})
