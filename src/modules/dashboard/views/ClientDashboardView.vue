<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter, RouterLink } from 'vue-router'
import {
  Send,
  Clock,
  CheckCircle,
  ArrowRight
} from 'lucide-vue-next'
import { useAuthStore } from '@/modules/auth/auth.store'
import { repositories } from '@/shared/infrastructure/provider'
import type { ClientDashboardStats } from '@/shared/types/dashboard.types'
import { formatDate } from '@/shared/utils/formatters'
import StatusBadge from '@/shared/components/StatusBadge.vue'

const router = useRouter()
const authStore = useAuthStore()

const stats = ref<ClientDashboardStats | null>(null)
const isLoading = ref(true)

const user = computed(() => authStore.currentUser)
const clientFirstName = computed(() => user.value?.full_name?.split(' ')[0] || 'Cliente')

onMounted(async () => {
  if (user.value) {
    try {
      stats.value = await repositories.dashboard.getClientStats(user.value.id)
    } finally {
      isLoading.value = false
    }
  }
})

function goToNewRequest() {
  router.push('/client/requests/new')
}
</script>

<template>
  <div class="client-dashboard">
    <div class="dashboard-greeting">
      <h1 class="greeting-title">¡Hola, {{ clientFirstName }}! ☀️</h1>
      <p class="greeting-subtitle">Aquí tienes un resumen de tus actividades.</p>
    </div>

    <div v-if="isLoading" class="loading-wrap">
      <div class="skeleton-stat-row">
        <div v-for="i in 3" :key="i" class="skeleton-stat"></div>
      </div>
    </div>

    <div v-else-if="stats" class="dashboard-grid">
      <div class="stats-and-recent">
        <div class="stats-row">
          <div class="client-stat-card">
            <div class="stat-icon-wrap icon-blue">
              <Send :size="20" />
            </div>
            <div class="stat-content">
              <span class="stat-value">{{ stats.total_requests }}</span>
              <span class="stat-label">Mis Solicitudes</span>
            </div>
          </div>

          <div class="client-stat-card">
            <div class="stat-icon-wrap icon-blue-dark">
              <Clock :size="20" />
            </div>
            <div class="stat-content">
              <span class="stat-value">{{ stats.in_progress_requests }}</span>
              <span class="stat-label">En Proceso</span>
            </div>
          </div>

          <div class="client-stat-card">
            <div class="stat-icon-wrap icon-green">
              <CheckCircle :size="20" />
            </div>
            <div class="stat-content">
              <span class="stat-value">{{ stats.completed_requests }}</span>
              <span class="stat-label">Finalizadas</span>
            </div>
          </div>
        </div>

        <div class="recent-requests-card">
          <div class="recent-card-header">
            <h2 class="recent-title">Mis Solicitudes Recientes</h2>
            <RouterLink to="/client/requests" class="view-all-link">
              <span>Ver todas</span>
              <ArrowRight :size="14" />
            </RouterLink>
          </div>

          <div v-if="stats.recent_requests.length === 0" class="empty-recents">
            <p>No tienes solicitudes activas en este momento.</p>
          </div>

          <div v-else class="recent-table-wrap">
            <table class="recent-table">
              <tbody>
                <tr v-for="req in stats.recent_requests.slice(0, 3)" :key="req.id">
                  <td class="req-id">{{ req.request_number }}</td>
                  <td class="req-name">{{ req.service_name }}</td>
                  <td class="req-date">{{ formatDate(req.created_at) }}</td>
                  <td class="text-right">
                    <StatusBadge :status="req.status" />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div class="hero-promo-card">
        <div class="hero-card-content">
          <h2 class="hero-cta-title">¿Necesitas un servicio?</h2>
          <p class="hero-cta-desc">Solicítalo ahora y nos encargamos del resto.</p>
          <button class="btn btn-primary hero-btn" @click="goToNewRequest">
            <span>Solicitar servicio</span>
            <ArrowRight :size="16" />
          </button>
        </div>

        <div class="hero-img-box">
          <img
            src="/images/illustrations/promo-character.png"
            alt="Asistente NEXORA"
            class="hero-character-photo"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.client-dashboard {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.greeting-title {
  font-size: 24px;
  font-weight: 800;
  color: var(--color-blue-title);
  line-height: 1.2;
}

.greeting-subtitle {
  font-size: 13px;
  color: var(--color-text-secondary);
  margin-top: 4px;
}

.dashboard-grid {
  display: grid;
  grid-template-columns: 1.4fr 1fr;
  gap: 24px;
}

.stats-and-recent {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.stats-row {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}

.client-stat-card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: 18px;
  display: flex;
  align-items: center;
  gap: 14px;
  box-shadow: var(--shadow-card);
  transition: transform var(--transition-fast);
}

.client-stat-card:hover {
  transform: translateY(-2px);
}

.stat-icon-wrap {
  width: 44px;
  height: 44px;
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.icon-blue { background: #EBF5FF; color: var(--color-primary); }
.icon-blue-dark { background: #E0F2FE; color: #0284C7; }
.icon-green { background: #DCFCE7; color: var(--color-success); }

.stat-content {
  display: flex;
  flex-direction: column;
}

.stat-value {
  font-size: 22px;
  font-weight: 800;
  color: var(--color-blue-title);
  line-height: 1.1;
}

.stat-label {
  font-size: 12px;
  font-weight: 600;
  color: var(--color-text-secondary);
  margin-top: 3px;
}

.recent-requests-card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: 22px;
  box-shadow: var(--shadow-card);
}

.recent-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.recent-title {
  font-size: 16px;
  font-weight: 700;
  color: var(--color-blue-title);
}

.view-all-link {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  font-weight: 600;
  color: var(--color-primary);
}

.recent-table-wrap {
  overflow-x: auto;
}

.recent-table {
  width: 100%;
}

.recent-table td {
  padding: 12px 14px;
  font-size: 13px;
  border-bottom: 1px solid var(--color-border);
  vertical-align: middle;
}

.recent-table tr:last-child td {
  border-bottom: none;
}

.req-id {
  font-weight: 800;
  color: var(--color-primary);
  width: 70px;
}

.req-name {
  font-weight: 600;
  color: var(--color-text-main);
}

.req-date {
  color: var(--color-text-secondary);
  font-size: 12px;
}

.text-right {
  text-align: right;
}

.hero-promo-card {
  background: linear-gradient(135deg, #CFE6FA 0%, #BAE6FD 30%, #C4B5FD 70%, #60A5FA 100%);
  border: 1px solid #BAE6FD;
  border-radius: var(--radius-lg);
  padding: 24px 20px 24px 28px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  position: relative;
  overflow: hidden;
  box-shadow: 0 8px 24px rgba(8, 123, 250, 0.12);
}

.hero-card-content {
  flex: 1;
  z-index: 2;
  max-width: 260px;
}

.hero-cta-title {
  font-size: 20px;
  font-weight: 800;
  color: #17366C;
  line-height: 1.25;
}

.hero-cta-desc {
  font-size: 13px;
  font-weight: 500;
  color: #2E4B7A;
  margin-top: 6px;
  margin-bottom: 18px;
  line-height: 1.4;
}

.hero-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  font-size: 13px;
  font-weight: 700;
  border-radius: var(--radius-full);
  background: #087BFA;
  color: #FFFFFF;
  box-shadow: 0 4px 12px rgba(8, 123, 250, 0.35);
  border: none;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.hero-btn:hover {
  background: #0870E8;
  transform: translateY(-1px);
}

.hero-img-box {
  margin: -24px -20px -24px 0;
  height: calc(100% + 48px);
  display: flex;
  align-items: flex-end;
  z-index: 1;
}

.hero-character-photo {
  height: 200px;
  width: auto;
  object-fit: cover;
  object-position: bottom right;
  display: block;
}

.skeleton-stat-row {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}

.skeleton-stat {
  height: 80px;
  background: #EDF2F7;
  border-radius: var(--radius-md);
}

@media (max-width: 992px) {
  .dashboard-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 640px) {
  .stats-row {
    grid-template-columns: 1fr;
  }
}
</style>
