import type { IServiceRepository } from '@/shared/infrastructure/contracts/service.repository'
import type { Service, ServiceCategory, ServiceFilter, CreateServiceDTO, UpdateServiceDTO } from '@/shared/types/service.types'
import { getSupabaseClient } from '@/shared/infrastructure/supabase'

export class SupabaseServiceRepository implements IServiceRepository {
  private getClient() {
    const client = getSupabaseClient()
    if (!client) {
      throw new Error('Supabase no está configurado')
    }
    return client
  }

  async getCategories(): Promise<ServiceCategory[]> {
    const client = this.getClient()
    const { data, error } = await client
      .from('service_categories')
      .select('*')
      .order('sort_order', { ascending: true })

    if (error) throw new Error(error.message)
    return (data as ServiceCategory[]) || []
  }

  async getServices(filter?: ServiceFilter): Promise<{ data: Service[]; total: number }> {
    const client = this.getClient()
    let query = client
      .from('services')
      .select('*, service_categories(name)', { count: 'exact' })

    if (filter?.is_active !== undefined) {
      query = query.eq('is_active', filter.is_active)
    }

    if (filter?.category_id && filter.category_id !== 'all') {
      query = query.eq('category_id', filter.category_id)
    }

    if (filter?.search) {
      query = query.ilike('name', `%${filter.search.trim()}%`)
    }

    const page = filter?.page ?? 1
    const limit = filter?.limit ?? 10
    const start = (page - 1) * limit
    const end = start + limit - 1

    query = query.range(start, end).order('created_at', { ascending: false })

    const { data, count, error } = await query
    if (error) throw new Error(error.message)

    type ServiceRow = Service & { service_categories?: { name: string } | null }
    const mapped: Service[] = ((data as unknown as ServiceRow[]) || []).map(row => ({
      ...row,
      category_name: row.service_categories ? row.service_categories.name : undefined
    }))

    return {
      data: mapped,
      total: count || 0
    }
  }

  async getServiceById(id: string): Promise<Service | null> {
    const client = this.getClient()
    const { data, error } = await client
      .from('services')
      .select('*, service_categories(name)')
      .eq('id', id)
      .single()

    if (error || !data) return null
    type ServiceRow = Service & { service_categories?: { name: string } | null }
    const row = data as unknown as ServiceRow
    return {
      ...row,
      category_name: row.service_categories ? row.service_categories.name : undefined
    }
  }

  async createService(dto: CreateServiceDTO, creatorId: string): Promise<Service> {
    const client = this.getClient()
    const { data, error } = await client
      .from('services')
      .insert({
        category_id: dto.category_id,
        name: dto.name,
        slug: dto.slug,
        short_description: dto.short_description,
        description: dto.description,
        image_path: dto.image_path,
        price_amount: dto.price_amount,
        currency_code: dto.currency_code || 'USD',
        is_active: dto.is_active ?? true,
        created_by: creatorId
      })
      .select()
      .single()

    if (error || !data) throw new Error(error?.message || 'Error al crear servicio')
    return data as Service
  }

  async updateService(dto: UpdateServiceDTO): Promise<Service> {
    const client = this.getClient()
    const { data, error } = await client
      .from('services')
      .update({
        ...dto,
        updated_at: new Date().toISOString()
      })
      .eq('id', dto.id)
      .select()
      .single()

    if (error || !data) throw new Error(error?.message || 'Error al actualizar servicio')
    return data as Service
  }

  async deleteService(id: string): Promise<void> {
    const client = this.getClient()
    const { error } = await client.from('services').delete().eq('id', id)
    if (error) throw new Error(error.message)
  }
}
