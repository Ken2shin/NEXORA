import type { Notification } from '@/shared/types/notification.types'

export interface INotificationRepository {
  getNotifications(userId: string): Promise<Notification[]>
  markAsRead(notificationId: string): Promise<void>
  markAllAsRead(userId: string): Promise<void>
}
