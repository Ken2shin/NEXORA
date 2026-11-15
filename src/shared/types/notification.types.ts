export type NotificationType = 'request_created' | 'status_changed' | 'general'

export interface Notification {
  id: string
  user_id: string
  request_id?: string | null
  title: string
  message: string
  notification_type: NotificationType
  read_at: string | null
  created_at: string
}
