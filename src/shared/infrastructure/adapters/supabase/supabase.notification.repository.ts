import type { INotificationRepository } from '@/shared/infrastructure/contracts/notification.repository'
import type { Notification } from '@/shared/types/notification.types'
import { getSupabaseClient } from '@/shared/infrastructure/supabase'

export class SupabaseNotificationRepository implements INotificationRepository {
  private getClient() {
    const client = getSupabaseClient()
    if (!client) {
      throw new Error('Supabase no está configurado')
    }
    return client
  }

  async getNotifications(userId: string): Promise<Notification[]> {
    const client = this.getClient()
    const { data, error } = await client
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) throw new Error(error.message)
    return (data as Notification[]) || []
  }

  async markAsRead(notificationId: string): Promise<void> {
    const client = this.getClient()
    const { error } = await client
      .from('notifications')
      .update({ read_at: new Date().toISOString() })
      .eq('id', notificationId)

    if (error) throw new Error(error.message)
  }

  async markAllAsRead(userId: string): Promise<void> {
    const client = this.getClient()
    const { error } = await client
      .from('notifications')
      .update({ read_at: new Date().toISOString() })
      .eq('user_id', userId)
      .is('read_at', null)

    if (error) throw new Error(error.message)
  }
}
