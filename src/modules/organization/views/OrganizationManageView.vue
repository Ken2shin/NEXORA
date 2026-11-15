<script setup lang="ts">
import { ref, onMounted } from 'vue'
import {
  Building2,
  Layers,
  Plus,
  Edit2,
  Trash2,
  UserCheck,
  Network
} from 'lucide-vue-next'
import { orgService } from '@/shared/infrastructure/adapters/mock/mock.organization.service'
import type { Department, WorkGroup, Employee } from '@/shared/types/organization.types'
import { useUiStore } from '@/shared/stores/ui.store'
import BaseModal from '@/shared/components/BaseModal.vue'
import OrgChartView from '../components/OrgChartView.vue'

const uiStore = useUiStore()

const activeTab = ref<'departments' | 'groups' | 'chart'>('departments')
const departments = ref<Department[]>([])
const groups = ref<WorkGroup[]>([])
const employees = ref<Employee[]>([])
const isLoading = ref(true)

const isDeptModalOpen = ref(false)
const editingDept = ref<Department | null>(null)
const deptName = ref('')
const deptCode = ref('')
const deptDesc = ref('')
const deptObjectives = ref('')
const deptFunctions = ref('')
const deptManagerId = ref('')

const isGroupModalOpen = ref(false)
const editingGroup = ref<WorkGroup | null>(null)
const groupDeptId = ref('')
const groupName = ref('')
const groupCode = ref('')
const groupObjective = ref('')
const groupLeaderId = ref('')
const groupCapacity = ref(10)
const groupSpecialties = ref('')
const groupServices = ref('')

async function loadData() {
  isLoading.value = true
  try {
    const [d, g, e] = await Promise.all([
      orgService.getDepartments(),
      orgService.getGroups(),
      orgService.getEmployees()
    ])
    departments.value = d
    groups.value = g
    employees.value = e
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  loadData()
})

function openCreateDeptModal() {
  editingDept.value = null
  deptName.value = ''
  deptCode.value = ''
  deptDesc.value = ''
  deptObjectives.value = ''
  deptFunctions.value = ''
  deptManagerId.value = ''
  isDeptModalOpen.value = true
}

function openEditDeptModal(dept: Department) {
  editingDept.value = dept
  deptName.value = dept.name
  deptCode.value = dept.code
  deptDesc.value = dept.description
  deptObjectives.value = dept.objectives
  deptFunctions.value = dept.functions.join(', ')
  deptManagerId.value = dept.manager_id || ''
  isDeptModalOpen.value = true
}

async function handleSaveDept() {
  if (!deptName.value.trim() || !deptCode.value.trim()) {
    uiStore.showToast('error', 'Validación', 'El nombre y código de departamento son obligatorios.')
    return
  }

  const manager = employees.value.find(e => e.id === deptManagerId.value)
  const fnList = deptFunctions.value.split(',').map(s => s.trim()).filter(Boolean)

  try {
    if (editingDept.value) {
      await orgService.updateDepartment(editingDept.value.id, {
        name: deptName.value.trim(),
        code: deptCode.value.trim(),
        description: deptDesc.value.trim(),
        objectives: deptObjectives.value.trim(),
        functions: fnList,
        manager_id: deptManagerId.value || null,
        manager_name: manager?.full_name
      })
      uiStore.showToast('success', 'Departamento actualizado', 'Los cambios se guardaron correctamente.')
    } else {
      await orgService.createDepartment({
        name: deptName.value.trim(),
        code: deptCode.value.trim(),
        description: deptDesc.value.trim(),
        objectives: deptObjectives.value.trim(),
        functions: fnList,
        manager_id: deptManagerId.value || null,
        manager_name: manager?.full_name,
        is_active: true
      })
      uiStore.showToast('success', 'Departamento creado', 'El departamento fue incorporado a la estructura organizacional.')
    }
    isDeptModalOpen.value = false
    await loadData()
  } catch (err: unknown) {
    uiStore.showToast('error', 'Error al guardar', err instanceof Error ? err.message : 'No se pudo guardar el departamento')
  }
}

