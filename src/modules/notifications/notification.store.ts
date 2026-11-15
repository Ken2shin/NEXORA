import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Notification } from '@/shared/types/notification.types'
import { repositories } from '@/shared/infrastructure/provider'

export const useNotificationStore = defineStore('notifications', () => {
  const notifications = ref<Notification[]>([])
  const isLoading = ref<boolean>(false)

  const unreadCount = computed(() => notifications.value.filter(n => !n.read_at).length)

  async function fetchNotifications(userId: string): Promise<void> {
    isLoading.value = true
    try {
      notifications.value = await repositories.notifications.getNotifications(userId)
    } finally {
      isLoading.value = false
    }
  }

  async function markAsRead(id: string): Promise<void> {
    await repositories.notifications.markAsRead(id)
    const target = notifications.value.find(n => n.id === id)
    if (target) {
      target.read_at = new Date().toISOString()
    }
  }

  async function markAllAsRead(userId: string): Promise<void> {
    await repositories.notifications.markAllAsRead(userId)
    notifications.value.forEach(n => {
      n.read_at = new Date().toISOString()
    })
  }

  return {
    notifications,
    isLoading,
    unreadCount,
    fetchNotifications,
    markAsRead,
    markAllAsRead
  }
})
