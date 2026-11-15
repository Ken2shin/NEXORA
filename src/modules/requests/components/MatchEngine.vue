<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { Sparkles, UserCheck } from 'lucide-vue-next'
import { orgService } from '@/shared/infrastructure/adapters/mock/mock.organization.service'

interface EmployeeMatch {
  id: string
  name: string
  role: string
  specialty: string
  activeWorkload: number
  maxCapacity: number
  matchScore: number
  avatarUrl: string
}

interface Props {
  serviceName?: string
  currentAssigneeId?: string
  currentAssigneeName?: string
  isStaff: boolean
}

const props = defineProps<Props>()

const emit = defineEmits<{
  (e: 'assign', employeeId: string, employeeName: string): void
}>()

const employees = ref<EmployeeMatch[]>([
  {
    id: 'emp-2',
    name: 'Andrea Morales',
    role: 'Ingeniera de Soporte y Redes',
    specialty: 'Soporte Técnico',
    activeWorkload: 1,
    maxCapacity: 5,
    matchScore: 99,
    avatarUrl: '/images/illustrations/hero-character.jpg'
  },
  {
    id: 'emp-1',
    name: 'Roberto Gómez',
    role: 'Especialista Frontend & UI',
    specialty: 'Diseño Web',
    activeWorkload: 2,
    maxCapacity: 5,
    matchScore: 95,
    avatarUrl: '/images/illustrations/hero-character.jpg'
  },
  {
    id: 'emp-3',
    name: 'Felipe Herrera',
    role: 'Consultor Cloud & DevOps',
    specialty: 'Consultoría IT',
    activeWorkload: 4,
    maxCapacity: 5,
    matchScore: 84,
    avatarUrl: '/images/illustrations/hero-character.jpg'
  },
  {
    id: 'emp-4',
    name: 'Valeria Castro',
    role: 'Desarrolladora Fullstack',
    specialty: 'General',
    activeWorkload: 3,
    maxCapacity: 5,
    matchScore: 78,
    avatarUrl: '/images/illustrations/hero-character.jpg'
  }
])

const isAssigning = ref(false)
const selectedEmpId = ref(props.currentAssigneeId || '')

onMounted(async () => {
  try {
    const list = await orgService.getEmployees()
    if (list && list.length > 0) {
      employees.value = list.filter(e => e.status === 'active').map((e, index) => ({
        id: e.user_id || e.id,
        name: e.full_name,
        role: e.position_title || e.profession,
        specialty: (e.specialties && e.specialties[0]) || e.profession,
        activeWorkload: (index % 3) + 1,
        maxCapacity: 5,
        matchScore: 85,
        avatarUrl: e.avatar_url || '/images/illustrations/hero-character.jpg'
      }))
    }
  } catch {}
})

const scoredEmployees = computed(() => {
  const currentService = (props.serviceName || '').toLowerCase()
  return [...employees.value].map(emp => {
    let score = 50
    if (emp.specialty.toLowerCase().includes(currentService) || currentService.includes(emp.specialty.toLowerCase())) {
      score += 35
    }
    const availabilityFactor = Math.max(0, (emp.maxCapacity - emp.activeWorkload) * 4)
    score += availabilityFactor
    return {
      ...emp,
      matchScore: Math.min(99, score)
    }
  }).sort((a, b) => b.matchScore - a.matchScore)
})

const bestMatch = computed(() => scoredEmployees.value[0])

function handleAssign(emp: EmployeeMatch) {
  selectedEmpId.value = emp.id
  emit('assign', emp.id, emp.name)
}
</script>

<template>
  <div class="match-engine-card">
    <div class="engine-header">
      <div class="title-wrap">
        <Sparkles :size="18" class="sparkle-icon" />
        <h3 class="engine-title">NEXORA Match — Asignación Inteligente</h3>
      </div>
      <span class="engine-tag">Algoritmo de balanceo y especialidad</span>
    </div>

    <div v-if="bestMatch && !currentAssigneeId" class="recommendation-banner">
      <div class="rec-avatar-wrap">
        <img :src="bestMatch.avatarUrl" :alt="bestMatch.name" class="rec-avatar" />
        <span class="match-pct">{{ bestMatch.matchScore }}% afinidad</span>
      </div>
      <div class="rec-info">
        <div class="rec-label">Candidato óptimo recomendado</div>
        <div class="rec-name">{{ bestMatch.name }}</div>
        <div class="rec-meta">
          <span>{{ bestMatch.role }}</span> ·
          <span class="workload-tag">Carga: {{ bestMatch.activeWorkload }}/{{ bestMatch.maxCapacity }} tareas</span>
        </div>
      </div>
      <button
        v-if="isStaff"
        type="button"
        class="assign-recommended-btn"
        @click="handleAssign(bestMatch)"
      >
        <UserCheck :size="15" />
        <span>Asignar ahora</span>
      </button>
    </div>

    <div v-else-if="currentAssigneeName" class="current-assignee-card">
      <div class="assignee-inner">
        <UserCheck :size="18" class="assigned-icon" />
        <div>
          <span class="assigned-label">Especialista responsable asignado:</span>
          <span class="assigned-name">{{ currentAssigneeName }}</span>
        </div>
      </div>
      <button
        v-if="isStaff"
        type="button"
        class="reassign-btn"
        @click="isAssigning = !isAssigning"
      >
        {{ isAssigning ? 'Cerrar panel' : 'Reasignar' }}
      </button>
    </div>

    <div v-if="isStaff && (isAssigning || !currentAssigneeId)" class="staff-picker-panel">
      <h4 class="panel-subtitle">Disponibilidad del equipo técnico:</h4>
      <div class="staff-grid">
        <div
          v-for="emp in scoredEmployees"
          :key="emp.id"
          :class="['staff-card', { active: selectedEmpId === emp.id }]"
          @click="handleAssign(emp)"
        >
          <div class="staff-card-top">
            <img :src="emp.avatarUrl" :alt="emp.name" class="staff-avatar" />
            <div class="staff-details">
              <span class="staff-name">{{ emp.name }}</span>
              <span class="staff-role">{{ emp.role }}</span>
            </div>
            <span class="score-badge">{{ emp.matchScore }}%</span>
          </div>
          <div class="capacity-bar-wrap">
            <div class="capacity-labels">
              <span>Capacidad operativa</span>
              <span>{{ emp.activeWorkload }}/{{ emp.maxCapacity }}</span>
            </div>
            <div class="capacity-track">
              <div
                class="capacity-fill"
                :style="{ width: `${(emp.activeWorkload / emp.maxCapacity) * 100}%` }"
              ></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.match-engine-card {
  background: #FFFFFF;
  border: 1px solid #E3EAF6;
  border-radius: 14px;
  padding: 18px 20px;
  box-shadow: 0 4px 16px rgba(8, 123, 250, 0.04);
  margin-bottom: 20px;
}

