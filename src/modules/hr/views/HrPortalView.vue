<script setup lang="ts">
import { ref, onMounted } from 'vue'
import {
  Users,
  Calendar,
  Briefcase,
  UserPlus,
  CheckCircle,
  XCircle,
  Plus
} from 'lucide-vue-next'
import { orgService } from '@/shared/infrastructure/adapters/mock/mock.organization.service'
import type { Employee, HrLeaveRequest, HrVacancy, HrPerformanceReview } from '@/shared/types/organization.types'
import { useUiStore } from '@/shared/stores/ui.store'
import BaseModal from '@/shared/components/BaseModal.vue'
import { formatDate } from '@/shared/utils/formatters'

const uiStore = useUiStore()

const activeTab = ref<'directory' | 'leaves' | 'recruitment' | 'reviews' | 'onboarding'>('directory')
const employees = ref<Employee[]>([])
const leaves = ref<HrLeaveRequest[]>([])
const vacancies = ref<HrVacancy[]>([])
const reviews = ref<HrPerformanceReview[]>([])
const isLoading = ref(true)

const isLeaveModalOpen = ref(false)
const selectedEmpId = ref('')
const leaveType = ref<'vacation' | 'medical' | 'personal'>('vacation')
const leaveStartDate = ref('')
const leaveEndDate = ref('')
const leaveReason = ref('')

const isVacancyModalOpen = ref(false)
const vacTitle = ref('')
const vacDeptId = ref('dept-1')
const vacOpenings = ref(1)
const vacDesc = ref('')
const vacReqs = ref('')

async function loadData() {
  isLoading.value = true
  try {
    const [e, l, v, r] = await Promise.all([
      orgService.getEmployees(),
      orgService.getHrLeaves(),
      orgService.getHrVacancies(),
      orgService.getHrReviews()
    ])
    employees.value = e
    leaves.value = l
    vacancies.value = v
    reviews.value = r
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  loadData()
})

async function handleApproveLeave(leave: HrLeaveRequest) {
  await orgService.updateHrLeaveStatus(leave.id, 'approved', 'Mariana Pineda (HR Manager)')
  uiStore.showToast('success', 'Permiso aprobado', `El permiso para ${leave.employee_name} fue aprobado.`)
  await loadData()
}

async function handleRejectLeave(leave: HrLeaveRequest) {
  const ok = await uiStore.confirm({
    title: 'Rechazar solicitud de permiso',
    message: `¿Estás seguro de rechazar la solicitud de ${leave.employee_name}?`,
    confirmText: 'Rechazar solicitud',
    isDanger: true
  })
  if (ok) {
    await orgService.updateHrLeaveStatus(leave.id, 'rejected', 'Mariana Pineda (HR Manager)')
    uiStore.showToast('info', 'Permiso rechazado', 'La solicitud fue denegada.')
    await loadData()
  }
}

async function handleCreateLeave() {
  const emp = employees.value.find(e => e.id === selectedEmpId.value)
  if (!emp || !leaveStartDate.value || !leaveEndDate.value) {
    uiStore.showToast('error', 'Validación', 'Selecciona el colaborador y fechas de inicio y fin.')
    return
  }

  const start = new Date(leaveStartDate.value)
  const end = new Date(leaveEndDate.value)
  const days = Math.max(1, Math.round((end.getTime() - start.getTime()) / 86400000) + 1)

  await orgService.createHrLeave({
    employee_id: emp.id,
    employee_name: emp.full_name,
    leave_type: leaveType.value,
    start_date: leaveStartDate.value,
    end_date: leaveEndDate.value,
    days_count: days,
    reason: leaveReason.value.trim() || 'Solicitud tramitada por RRHH',
    status: 'pending'
  })

  uiStore.showToast('success', 'Solicitud registrada', 'El permiso fue enviado a aprobación.')
  isLeaveModalOpen.value = false
  await loadData()
}

