<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import {
  Package,
  Users,
  ClipboardList,
  CheckCircle,
  Rocket,
  ArrowRight,
  ChevronDown
} from 'lucide-vue-next'
import { repositories } from '@/shared/infrastructure/provider'
import type { AdminDashboardStats } from '@/shared/types/dashboard.types'
import LineChart from '@/shared/components/LineChart.vue'
import DonutChart from '@/shared/components/DonutChart.vue'
import PulseRadar from '../components/PulseRadar.vue'
import type { ServiceRequest } from '@/shared/types/request.types'

const router = useRouter()
const stats = ref<AdminDashboardStats | null>(null)
const requestsList = ref<ServiceRequest[]>([])
const isLoading = ref(true)
const selectedPeriod = ref('7d')

onMounted(async () => {
  try {
    const [statsRes, reqsRes] = await Promise.all([
      repositories.dashboard.getAdminStats(),
      repositories.requests.getRequests({ limit: 50 })
    ])
    stats.value = statsRes
    requestsList.value = reqsRes.data
  } finally {
    isLoading.value = false
  }
})

function goToRequests() {
  router.push('/admin/requests')
}
</script>

<template>
  <div class="dashboard-page">
    <div v-if="isLoading" class="loading-state">
      <div class="skeleton-kpi-grid">
        <div v-for="i in 4" :key="i" class="skeleton-card"></div>
      </div>
    </div>

    <div v-else-if="stats" class="dashboard-content">
      <section class="kpi-grid" aria-label="Indicadores clave de rendimiento">
        <div class="kpi-card">
          <div class="kpi-icon-wrap icon-blue">
            <Package :size="26" />
          </div>
          <div class="kpi-data">
            <span class="kpi-value">{{ stats.total_services }}</span>
            <span class="kpi-label">Servicios</span>
          </div>
        </div>

        <div class="kpi-card">
          <div class="kpi-icon-wrap icon-purple">
            <Users :size="26" />
          </div>
          <div class="kpi-data">
            <span class="kpi-value">{{ stats.total_users }}</span>
            <span class="kpi-label">Usuarios</span>
          </div>
        </div>

        <div class="kpi-card">
          <div class="kpi-icon-wrap icon-yellow">
            <ClipboardList :size="26" />
          </div>
          <div class="kpi-data">
            <span class="kpi-value">{{ stats.total_requests }}</span>
            <span class="kpi-label">Solicitudes</span>
          </div>
        </div>

        <div class="kpi-card">
          <div class="kpi-icon-wrap icon-green">
            <CheckCircle :size="26" />
          </div>
          <div class="kpi-data">
            <span class="kpi-value">{{ stats.completion_percentage }}%</span>
            <span class="kpi-label">Completadas</span>
          </div>
        </div>
      </section>

      <PulseRadar :requests="requestsList" />

      <section class="charts-grid">
        <div class="chart-card">
          <div class="card-head">
            <h2 class="card-title">Actividad Reciente</h2>
            <div class="period-select-wrap">
              <select v-model="selectedPeriod" class="period-select" aria-label="Filtrar período de actividad">
                <option value="7d">Últimos 7 días</option>
                <option value="30d">Últimos 30 días</option>
                <option value="90d">Último trimestre</option>
              </select>
              <ChevronDown :size="14" class="select-caret" />
            </div>
          </div>
          <div class="card-body">
            <LineChart :data="stats.recent_activity" />
          </div>
        </div>

        <div class="chart-card">
          <div class="card-head">
            <h2 class="card-title">Solicitudes por Estado</h2>
          </div>
          <div class="card-body donut-body">
            <DonutChart
              :pending-pct="stats.status_breakdown.pending_pct"
              :in-progress-pct="stats.status_breakdown.in_progress_pct"
              :completed-pct="stats.status_breakdown.completed_pct"
            />
          </div>
        </div>
      </section>

      <section class="alert-banner-card">
        <div class="banner-left">
          <div class="rocket-icon-wrap">
            <Rocket :size="26" class="rocket-icon" />
          </div>
          <div class="banner-text">
            <h3 class="banner-title">Nuevas solicitudes en espera</h3>
            <p class="banner-desc">Tienes {{ stats.pending_action_count }} solicitudes por revisar.</p>
          </div>
        </div>
        <button class="banner-action-btn" @click="goToRequests">
          <span>Ver detalles</span>
          <ArrowRight :size="16" />
        </button>
      </section>
    </div>
  </div>
