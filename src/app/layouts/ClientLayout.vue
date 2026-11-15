<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter, useRoute, RouterLink, RouterView } from 'vue-router'
import {
  Home,
  Layers,
  ClipboardList,
  Bell,
  User,
  Menu,
  X,
  LogOut,
  ChevronDown,
  MessageSquare
} from 'lucide-vue-next'
import { useAuthStore } from '@/modules/auth/auth.store'
import { useNotificationStore } from '@/modules/notifications/notification.store'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const notificationStore = useNotificationStore()

const isSidebarOpen = ref(false)
const showUserMenu = ref(false)

const navItems = [
  { name: 'Inicio', path: '/client/dashboard', icon: Home },
  { name: 'Servicios', path: '/client/services', icon: Layers },
  { name: 'Mis Solicitudes', path: '/client/requests', icon: ClipboardList },
  { name: 'Conversaciones', path: '/client/conversations', icon: MessageSquare },
  { name: 'Notificaciones', path: '/client/notifications', icon: Bell },
  { name: 'Mi Perfil', path: '/client/profile', icon: User }
]

const user = computed(() => authStore.currentUser)
const unreadCount = computed(() => notificationStore.unreadCount)

function toggleSidebar() {
  isSidebarOpen.value = !isSidebarOpen.value
}

function closeSidebar() {
  isSidebarOpen.value = false
}

async function handleLogout() {
  await authStore.logout()
  router.push('/login')
}
</script>

<template>
  <div class="client-shell">
    <aside :class="['client-sidebar', { 'sidebar-open': isSidebarOpen }]">
      <div class="sidebar-header">
        <RouterLink to="/client/dashboard" class="brand-link" @click="closeSidebar">
          <img src="/brand/logo-white.svg" alt="NEXORA" class="brand-logo" />
        </RouterLink>
        <button class="close-sidebar-btn" @click="toggleSidebar" aria-label="Cerrar navegación">
          <X :size="20" />
        </button>
      </div>

      <nav class="sidebar-nav">
        <RouterLink
          v-for="item in navItems"
          :key="item.path"
          :to="item.path"
          :class="['nav-item', { active: route.path === item.path || route.path.startsWith(item.path + '/') }]"
          @click="closeSidebar"
        >
          <component :is="item.icon" :size="20" class="nav-icon" />
          <span class="nav-label">{{ item.name }}</span>
          <span v-if="item.name === 'Notificaciones' && unreadCount > 0" class="nav-badge">
            {{ unreadCount }}
          </span>
        </RouterLink>
      </nav>

      <div class="sidebar-footer">
        <div class="user-chip" @click="showUserMenu = !showUserMenu">
          <img :src="user?.avatar_path || '/images/illustrations/hero-character.jpg'" alt="Avatar" class="user-avatar" />
          <div class="user-info">
            <span class="user-name">{{ user?.full_name || 'Cliente' }}</span>
            <span class="user-role">Cliente</span>
          </div>
          <ChevronDown :size="16" class="menu-arrow" />
        </div>

        <div v-if="showUserMenu" class="user-dropdown">
          <button class="dropdown-item logout" @click="handleLogout">
            <LogOut :size="16" />
            <span>Cerrar sesión</span>
          </button>
        </div>
      </div>
    </aside>

    <div v-if="isSidebarOpen" class="sidebar-overlay" @click="closeSidebar"></div>

    <div class="client-main-wrap">
      <header class="client-topbar">
        <div class="topbar-left">
          <button class="menu-toggle-btn" @click="toggleSidebar" aria-label="Abrir menú">
            <Menu :size="22" />
          </button>
          <div class="breadcrumb-trail">
            <span class="breadcrumb-root">Portal de Cliente</span>
            <span class="breadcrumb-separator">/</span>
            <span class="breadcrumb-current">{{ route.meta.title || 'Panel' }}</span>
          </div>
        </div>

        <div class="topbar-right">
          <RouterLink to="/client/notifications" class="icon-btn notif-btn" aria-label="Notificaciones">
            <Bell :size="20" />
            <span v-if="unreadCount > 0" class="notif-badge">{{ unreadCount }}</span>
          </RouterLink>

          <RouterLink to="/client/profile" class="profile-avatar-link">
            <img :src="user?.avatar_path || '/images/illustrations/hero-character.jpg'" alt="Perfil" class="header-avatar" />
          </RouterLink>
        </div>
      </header>

      <main class="client-content">
        <RouterView />
      </main>
    </div>
  </div>
</template>

<style scoped>
.client-shell {
  display: flex;
  min-height: 100vh;
  background-color: var(--color-bg-app);
}

.client-sidebar {
  width: 250px;
  background: var(--sidebar-gradient);
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  color: #FFFFFF;
  z-index: 50;
  position: sticky;
  top: 0;
  height: 100vh;
}

