<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import {
  Briefcase,
  Search,
  Plus,
  Edit2,
  Trash2,
  GraduationCap
} from 'lucide-vue-next'
import { orgService } from '@/shared/infrastructure/adapters/mock/mock.organization.service'
import type { Position, Department, ResponsibilityLevel } from '@/shared/types/organization.types'
import { useUiStore } from '@/shared/stores/ui.store'
import BaseModal from '@/shared/components/BaseModal.vue'

const uiStore = useUiStore()

const positions = ref<Position[]>([])
const departments = ref<Department[]>([])
const isLoading = ref(true)
const searchQuery = ref('')

const isModalOpen = ref(false)
const editingPosition = ref<Position | null>(null)

const formTitle = ref('')
const formDeptId = ref('')
const formHierarchy = ref<ResponsibilityLevel>('senior')
const formDescription = ref('')
const formResponsibilities = ref('')
const formRequiredSkills = ref('')
const formRequiredEducation = ref('')
const formSpecialties = ref('')

async function loadData() {
  isLoading.value = true
  try {
    const [p, d] = await Promise.all([
      orgService.getPositions(),
      orgService.getDepartments()
    ])
    positions.value = p
    departments.value = d
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  loadData()
})

const filteredPositions = computed(() => {
  if (!searchQuery.value) return positions.value
  const q = searchQuery.value.toLowerCase().trim()
  return positions.value.filter(p =>
    p.title.toLowerCase().includes(q) ||
    p.department_name?.toLowerCase().includes(q) ||
    p.required_education.toLowerCase().includes(q)
  )
})

function openCreateModal() {
  editingPosition.value = null
  formTitle.value = ''
  formDeptId.value = departments.value[0]?.id || ''
  formHierarchy.value = 'senior'
  formDescription.value = ''
  formResponsibilities.value = ''
  formRequiredSkills.value = ''
  formRequiredEducation.value = 'Licenciatura o Ingeniería'
  formSpecialties.value = ''
  isModalOpen.value = true
}

function openEditModal(pos: Position) {
  editingPosition.value = pos
  formTitle.value = pos.title
  formDeptId.value = pos.department_id
  formHierarchy.value = pos.hierarchy_level
  formDescription.value = pos.description
  formResponsibilities.value = pos.responsibilities.join(', ')
  formRequiredSkills.value = pos.required_skills.join(', ')
  formRequiredEducation.value = pos.required_education
  formSpecialties.value = pos.specialties.join(', ')
  isModalOpen.value = true
}

async function handleSavePosition() {
  if (!formTitle.value.trim() || !formDeptId.value) {
    uiStore.showToast('error', 'Validación', 'El título del puesto y departamento son requeridos.')
    return
  }

  const dept = departments.value.find(d => d.id === formDeptId.value)
  const respList = formResponsibilities.value.split(',').map(s => s.trim()).filter(Boolean)
  const skillList = formRequiredSkills.value.split(',').map(s => s.trim()).filter(Boolean)
  const specList = formSpecialties.value.split(',').map(s => s.trim()).filter(Boolean)

  try {
    if (editingPosition.value) {
      await orgService.updatePosition(editingPosition.value.id, {
        title: formTitle.value.trim(),
        department_id: formDeptId.value,
        department_name: dept?.name,
        hierarchy_level: formHierarchy.value,
        description: formDescription.value.trim(),
        responsibilities: respList,
        required_skills: skillList,
        required_education: formRequiredEducation.value.trim(),
        specialties: specList
      })
      uiStore.showToast('success', 'Puesto actualizado', 'La descripción del cargo fue modificada exitosamente.')
    } else {
      await orgService.createPosition({
        title: formTitle.value.trim(),
        department_id: formDeptId.value,
        department_name: dept?.name,
        hierarchy_level: formHierarchy.value,
        description: formDescription.value.trim(),
        responsibilities: respList,
        required_skills: skillList,
        required_education: formRequiredEducation.value.trim(),
        specialties: specList,
        supervisor_position_id: null,
        is_active: true
      })
      uiStore.showToast('success', 'Puesto registrado', 'El cargo profesional fue añadido al catálogo.')
    }
    isModalOpen.value = false
    await loadData()
  } catch (err: unknown) {
    uiStore.showToast('error', 'Error al guardar', err instanceof Error ? err.message : 'Error al guardar el puesto')
  }
}

