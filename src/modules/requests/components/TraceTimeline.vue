<script setup lang="ts">
import { computed } from 'vue'
import {
  CheckCircle2,
  Clock,
  UserCheck,
  Cpu,
  PackageCheck,
  ThumbsUp
} from 'lucide-vue-next'
import { formatDate } from '@/shared/utils/formatters'

const props = defineProps<{
  currentStatus: string
  createdAt: string
  updatedAt?: string
  assignedToName?: string
  clientName?: string
  history?: Array<{
    id?: string
    status?: string
    new_status?: string
    changed_by_name?: string
    note?: string | null
    created_at: string
  }>
}>()

const isFinalized = computed(() => props.currentStatus === 'completed')
const isInProgress = computed(() => props.currentStatus === 'in_progress' || isFinalized.value)
const isAssigned = computed(() => !!props.assignedToName || isInProgress.value)
const isValidated = computed(() => isAssigned.value || isInProgress.value)

const milestones = computed(() => [
  {
    key: 'received',
    title: 'Solicitud Recibida',
    desc: 'Registrada exitosamente en el sistema NEXORA.',
    author: props.clientName || 'Cliente',
    date: formatDate(props.createdAt),
    isCompleted: true,
    isActive: props.currentStatus === 'pending' && !isAssigned.value,
    icon: CheckCircle2
  },
  {
    key: 'validated',
    title: 'Requerimientos Validados',
    desc: 'Parámetros técnicos de intake comprobados y aprobados.',
    author: 'Sistema NEXORA',
    date: formatDate(props.createdAt),
    isCompleted: isValidated.value,
    isActive: isValidated.value && !isAssigned.value,
    icon: Cpu
  },
  {
    key: 'assigned',
    title: 'Especialista Asignado',
    desc: props.assignedToName ? `Asignado al especialista ${props.assignedToName}.` : 'Asignación automática según especialidad y carga.',
    author: props.assignedToName || 'Equipo NEXORA',
    date: props.updatedAt ? formatDate(props.updatedAt) : formatDate(props.createdAt),
    isCompleted: isAssigned.value,
    isActive: isAssigned.value && !isInProgress.value,
    icon: UserCheck
  },
  {
    key: 'in_progress',
    title: 'En Proceso Activo',
    desc: 'El especialista técnico se encuentra trabajando en la solución.',
    author: props.assignedToName || 'Área Operativa',
    date: props.updatedAt ? formatDate(props.updatedAt) : 'En curso',
    isCompleted: isFinalized.value,
    isActive: props.currentStatus === 'in_progress',
    icon: Clock
  },
  {
    key: 'finalized',
    title: 'Entrega y Finalización',
    desc: isFinalized.value ? 'El servicio ha sido completado y entregado al cliente.' : 'Entregable pendiente de emisión técnica.',
    author: 'Equipo Técnico',
    date: isFinalized.value && props.updatedAt ? formatDate(props.updatedAt) : 'Pendiente',
    isCompleted: isFinalized.value,
    isActive: false,
    icon: PackageCheck
  },
  {
    key: 'accepted',
    title: 'Aceptación de Conformidad',
    desc: isFinalized.value ? 'Entrega verificada y aceptada por el cliente.' : 'Pendiente de entrega técnica.',
    author: props.clientName || 'Cliente',
    date: isFinalized.value && props.updatedAt ? formatDate(props.updatedAt) : 'Pendiente',
    isCompleted: isFinalized.value,
    isActive: false,
    icon: ThumbsUp
  }
])
</script>