async function handleDeleteDept(dept: Department) {
  const otherDepts = departments.value.filter(d => d.id !== dept.id)
  const fallbackDeptId = otherDepts[0]?.id

  const ok = await uiStore.confirm({
    title: `Eliminar Departamento: ${dept.name}`,
    message: `¿Estás seguro de eliminar el departamento ${dept.name} (${dept.code})?`,
    consequence: otherDepts.length > 0
      ? `Las dependencias activas (grupos y colaboradores) serán reasignadas automáticamente al departamento "${otherDepts[0]?.name}".`
      : 'No existen otros departamentos disponibles para reasignar colaboradores.',
    confirmText: 'Confirmar eliminación',
    isDanger: true
  })

  if (ok) {
    try {
      await orgService.deleteDepartment(dept.id, fallbackDeptId)
      uiStore.showToast('success', 'Departamento eliminado', 'El departamento y sus dependencias fueron actualizados.')
      await loadData()
    } catch (err: unknown) {
      uiStore.showToast('error', 'Acción bloqueada', err instanceof Error ? err.message : 'Error al eliminar')
    }
  }
}

function openCreateGroupModal() {
  editingGroup.value = null
  groupDeptId.value = departments.value[0]?.id || ''
  groupName.value = ''
  groupCode.value = ''
  groupObjective.value = ''
  groupLeaderId.value = ''
  groupCapacity.value = 10
  groupSpecialties.value = ''
  groupServices.value = ''
  isGroupModalOpen.value = true
}

function openEditGroupModal(grp: WorkGroup) {
  editingGroup.value = grp
  groupDeptId.value = grp.department_id
  groupName.value = grp.name
  groupCode.value = grp.code
  groupObjective.value = grp.objective
  groupLeaderId.value = grp.leader_id || ''
  groupCapacity.value = grp.max_capacity
  groupSpecialties.value = grp.specialties.join(', ')
  groupServices.value = grp.services_assigned.join(', ')
  isGroupModalOpen.value = true
}

async function handleSaveGroup() {
  if (!groupName.value.trim() || !groupCode.value.trim() || !groupDeptId.value) {
    uiStore.showToast('error', 'Validación', 'Por favor completa el nombre, código y departamento del grupo.')
    return
  }

  const dept = departments.value.find(d => d.id === groupDeptId.value)
  const leader = employees.value.find(e => e.id === groupLeaderId.value)
  const specList = groupSpecialties.value.split(',').map(s => s.trim()).filter(Boolean)
  const srvList = groupServices.value.split(',').map(s => s.trim()).filter(Boolean)

  try {
    if (editingGroup.value) {
      await orgService.updateGroup(editingGroup.value.id, {
        department_id: groupDeptId.value,
        department_name: dept?.name,
        name: groupName.value.trim(),
        code: groupCode.value.trim(),
        objective: groupObjective.value.trim(),
        leader_id: groupLeaderId.value || null,
        leader_name: leader?.full_name,
        max_capacity: Number(groupCapacity.value) || 10,
        specialties: specList,
        services_assigned: srvList
      })
      uiStore.showToast('success', 'Grupo actualizado', 'Los datos del equipo fueron actualizados.')
    } else {
      await orgService.createGroup({
        department_id: groupDeptId.value,
        department_name: dept?.name,
        name: groupName.value.trim(),
        code: groupCode.value.trim(),
        objective: groupObjective.value.trim(),
        leader_id: groupLeaderId.value || null,
        leader_name: leader?.full_name,
        max_capacity: Number(groupCapacity.value) || 10,
        specialties: specList,
        services_assigned: srvList,
        is_active: true
      })
      uiStore.showToast('success', 'Grupo creado', 'El grupo operativo fue incorporado satisfactoriamente.')
    }
    isGroupModalOpen.value = false
    await loadData()
  } catch (err: unknown) {
    uiStore.showToast('error', 'Error al guardar', err instanceof Error ? err.message : 'Error al guardar el grupo')
  }
}

async function handleDeleteGroup(grp: WorkGroup) {
  const otherGroups = groups.value.filter(g => g.id !== grp.id && g.department_id === grp.department_id)
  const fallbackGrpId = otherGroups[0]?.id

  const ok = await uiStore.confirm({
    title: `Eliminar Grupo: ${grp.name}`,
    message: `¿Estás seguro de disolver el equipo ${grp.name} (${grp.code})?`,
    consequence: fallbackGrpId
      ? `Los integrantes serán reasignados al grupo "${otherGroups[0]?.name}".`
      : 'Debes asegurar la reasignación de colaboradores activos.',
    confirmText: 'Disolver grupo',
    isDanger: true
  })

  if (ok) {
    try {
      await orgService.deleteGroup(grp.id, fallbackGrpId)
      uiStore.showToast('success', 'Grupo eliminado', 'El grupo operativo fue retirado.')
      await loadData()
    } catch (err: unknown) {
      uiStore.showToast('error', 'Acción bloqueada', err instanceof Error ? err.message : 'Error al eliminar')
    }
  }
}
</script>