async function handleDeletePosition(pos: Position) {
  const ok = await uiStore.confirm({
    title: `Eliminar Puesto: ${pos.title}`,
    message: `¿Estás seguro de eliminar el puesto ${pos.title}?`,
    consequence: 'No debe haber colaboradores asignados a este puesto en nómina.',
    confirmText: 'Confirmar eliminación',
    isDanger: true
  })

  if (ok) {
    try {
      await orgService.deletePosition(pos.id)
      uiStore.showToast('success', 'Puesto eliminado', 'El cargo profesional fue retirado del catálogo.')
      await loadData()
    } catch (err: unknown) {
      uiStore.showToast('error', 'Acción bloqueada', err instanceof Error ? err.message : 'Error al eliminar')
    }
  }
}
</script>

<template>
  <div class="positions-page">
    <div class="page-header">
      <div>
        <h1 class="page-title">Catálogo de Puestos y Cargos</h1>
        <p class="page-subtitle">Define las responsabilidades, perfiles, niveles de mando y requisitos profesionales.</p>
      </div>

      <button type="button" class="btn-primary-action" @click="openCreateModal">
        <Plus :size="16" />
        <span>Crear Nuevo Puesto</span>
      </button>
    </div>

    <div class="search-card">
      <div class="search-wrap">
        <Search :size="18" class="search-icon" />
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Buscar por título de cargo, departamento o formación..."
          class="search-input"
        />
      </div>
    </div>

    <div class="positions-grid">
      <div
        v-for="pos in filteredPositions"
        :key="pos.id"
        class="pos-card"
      >
        <div class="pos-top">
          <div class="pos-badge-title">
            <span :class="['level-tag', pos.hierarchy_level]">{{ pos.hierarchy_level.toUpperCase() }}</span>
            <h3 class="pos-name">{{ pos.title }}</h3>
          </div>
          <div class="row-actions">
            <button class="action-btn edit" @click="openEditModal(pos)" title="Editar puesto">
              <Edit2 :size="15" />
            </button>
            <button class="action-btn delete" @click="handleDeletePosition(pos)" title="Eliminar puesto">
              <Trash2 :size="15" />
            </button>
          </div>
        </div>

        <span class="dept-link">{{ pos.department_name }}</span>
        <p class="pos-desc">{{ pos.description }}</p>

        <div class="pos-meta-box">
          <div class="meta-line">
            <GraduationCap :size="14" class="meta-icon" />
            <span>Formación: <strong>{{ pos.required_education }}</strong></span>
          </div>
          <div class="meta-line">
            <Briefcase :size="14" class="meta-icon" />
            <span>Ocupación actual: <strong>{{ pos.employee_count || 0 }} colaboradores</strong></span>
          </div>
        </div>

        <div class="skills-block">
          <span class="skills-label">Habilidades requeridas:</span>
          <div class="skills-chips">
            <span v-for="s in pos.required_skills" :key="s" class="skill-chip">{{ s }}</span>
          </div>
        </div>
      </div>
    </div>

    <BaseModal
      v-model="isModalOpen"
      :title="editingPosition ? 'Editar Puesto Laboral' : 'Nuevo Puesto Laboral'"
    >
      <form @submit.prevent="handleSavePosition" class="pos-form">
        <div class="form-row-2">
          <div class="form-group">
            <label class="form-label">Título del puesto *</label>
            <input v-model="formTitle" type="text" class="form-input" placeholder="Ej. Ingeniero en Ciberseguridad Senior" required />
          </div>
          <div class="form-group">
            <label class="form-label">Departamento *</label>
            <select v-model="formDeptId" class="form-select" required>
              <option v-for="d in departments" :key="d.id" :value="d.id">
                {{ d.name }}
              </option>
            </select>
          </div>
        </div>

        <div class="form-row-2">
          <div class="form-group">
            <label class="form-label">Nivel jerárquico</label>
            <select v-model="formHierarchy" class="form-select">
              <option value="junior">Junior</option>
              <option value="mid">Mid-level</option>
              <option value="senior">Senior</option>
              <option value="lead">Lead / Coordinador</option>
              <option value="manager">Manager / Gerente</option>
              <option value="director">Director</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Formación académica mínima</label>
            <input v-model="formRequiredEducation" type="text" class="form-input" placeholder="Ej. Licenciatura o Ingeniería" />
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">Descripción del puesto</label>
          <textarea v-model="formDescription" rows="2" class="form-textarea" placeholder="Propósito principal de la posición..."></textarea>
        </div>

        <div class="form-group">
          <label class="form-label">Responsabilidades clave (separadas por coma)</label>
          <input v-model="formResponsibilities" type="text" class="form-input" placeholder="Supervisar red, Resolver incidencias, Realizar auditorías" />
        </div>

        <div class="form-group">
          <label class="form-label">Habilidades y competencias (separadas por coma)</label>
          <input v-model="formRequiredSkills" type="text" class="form-input" placeholder="Linux, Firewalls, Wireshark, OWASP" />
        </div>

        <div class="form-group">
          <label class="form-label">Especialidades relacionadas (separadas por coma)</label>
          <input v-model="formSpecialties" type="text" class="form-input" placeholder="Seguridad Ofensiva, Redes LAN/WAN" />
        </div>

        <div class="modal-btn-row">
          <button type="button" class="btn-cancel" @click="isModalOpen = false">Cancelar</button>
          <button type="submit" class="btn-primary-action">Guardar puesto</button>
        </div>
      </form>
    </BaseModal>
  </div>
