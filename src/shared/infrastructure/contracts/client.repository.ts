import type { UserProfile } from '@/shared/types/user.types'

export interface IClientRepository {
  getClients(search?: string, page?: number, limit?: number): Promise<{ data: UserProfile[]; total: number }>
  getClientById(id: string): Promise<UserProfile | null>
  toggleClientStatus(id: string, isActive: boolean): Promise<UserProfile>
}
