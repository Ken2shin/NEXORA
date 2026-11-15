import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import { useAuthStore } from '@/modules/auth/auth.store'

function resolveEmployeePortal(user: { department_name?: string; department_id?: string } | null): string {
  if (!user) return '/login'
  const dept = (user.department_name || '').toLowerCase()
  const deptId = (user.department_id || '').toLowerCase()

  if (dept.includes('ciberseguridad') || dept.includes('seguridad') || deptId === 'dept-2' || deptId === 'dept-security') {
    return '/admin/security'
  }
  if (dept.includes('desarrollo') || dept.includes('tecnología') || dept.includes('sistemas') || deptId === 'dept-1' || deptId === 'dept-3' || deptId === 'dept-dev' || deptId === 'dept-tech') {
    return '/admin/development'
  }
  if (dept.includes('soporte') || dept.includes('atención') || deptId === 'dept-support') {
    return '/admin/support'
  }
  if (dept.includes('recursos humanos') || dept.includes('rrhh') || dept.includes('talento') || deptId === 'dept-4' || deptId === 'dept-hr') {
    return '/admin/hr'
  }
  if (dept.includes('contabilidad') || dept.includes('finanzas') || deptId === 'dept-5' || deptId === 'dept-finance') {
    return '/admin/finance'
  }
  if (dept.includes('legal') || dept.includes('jurídico') || deptId === 'dept-6' || deptId === 'dept-legal') {
    return '/admin/legal'
  }
  return '/admin/requests'
}

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    redirect: () => {
      const authStore = useAuthStore()
      authStore.initializeFromStorage()
      if (authStore.isAuthenticated) {
        if (authStore.role === 'client') return '/client/dashboard'
        if (authStore.role === 'admin') return '/admin/dashboard'
        return resolveEmployeePortal(authStore.currentUser)
      }
      return '/login'
    }
  },
  {
    path: '/',
    component: () => import('@/app/layouts/AuthLayout.vue'),
    children: [
      {
        path: 'login',
        name: 'login',
        component: () => import('@/modules/auth/views/LoginView.vue'),
        meta: { guestOnly: true, title: 'Iniciar Sesión' }
      },
      {
        path: 'register',
        name: 'register',
        component: () => import('@/modules/auth/views/RegisterView.vue'),
        meta: { guestOnly: true, title: 'Crear Cuenta' }
      },
      {
        path: 'forgot-password',
        name: 'forgot-password',
        component: () => import('@/modules/auth/views/ForgotPasswordView.vue'),
        meta: { guestOnly: true, title: 'Recuperar Contraseña' }
      }
    ]
  },
  {
    path: '/admin',
    component: () => import('@/app/layouts/AdminLayout.vue'),
    meta: { requiresAuth: true, roles: ['admin', 'employee'] },
    children: [
      {
        path: '',
        redirect: () => {
          const authStore = useAuthStore()
          authStore.initializeFromStorage()
          if (authStore.role === 'admin') return '/admin/dashboard'
          return resolveEmployeePortal(authStore.currentUser)
        }
      },
      {
        path: 'dashboard',
        name: 'admin-dashboard',
        component: () => import('@/modules/dashboard/views/AdminDashboardView.vue'),
        meta: { roles: ['admin'], title: 'Dashboard Administrador' }
      },
      {
        path: 'services',
        name: 'admin-services',
        component: () => import('@/modules/services/views/ServicesManageView.vue'),
        meta: { roles: ['admin'], title: 'Gestión de Servicios' }
      },
      {
        path: 'clients',
        name: 'admin-clients',
        component: () => import('@/modules/clients/views/ClientsListView.vue'),
        meta: { roles: ['admin'], title: 'Clientes Registrados' }
      },
      {
        path: 'requests',
        name: 'admin-requests',
        component: () => import('@/modules/requests/views/RequestsListView.vue'),
        meta: { title: 'Solicitudes de Servicios' }
      },
      {
        path: 'requests/:id',
        name: 'admin-request-detail',
        component: () => import('@/modules/requests/views/RequestDetailView.vue'),
        meta: { title: 'Detalle de Solicitud' }
      },
      {
        path: 'history',
        name: 'admin-history',
        component: () => import('@/modules/history/views/AdminHistoryView.vue'),
        meta: { title: 'Historial Administrativo' }
      },
      {
        path: 'reports',
        name: 'admin-reports',
        component: () => import('@/modules/reports/views/ReportsView.vue'),
        meta: { roles: ['admin'], title: 'Reportes y Métricas' }
      },
      {
        path: 'organization',
        name: 'admin-organization',
        component: () => import('@/modules/organization/views/OrganizationManageView.vue'),
        meta: { roles: ['admin'], title: 'Estructura Organizacional' }
      },
      {
        path: 'employees',
        name: 'admin-employees',
        component: () => import('@/modules/employees/views/EmployeesManageView.vue'),
        meta: { roles: ['admin'], title: 'Gestión de Personal' }
      },
      {
        path: 'positions',
        name: 'admin-positions',
        component: () => import('@/modules/positions/views/PositionsCatalogView.vue'),
        meta: { roles: ['admin'], title: 'Catálogo de Puestos' }
      },
      {
        path: 'hr',
        name: 'admin-hr',
        component: () => import('@/modules/hr/views/HrPortalView.vue'),
        meta: { title: 'Portal de Recursos Humanos' }
      },
      {
        path: 'finance',
        name: 'admin-finance',
        component: () => import('@/modules/finance/views/FinancePortalView.vue'),
        meta: { title: 'Portal de Contabilidad y Finanzas' }
      },
      {
        path: 'legal',
        name: 'admin-legal',
        component: () => import('@/modules/legal/views/LegalPortalView.vue'),
        meta: { title: 'Portal de Asesoría Legal' }
      },
      {
        path: 'security',
        name: 'admin-security',
        component: () => import('@/modules/security/views/SecurityPortalView.vue'),
        meta: { title: 'Portal de Ciberseguridad' }
      },
      {
        path: 'development',
        name: 'admin-development',
        component: () => import('@/modules/development/views/DevelopmentPortalView.vue'),
        meta: { title: 'Portal de Desarrollo de Software' }
      },
      {
        path: 'support',
        name: 'admin-support',
        component: () => import('@/modules/support/views/SupportPortalView.vue'),
        meta: { title: 'Portal de Soporte y Atención' }
      },
      {
        path: 'profile',
        name: 'admin-profile',
        component: () => import('@/modules/profile/views/ProfileView.vue'),
        meta: { title: 'Configuración y Perfil' }
      }
    ]
  },
  {
    path: '/client',
    component: () => import('@/app/layouts/ClientLayout.vue'),
    meta: { requiresAuth: true, roles: ['client'] },
    children: [
      {
        path: '',
        redirect: '/client/dashboard'
      },
      {
        path: 'dashboard',
        name: 'client-dashboard',
        component: () => import('@/modules/dashboard/views/ClientDashboardView.vue'),
        meta: { title: 'Inicio' }
      },
      {
        path: 'services',
        name: 'client-services',
        component: () => import('@/modules/services/views/ClientCatalogView.vue'),
        meta: { title: 'Servicios' }
      },
      {
        path: 'requests',
        name: 'client-requests',
        component: () => import('@/modules/history/views/ClientHistoryView.vue'),
        meta: { title: 'Mis Solicitudes' }
      },
      {
        path: 'requests/new',
        name: 'client-new-request',
        component: () => import('@/modules/requests/views/NewRequestView.vue'),
        meta: { title: 'Nueva Solicitud' }
      },
      {
        path: 'requests/:id',
        name: 'client-request-detail',
        component: () => import('@/modules/requests/views/RequestDetailView.vue'),
        meta: { title: 'Detalle de Solicitud' }
      },
      {
        path: 'notifications',
        name: 'client-notifications',
        component: () => import('@/modules/notifications/views/NotificationsView.vue'),
        meta: { title: 'Notificaciones' }
      },
      {
        path: 'conversations',
        name: 'client-conversations',
        component: () => import('@/modules/conversations/views/ConversationsWorkspace.vue'),
        meta: { title: 'Conversaciones y Soporte' }
      },
      {
        path: 'profile',
        name: 'client-profile',
        component: () => import('@/modules/profile/views/ProfileView.vue'),
        meta: { title: 'Mi Perfil' }
      }
    ]
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/'
  }
]

export const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior() {
    return { top: 0 }
  }
})

router.beforeEach((to, _from, next) => {
  const authStore = useAuthStore()
  authStore.initializeFromStorage()

  if (to.meta.guestOnly && authStore.isAuthenticated) {
    if (authStore.role === 'client') {
      return next('/client/dashboard')
    }
    if (authStore.role === 'admin') {
      return next('/admin/dashboard')
    }
    return next(resolveEmployeePortal(authStore.currentUser))
  }

  if (to.matched.some(record => record.meta.requiresAuth)) {
    if (!authStore.isAuthenticated) {
      return next({ path: '/login', query: { redirect: to.fullPath } })
    }

    const routeRoles = to.meta.roles as string[] | undefined
    if (routeRoles && authStore.role && !routeRoles.includes(authStore.role)) {
      if (authStore.role === 'client') {
        return next('/client/dashboard')
      }
      if (authStore.role === 'admin') {
        return next('/admin/dashboard')
      }
      return next(resolveEmployeePortal(authStore.currentUser))
    }
  }

  next()
})

router.afterEach(to => {
  const title = to.meta.title as string | undefined
  document.title = title ? `${title} — NEXORA` : 'NEXORA — Gestiona · Solicita · Avanza'
})