async function handleCreateVacancy() {
  if (!vacTitle.value.trim()) return

  await orgService.createHrVacancy({
    title: vacTitle.value.trim(),
    department_id: vacDeptId.value,
    department_name: 'Departamento de Tecnología',
    position_id: 'pos-2',
    openings_count: Number(vacOpenings.value) || 1,
    status: 'open',
    description: vacDesc.value.trim(),
    requirements: vacReqs.value.split(',').map(s => s.trim()).filter(Boolean)
  })

  uiStore.showToast('success', 'Vacante publicada', 'La vacante fue registrada en el portal de talento.')
  isVacancyModalOpen.value = false
  await loadData()
}
</script>

<template>
  <div class="hr-portal-page">
    <div class="page-header">
      <div>
        <h1 class="page-title">Portal de Recursos Humanos</h1>
        <p class="page-subtitle">Gestión de talento, expedientes de personal, ausencias, evaluaciones y reclutamiento.</p>
      </div>

      <div class="header-actions">
        <button
          v-if="activeTab === 'leaves'"
          type="button"
          class="btn-primary-action"
          @click="isLeaveModalOpen = true; selectedEmpId = employees[0]?.id || ''"
        >
          <Plus :size="16" />
          <span>Tramitar Permiso / Ausencia</span>
        </button>
        <button
          v-else-if="activeTab === 'recruitment'"
          type="button"
          class="btn-primary-action"
          @click="isVacancyModalOpen = true"
        >
          <Plus :size="16" />
          <span>Publicar Vacante</span>
        </button>
      </div>
    </div>

    <div class="hr-tabs-bar">
      <button :class="['tab-btn', { active: activeTab === 'directory' }]" @click="activeTab = 'directory'">
        <Users :size="16" />
        <span>Expedientes de Personal</span>
      </button>

      <button :class="['tab-btn', { active: activeTab === 'leaves' }]" @click="activeTab = 'leaves'">
        <Calendar :size="16" />
        <span>Vacaciones y Permisos</span>
      </button>

      <button :class="['tab-btn', { active: activeTab === 'recruitment' }]" @click="activeTab = 'recruitment'">
        <Briefcase :size="16" />
        <span>Reclutamiento y Vacantes</span>
      </button>

      <button :class="['tab-btn', { active: activeTab === 'onboarding' }]" @click="activeTab = 'onboarding'">
        <UserPlus :size="16" />
        <span>Onboarding / Offboarding</span>
      </button>
    </div>

    <div v-if="activeTab === 'directory'" class="tab-pane">
      <div class="table-card">
        <table class="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Colaborador</th>
              <th>Departamento</th>
              <th>Cargo</th>
              <th>Fecha Ingreso</th>
              <th>Estado Laboral</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="emp in employees" :key="emp.id">
              <td class="font-bold text-primary">{{ emp.internal_id }}</td>
              <td>
                <div class="emp-user-row">
                  <img :src="emp.avatar_url || '/images/illustrations/hero-character.jpg'" class="avatar-sm" />
                  <div>
                    <span class="font-bold">{{ emp.full_name }}</span>
                    <span class="subtext">{{ emp.email }}</span>
                  </div>
                </div>
              </td>
              <td>{{ emp.department_name }}</td>
              <td>{{ emp.position_title }}</td>
              <td>{{ formatDate(emp.hire_date) }}</td>
              <td>
                <span class="status-pill active">{{ emp.status }}</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div v-else-if="activeTab === 'leaves'" class="tab-pane">
      <div class="table-card">
        <table class="data-table">
          <thead>
            <tr>
              <th>Colaborador</th>
              <th>Tipo</th>
              <th>Período</th>
              <th>Días</th>
              <th>Motivo</th>
              <th>Estado</th>
              <th class="text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="l in leaves" :key="l.id">
              <td class="font-bold">{{ l.employee_name }}</td>
              <td>
                <span class="leave-type-tag">{{ l.leave_type.toUpperCase() }}</span>
              </td>
              <td>{{ formatDate(l.start_date) }} al {{ formatDate(l.end_date) }}</td>
              <td><strong>{{ l.days_count }} días</strong></td>
              <td>{{ l.reason }}</td>
              <td>
                <span :class="['status-chip', l.status]">
                  {{ l.status === 'approved' ? 'Aprobado' : (l.status === 'rejected' ? 'Rechazado' : 'Pendiente') }}
                </span>
              </td>
              <td class="text-right">
                <div v-if="l.status === 'pending'" class="row-actions">
                  <button class="action-btn check" @click="handleApproveLeave(l)" title="Aprobar">
                    <CheckCircle :size="16" />
                  </button>
                  <button class="action-btn reject" @click="handleRejectLeave(l)" title="Rechazar">
                    <XCircle :size="16" />
                  </button>
                </div>
                <span v-else class="approved-text">{{ l.approved_by || 'Procesado' }}</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div v-else-if="activeTab === 'recruitment'" class="tab-pane">
      <div class="vacancies-grid">
        <div v-for="vac in vacancies" :key="vac.id" class="vacancy-card">
          <div class="vac-top">
            <span class="vac-dept">{{ vac.department_name }}</span>
            <span :class="['vac-status', vac.status]">{{ vac.status.toUpperCase() }}</span>
          </div>
          <h3 class="vac-title">{{ vac.title }}</h3>
          <p class="vac-desc">{{ vac.description }}</p>

          <div class="vac-stats">
            <span>Plazas: <strong>{{ vac.openings_count }}</strong></span>
            <span>Candidatos en pipeline: <strong>{{ vac.candidates_count }}</strong></span>
          </div>

          <div class="req-chips">
            <span v-for="r in vac.requirements" :key="r" class="req-chip">{{ r }}</span>
          </div>
        </div>
      </div>
    </div>

    <div v-else-if="activeTab === 'onboarding'" class="tab-pane">
      <div class="onboarding-grid">
        <div class="checklist-card">
          <h3 class="check-title">Protocolo de Onboarding (Nuevos Ingresos)</h3>
          <p class="check-subtitle">Pasos obligatorios para la incorporación de personal técnico y administrativo.</p>
          <ul class="task-list">
            <li><CheckCircle :size="16" class="check-icon" /> Firma digital de contrato laboral y convenio confidencialidad NDA</li>
            <li><CheckCircle :size="16" class="check-icon" /> Provisión de cuenta empresarial @nexora.com y accesos de autenticación</li>
            <li><CheckCircle :size="16" class="check-icon" /> Asignación al departamento y grupo operativo con líder correspondiente</li>
            <li><CheckCircle :size="16" class="check-icon" /> Entrega de equipo portátil con software de seguridad preinstalado</li>
            <li><CheckCircle :size="16" class="check-icon" /> Capacitación inicial sobre estándares de calidad y SLA Radar</li>
          </ul>
        </div>

        <div class="checklist-card">
          <h3 class="check-title">Protocolo de Offboarding (Bajas y Salidas)</h3>
          <p class="check-subtitle">Procedimiento seguro para la revocación de accesos y cierre de responsabilidades.</p>
          <ul class="task-list">
            <li><CheckCircle :size="16" class="check-icon red" /> Reasignación de tickets activos y tareas pendientes en NEXORA Match</li>
            <li><CheckCircle :size="16" class="check-icon red" /> Revocación inmediata de credenciales en Supabase y correo empresarial</li>
            <li><CheckCircle :size="16" class="check-icon red" /> Devolución y revisión técnica de equipamiento físico e inventario</li>
            <li><CheckCircle :size="16" class="check-icon red" /> Firma de constancia de finiquito y entrega formal de responsabilidades</li>
          </ul>
        </div>
      </div>
    </div>

    <BaseModal v-model="isLeaveModalOpen" title="Solicitud de Permiso / Ausencia Laboral">
      <form @submit.prevent="handleCreateLeave" class="modal-form">
        <div class="form-group">
          <label class="form-label">Colaborador solicitante *</label>
          <select v-model="selectedEmpId" class="form-select" required>
            <option v-for="emp in employees" :key="emp.id" :value="emp.id">
              {{ emp.full_name }} ({{ emp.department_name }})
            </option>
          </select>
        </div>

        <div class="form-group">
          <label class="form-label">Tipo de permiso</label>
          <select v-model="leaveType" class="form-select">
            <option value="vacation">Vacaciones programadas</option>
            <option value="medical">Incapacidad médica</option>
            <option value="personal">Asunto personal / justificado</option>
          </select>
        </div>

        <div class="form-row-2">
          <div class="form-group">
            <label class="form-label">Fecha de inicio *</label>
            <input v-model="leaveStartDate" type="date" class="form-input" required />
          </div>
          <div class="form-group">
            <label class="form-label">Fecha de reincorporación *</label>
            <input v-model="leaveEndDate" type="date" class="form-input" required />
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">Justificación o motivo</label>
          <textarea v-model="leaveReason" rows="2" class="form-textarea" placeholder="Detalla el motivo de la solicitud..."></textarea>
        </div>

        <div class="modal-btn-row">
          <button type="button" class="btn-cancel" @click="isLeaveModalOpen = false">Cancelar</button>
          <button type="submit" class="btn-primary-action">Enviar solicitud</button>
        </div>
      </form>
    </BaseModal>

    <BaseModal v-model="isVacancyModalOpen" title="Publicar Nueva Vacante">
      <form @submit.prevent="handleCreateVacancy" class="modal-form">
        <div class="form-group">
          <label class="form-label">Título de la posición *</label>
          <input v-model="vacTitle" type="text" class="form-input" placeholder="Ej. Desarrollador Backend Senior" required />
        </div>

        <div class="form-row-2">
          <div class="form-group">
            <label class="form-label">Departamento</label>
            <select v-model="vacDeptId" class="form-select">
              <option value="dept-1">Departamento de Tecnología</option>
              <option value="dept-2">Departamento de Ciberseguridad</option>
              <option value="dept-4">Departamento de Recursos Humanos</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Número de plazas</label>
            <input v-model.number="vacOpenings" type="number" min="1" max="10" class="form-input" required />
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">Descripción del rol</label>
          <textarea v-model="vacDesc" rows="2" class="form-textarea" placeholder="Objetivo del puesto..."></textarea>
        </div>

        <div class="form-group">
          <label class="form-label">Requisitos (separados por coma)</label>
          <input v-model="vacReqs" type="text" class="form-input" placeholder="3+ años exp, PostgreSQL, TypeScript" />
        </div>

        <div class="modal-btn-row">
          <button type="button" class="btn-cancel" @click="isVacancyModalOpen = false">Cancelar</button>
          <button type="submit" class="btn-primary-action">Publicar vacante</button>
        </div>
      </form>
    </BaseModal>
  </div>