</template>

<style scoped>
.positions-page {
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

.search-card {
  background: #FFFFFF;
  border: 1px solid #E3EAF6;
  border-radius: 12px;
  padding: 12px 16px;
}

.search-wrap {
  position: relative;
  display: flex;
  align-items: center;
}

.search-icon {
  position: absolute;
  left: 12px;
  color: #71809B;
}

.search-input {
  width: 100%;
  padding: 8px 12px 8px 38px;
  border: 1px solid #E3EAF6;
  border-radius: 8px;
  font-size: 0.85rem;
  outline: none;
}

.search-input:focus {
  border-color: #087BFA;
}

.positions-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 16px;
}

.pos-card {
  background: #FFFFFF;
  border: 1px solid #E3EAF6;
  border-radius: 14px;
  padding: 18px;
  box-shadow: 0 4px 14px rgba(8, 123, 250, 0.04);
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.pos-top {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.pos-badge-title {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.level-tag {
  font-size: 0.68rem;
  font-weight: 800;
  padding: 2px 6px;
  border-radius: 4px;
  align-self: flex-start;
}

.level-tag.junior { background: #EDF5FF; color: #087BFA; }
.level-tag.mid { background: #EBF8F2; color: #00BA88; }
.level-tag.senior { background: #F3E8FF; color: #8755E9; }
.level-tag.lead { background: #FFFBEB; color: #D97706; }
.level-tag.manager { background: #FEE2E2; color: #DC2626; }
.level-tag.director { background: #17366C; color: #FFFFFF; }

.pos-name {
  font-size: 1.05rem;
  font-weight: 700;
  color: #17366C;
  margin: 0;
}

.dept-link {
  font-size: 0.74rem;
  font-weight: 600;
  color: #087BFA;
}

.pos-desc {
  font-size: 0.82rem;
  color: #556987;
  line-height: 1.45;
  margin: 0;
}

.pos-meta-box {
  background: #F8FAFD;
  border-radius: 8px;
  padding: 8px 12px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.meta-line {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.76rem;
  color: #556987;
}

.meta-icon {
  color: #087BFA;
}

.skills-block {
  margin-top: 4px;
}

.skills-label {
  font-size: 0.7rem;
  font-weight: 700;
  color: #71809B;
  display: block;
  margin-bottom: 4px;
}

.skills-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
}

.skill-chip {
  font-size: 0.7rem;
  background: #EDF5FF;
  color: #087BFA;
  padding: 2px 7px;
  border-radius: 4px;
  font-weight: 600;
}

.row-actions {
  display: flex;
  gap: 6px;
}

.action-btn {
  width: 30px;
  height: 30px;
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

.pos-form {
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