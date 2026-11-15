import type { INotificationRepository } from '@/shared/infrastructure/contracts/notification.repository'
import type { Notification } from '@/shared/types/notification.types'
import { initialNotifications } from './mock.data'
import { isSupabaseConfigured } from '@/shared/infrastructure/supabase'

export class MockNotificationRepository implements INotificationRepository {
  private notifications: Notification[] = [...initialNotifications]

  private checkProductionPolicy(): void {
    if (import.meta.env.PROD && !isSupabaseConfigured()) {
      throw new Error('Configuración requerida: VITE_SUPABASE_URL y VITE_SUPABASE_PUBLISHABLE_KEY deben configurarse en producción.')
    }
  }

  async getNotifications(userId: string): Promise<Notification[]> {
    this.checkProductionPolicy()
    return this.notifications
      .filter(n => n.user_id === userId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
  }

  async markAsRead(notificationId: string): Promise<void> {
    this.checkProductionPolicy()
    const n = this.notifications.find(item => item.id === notificationId)
    if (n) {
      n.read_at = new Date().toISOString()
    }
  }

  async markAllAsRead(userId: string): Promise<void> {
    this.checkProductionPolicy()
    this.notifications.forEach(n => {
      if (n.user_id === userId && !n.read_at) {
        n.read_at = new Date().toISOString()
      }
    })
  }

  addNotification(notification: Omit<Notification, 'id' | 'created_at' | 'read_at'>): Notification {
    const created: Notification = {
      ...notification,
      id: `n-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      read_at: null,
      created_at: new Date().toISOString()
    }
    this.notifications.unshift(created)
    return created
  }
}