</template>

<style scoped>
.hr-portal-page {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 16px;
}

.page-title {
  font-size: 1.5rem;
  font-weight: 800;
  color: #17366C;
  margin: 0;
}

.page-subtitle {
  font-size: 0.82rem;
  color: #71809B;
  margin: 3px 0 0 0;
}

.btn-primary-action {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: #087BFA;
  color: #FFFFFF;
  border: none;
  border-radius: 8px;
  padding: 9px 18px;
  font-size: 0.85rem;
  font-weight: 700;
  cursor: pointer;
}

.btn-primary-action:hover {
  background: #0870E8;
}

.hr-tabs-bar {
  display: flex;
  gap: 8px;
  border-bottom: 2px solid #E3EAF6;
  overflow-x: auto;
}

.tab-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: transparent;
  border: none;
  padding: 10px 18px;
  font-size: 0.85rem;
  font-weight: 600;
  color: #71809B;
  border-radius: 8px 8px 0 0;
  cursor: pointer;
  white-space: nowrap;
}

.tab-btn.active {
  color: #087BFA;
  font-weight: 700;
  background: #FFFFFF;
  border-bottom: 3px solid #087BFA;
}

.table-card {
  background: #FFFFFF;
  border: 1px solid #E3EAF6;
  border-radius: 14px;
  overflow: hidden;
  box-shadow: 0 4px 14px rgba(8, 123, 250, 0.04);
}

