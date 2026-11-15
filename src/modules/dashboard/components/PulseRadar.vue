<script setup lang="ts">
import { computed } from 'vue'
import { Activity, Clock, CheckCircle2, ShieldAlert, ArrowUpRight } from 'lucide-vue-next'
import { useRouter } from 'vue-router'
import type { ServiceRequest } from '@/shared/types/request.types'

interface Props {
  requests: ServiceRequest[]
}

const props = defineProps<Props>()
const router = useRouter()

const unassignedCount = computed(() => {
  return props.requests.filter(r => !r.assigned_to && r.status !== 'completed').length
})

const atRiskCount = computed(() => {
  return props.requests.filter(r => {
    if (r.status === 'completed') return false
    const created = new Date(r.created_at).getTime()
    const ageHours = (Date.now() - created) / 3600000
    return ageHours > 16
  }).length
})

const totalActive = computed(() => {
  return props.requests.filter(r => r.status === 'pending' || r.status === 'in_progress').length
})

const operationalHealth = computed(() => {
  if (totalActive.value === 0) return { score: 100, label: 'Excelente', status: 'optimal' }
  const riskRatio = (atRiskCount.value + unassignedCount.value * 0.5) / Math.max(totalActive.value, 1)
  if (riskRatio > 0.4) return { score: 68, label: 'Atención requerida', status: 'warning' }
  if (riskRatio > 0.2) return { score: 85, label: 'Controlado', status: 'good' }
  return { score: 96, label: 'Óptimo', status: 'optimal' }
})

function viewFiltered(tab: string) {
  router.push(`/admin/requests?filter=${tab}`)
}
</script>

<template>
  <div class="pulse-radar-card">
    <div class="radar-header">
      <div class="header-left">
        <Activity :size="20" class="pulse-icon" />
        <div>
          <h3 class="radar-title">NEXORA Pulse — Radar Operativo</h3>
          <p class="radar-subtitle">Monitoreo continuo de riesgos, cuellos de botella y compromisos</p>
        </div>
      </div>
      <div :class="['health-badge', operationalHealth.status]">
        <span class="health-dot"></span>
        <span>Salud Operativa: {{ operationalHealth.score }}% ({{ operationalHealth.label }})</span>
      </div>
    </div>

    <div class="radar-grid">
      <div class="risk-card" @click="viewFiltered('unassigned')">
        <div class="risk-card-top">
          <div class="risk-icon-wrap yellow">
            <Clock :size="18" />
          </div>
          <span class="risk-count">{{ unassignedCount }}</span>
        </div>
        <div class="risk-label">Sin Asignación Inmediata</div>
        <div class="risk-desc">Solicitudes en cola esperando asignación de especialista</div>
        <div class="risk-footer">
          <span>Gestionar asignación</span>
          <ArrowUpRight :size="14" />
        </div>
      </div>

      <div class="risk-card" @click="viewFiltered('at_risk')">
        <div class="risk-card-top">
          <div class="risk-icon-wrap red">
            <ShieldAlert :size="18" />
          </div>
          <span class="risk-count">{{ atRiskCount }}</span>
        </div>
        <div class="risk-label">Compromisos SLA en Riesgo</div>
        <div class="risk-desc">Casos que superan el 70% del tiempo objetivo de entrega</div>
        <div class="risk-footer">
          <span>Priorizar atención</span>
          <ArrowUpRight :size="14" />
        </div>
      </div>

      <div class="risk-card optimal">
        <div class="risk-card-top">
          <div class="risk-icon-wrap green">
            <CheckCircle2 :size="18" />
          </div>
          <span class="risk-count">{{ totalActive }}</span>
        </div>
        <div class="risk-label">Flujo de Tareas Activas</div>
        <div class="risk-desc">Monitoreo continuo de carga en ejecución sincronizada</div>
        <div class="risk-footer">
          <span>Ver distribución global</span>
          <ArrowUpRight :size="14" />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.pulse-radar-card {
  background: #FFFFFF;
  border: 1px solid #E3EAF6;
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 4px 18px rgba(8, 123, 250, 0.05);
  margin-bottom: 24px;
}

.radar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 18px;
  flex-wrap: wrap;
  gap: 12px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.pulse-icon {
  color: #087BFA;
}

.radar-title {
  font-size: 1.05rem;
  font-weight: 700;
  color: #17366C;
  margin: 0;
}

.radar-subtitle {
  font-size: 0.8rem;
  color: #71809B;
  margin: 2px 0 0 0;
}

.health-badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 6px 14px;
  border-radius: 20px;
  font-size: 0.82rem;
  font-weight: 700;
}

.health-badge.optimal {
  background: #EBF8F2;
  color: #00BA88;
  border: 1px solid #A7F3D0;
}

.health-badge.good {
  background: #EDF5FF;
  color: #087BFA;
  border: 1px solid #BAE6FD;
}

.health-badge.warning {
  background: #FFF8E6;
  color: #B78103;
  border: 1px solid #FDE68A;
}

.health-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: currentColor;
  box-shadow: 0 0 8px currentColor;
  animation: pulseDot 2s infinite ease-in-out;
}

@keyframes pulseDot {
  0%, 100% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.3); opacity: 0.6; }
}

.radar-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 14px;
}

.risk-card {
  background: #F8FAFD;
  border: 1px solid #E3EAF6;
  border-radius: 12px;
  padding: 16px;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  flex-direction: column;
}

.risk-card:hover {
  background: #FFFFFF;
  border-color: #087BFA;
  transform: translateY(-2px);
  box-shadow: 0 6px 14px rgba(8, 123, 250, 0.08);
}

.risk-card-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
}

.risk-icon-wrap {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.risk-icon-wrap.yellow {
  background: #FFF8E6;
  color: #B78103;
}

.risk-icon-wrap.red {
  background: #FEF2F2;
  color: #EF4444;
}

.risk-icon-wrap.green {
  background: #EBF8F2;
  color: #00BA88;
}

.risk-count {
  font-size: 1.5rem;
  font-weight: 800;
  color: #17366C;
}

.risk-label {
  font-size: 0.9rem;
  font-weight: 700;
  color: #182B49;
  margin-bottom: 4px;
}

.risk-desc {
  font-size: 0.78rem;
  color: #71809B;
  line-height: 1.4;
  flex: 1;
  margin-bottom: 12px;
}

.risk-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 0.76rem;
  font-weight: 600;
  color: #087BFA;
  padding-top: 8px;
  border-top: 1px solid #E9EFF9;
}
</style>