</template>

<style scoped>
.dashboard-page {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.kpi-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
}

.kpi-card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: 22px 26px;
  display: flex;
  align-items: center;
  gap: 18px;
  box-shadow: var(--shadow-card);
  transition: transform var(--transition-fast), box-shadow var(--transition-fast);
}

.kpi-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.kpi-icon-wrap {
  width: 56px;
  height: 56px;
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.icon-blue {
  background: #EBF5FF;
  color: var(--color-primary);
}

.icon-purple {
  background: #F3E8FF;
  color: var(--color-purple);
}

.icon-yellow {
  background: #FEF3C7;
  color: var(--color-yellow-dark);
}

.icon-green {
  background: #DCFCE7;
  color: var(--color-success);
}

.kpi-data {
  display: flex;
  flex-direction: column;
}

.kpi-value {
  font-size: 28px;
  font-weight: 800;
  color: var(--color-blue-title);
  line-height: 1.1;
}

.kpi-label {
  font-size: 13.5px;
  font-weight: 600;
  color: var(--color-text-secondary);
  margin-top: 4px;
}

.charts-grid {
  display: grid;
  grid-template-columns: 1.5fr 1fr;
  gap: 20px;
  margin-top: 4px;
}

.chart-card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: 26px;
  box-shadow: var(--shadow-card);
  display: flex;
  flex-direction: column;
}

.card-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
}

.card-title {
  font-size: 17px;
  font-weight: 700;
  color: var(--color-blue-title);
}

.period-select-wrap {
  position: relative;
  display: flex;
  align-items: center;
}

.period-select {
  appearance: none;
  background: #F8FAFC;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  padding: 6px 28px 6px 12px;
  font-size: 12px;
  font-weight: 600;
  color: var(--color-text-secondary);
  cursor: pointer;
}

.select-caret {
  position: absolute;
  right: 10px;
  color: var(--color-text-secondary);
  pointer-events: none;
}

.card-body {
  flex: 1;
  display: flex;
  align-items: center;
}

.donut-body {
  justify-content: center;
}

.alert-banner-card {
  background: linear-gradient(135deg, #EBF5FF 0%, #FFFFFF 100%);
  border: 1px solid #BAE6FD;
  border-radius: var(--radius-md);
  padding: 22px 26px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  box-shadow: 0 4px 14px rgba(8, 123, 250, 0.08);
}

.banner-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.rocket-icon-wrap {
  width: 50px;
  height: 50px;
  border-radius: var(--radius-md);
  background: var(--button-gradient);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #FFFFFF;
  box-shadow: 0 4px 12px rgba(8, 123, 250, 0.25);
  flex-shrink: 0;
}

.banner-title {
  font-size: 16px;
  font-weight: 700;
  color: var(--color-blue-title);
  margin-bottom: 2px;
}

.banner-desc {
  font-size: 13.5px;
  color: var(--color-text-secondary);
}

.banner-action-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  background: #FFFFFF;
  color: var(--color-primary);
  border: 1px solid var(--color-primary);
  border-radius: var(--radius-sm);
  font-size: 13.5px;
  font-weight: 700;
  box-shadow: 0 2px 6px rgba(8, 123, 250, 0.1);
  transition: all var(--transition-fast);
}

.banner-action-btn:hover {
  background: var(--color-primary);
  color: #FFFFFF;
  transform: translateY(-1px);
}

.skeleton-kpi-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
}

.skeleton-card {
  height: 98px;
  background: linear-gradient(90deg, #EDF2F7 25%, #E2E8F0 50%, #EDF2F7 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
  border-radius: var(--radius-md);
}

@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

@media (max-width: 1024px) {
  .kpi-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .charts-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 640px) {
  .kpi-grid {
    grid-template-columns: 1fr;
  }

  .alert-banner-card {
    flex-direction: column;
    align-items: flex-start;
  }

  .banner-action-btn {
    width: 100%;
    justify-content: center;
  }
}
</style>