.sidebar-header {
  height: 72px;
  padding: 0 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.brand-link {
  display: flex;
  align-items: center;
}

.brand-logo {
  height: 38px;
  width: auto;
}

.close-sidebar-btn {
  display: none;
  color: #FFFFFF;
}

.sidebar-nav {
  flex: 1;
  padding: 24px 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  overflow-y: auto;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 12px 16px;
  color: rgba(255, 255, 255, 0.85);
  border-radius: var(--radius-sm);
  font-weight: 500;
  font-size: 14px;
  transition: all var(--transition-fast);
}

.nav-item:hover {
  background-color: rgba(255, 255, 255, 0.12);
  color: #FFFFFF;
}

.nav-item.active {
  background-color: #FFFFFF;
  color: var(--color-primary);
  font-weight: 700;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.nav-item.active .nav-icon {
  color: var(--color-primary);
}

.nav-badge {
  margin-left: auto;
  background-color: var(--color-danger);
  color: #FFFFFF;
  font-size: 11px;
  font-weight: 700;
  padding: 2px 7px;
  border-radius: var(--radius-full);
}

.sidebar-footer {
  padding: 16px;
  border-top: 1px solid rgba(255, 255, 255, 0.12);
  position: relative;
}

.user-chip {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 10px;
  border-radius: var(--radius-sm);
  cursor: pointer;
  background-color: rgba(255, 255, 255, 0.08);
  transition: background-color var(--transition-fast);
}

.user-chip:hover {
  background-color: rgba(255, 255, 255, 0.16);
}

.user-avatar {
  width: 38px;
  height: 38px;
  border-radius: 50%;
  border: 2px solid #FFFFFF;
  background-color: #FFFFFF;
  object-fit: cover;
  object-position: center 20%;
  flex-shrink: 0;
}

.user-info {
  display: flex;
  flex-direction: column;
  flex: 1;
  overflow: hidden;
}

.user-name {
  font-size: 14px;
  font-weight: 700;
  color: #FFFFFF;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.user-role {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.7);
}

.menu-arrow {
  color: rgba(255, 255, 255, 0.7);
}

.user-dropdown {
  position: absolute;
  bottom: 74px;
  left: 16px;
  right: 16px;
  background: #FFFFFF;
  border-radius: var(--radius-sm);
  box-shadow: var(--shadow-lg);
  overflow: hidden;
  border: 1px solid var(--color-border);
}

.dropdown-item {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;
  font-size: 13px;
  font-weight: 600;
  color: var(--color-text-main);
  text-align: left;
}

.dropdown-item.logout {
  color: var(--color-danger);
}

.dropdown-item.logout:hover {
  background-color: var(--color-danger-bg);
}

.client-main-wrap {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.client-topbar {
  height: 72px;
  background-color: var(--color-surface);
  border-bottom: 1px solid var(--color-border);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 32px;
  position: sticky;
  top: 0;
  z-index: 40;
}

.topbar-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.menu-toggle-btn {
  display: none;
  color: var(--color-text-main);
  padding: 6px;
}

.breadcrumb-trail {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: var(--color-text-secondary);
}

.breadcrumb-separator {
  color: var(--color-text-muted);
}

.breadcrumb-current {
  color: var(--color-blue-title);
  font-weight: 700;
}

.topbar-right {
  display: flex;
  align-items: center;
  gap: 18px;
}

.notif-btn {
  position: relative;
  color: var(--color-text-secondary);
  padding: 8px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #F1F5F9;
}

.notif-btn:hover {
  color: var(--color-primary);
  background: #E2E8F0;
}

.notif-badge {
  position: absolute;
  top: 2px;
  right: 2px;
  background-color: var(--color-danger);
  color: #FFFFFF;
  font-size: 10px;
  font-weight: 700;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.header-avatar {
  width: 38px;
  height: 38px;
  border-radius: 50%;
  border: 2px solid #FFFFFF;
  box-shadow: 0 2px 8px rgba(8, 123, 250, 0.25);
  object-fit: cover;
  object-position: center 20%;
  display: block;
}

.client-content {
  flex: 1;
  padding: 28px 32px;
  max-width: 1440px;
  width: 100%;
  margin: 0 auto;
}

@media (max-width: 992px) {
  .client-sidebar {
    position: fixed;
    left: -260px;
    transition: left var(--transition-normal);
  }

  .client-sidebar.sidebar-open {
    left: 0;
  }

  .close-sidebar-btn {
    display: flex;
  }

  .menu-toggle-btn {
    display: flex;
  }

  .sidebar-overlay {
    position: fixed;
    inset: 0;
    background: rgba(15, 23, 42, 0.5);
    z-index: 45;
  }

  .client-topbar {
    padding: 0 16px;
  }

  .client-content {
    padding: 20px 16px;
  }
}
</style>
