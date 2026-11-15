import type { IClientRepository } from '@/shared/infrastructure/contracts/client.repository'
import type { UserProfile } from '@/shared/types/user.types'
import { getSupabaseClient } from '@/shared/infrastructure/supabase'

export class SupabaseClientRepository implements IClientRepository {
  private getClient() {
    const client = getSupabaseClient()
    if (!client) {
      throw new Error('Supabase no está configurado')
    }
    return client
  }

  async getClients(search?: string, page = 1, limit = 10): Promise<{ data: UserProfile[]; total: number }> {
    const client = this.getClient()
    let query = client
      .from('profiles')
      .select('*', { count: 'exact' })
      .eq('role', 'client')

    if (search) {
      query = query.or(`full_name.ilike.%${search.trim()}%,email.ilike.%${search.trim()}%`)
    }

    const start = (page - 1) * limit
    const end = start + limit - 1

    query = query.range(start, end).order('created_at', { ascending: false })

    const { data, count, error } = await query
    if (error) throw new Error(error.message)

    return {
      data: (data as UserProfile[]) || [],
      total: count || 0
    }
  }

  async getClientById(id: string): Promise<UserProfile | null> {
    const client = this.getClient()
    const { data, error } = await client
      .from('profiles')
      .select('*')
      .eq('id', id)
      .eq('role', 'client')
      .single()

    if (error || !data) return null
    return data as UserProfile
  }

  async toggleClientStatus(id: string, isActive: boolean): Promise<UserProfile> {
    const client = this.getClient()
    const { data, error } = await client
      .from('profiles')
      .update({ is_active: isActive, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()

    if (error || !data) throw new Error(error?.message || 'Error al actualizar cliente')
    return data as UserProfile
  }
}