<template>
  <div class="org-page">
    <div class="page-header">
      <div class="header-titles">
        <h1 class="page-title">Estructura Organizacional</h1>
        <p class="page-subtitle">Configura los departamentos, grupos de trabajo y jerarquías operativas de NEXORA.</p>
      </div>

      <div class="header-actions">
        <button
          v-if="activeTab === 'departments'"
          type="button"
          class="btn-primary-action"
          @click="openCreateDeptModal"
        >
          <Plus :size="16" />
          <span>Nuevo Departamento</span>
        </button>
        <button
          v-else-if="activeTab === 'groups'"
          type="button"
          class="btn-primary-action"
          @click="openCreateGroupModal"
        >
          <Plus :size="16" />
          <span>Nuevo Grupo de Trabajo</span>
        </button>
      </div>
    </div>

    <div class="tabs-nav-bar">
      <button
        :class="['nav-tab-btn', { active: activeTab === 'departments' }]"
        @click="activeTab = 'departments'"
      >
        <Building2 :size="16" />
        <span>Departamentos ({{ departments.length }})</span>
      </button>

      <button
        :class="['nav-tab-btn', { active: activeTab === 'groups' }]"
        @click="activeTab = 'groups'"
      >
        <Layers :size="16" />
        <span>Grupos de Trabajo ({{ groups.length }})</span>
      </button>

      <button
        :class="['nav-tab-btn', { active: activeTab === 'chart' }]"
        @click="activeTab = 'chart'"
      >
        <Network :size="16" />
        <span>Organigrama Interactivo</span>
      </button>
    </div>

    <div v-if="activeTab === 'departments'" class="tab-content">
      <div class="departments-grid">
        <div
          v-for="dept in departments"
          :key="dept.id"
          class="dept-item-card"
        >
          <div class="dept-top">
            <div class="dept-badge-title">
              <span class="code-pill">{{ dept.code }}</span>
              <h3 class="dept-card-title">{{ dept.name }}</h3>
            </div>
            <div class="row-actions">
              <button class="action-btn edit" @click="openEditDeptModal(dept)" title="Editar departamento">
                <Edit2 :size="15" />
              </button>
              <button class="action-btn delete" @click="handleDeleteDept(dept)" title="Eliminar departamento">
                <Trash2 :size="15" />
              </button>
            </div>
          </div>

          <p class="dept-desc-text">{{ dept.description }}</p>

          <div class="dept-info-row">
            <div class="info-item">
              <span class="info-lbl">Responsable directivo</span>
              <span class="info-val">{{ dept.manager_name || 'Sin asignar' }}</span>
            </div>
            <div class="info-item">
              <span class="info-lbl">Grupos de trabajo</span>
              <span class="info-val">{{ dept.group_count || 0 }} equipos</span>
            </div>
            <div class="info-item">
              <span class="info-lbl">Colaboradores</span>
              <span class="info-val">{{ dept.employee_count || 0 }} activos</span>
            </div>
          </div>

          <div class="dept-functions-row">
            <span class="fn-lbl">Funciones clave:</span>
            <div class="fn-chips">
              <span v-for="f in dept.functions" :key="f" class="fn-chip">{{ f }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-else-if="activeTab === 'groups'" class="tab-content">
      <div class="groups-grid">
        <div
          v-for="grp in groups"
          :key="grp.id"
          class="group-item-card"
        >
          <div class="group-top">
            <div>
              <span class="parent-dept-tag">{{ grp.department_name }}</span>
              <div class="grp-title-wrap">
                <span class="grp-code-pill">{{ grp.code }}</span>
                <h3 class="grp-card-title">{{ grp.name }}</h3>
              </div>
            </div>
            <div class="row-actions">
              <button class="action-btn edit" @click="openEditGroupModal(grp)" title="Editar grupo">
                <Edit2 :size="15" />
              </button>
              <button class="action-btn delete" @click="handleDeleteGroup(grp)" title="Eliminar grupo">
                <Trash2 :size="15" />
              </button>
            </div>
          </div>

          <p class="grp-objective">{{ grp.objective }}</p>

          <div class="grp-capacity-box">
            <div class="cap-header">
              <span>Capacidad operativa (Límite: {{ grp.max_capacity }})</span>
              <span class="cap-num">{{ grp.member_count }} integrantes</span>
            </div>
            <div class="cap-bar-track">
              <div
                class="cap-bar-fill"
                :style="{ width: `${Math.min(100, (grp.member_count / grp.max_capacity) * 100)}%` }"
              ></div>
            </div>
          </div>

          <div class="grp-footer-info">
            <div class="leader-info">
              <UserCheck :size="14" class="leader-icon" />
              <span>Líder: <strong>{{ grp.leader_name || 'Vacante' }}</strong></span>
            </div>
            <div v-if="grp.services_assigned.length > 0" class="srv-assigned-info">
              <span>Servicios: {{ grp.services_assigned.join(', ') }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-else-if="activeTab === 'chart'" class="tab-content">
      <OrgChartView />
    </div>

    <BaseModal
      v-model="isDeptModalOpen"
      :title="editingDept ? 'Editar Departamento' : 'Nuevo Departamento'"
    >
      <form @submit.prevent="handleSaveDept" class="modal-form">
        <div class="form-row-2">
          <div class="form-group">
            <label class="form-label">Nombre del departamento *</label>
            <input v-model="deptName" type="text" class="form-input" placeholder="Ej. Departamento de Ciberseguridad" required />
          </div>
          <div class="form-group">
            <label class="form-label">Código interno *</label>
            <input v-model="deptCode" type="text" class="form-input" placeholder="Ej. DEP-SEC" required />
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">Responsable directivo</label>
          <select v-model="deptManagerId" class="form-select">
            <option value="">Seleccionar responsable...</option>
            <option v-for="emp in employees" :key="emp.id" :value="emp.id">
              {{ emp.full_name }} ({{ emp.position_title }})
            </option>
          </select>
        </div>

        <div class="form-group">
          <label class="form-label">Descripción</label>
          <textarea v-model="deptDesc" rows="2" class="form-textarea" placeholder="Alcance y responsabilidades del departamento..."></textarea>
        </div>

        <div class="form-group">
          <label class="form-label">Objetivos estratégicos</label>
          <textarea v-model="deptObjectives" rows="2" class="form-textarea" placeholder="Objetivos clave del departamento..."></textarea>
        </div>

        <div class="form-group">
          <label class="form-label">Funciones (separadas por coma)</label>
          <input v-model="deptFunctions" type="text" class="form-input" placeholder="Análisis, Auditoría, Respuesta a incidentes" />
        </div>

        <div class="modal-btn-row">
          <button type="button" class="btn-cancel" @click="isDeptModalOpen = false">Cancelar</button>
          <button type="submit" class="btn-primary-action">Guardar departamento</button>
        </div>
      </form>
    </BaseModal>

    <BaseModal
      v-model="isGroupModalOpen"
      :title="editingGroup ? 'Editar Grupo de Trabajo' : 'Nuevo Grupo de Trabajo'"
    >
      <form @submit.prevent="handleSaveGroup" class="modal-form">
        <div class="form-group">
          <label class="form-label">Departamento al que pertenece *</label>
          <select v-model="groupDeptId" class="form-select" required>
            <option v-for="d in departments" :key="d.id" :value="d.id">
              {{ d.name }} ({{ d.code }})
            </option>
          </select>
        </div>

        <div class="form-row-2">
          <div class="form-group">
            <label class="form-label">Nombre del grupo *</label>
            <input v-model="groupName" type="text" class="form-input" placeholder="Ej. Desarrollo Frontend" required />
          </div>
          <div class="form-group">
            <label class="form-label">Código del grupo *</label>
            <input v-model="groupCode" type="text" class="form-input" placeholder="Ej. GRP-FE" required />
          </div>
        </div>

        <div class="form-row-2">
          <div class="form-group">
            <label class="form-label">Líder del equipo</label>
            <select v-model="groupLeaderId" class="form-select">
              <option value="">Vacante de líder</option>
              <option v-for="emp in employees" :key="emp.id" :value="emp.id">
                {{ emp.full_name }} ({{ emp.profession }})
              </option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Capacidad máxima (Integrantes)</label>
            <input v-model.number="groupCapacity" type="number" min="1" max="50" class="form-input" required />
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">Objetivo operativo del equipo</label>
          <textarea v-model="groupObjective" rows="2" class="form-textarea" placeholder="Objetivo del equipo de trabajo..."></textarea>
        </div>

        <div class="form-group">
          <label class="form-label">Especialidades (separadas por coma)</label>
          <input v-model="groupSpecialties" type="text" class="form-input" placeholder="Vue 3, TypeScript, UI/UX" />
        </div>

        <div class="form-group">
          <label class="form-label">Servicios asignados que atiende (separados por coma)</label>
          <input v-model="groupServices" type="text" class="form-input" placeholder="Diseño Web, Mantenimiento" />
        </div>

        <div class="modal-btn-row">
          <button type="button" class="btn-cancel" @click="isGroupModalOpen = false">Cancelar</button>
          <button type="submit" class="btn-primary-action">Guardar grupo</button>
        </div>
      </form>
    </BaseModal>
  </div>
</template>

<style scoped>
.org-page {
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
  transition: all 0.2s;
  box-shadow: 0 4px 12px rgba(8, 123, 250, 0.25);
}

.btn-primary-action:hover {
  background: #0870E8;
  transform: translateY(-1px);
}

.tabs-nav-bar {
  display: flex;
  gap: 8px;
  border-bottom: 2px solid #E3EAF6;
  padding-bottom: 2px;
}

.nav-tab-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: transparent;
  border: none;
  padding: 10px 18px;
  font-size: 0.88rem;
  font-weight: 600;
  color: #71809B;
  border-radius: 8px 8px 0 0;
  cursor: pointer;
  transition: all 0.2s;
}

.nav-tab-btn:hover {
  color: #087BFA;
  background: #F4F8FE;
}

.nav-tab-btn.active {
  color: #087BFA;
  font-weight: 700;
  background: #FFFFFF;
  border-bottom: 3px solid #087BFA;
}

.departments-grid, .groups-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(340px, 1fr));
  gap: 16px;
}