.data-table {
  width: 100%;
  border-collapse: collapse;
}

.data-table th {
  padding: 12px 16px;
  font-size: 0.75rem;
  font-weight: 700;
  color: #71809B;
  background: #F8FAFD;
  border-bottom: 1px solid #E3EAF6;
}

.data-table td {
  padding: 12px 16px;
  border-bottom: 1px solid #E3EAF6;
  font-size: 0.84rem;
}

.emp-user-row {
  display: flex;
  align-items: center;
  gap: 10px;
}

.avatar-sm {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  object-fit: cover;
  object-position: center 20%;
}

.subtext {
  font-size: 0.72rem;
  color: #71809B;
  display: block;
}

.status-pill.active {
  background: #EBF8F2;
  color: #00BA88;
  font-size: 0.7rem;
  padding: 2px 8px;
  border-radius: 10px;
  font-weight: 700;
}

.leave-type-tag {
  font-size: 0.7rem;
  font-weight: 700;
  color: #8755E9;
  background: #F3E8FF;
  padding: 2px 6px;
  border-radius: 4px;
}

.status-chip {
  font-size: 0.72rem;
  font-weight: 700;
  padding: 3px 8px;
  border-radius: 6px;
}

.status-chip.approved { background: #EBF8F2; color: #00BA88; }
.status-chip.pending { background: #FFFBEB; color: #D97706; }
.status-chip.rejected { background: #FEF2F2; color: #EF4444; }

.row-actions {
  display: flex;
  gap: 6px;
  justify-content: flex-end;
}

.action-btn {
  width: 28px;
  height: 28px;
  border-radius: 6px;
  border: 1px solid #E3EAF6;
  background: #FFFFFF;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.action-btn.check { color: #00BA88; }
.action-btn.check:hover { background: #EBF8F2; border-color: #00BA88; }
.action-btn.reject { color: #EF4444; }
.action-btn.reject:hover { background: #FEF2F2; border-color: #EF4444; }

.approved-text {
  font-size: 0.75rem;
  color: #71809B;
}

.vacancies-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 16px;
}

.vacancy-card {
  background: #FFFFFF;
  border: 1px solid #E3EAF6;
  border-radius: 14px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  box-shadow: 0 4px 14px rgba(8, 123, 250, 0.04);
}

.vac-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.vac-dept {
  font-size: 0.75rem;
  font-weight: 600;
  color: #71809B;
}

.vac-status {
  font-size: 0.7rem;
  font-weight: 700;
  padding: 2px 6px;
  border-radius: 4px;
}

.vac-status.open { background: #EBF8F2; color: #00BA88; }
.vac-status.interviewing { background: #EDF5FF; color: #087BFA; }

.vac-title {
  font-size: 1.05rem;
  font-weight: 700;
  color: #17366C;
  margin: 0;
}

.vac-desc {
  font-size: 0.82rem;
  color: #556987;
  line-height: 1.45;
  margin: 0;
}

.vac-stats {
  display: flex;
  justify-content: space-between;
  background: #F8FAFD;
  padding: 8px 12px;
  border-radius: 8px;
  font-size: 0.76rem;
  color: #556987;
}

.req-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.req-chip {
  font-size: 0.72rem;
  background: #F1F5F9;
  color: #334155;
  padding: 2px 8px;
  border-radius: 6px;
}

.onboarding-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 20px;
}

.checklist-card {
  background: #FFFFFF;
  border: 1px solid #E3EAF6;
  border-radius: 14px;
  padding: 24px;
  box-shadow: 0 4px 14px rgba(8, 123, 250, 0.04);
}

.check-title {
  font-size: 1.1rem;
  font-weight: 800;
  color: #17366C;
  margin: 0 0 6px 0;
}

.check-subtitle {
  font-size: 0.8rem;
  color: #71809B;
  margin: 0 0 16px 0;
}

.task-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.task-list li {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  font-size: 0.85rem;
  color: #182B49;
  line-height: 1.4;
}

.check-icon {
  color: #00BA88;
  flex-shrink: 0;
  margin-top: 2px;
}

.check-icon.red {
  color: #EF4444;
}

.modal-form {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.form-row-2 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.form-label {
  font-size: 0.8rem;
  font-weight: 600;
  color: #182B49;
}

.form-input, .form-select, .form-textarea {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #E3EAF6;
  border-radius: 8px;
  font-size: 0.85rem;
  outline: none;
  box-sizing: border-box;
}

.modal-btn-row {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 8px;
}

.btn-cancel {
  background: #FFFFFF;
  border: 1px solid #D5E0F2;
  color: #475569;
  font-size: 0.85rem;
  font-weight: 600;
  padding: 8px 16px;
  border-radius: 8px;
  cursor: pointer;
}
</style>