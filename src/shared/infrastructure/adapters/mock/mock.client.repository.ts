import type { IClientRepository } from '@/shared/infrastructure/contracts/client.repository'
import type { UserProfile } from '@/shared/types/user.types'
import { initialUsers } from './mock.data'
import { isSupabaseConfigured } from '@/shared/infrastructure/supabase'

export class MockClientRepository implements IClientRepository {
  private users: UserProfile[] = [...initialUsers]

  private checkProductionPolicy(): void {
    if (import.meta.env.PROD && !isSupabaseConfigured()) {
      throw new Error('Configuración requerida: VITE_SUPABASE_URL y VITE_SUPABASE_PUBLISHABLE_KEY deben configurarse en producción.')
    }
  }

  async getClients(search?: string, page = 1, limit = 10): Promise<{ data: UserProfile[]; total: number }> {
    this.checkProductionPolicy()
    let clients = this.users.filter(u => u.role === 'client')

    if (search) {
      const q = search.toLowerCase().trim()
      clients = clients.filter(c =>
        c.full_name.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        (c.phone && c.phone.includes(q))
      )
    }

    const total = clients.length
    const start = (page - 1) * limit
    const paginated = clients.slice(start, start + limit)

    return {
      data: paginated,
      total
    }
  }

  async getClientById(id: string): Promise<UserProfile | null> {
    this.checkProductionPolicy()
    const found = this.users.find(u => u.id === id && u.role === 'client')
    return found ? { ...found } : null
  }

  async toggleClientStatus(id: string, isActive: boolean): Promise<UserProfile> {
    this.checkProductionPolicy()
    const client = this.users.find(u => u.id === id && u.role === 'client')
    if (!client) {
      throw new Error('Cliente no encontrado')
    }

    client.is_active = isActive
    client.updated_at = new Date().toISOString()
    return { ...client }
  }
}