.engine-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 14px;
}

.title-wrap {
  display: flex;
  align-items: center;
  gap: 8px;
}

.sparkle-icon {
  color: #8252E8;
}

.engine-title {
  font-size: 0.95rem;
  font-weight: 700;
  color: #17366C;
  margin: 0;
}

.engine-tag {
  font-size: 0.72rem;
  color: #71809B;
  background: #F4F7FD;
  padding: 3px 8px;
  border-radius: 6px;
  font-weight: 500;
}

.recommendation-banner {
  display: flex;
  align-items: center;
  gap: 14px;
  background: linear-gradient(135deg, #F0F6FF 0%, #FAF5FF 100%);
  border: 1px solid #D5E5FF;
  border-radius: 12px;
  padding: 12px 16px;
}

.rec-avatar-wrap {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.rec-avatar {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  object-fit: cover;
  object-position: center 20%;
  border: 2px solid #087BFA;
}

.match-pct {
  font-size: 0.68rem;
  font-weight: 700;
  color: #8252E8;
  background: #FFFFFF;
  padding: 1px 6px;
  border-radius: 10px;
  border: 1px solid #E0D4FF;
}

.rec-info {
  flex: 1;
}

.rec-label {
  font-size: 0.75rem;
  font-weight: 700;
  color: #087BFA;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.rec-name {
  font-size: 0.95rem;
  font-weight: 700;
  color: #182B49;
}

.rec-meta {
  font-size: 0.78rem;
  color: #71809B;
  margin-top: 2px;
}

.workload-tag {
  color: #087BFA;
  font-weight: 600;
}

.assign-recommended-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: #087BFA;
  color: #FFFFFF;
  border: none;
  border-radius: 8px;
  padding: 8px 14px;
  font-size: 0.82rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 2px 8px rgba(8, 123, 250, 0.25);
}

.assign-recommended-btn:hover {
  background: #0870E8;
  transform: translateY(-1px);
}

.current-assignee-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #F8FAFD;
  border: 1px solid #E3EAF6;
  border-radius: 10px;
  padding: 10px 14px;
}

.assignee-inner {
  display: flex;
  align-items: center;
  gap: 10px;
}

.assigned-icon {
  color: #00BA88;
}

.assigned-label {
  font-size: 0.78rem;
  color: #71809B;
  display: block;
}

.assigned-name {
  font-size: 0.9rem;
  font-weight: 700;
  color: #182B49;
}

.reassign-btn {
  background: transparent;
  border: 1px solid #D5E0F2;
  color: #087BFA;
  border-radius: 6px;
  padding: 5px 10px;
  font-size: 0.78rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s;
}

.reassign-btn:hover {
  background: #F0F6FF;
  border-color: #087BFA;
}

.staff-picker-panel {
  margin-top: 14px;
  padding-top: 14px;
  border-top: 1px dashed #E3EAF6;
}

.panel-subtitle {
  font-size: 0.8rem;
  font-weight: 700;
  color: #71809B;
  text-transform: uppercase;
  margin-bottom: 10px;
}

.staff-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(210px, 1fr));
  gap: 10px;
}

.staff-card {
  background: #FFFFFF;
  border: 1px solid #E3EAF6;
  border-radius: 10px;
  padding: 10px;
  cursor: pointer;
  transition: all 0.2s;
}

.staff-card:hover {
  border-color: #087BFA;
  transform: translateY(-1px);
  box-shadow: 0 4px 10px rgba(8, 123, 250, 0.08);
}

.staff-card.active {
  border-color: #087BFA;
  background: #F6F9FF;
}

.staff-card-top {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.staff-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  object-fit: cover;
  object-position: center 20%;
}

.staff-details {
  flex: 1;
  min-width: 0;
}

.staff-name {
  font-size: 0.82rem;
  font-weight: 700;
  color: #182B49;
  display: block;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.staff-role {
  font-size: 0.7rem;
  color: #71809B;
  display: block;
}

.score-badge {
  font-size: 0.7rem;
  font-weight: 700;
  color: #087BFA;
  background: #EDF5FF;
  padding: 2px 6px;
  border-radius: 8px;
}

.capacity-labels {
  display: flex;
  justify-content: space-between;
  font-size: 0.68rem;
  color: #71809B;
  margin-bottom: 3px;
}

.capacity-track {
  height: 4px;
  background: #E8EEF8;
  border-radius: 2px;
  overflow: hidden;
}

.capacity-fill {
  height: 100%;
  background: #087BFA;
  border-radius: 2px;
}
</style>