.dept-item-card, .group-item-card {
  background: #FFFFFF;
  border: 1px solid #E3EAF6;
  border-radius: 14px;
  padding: 20px;
  box-shadow: 0 4px 14px rgba(8, 123, 250, 0.04);
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.dept-top, .group-top {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.dept-badge-title, .grp-title-wrap {
  display: flex;
  align-items: center;
  gap: 8px;
}

.code-pill, .grp-code-pill {
  font-size: 0.72rem;
  font-weight: 700;
  color: #087BFA;
  background: #EDF5FF;
  padding: 2px 8px;
  border-radius: 6px;
}

.parent-dept-tag {
  font-size: 0.72rem;
  font-weight: 600;
  color: #71809B;
  display: block;
  margin-bottom: 4px;
}

.dept-card-title, .grp-card-title {
  font-size: 1.02rem;
  font-weight: 700;
  color: #17366C;
  margin: 0;
}

.dept-desc-text, .grp-objective {
  font-size: 0.82rem;
  color: #556987;
  line-height: 1.45;
  margin: 0;
}

.dept-info-row {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  background: #F8FAFD;
  border-radius: 10px;
  padding: 10px;
}

.info-item {
  display: flex;
  flex-direction: column;
}

.info-lbl {
  font-size: 0.68rem;
  color: #71809B;
  font-weight: 600;
}

.info-val {
  font-size: 0.8rem;
  font-weight: 700;
  color: #182B49;
}

.dept-functions-row {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.fn-lbl {
  font-size: 0.72rem;
  font-weight: 700;
  color: #71809B;
}

.fn-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.fn-chip {
  font-size: 0.72rem;
  background: #EDF5FF;
  color: #087BFA;
  padding: 2px 8px;
  border-radius: 6px;
  font-weight: 600;
}

.grp-capacity-box {
  background: #F8FAFD;
  border: 1px solid #E3EAF6;
  border-radius: 10px;
  padding: 10px 12px;
}

.cap-header {
  display: flex;
  justify-content: space-between;
  font-size: 0.75rem;
  color: #71809B;
  font-weight: 600;
  margin-bottom: 6px;
}

.cap-num {
  color: #087BFA;
  font-weight: 700;
}

.cap-bar-track {
  height: 6px;
  background: #E2E8F0;
  border-radius: 3px;
  overflow: hidden;
}

.cap-bar-fill {
  height: 100%;
  background: linear-gradient(90deg, #087BFA, #00BA88);
  border-radius: 3px;
}

.grp-footer-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.78rem;
  color: #556987;
  padding-top: 8px;
  border-top: 1px solid #E9EFF9;
}

.leader-info {
  display: flex;
  align-items: center;
  gap: 6px;
}

.leader-icon {
  color: #00BA88;
}

.row-actions {
  display: flex;
  gap: 6px;
}

.action-btn {
  width: 32px;
  height: 32px;
  border-radius: 6px;
  border: 1px solid #E3EAF6;
  background: #FFFFFF;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.15s;
}

.action-btn.edit { color: #087BFA; }
.action-btn.edit:hover { background: #EDF5FF; border-color: #087BFA; }
.action-btn.delete { color: #EF4444; }
.action-btn.delete:hover { background: #FEF2F2; border-color: #EF4444; }

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

.form-input:focus, .form-select:focus, .form-textarea:focus {
  border-color: #087BFA;
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