<script setup lang="ts">
import { computed } from 'vue'
import { Clock, AlertTriangle, CheckCircle, AlertOctagon, PauseCircle } from 'lucide-vue-next'
import { evaluateDualSla } from '@/shared/utils/sla.calculator'

const props = withDefaults(
  defineProps<{
    createdAt: string
    currentStatus: string
    priority?: 'low' | 'medium' | 'high' | 'urgent'
    firstResponseAt?: string | null
    showDetails?: boolean
  }>(),
  {
    priority: 'medium',
    showDetails: false
  }
)

const dualSla = computed(() => evaluateDualSla(props.createdAt, props.currentStatus, props.priority, props.firstResponseAt))
const sla = computed(() => dualSla.value.resolution)
const firstResp = computed(() => dualSla.value.firstResponse)
</script>

<template>
  <div class="sla-badge-container">
    <div
      class="sla-pill"
      :class="{
        'sla-within': dualSla.overallRisk === 'within_sla',
        'sla-near': dualSla.overallRisk === 'near_breach',
        'sla-risk': dualSla.overallRisk === 'at_risk',
        'sla-breached': dualSla.overallRisk === 'breached',
        'sla-waiting': dualSla.overallRisk === 'paused'
      }"
    >
      <CheckCircle v-if="dualSla.overallRisk === 'within_sla' && (currentStatus === 'completed' || currentStatus === 'finalizada')" :size="13" />
      <Clock v-else-if="dualSla.overallRisk === 'within_sla'" :size="13" />
      <AlertTriangle v-else-if="dualSla.overallRisk === 'near_breach' || dualSla.overallRisk === 'at_risk'" :size="13" />
      <AlertOctagon v-else-if="dualSla.overallRisk === 'breached'" :size="13" />
      <PauseCircle v-else-if="dualSla.overallRisk === 'paused'" :size="13" />

      <span class="sla-text">{{ sla.label }}</span>
      <span v-if="sla.remainingHours > 0 && currentStatus !== 'completed' && currentStatus !== 'finalizada'" class="sla-time">
        ({{ sla.remainingHours }}h)
      </span>
    </div>

    <div v-if="showDetails && currentStatus !== 'completed' && currentStatus !== 'finalizada'" class="sla-progress-box">
      <div class="sla-metric-split">
        <span class="split-label">1ª Respuesta:</span>
        <span
          class="split-val"
          :class="{
            'text-green': firstResp.status === 'met',
            'text-amber': firstResp.status === 'pending',
            'text-red': firstResp.status === 'breached'
          }"
        >
          {{ firstResp.status === 'met' ? `Cumplida (${firstResp.elapsedHours}h)` : (firstResp.status === 'pending' ? `Pendiente (${firstResp.limitHours}h máx)` : `Incumplida (+${firstResp.elapsedHours}h)`) }}
        </span>
      </div>

      <div class="sla-progress-track">
        <div
          class="sla-progress-bar"
          :style="{ width: `${sla.percentUsed}%` }"
          :class="{
            'bar-green': sla.percentUsed < 70,
            'bar-yellow': sla.percentUsed >= 70 && sla.percentUsed < 85,
            'bar-red': sla.percentUsed >= 85
          }"
        ></div>
      </div>
      <div class="sla-deadline-text">
        <span>Vence: {{ sla.deadlineFormatted }}</span>
        <span>{{ sla.percentUsed }}%</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.sla-badge-container {
  display: inline-flex;
  flex-direction: column;
  gap: 4px;
}

.sla-pill {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 4px 10px;
  border-radius: var(--radius-full);
  font-size: 11px;
  font-weight: 700;
  width: fit-content;
  white-space: nowrap;
}

.sla-within {
  background: #E8F5E9;
  color: #16A34A;
  border: 1px solid #BBF7D0;
}

.sla-near {
  background: #FEF3C7;
  color: #D97706;
  border: 1px solid #FDE68A;
}

.sla-risk {
  background: #FFF7ED;
  color: #EA580C;
  border: 1px solid #FFEDD5;
}

.sla-breached {
  background: #FEE2E2;
  color: #DC2626;
  border: 1px solid #FECACA;
}

.sla-waiting {
  background: #EBF5FF;
  color: var(--color-primary);
  border: 1px solid #BAE6FD;
}

.sla-time {
  font-weight: 800;
  opacity: 0.9;
}

.sla-progress-box {
  display: flex;
  flex-direction: column;
  gap: 3px;
  width: 140px;
}

.sla-progress-track {
  width: 100%;
  height: 4px;
  background: #E2E8F0;
  border-radius: 2px;
  overflow: hidden;
}

.sla-progress-bar {
  height: 100%;
  transition: width 0.3s ease;
}

.bar-green {
  background: #16A34A;
}

.bar-yellow {
  background: #D97706;
}

.bar-red {
  background: #DC2626;
}

.sla-deadline-text {
  display: flex;
  justify-content: space-between;
  font-size: 10px;
  font-weight: 600;
  color: var(--color-text-secondary);
}

.sla-metric-split {
  display: flex;
  justify-content: space-between;
  font-size: 10px;
  font-weight: 700;
}

.split-label {
  color: #64748B;
}

.text-green { color: #16A34A; }
.text-amber { color: #D97706; }
.text-red { color: #DC2626; }
</style>