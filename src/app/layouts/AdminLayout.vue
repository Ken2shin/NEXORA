<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute, RouterLink, RouterView } from 'vue-router'
import {
  LayoutDashboard,
  Layers,
  Users,
  ClipboardList,
  BarChart3,
  Settings,
  Bell,
  Menu,
  X,
  LogOut,
  ChevronDown,
  Building2,
  UserCheck,
  Briefcase,
  HeartHandshake,
  DollarSign,
  Scale,
  ShieldAlert,
  Code,
  LifeBuoy
} from 'lucide-vue-next'
import { useAuthStore } from '@/modules/auth/auth.store'
import { useNotificationStore } from '@/modules/notifications/notification.store'
import { getSupabaseClient } from '@/shared/infrastructure/supabase'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const notificationStore = useNotificationStore()

const isSidebarOpen = ref(false)
const showUserMenu = ref(false)

const allNavItems = [
  { name: 'Inicio', path: '/admin/dashboard', icon: LayoutDashboard, depts: ['admin'] },
  { name: 'Servicios', path: '/admin/services', icon: Layers, depts: ['admin'] },
  { name: 'Usuarios', path: '/admin/clients', icon: Users, depts: ['admin'] },
  { name: 'Solicitudes', path: '/admin/requests', icon: ClipboardList, depts: ['all'] },
  { name: 'Soporte y Chat', path: '/admin/support', icon: LifeBuoy, depts: ['admin', 'dept-support', 'soporte', 'atención'] },
  { name: 'Ciberseguridad', path: '/admin/security', icon: ShieldAlert, depts: ['admin', 'dept-2', 'dept-security', 'ciberseguridad', 'seguridad'] },
  { name: 'Desarrollo', path: '/admin/development', icon: Code, depts: ['admin', 'dept-1', 'dept-3', 'dept-dev', 'dept-tech', 'desarrollo', 'tecnología', 'sistemas'] },
  { name: 'Estructura Org.', path: '/admin/organization', icon: Building2, depts: ['admin'] },
  { name: 'Personal', path: '/admin/employees', icon: UserCheck, depts: ['admin'] },
  { name: 'Puestos', path: '/admin/positions', icon: Briefcase, depts: ['admin'] },
  { name: 'RRHH', path: '/admin/hr', icon: HeartHandshake, depts: ['admin', 'dept-4', 'dept-hr', 'recursos humanos', 'rrhh', 'talento'] },
  { name: 'Contabilidad', path: '/admin/finance', icon: DollarSign, depts: ['admin', 'dept-5', 'dept-finance', 'contabilidad', 'finanzas'] },
  { name: 'Asesoría Legal', path: '/admin/legal', icon: Scale, depts: ['admin', 'dept-6', 'dept-legal', 'legal', 'jurídico'] },
  { name: 'Reportes', path: '/admin/reports', icon: BarChart3, depts: ['admin'] },
  { name: 'Configuración', path: '/admin/profile', icon: Settings, depts: ['all'] }
]

const user = computed(() => authStore.currentUser)

onMounted(async () => {
  if (user.value?.role === 'employee' && (!user.value.department_name || !user.value.department_id)) {
    try {
      const client = getSupabaseClient()
      if (client) {
        const { data: emp } = await client
          .from('employees')
          .select('*, department:departments!department_id(name), position:positions!position_id(title)')
          .or(`user_id.eq.${user.value.id},email.eq.${user.value.email.toLowerCase()}`)
          .maybeSingle()

        if (emp) {
          type EmpRow = typeof emp & {
            department?: { name: string } | null
            position?: { title: string } | null
          }
          const row = emp as unknown as EmpRow
          const updated = {
            ...user.value,
            department_id: row.department_id,
            department_name: row.department?.name || row.department_name,
            position_title: row.position?.title || row.position_title
          }
          authStore.setDirectUser(updated)
        }
      }
    } catch {}
  }
})

function resolveDefaultEmployeeRoute(u: typeof user.value): string {
  if (!u) return '/login'
  const dept = (u.department_name || '').toLowerCase()
  const deptId = (u.department_id || '').toLowerCase()
  const pos = (u.position_title || '').toLowerCase()

  if (dept.includes('ciberseguridad') || dept.includes('seguridad') || pos.includes('segur') || deptId === 'dept-2' || deptId === 'dept-security') {
    return '/admin/security'
  }
  if (dept.includes('desarrollo') || dept.includes('tecnología') || dept.includes('sistemas') || pos.includes('soft') || pos.includes('dev') || pos.includes('prog') || pos.includes('sist') || deptId === 'dept-1' || deptId === 'dept-3' || deptId === 'dept-dev' || deptId === 'dept-tech') {
    return '/admin/development'
  }
  if (dept.includes('soporte') || dept.includes('atención') || pos.includes('sop') || deptId === 'dept-support') {
    return '/admin/support'
  }
  if (dept.includes('recursos humanos') || dept.includes('rrhh') || dept.includes('talento') || pos.includes('rh') || deptId === 'dept-4' || deptId === 'dept-hr') {
    return '/admin/hr'
  }
  if (dept.includes('contabilidad') || dept.includes('finanzas') || pos.includes('cont') || deptId === 'dept-5' || deptId === 'dept-finance') {
    return '/admin/finance'
  }
  if (dept.includes('legal') || dept.includes('jurídico') || pos.includes('abog') || deptId === 'dept-6' || deptId === 'dept-legal') {
    return '/admin/legal'
  }
  return '/admin/requests'
}

