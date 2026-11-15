<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { CheckCircle2, RefreshCw, Bell, CheckCheck, MessageSquare } from 'lucide-vue-next'
import { useAuthStore } from '@/modules/auth/auth.store'
import { useNotificationStore } from '../notification.store'
import { formatRelativeTime } from '@/shared/utils/formatters'
import ConversationsWorkspace from '@/modules/conversations/views/ConversationsWorkspace.vue'

const authStore = useAuthStore()
const notificationStore = useNotificationStore()

const activeTab = ref<'notifications' | 'conversations'>('conversations')

const user = computed(() => authStore.currentUser)
const notifications = computed(() => notificationStore.notifications)
const isLoading = computed(() => notificationStore.isLoading)

onMounted(async () => {
  if (user.value) {
    await notificationStore.fetchNotifications(user.value.id)
  }
})

async function handleMarkAsRead(id: string) {
  await notificationStore.markAsRead(id)
}

async function handleMarkAllAsRead() {
  if (user.value) {
    await notificationStore.markAllAsRead(user.value.id)
  }
}
</script>

<template>
  <div class="notifications-page">
    <div class="page-header">
      <div class="header-main">
        <div>
          <h1 class="page-title">Centro de Notificaciones y Mensajería</h1>
          <p class="page-subtitle">Mantente al tanto de tus actividades, actualizaciones y atención directa con soporte técnico.</p>
        </div>
        <button
          v-if="activeTab === 'notifications' && notifications.length > 0"
          class="btn btn-secondary mark-read-all-btn"
          @click="handleMarkAllAsRead"
        >
          <CheckCheck :size="16" />
          <span>Marcar todas como leídas</span>
        </button>
      </div>

      <div class="notif-tabs">
        <button
          class="tab-pill"
          :class="{ active: activeTab === 'conversations' }"
          @click="activeTab = 'conversations'"
        >
          <MessageSquare :size="16" />
          <span>Conversaciones y Soporte</span>
        </button>

        <button
          class="tab-pill"
          :class="{ active: activeTab === 'notifications' }"
          @click="activeTab = 'notifications'"
        >
          <Bell :size="16" />
          <span>Notificaciones Informativas</span>
          <span v-if="notifications.length > 0" class="notif-count-badge">{{ notifications.length }}</span>
        </button>
      </div>
    </div>

    <div v-if="activeTab === 'conversations'" class="conversations-tab-wrap">
      <ConversationsWorkspace />
    </div>

    <div v-else>
      <div v-if="isLoading" class="loading-wrap">
        <div class="skeleton-notif" v-for="i in 3" :key="i"></div>
      </div>

      <div v-else-if="notifications.length === 0" class="empty-state card">
        <div class="empty-bell-icon">
          <Bell :size="40" />
        </div>
        <p class="empty-title">Bandeja de notificaciones vacía</p>
        <p class="empty-desc">Te avisaremos en cuanto haya actualizaciones en tus solicitudes.</p>
      </div>

      <div v-else class="notifications-list card">
        <div
          v-for="notif in notifications"
          :key="notif.id"
          :class="['notif-item', { unread: !notif.read_at }]"
          @click="handleMarkAsRead(notif.id)"
        >
          <div class="notif-icon-col">
            <div
              :class="[
                'notif-icon-circle',
                notif.notification_type === 'status_changed' ? 'icon-blue' :
                (notif.notification_type === 'request_created' ? 'icon-purple' : 'icon-green')
              ]"
            >
              <CheckCircle2 v-if="notif.notification_type === 'general'" :size="20" />
              <RefreshCw v-else-if="notif.notification_type === 'status_changed'" :size="18" />
              <Bell v-else :size="18" />
            </div>
          </div>

          <div class="notif-content-col">
            <div class="notif-title-row">
              <h4 class="notif-title">{{ notif.title }}</h4>
              <span class="notif-time">{{ formatRelativeTime(notif.created_at) }}</span>
            </div>
            <p class="notif-message">{{ notif.message }}</p>
          </div>

          <div v-if="!notif.read_at" class="unread-dot-col">
            <span class="unread-indicator" title="No leída"></span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.notifications-page {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.header-main {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.notif-tabs {
  display: flex;
  gap: 8px;
  margin-top: 14px;
  border-bottom: 2px solid #E2E8F0;
  padding-bottom: 2px;
}

.tab-pill {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: transparent;
  border: none;
  border-bottom: 2px solid transparent;
  font-size: 14px;
  font-weight: 700;
  color: #64748B;
  cursor: pointer;
  transition: all 0.2s;
}

.tab-pill:hover {
  color: #087BFA;
}

.tab-pill.active {
  color: #087BFA;
  border-bottom-color: #087BFA;
}

.notif-count-badge {
  background: #EFF6FF;
  color: #087BFA;
  font-size: 11px;
  padding: 2px 7px;
  border-radius: 9999px;
}

.conversations-tab-wrap {
  margin-top: 4px;
}

.page-title {
  font-size: 24px;
  font-weight: 800;
  color: var(--color-blue-title);
}

.page-subtitle {
  font-size: 13px;
  color: var(--color-text-secondary);
}

.notifications-list {
  display: flex;
  flex-direction: column;
  padding: 0;
  overflow: hidden;
}

.notif-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 18px 24px;
  border-bottom: 1px solid var(--color-border);
  cursor: pointer;
  transition: background-color var(--transition-fast);
}

.notif-item:last-child {
  border-bottom: none;
}

.notif-item:hover {
  background-color: #F8FAFC;
}

.notif-item.unread {
  background-color: #F0F7FF;
}

.notif-icon-circle {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.icon-green {
  background-color: var(--color-success-bg);
  color: var(--color-success);
}

.icon-blue {
  background-color: var(--color-info-bg);
  color: var(--color-primary);
}

.icon-purple {
  background-color: #F3E8FF;
  color: var(--color-purple);
}

.notif-content-col {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.notif-title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.notif-title {
  font-size: 15px;
  font-weight: 700;
  color: var(--color-blue-title);
}

.notif-time {
  font-size: 12px;
  color: var(--color-text-secondary);
  white-space: nowrap;
}

.notif-message {
  font-size: 13px;
  color: var(--color-text-main);
  line-height: 1.4;
}

.unread-indicator {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: var(--color-primary);
  display: block;
}

.empty-state {
  padding: 60px 20px;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.empty-bell-icon {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: #F1F5F9;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-text-muted);
  margin-bottom: 8px;
}

.empty-title {
  font-size: 16px;
  font-weight: 700;
  color: var(--color-blue-title);
}

.empty-desc {
  font-size: 13px;
  color: var(--color-text-secondary);
}

.loading-wrap {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.skeleton-notif {
  height: 76px;
  background: #EDF2F7;
  border-radius: var(--radius-md);
}

@media (max-width: 640px) {
  .header-main {
    flex-direction: column;
    align-items: flex-start;
  }
  .mark-read-all-btn {
    width: 100%;
  }
}
</style>
