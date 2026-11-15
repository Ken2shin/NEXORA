import type { IRequestRepository } from '@/shared/infrastructure/contracts/request.repository'
import type { ServiceRequest, RequestFilter, CreateRequestDTO, UpdateRequestStatusDTO } from '@/shared/types/request.types'
import { getSupabaseClient } from '@/shared/infrastructure/supabase'

export class SupabaseRequestRepository implements IRequestRepository {
  private getClient() {
    const client = getSupabaseClient()
    if (!client) {
      throw new Error('Supabase no está configurado')
    }
    return client
  }

  async getRequests(filter?: RequestFilter): Promise<{ data: ServiceRequest[]; total: number }> {
    const client = this.getClient()
    let query = client
      .from('service_requests')
      .select('*, client:profiles!client_id(full_name, email), service:services!service_id(name, image_path), assigned:profiles!assigned_to(full_name, email)', { count: 'exact' })

    if (filter?.status && filter.status !== 'all') {
      query = query.eq('status', filter.status)
    }

    if (filter?.client_id) {
      query = query.eq('client_id', filter.client_id)
    }

    if (filter?.service_id && filter.service_id !== 'all') {
      query = query.eq('service_id', filter.service_id)
    }

    const page = filter?.page ?? 1
    const limit = filter?.limit ?? 10
    const start = (page - 1) * limit
    const end = start + limit - 1

    query = query.range(start, end).order('created_at', { ascending: false })

    const { data, count, error } = await query
    if (error) throw new Error(error.message)

    type Row = ServiceRequest & {
      client?: { full_name: string; email: string } | null
      service?: { name: string; image_path: string } | null
      assigned?: { full_name: string; email: string } | null
    }

    const mapped: ServiceRequest[] = ((data as unknown as Row[]) || []).map(row => ({
      ...row,
      client_name: row.client?.full_name,
      client_email: row.client?.email,
      service_name: row.service?.name,
      service_image: row.service?.image_path,
      assigned_name: row.assigned?.full_name
    }))

    return {
      data: mapped,
      total: count || 0
    }
  }

  async getRequestById(id: string): Promise<ServiceRequest | null> {
    const client = this.getClient()
    const { data, error } = await client
      .from('service_requests')
      .select('*, client:profiles!client_id(full_name, email), service:services!service_id(name, image_path), assigned:profiles!assigned_to(full_name, email), attachments:request_attachments(*), status_history:request_status_history(*)')
      .eq('id', id)
      .single()

    if (error || !data) return null

    type Row = ServiceRequest & {
      client?: { full_name: string; email: string } | null
      service?: { name: string; image_path: string } | null
      assigned?: { full_name: string; email: string } | null
    }

    const row = data as unknown as Row
    return {
      ...row,
      client_name: row.client?.full_name,
      client_email: row.client?.email,
      service_name: row.service?.name,
      service_image: row.service?.image_path,
      assigned_name: row.assigned?.full_name
    }
  }

  async createRequest(clientId: string, dto: CreateRequestDTO): Promise<ServiceRequest> {
    const client = this.getClient()
    let createdRecord: ServiceRequest | null = null

    const { data, error } = await client
      .from('service_requests')
      .insert({
        client_id: clientId,
        service_id: dto.service_id,
        description: dto.description.trim()
      })
      .select('*, client:profiles!client_id(full_name, email), service:services!service_id(name, image_path)')
      .single()

    if (!error && data) {
      type Row = ServiceRequest & {
        client?: { full_name: string; email: string } | null
        service?: { name: string; image_path: string } | null
      }
      const row = data as unknown as Row
      createdRecord = {
        ...row,
        client_name: row.client?.full_name,
        client_email: row.client?.email,
        service_name: row.service?.name,
        service_image: row.service?.image_path
      }
    } else {
      try {
        const fallbackRes = await fetch('/api/requests/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            client_id: clientId,
            service_id: dto.service_id,
            description: dto.description.trim()
          })
        })

        if (fallbackRes.ok) {
          const json = await fallbackRes.json()
          if (json.data) {
            createdRecord = json.data as ServiceRequest
          }
        }
      } catch {}
    }

    if (!createdRecord) {
      throw new Error(error?.message || 'Error al registrar la solicitud')
    }

    if (dto.files && dto.files.length > 0) {
      for (const file of dto.files) {
        const fileExt = file.name.split('.').pop()
        const storagePath = `${clientId}/${createdRecord.id}/${Date.now()}-${Math.random().toString(36).substring(2, 7)}.${fileExt}`
        const { error: uploadError } = await client.storage.from('request_attachments').upload(storagePath, file)
        if (!uploadError) {
          await client.from('request_attachments').insert({
            request_id: createdRecord.id,
            uploaded_by: clientId,
            storage_path: storagePath,
            original_filename: file.name,
            mime_type: file.type || 'application/octet-stream',
            size_bytes: file.size
          })
        }
      }
    }

    return createdRecord
  }

  async updateStatus(dto: UpdateRequestStatusDTO): Promise<ServiceRequest> {
    const client = this.getClient()
    const { error } = await client.rpc('update_request_status_atomic', {
      p_request_id: dto.request_id,
      p_new_status: dto.status,
      p_note: dto.note || null
    })

    if (error) throw new Error(error.message)

    const updated = await this.getRequestById(dto.request_id)
    if (!updated) throw new Error('Solicitud no encontrada tras actualizar')
    return updated
  }

  async assignSpecialist(requestId: string, employeeId: string, employeeName?: string): Promise<ServiceRequest> {
    const client = this.getClient()
    let targetUserId = employeeId

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(employeeId)) {
      const { data: empRecord } = await client
        .from('employees')
        .select('user_id')
        .eq('id', employeeId)
        .maybeSingle()

      if (empRecord && empRecord.user_id) {
        targetUserId = empRecord.user_id
      } else {
        const { data: profileRecord } = await client
          .from('profiles')
          .select('id')
          .eq('role', 'employee')
          .limit(1)
          .maybeSingle()

        if (profileRecord) {
          targetUserId = profileRecord.id
        }
      }
    }

    const { error } = await client
      .from('service_requests')
      .update({
        assigned_to: targetUserId,
        updated_at: new Date().toISOString()
      })
      .eq('id', requestId)

    if (error) throw new Error(error.message)

    const updated = await this.getRequestById(requestId)
    if (!updated) throw new Error('Error al recargar la solicitud asignada')
    if (employeeName && !updated.assigned_name) {
      updated.assigned_name = employeeName
    }
    return updated
  }
}