const navItems = computed(() => {
  if (!user.value) {
    return []
  }
  if (user.value.role === 'admin') {
    return allNavItems
  }

  let userDept = (user.value.department_name || '').toLowerCase()
  let userDeptId = (user.value.department_id || '').toLowerCase()
  const userPos = (user.value.position_title || '').toLowerCase()

  if (!userDept && typeof localStorage !== 'undefined') {
    try {
      const raw = localStorage.getItem('nexora_org_employees')
      if (raw) {
        const emps = JSON.parse(raw)
        const found = emps.find((e: { email?: string; user_id?: string; id?: string; department_name?: string; position_title?: string; profession?: string; department_id?: string }) =>
          (e.email && e.email.toLowerCase() === user.value?.email.toLowerCase()) ||
          (e.user_id && e.user_id === user.value?.id) ||
          (e.id && e.id === user.value?.id)
        )
        if (found) {
          userDept = (found.department_name || found.position_title || found.profession || '').toLowerCase()
          userDeptId = (found.department_id || '').toLowerCase()
        }
      }
    } catch {}
  }

  if (!userDept && userPos) {
    if (userPos.includes('soft') || userPos.includes('front') || userPos.includes('back') || userPos.includes('dev') || userPos.includes('prog') || userPos.includes('sist')) {
      userDept = 'tecnología desarrollo'
    } else if (userPos.includes('segur') || userPos.includes('ciber') || userPos.includes('soc')) {
      userDept = 'ciberseguridad'
    } else if (userPos.includes('sop') || userPos.includes('red') || userPos.includes('aten')) {
      userDept = 'soporte'
    } else if (userPos.includes('rh') || userPos.includes('rec') || userPos.includes('hum')) {
      userDept = 'recursos humanos'
    } else if (userPos.includes('cont') || userPos.includes('fin')) {
      userDept = 'contabilidad'
    } else if (userPos.includes('abog') || userPos.includes('leg') || userPos.includes('jur')) {
      userDept = 'legal'
    }
  }

  const list = allNavItems.filter(item => {
    if (item.depts.length === 1 && item.depts[0] === 'admin') {
      return false
    }
    if (item.depts.includes('all')) {
      return true
    }
    if (userDeptId && item.depts.includes(userDeptId)) {
      return true
    }
    return item.depts.some(d => d !== 'admin' && (userDept.includes(d) || userPos.includes(d)))
  })

  return list
})
const unreadCount = computed(() => notificationStore.unreadCount)

const formattedDate = computed(() => {
  const options: Intl.DateTimeFormatOptions = {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  }
  return new Intl.DateTimeFormat('es-MX', options).format(new Date())
})

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
  <div class="admin-shell">
    <aside :class="['admin-sidebar', { 'sidebar-open': isSidebarOpen }]">
      <div class="sidebar-header">
        <RouterLink :to="user?.role === 'admin' ? '/admin/dashboard' : resolveDefaultEmployeeRoute(user)" class="brand-link" @click="closeSidebar">
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
        </RouterLink>
      </nav>

      <div class="sidebar-footer">
        <div class="user-chip" @click="showUserMenu = !showUserMenu">
          <img :src="user?.avatar_path || '/images/illustrations/avatar-admin.svg'" alt="Avatar" class="user-avatar" />
          <div class="user-info">
            <span class="user-name">{{ user?.full_name || 'Admin' }}</span>
            <span class="user-role">{{ user?.role === 'admin' ? 'Administrador' : (user?.position_title || 'Colaborador') }}</span>
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

    <div class="admin-main-wrap">
      <header class="admin-topbar">
        <div class="topbar-left">
          <button class="menu-toggle-btn" @click="toggleSidebar" aria-label="Abrir menú">
            <Menu :size="22" />
          </button>
          <div class="welcome-box">
            <h1 class="welcome-title">¡Bienvenido, {{ user?.full_name?.split(' ')[0] || (user?.role === 'admin' ? 'Administrador' : 'Colaborador') }}!</h1>
            <p class="welcome-subtitle">
              {{ user?.role === 'admin' ? 'Aquí tienes un resumen general del sistema.' : (user?.department_name || 'Portal Operativo de Colaborador') }}
            </p>
          </div>
        </div>

        <div class="topbar-right">
          <span class="date-badge">{{ formattedDate }}</span>

          <RouterLink to="/admin/profile" class="icon-btn notif-btn" aria-label="Notificaciones">
            <Bell :size="20" />
            <span v-if="unreadCount > 0" class="notif-badge">{{ unreadCount }}</span>
          </RouterLink>

          <RouterLink to="/admin/profile" class="profile-avatar-link">
            <img :src="user?.avatar_path || '/images/illustrations/avatar-admin.svg'" alt="Perfil" class="header-avatar" />
          </RouterLink>
        </div>
      </header>

      <main class="admin-content">
        <RouterView />
      </main>
    </div>
  </div>
</template>

<style scoped>
.admin-shell {
  display: flex;
  min-height: 100vh;
  background-color: var(--color-bg-app);
}

.admin-sidebar {
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

.admin-main-wrap {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.admin-topbar {
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

.welcome-title {
  font-size: 18px;
  font-weight: 800;
  color: var(--color-blue-title);
  line-height: 1.2;
}

.welcome-subtitle {
  font-size: 12px;
  color: var(--color-text-secondary);
}

.topbar-right {
  display: flex;
  align-items: center;
  gap: 18px;
}

.date-badge {
  font-size: 13px;
  font-weight: 600;
  color: var(--color-text-secondary);
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

.admin-content {
  flex: 1;
  padding: 28px 32px;
  max-width: 1440px;
  width: 100%;
  margin: 0 auto;
}

@media (max-width: 992px) {
  .admin-sidebar {
    position: fixed;
    left: -260px;
    transition: left var(--transition-normal);
  }

  .admin-sidebar.sidebar-open {
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

  .admin-topbar {
    padding: 0 16px;
  }

  .admin-content {
    padding: 20px 16px;
  }
}
</style>