<template>
  <div class="trace-timeline-card">
    <div class="trace-header">
      <div class="trace-title-box">
        <h3 class="trace-title">NEXORA Trace · Línea de Vida</h3>
        <p class="trace-subtitle">Seguimiento transparente de hitos y trazabilidad técnica en tiempo real.</p>
      </div>
      <div class="status-summary-badge" :class="currentStatus">
        {{ currentStatus === 'completed' ? 'Finalizada y Aceptada' : (currentStatus === 'in_progress' ? 'En Proceso Activo' : 'Pendiente de Asignación') }}
      </div>
    </div>

    <div class="timeline-stream">
      <div
        v-for="(m, i) in milestones"
        :key="m.key"
        class="timeline-item"
        :class="{ completed: m.isCompleted, active: m.isActive }"
      >
        <div class="item-rail">
          <div class="node-circle" :class="{ done: m.isCompleted, current: m.isActive }">
            <component :is="m.icon" :size="14" />
          </div>
          <div v-if="i < milestones.length - 1" class="rail-line" :class="{ filled: m.isCompleted }"></div>
        </div>

        <div class="item-content">
          <div class="content-head">
            <span class="milestone-title">{{ m.title }}</span>
            <span class="milestone-date">{{ m.date }}</span>
          </div>
          <p class="milestone-desc">{{ m.desc }}</p>
          <div class="content-meta">
            <span class="author-tag">Responsable: {{ m.author }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.trace-timeline-card {
  background: #FFFFFF;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: 24px;
  box-shadow: var(--shadow-card);
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.trace-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--color-border);
}

.trace-title {
  font-size: 16px;
  font-weight: 800;
  color: var(--color-blue-title);
  margin-bottom: 2px;
}

.trace-subtitle {
  font-size: 12.5px;
  color: var(--color-text-secondary);
}

.status-summary-badge {
  padding: 5px 12px;
  border-radius: var(--radius-full);
  font-size: 11.5px;
  font-weight: 700;
  white-space: nowrap;
}

.status-summary-badge.completed {
  background: #DCFCE7;
  color: var(--color-success);
  border: 1px solid #BBF7D0;
}

.status-summary-badge.in_progress {
  background: #EBF5FF;
  color: var(--color-primary);
  border: 1px solid #BAE6FD;
}

.status-summary-badge.pending {
  background: #FEF3C7;
  color: var(--color-yellow-dark);
  border: 1px solid #FDE68A;
}

.timeline-stream {
  display: flex;
  flex-direction: column;
  gap: 0;
}

.timeline-item {
  display: flex;
  gap: 16px;
  position: relative;
}

.item-rail {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 28px;
  flex-shrink: 0;
}

.node-circle {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  border: 2px solid #CBD5E1;
  background: #FFFFFF;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #94A3B8;
  z-index: 2;
  transition: all var(--transition-fast);
}

.node-circle.done {
  background: var(--color-primary);
  border-color: var(--color-primary);
  color: #FFFFFF;
  box-shadow: 0 2px 8px rgba(8, 123, 250, 0.3);
}

.node-circle.current {
  background: #FEF3C7;
  border-color: var(--color-yellow-dark);
  color: var(--color-yellow-dark);
  box-shadow: 0 0 0 4px rgba(255, 200, 61, 0.25);
}

.rail-line {
  width: 2px;
  flex: 1;
  min-height: 38px;
  background: #E2E8F0;
  margin: 4px 0;
}

.rail-line.filled {
  background: var(--color-primary);
}

.item-content {
  flex: 1;
  padding-bottom: 22px;
}

.content-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.milestone-title {
  font-size: 13.5px;
  font-weight: 700;
  color: var(--color-text-main);
}

.timeline-item.completed .milestone-title {
  color: var(--color-blue-title);
}

.milestone-date {
  font-size: 11.5px;
  font-weight: 600;
  color: var(--color-text-muted);
}

.milestone-desc {
  font-size: 12.5px;
  color: var(--color-text-secondary);
  line-height: 1.4;
  margin-top: 3px;
}

.content-meta {
  margin-top: 6px;
}

.author-tag {
  font-size: 11px;
  font-weight: 600;
  color: var(--color-text-secondary);
  background: #F8FAFC;
  padding: 2px 8px;
  border-radius: var(--radius-sm);
  border: 1px solid var(--color-border);
}
</style>