import type { IServiceRepository } from '@/shared/infrastructure/contracts/service.repository'
import type { Service, ServiceCategory, ServiceFilter, CreateServiceDTO, UpdateServiceDTO } from '@/shared/types/service.types'
import { initialServices, initialCategories } from './mock.data'
import { isSupabaseConfigured } from '@/shared/infrastructure/supabase'

export class MockServiceRepository implements IServiceRepository {
  private services: Service[] = [...initialServices]
  private categories: ServiceCategory[] = [...initialCategories]

  private checkProductionPolicy(): void {
    if (import.meta.env.PROD && !isSupabaseConfigured()) {
      throw new Error('Configuración requerida: VITE_SUPABASE_URL y VITE_SUPABASE_PUBLISHABLE_KEY deben configurarse en producción.')
    }
  }

  async getCategories(): Promise<ServiceCategory[]> {
    this.checkProductionPolicy()
    return [...this.categories].sort((a, b) => a.sort_order - b.sort_order)
  }

  async getServices(filter?: ServiceFilter): Promise<{ data: Service[]; total: number }> {
    this.checkProductionPolicy()
    let result = [...this.services]

    if (filter?.is_active !== undefined) {
      result = result.filter(s => s.is_active === filter.is_active)
    }

    if (filter?.category_id && filter.category_id !== 'all') {
      result = result.filter(s => s.category_id === filter.category_id)
    }

    if (filter?.search) {
      const q = filter.search.toLowerCase().trim()
      result = result.filter(s =>
        s.name.toLowerCase().includes(q) ||
        s.short_description.toLowerCase().includes(q) ||
        s.description.toLowerCase().includes(q)
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

  async getServiceById(id: string): Promise<Service | null> {
    this.checkProductionPolicy()
    const found = this.services.find(s => s.id === id)
    return found ? { ...found } : null
  }

  async createService(dto: CreateServiceDTO, creatorId: string): Promise<Service> {
    this.checkProductionPolicy()
    const cat = this.categories.find(c => c.id === dto.category_id)
    const newService: Service = {
      id: `s-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      category_id: dto.category_id,
      category_name: cat ? cat.name : 'General',
      name: dto.name.trim(),
      slug: dto.slug.trim(),
      short_description: dto.short_description.trim(),
      description: dto.description.trim(),
      image_path: dto.image_path,
      price_amount: dto.price_amount ?? null,
      currency_code: dto.currency_code ?? 'USD',
      is_active: dto.is_active ?? true,
      created_by: creatorId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    this.services.unshift(newService)
    return newService
  }

  async updateService(dto: UpdateServiceDTO): Promise<Service> {
    this.checkProductionPolicy()
    const index = this.services.findIndex(s => s.id === dto.id)
    if (index === -1) {
      throw new Error('Servicio no encontrado')
    }

    const existing = this.services[index]!
    const cat = dto.category_id ? this.categories.find(c => c.id === dto.category_id) : undefined

    const updated: Service = {
      ...existing,
      ...dto,
      category_name: cat ? cat.name : existing.category_name,
      updated_at: new Date().toISOString()
    }

    this.services[index] = updated
    return updated
  }

  async deleteService(id: string): Promise<void> {
    this.checkProductionPolicy()
    const index = this.services.findIndex(s => s.id === id)
    if (index === -1) {
      throw new Error('Servicio no encontrado')
    }
    this.services.splice(index, 1)
  }
}
