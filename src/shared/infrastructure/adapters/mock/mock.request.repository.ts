import type { IRequestRepository } from '@/shared/infrastructure/contracts/request.repository'
import type { ServiceRequest, RequestFilter, CreateRequestDTO, UpdateRequestStatusDTO } from '@/shared/types/request.types'
import { initialRequests, initialServices, initialUsers } from './mock.data'
import { isSupabaseConfigured } from '@/shared/infrastructure/supabase'

export class MockRequestRepository implements IRequestRepository {
  private requests: ServiceRequest[] = [...initialRequests]

  private checkProductionPolicy(): void {
    if (import.meta.env.PROD && !isSupabaseConfigured()) {
      throw new Error('Configuración requerida: VITE_SUPABASE_URL y VITE_SUPABASE_PUBLISHABLE_KEY deben configurarse en producción.')
    }
  }

  async getRequests(filter?: RequestFilter): Promise<{ data: ServiceRequest[]; total: number }> {
    this.checkProductionPolicy()
    let result = [...this.requests]

    if (filter?.status && filter.status !== 'all') {
      result = result.filter(r => r.status === filter.status)
    }

    if (filter?.client_id) {
      result = result.filter(r => r.client_id === filter.client_id)
    }

    if (filter?.service_id && filter.service_id !== 'all') {
      result = result.filter(r => r.service_id === filter.service_id)
    }

    if (filter?.search) {
      const q = filter.search.toLowerCase().trim()
      result = result.filter(r =>
        r.request_number.toLowerCase().includes(q) ||
        (r.client_name && r.client_name.toLowerCase().includes(q)) ||
        (r.service_name && r.service_name.toLowerCase().includes(q)) ||
        r.description.toLowerCase().includes(q)
      )
    }

    const total = result.length
    const page = filter?.page ?? 1
    const limit = filter?.limit ?? 10
    const start = (page - 1) * limit
    const paginated = result.slice(start, start + limit)

    return {
      data: paginated,
      total
    }
  }

  async getRequestById(id: string): Promise<ServiceRequest | null> {
    this.checkProductionPolicy()
    const found = this.requests.find(r => r.id === id)
    return found ? { ...found } : null
  }

  async createRequest(clientId: string, dto: CreateRequestDTO): Promise<ServiceRequest> {
    this.checkProductionPolicy()
    const client = initialUsers.find(u => u.id === clientId)
    const service = initialServices.find(s => s.id === dto.service_id)

    if (!service) {
      throw new Error('Servicio no encontrado')
    }

    const nextNum = this.requests.length + 1
    const formattedNum = `#${String(nextNum).padStart(3, '0')}`

    const newReq: ServiceRequest = {
      id: `r-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      request_number: formattedNum,
      client_id: clientId,
      client_name: client ? client.full_name : 'Cliente',
      client_email: client ? client.email : '',
      service_id: dto.service_id,
      service_name: service.name,
      service_image: service.image_path,
      description: dto.description.trim(),
      status: 'pending',
      assigned_to: null,
      assigned_name: undefined,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      attachments: [],
      history: [
        {
          id: `h-${Date.now()}`,
          request_id: '',
          previous_status: null,
          new_status: 'pending',
          changed_by: clientId,
          changed_by_name: client ? client.full_name : 'Cliente',
          note: 'Solicitud enviada a través de la plataforma web',
          created_at: new Date().toISOString()
        }
      ]
    }

    newReq.history![0]!.request_id = newReq.id
    this.requests.unshift(newReq)
    return newReq
  }

  async updateStatus(dto: UpdateRequestStatusDTO, changedById: string): Promise<ServiceRequest> {
    this.checkProductionPolicy()
    const index = this.requests.findIndex(r => r.id === dto.request_id)
    if (index === -1) {
      throw new Error('Solicitud no encontrada')
    }

    const changer = initialUsers.find(u => u.id === changedById)
    const existing = this.requests[index]!
    const previousStatus = existing.status

    const historyItem = {
      id: `h-${Date.now()}`,
      request_id: existing.id,
      previous_status: previousStatus,
      new_status: dto.status,
      changed_by: changedById,
      changed_by_name: changer ? changer.full_name : 'Personal autorizado',
      note: dto.note?.trim() || `Estado cambiado a ${dto.status}`,
      created_at: new Date().toISOString()
    }

    const updated: ServiceRequest = {
      ...existing,
      status: dto.status,
      updated_at: new Date().toISOString(),
      history: [historyItem, ...(existing.history || [])]
    }

    this.requests[index] = updated
    return updated
  }

  async assignSpecialist(requestId: string, employeeId: string, employeeName?: string): Promise<ServiceRequest> {
    const index = this.requests.findIndex(r => r.id === requestId)
    if (index === -1) {
      throw new Error('Solicitud no encontrada')
    }

    const existing = this.requests[index]!
    const updated: ServiceRequest = {
      ...existing,
      assigned_to: employeeId,
      assigned_name: employeeName || 'Especialista Asignado',
      updated_at: new Date().toISOString()
    }

    this.requests[index] = updated
    return updated
  }
}
