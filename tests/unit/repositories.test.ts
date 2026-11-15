import { describe, it, expect, beforeEach } from 'vitest'
import { MockAuthRepository } from '../../src/shared/infrastructure/adapters/mock/mock.auth.repository'
import { MockServiceRepository } from '../../src/shared/infrastructure/adapters/mock/mock.service.repository'
import { MockRequestRepository } from '../../src/shared/infrastructure/adapters/mock/mock.request.repository'
import { MockClientRepository } from '../../src/shared/infrastructure/adapters/mock/mock.client.repository'

describe('Mock Repositories Integration', () => {
  let authRepo: MockAuthRepository
  let serviceRepo: MockServiceRepository
  let requestRepo: MockRequestRepository
  let clientRepo: MockClientRepository

  beforeEach(() => {
    authRepo = new MockAuthRepository()
    serviceRepo = new MockServiceRepository()
    requestRepo = new MockRequestRepository()
    clientRepo = new MockClientRepository()
  })

  it('authenticates admin and client users correctly', async () => {
    const adminUser = await authRepo.signIn({ email: 'admin@nexora.com', password: 'any' })
    expect(adminUser.role).toBe('admin')

    const clientUser = await authRepo.signIn({ email: 'carlos@gmail.com', password: 'any' })
    expect(clientUser.role).toBe('client')
  })

  it('registers a new client with default client role and prevents duplicate emails', async () => {
    const newClient = await authRepo.signUp({
      full_name: 'Nuevo Cliente',
      email: 'nuevo@empresa.com',
      password: 'password123'
    })
    expect(newClient.role).toBe('client')
    expect(newClient.full_name).toBe('Nuevo Cliente')

    await expect(authRepo.signUp({
      full_name: 'Otro Nombre',
      email: 'nuevo@empresa.com',
      password: 'password123'
    })).rejects.toThrow('El correo electrónico ya se encuentra registrado.')
  })

  it('filters services by active status and category', async () => {
    const allServices = await serviceRepo.getServices()
    expect(allServices.total).toBeGreaterThan(0)

    const categories = await serviceRepo.getCategories()
    expect(categories.length).toBeGreaterThan(0)

    const filtered = await serviceRepo.getServices({ category_id: categories[0]!.id })
    expect(filtered.data.every(s => s.category_id === categories[0]!.id)).toBe(true)
  })

  it('creates, updates and lists service requests with status history', async () => {
    const services = await serviceRepo.getServices()
    const targetService = services.data[0]!

    const createdReq = await requestRepo.createRequest('u0000000-0000-0000-0000-000000000003', {
      service_id: targetService.id,
      description: 'Solicitud de prueba automatizada'
    })

    expect(createdReq.status).toBe('pending')
    expect(createdReq.request_number).toMatch(/^#\d{3}$/)

    const updatedReq = await requestRepo.updateStatus(
      {
        request_id: createdReq.id,
        status: 'in_progress',
        note: 'Técnico asignado'
      },
      'u0000000-0000-0000-0000-000000000001'
    )

    expect(updatedReq.status).toBe('in_progress')
    expect(updatedReq.history?.length).toBeGreaterThan(0)
    expect(updatedReq.history?.[0]?.new_status).toBe('in_progress')
  })

  it('lists registered clients and toggles active status', async () => {
    const clients = await clientRepo.getClients()
    expect(clients.total).toBeGreaterThan(0)

    const firstClient = clients.data[0]!
    const toggled = await clientRepo.toggleClientStatus(firstClient.id, false)
    expect(toggled.is_active).toBe(false)

    const restored = await clientRepo.toggleClientStatus(firstClient.id, true)
    expect(restored.is_active).toBe(true)
  })
})
