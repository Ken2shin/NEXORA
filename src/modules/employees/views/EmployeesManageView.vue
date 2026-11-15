<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  Eye,
  EyeOff,
  CheckCircle,
  XCircle,
  Camera,
  Filter,
  Key,
  Copy,
  ShieldCheck
} from 'lucide-vue-next'
import { orgService } from '@/shared/infrastructure/adapters/mock/mock.organization.service'
import type { Employee, Department, WorkGroup, Position, EmploymentStatus, ResponsibilityLevel, TemporaryCredential } from '@/shared/types/organization.types'
import { useUiStore } from '@/shared/stores/ui.store'
import BaseModal from '@/shared/components/BaseModal.vue'
import { formatDate } from '@/shared/utils/formatters'

const uiStore = useUiStore()

const employees = ref<Employee[]>([])
const departments = ref<Department[]>([])
const groups = ref<WorkGroup[]>([])
const positions = ref<Position[]>([])
const isLoading = ref(true)

const searchQuery = ref('')
const selectedDeptFilter = ref('all')
const selectedStatusFilter = ref('all')

const isFormModalOpen = ref(false)
const isDetailModalOpen = ref(false)
const isCredentialModalOpen = ref(false)
const currentCredential = ref<TemporaryCredential | null>(null)
const isPasswordVisible = ref(false)
const selectedEmpForDetail = ref<Employee | null>(null)
const editingEmployee = ref<Employee | null>(null)

const formPassword = ref('')
const showFormPassword = ref(false)

const formFullName = ref('')
const formInternalId = ref('')
const formEmail = ref('')
const formPhone = ref('')
const formAddress = ref('')
const formAvatarUrl = ref('/images/illustrations/hero-character.jpg')
const formHireDate = ref<string>(new Date().toISOString().split('T')[0] ?? '')
const formStatus = ref<EmploymentStatus>('active')
const formDeptId = ref('')
const formGroupId = ref('')
const formPositionId = ref('')
const formProfession = ref('')
const formCareer = ref('')
const formSpecialties = ref('')
const formSkills = ref('')
const formYearsExp = ref(3)
const formResponsibility = ref<ResponsibilityLevel>('senior')
const formSupervisorId = ref('')
const formPermissions = ref('standard')

async function loadData() {
  isLoading.value = true
  try {
    const [e, d, g, p] = await Promise.all([
      orgService.getEmployees(),
      orgService.getDepartments(),
      orgService.getGroups(),
      orgService.getPositions()
    ])
    employees.value = e
    departments.value = d
    groups.value = g
    positions.value = p
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  loadData()
})

const filteredGroupsForSelectedDept = computed(() => {
  if (!formDeptId.value) return []
  return groups.value.filter(g => g.department_id === formDeptId.value)
})

const filteredEmployees = computed(() => {
  return employees.value.filter(e => {
    if (selectedDeptFilter.value !== 'all' && e.department_id !== selectedDeptFilter.value) {
      return false
    }
    if (selectedStatusFilter.value !== 'all' && e.status !== selectedStatusFilter.value) {
      return false
    }
    if (searchQuery.value) {
      const q = searchQuery.value.toLowerCase().trim()
      return (
        e.full_name.toLowerCase().includes(q) ||
        e.email.toLowerCase().includes(q) ||
        e.internal_id.toLowerCase().includes(q) ||
        e.profession.toLowerCase().includes(q) ||
        (e.position_title && e.position_title.toLowerCase().includes(q))
      )
    }
    return true
  })
})

function openCreateModal() {
  editingEmployee.value = null
  formPassword.value = ''
  showFormPassword.value = false
  formFullName.value = ''
  formInternalId.value = `EMP-${100 + employees.value.length + 1}`
  formEmail.value = ''
  formPhone.value = ''
  formAddress.value = ''
  formAvatarUrl.value = '/images/illustrations/hero-character.jpg'
  formHireDate.value = new Date().toISOString().split('T')[0] ?? ''
  formStatus.value = 'active'
  formDeptId.value = departments.value[0]?.id || ''
  formGroupId.value = ''
  formPositionId.value = positions.value[0]?.id || ''
  formProfession.value = 'Ingeniero de Software'
  formCareer.value = 'Ingeniería en Computación'
  formSpecialties.value = 'Desarrollo Web, Cloud'
  formSkills.value = 'Vue.js, TypeScript, PostgreSQL'
  formYearsExp.value = 4
  formResponsibility.value = 'senior'
  formSupervisorId.value = ''
  formPermissions.value = 'standard'
  isFormModalOpen.value = true
}

function openEditModal(emp: Employee) {
  editingEmployee.value = emp
  formFullName.value = emp.full_name
  formInternalId.value = emp.internal_id
  formEmail.value = emp.email
  formPhone.value = emp.phone
  formAddress.value = emp.address || ''
  formAvatarUrl.value = emp.avatar_url || '/images/illustrations/hero-character.jpg'
  formHireDate.value = emp.hire_date
  formStatus.value = emp.status
  formDeptId.value = emp.department_id
  formGroupId.value = emp.group_id || ''
  formPositionId.value = emp.position_id
  formProfession.value = emp.profession
  formCareer.value = emp.career
  formSpecialties.value = emp.specialties.join(', ')
  formSkills.value = emp.skills.join(', ')
  formYearsExp.value = emp.years_experience
  formResponsibility.value = emp.responsibility_level
  formSupervisorId.value = emp.supervisor_id || ''
  formPermissions.value = emp.assigned_permissions[0] || 'standard'
  isFormModalOpen.value = true
}

function viewEmployeeDetail(emp: Employee) {
  selectedEmpForDetail.value = emp
  isDetailModalOpen.value = true
}

function handlePhotoUpload(e: Event) {
  const input = e.target as HTMLInputElement
  if (input.files && input.files[0]) {
    const file = input.files[0]
    if (file.size > 2 * 1024 * 1024) {
      uiStore.showToast('warning', 'Tamaño de archivo', 'La imagen no debe superar los 2MB.')
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      formAvatarUrl.value = reader.result as string
    }
    reader.readAsDataURL(file)
  }
}

async function handleSaveEmployee() {
  if (!formFullName.value.trim() || !formEmail.value.trim() || !formDeptId.value) {
    uiStore.showToast('error', 'Validación', 'Nombre completo, correo empresarial y departamento son requeridos.')
    return
  }

  const dept = departments.value.find(d => d.id === formDeptId.value)
  const grp = groups.value.find(g => g.id === formGroupId.value)
  const pos = positions.value.find(p => p.id === formPositionId.value)
  const sup = employees.value.find(e => e.id === formSupervisorId.value)

  const specList = formSpecialties.value.split(',').map(s => s.trim()).filter(Boolean)
  const skillList = formSkills.value.split(',').map(s => s.trim()).filter(Boolean)

  try {
    if (editingEmployee.value) {
      await orgService.updateEmployee(editingEmployee.value.id, {
        full_name: formFullName.value.trim(),
        internal_id: formInternalId.value.trim(),
        email: formEmail.value.trim(),
        phone: formPhone.value.trim(),
        address: formAddress.value.trim() || undefined,
        avatar_url: formAvatarUrl.value,
        hire_date: formHireDate.value || (new Date().toISOString().split('T')[0] ?? ''),
        status: formStatus.value,
        department_id: formDeptId.value,
        department_name: dept?.name,
        group_id: formGroupId.value || null,
        group_name: grp?.name,
        position_id: formPositionId.value,
        position_title: pos?.title,
        profession: formProfession.value.trim(),
        career: formCareer.value.trim(),
        specialties: specList,
        skills: skillList,
        years_experience: Number(formYearsExp.value),
        responsibility_level: formResponsibility.value,
        supervisor_id: formSupervisorId.value || null,
        supervisor_name: sup?.full_name,
        assigned_permissions: [formPermissions.value]
      })
      uiStore.showToast('success', 'Colaborador actualizado', 'El expediente fue actualizado correctamente.')
    } else {
      const res = await orgService.createEmployeeWithCredentials({
        full_name: formFullName.value.trim(),
        internal_id: formInternalId.value.trim(),
        email: formEmail.value.trim(),
        phone: formPhone.value.trim(),
        address: formAddress.value.trim() || undefined,
        avatar_url: formAvatarUrl.value,
        hire_date: formHireDate.value || (new Date().toISOString().split('T')[0] ?? ''),
        status: formStatus.value,
        department_id: formDeptId.value,
        department_name: dept?.name,
        group_id: formGroupId.value || null,
        group_name: grp?.name,
        position_id: formPositionId.value,
        position_title: pos?.title,
        profession: formProfession.value.trim(),
        career: formCareer.value.trim(),
        specialties: specList,
        skills: skillList,
        years_experience: Number(formYearsExp.value),
        responsibility_level: formResponsibility.value,
        supervisor_id: formSupervisorId.value || null,
        supervisor_name: sup?.full_name,
        assigned_permissions: [formPermissions.value]
      }, formPassword.value.trim() || undefined)
      currentCredential.value = res.credential
      isCredentialModalOpen.value = true
      uiStore.showToast('success', 'Empleado registrado', 'Credenciales temporales creadas. Entréguelas personalmente.')
    }
    isFormModalOpen.value = false
    await loadData()
  } catch (err: unknown) {
    uiStore.showToast('error', 'Error al guardar', err instanceof Error ? err.message : 'Error al registrar colaborador')
  }
}

async function handleResetCredentials(emp: Employee) {
  const ok = await uiStore.confirm({
    title: 'Generar Nueva Credencial Temporal',
    message: `¿Deseas generar una nueva contraseña temporal para ${emp.full_name}?`,
    consequence: 'La clave temporal anterior quedará invalidada inmediatamente y el colaborador deberá ingresar con la nueva clave.',
    confirmText: 'Generar Clave',
    isDanger: false
  })
  if (!ok) return
  const cred = await orgService.generateTemporaryCredential(emp.id)
  currentCredential.value = cred
  isCredentialModalOpen.value = true
  uiStore.showToast('success', 'Nueva Clave Generada', 'La credencial temporal fue creada exitosamente.')
}

async function handleCopyPassword() {
  if (currentCredential.value) {
    await navigator.clipboard.writeText(currentCredential.value.temporary_password)
    uiStore.showToast('info', 'Copiada al portapapeles', 'Contraseña copiada de forma segura.')
  }
}

async function handleToggleStatus(emp: Employee) {
  const willDeactivate = emp.status === 'active'
  const ok = await uiStore.confirm({
    title: willDeactivate ? 'Suspender colaborador' : 'Reactivar colaborador',
    message: willDeactivate
      ? `¿Deseas suspender la cuenta y labores de ${emp.full_name}?`
      : `¿Deseas reactivar el estatus operativo de ${emp.full_name}?`,
    consequence: willDeactivate
      ? 'Sus asignaciones activas deberán ser atendidas por otros integrantes de su grupo.'
      : 'El colaborador podrá volver a recibir asignaciones y acceder al sistema.',
    confirmText: willDeactivate ? 'Suspender acceso' : 'Reactivar',
    isDanger: willDeactivate
  })

  if (ok) {
    await orgService.toggleEmployeeStatus(emp.id, willDeactivate ? 'inactive' : 'active')
    uiStore.showToast('success', 'Estado modificado', `El colaborador ${emp.full_name} ahora se encuentra ${willDeactivate ? 'inactivo' : 'activo'}.`)
    await loadData()
  }
}

async function handleDeleteEmployee(emp: Employee) {
  const ok = await uiStore.confirm({
    title: `Eliminar colaborador: ${emp.full_name}`,
    message: `¿Estás seguro de eliminar permanentemente a ${emp.full_name} (${emp.internal_id})?`,
    consequence: 'Esta acción removerá el expediente de nómina y los registros asociados al grupo.',
    confirmText: 'Eliminar definitivamente',
    isDanger: true
  })

  if (ok) {
    try {
      await orgService.deleteEmployee(emp.id)
      uiStore.showToast('success', 'Registro eliminado', 'El colaborador fue removido del sistema.')
      await loadData()
    } catch (err: unknown) {
      uiStore.showToast('error', 'Error al eliminar', err instanceof Error ? err.message : 'Error al remover colaborador')
    }
  }
}
</script>

<template>
  <div class="employees-page">
    <div class="page-header">
      <div>
        <h1 class="page-title">Administración del Personal</h1>
        <p class="page-subtitle">Gestiona los colaboradores, profesiones, cargos y asignaciones organizacionales.</p>
      </div>

      <button type="button" class="btn-primary-action" @click="openCreateModal">
        <Plus :size="16" />
        <span>Registrar Nuevo Empleado</span>
      </button>
    </div>

    <div class="filters-card">
      <div class="search-wrap">
        <Search :size="18" class="search-icon" />
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Buscar por nombre, ID, correo o profesión..."
          class="search-input"
        />
      </div>

      <div class="filter-select-wrap">
        <Filter :size="16" class="filter-icon" />
        <select v-model="selectedDeptFilter" class="filter-select">
          <option value="all">Todos los Departamentos</option>
          <option v-for="d in departments" :key="d.id" :value="d.id">
            {{ d.name }}
          </option>
        </select>
      </div>

      <div class="filter-select-wrap">
        <select v-model="selectedStatusFilter" class="filter-select">
          <option value="all">Todos los Estados</option>
          <option value="active">Activo</option>
          <option value="inactive">Inactivo</option>
          <option value="on_leave">De Permiso</option>
        </select>
      </div>
    </div>

    <div class="table-card">
      <div v-if="isLoading" class="loading-wrap">
        <div class="skeleton-row" v-for="i in 4" :key="i"></div>
      </div>

      <div v-else-if="filteredEmployees.length === 0" class="empty-state">
        <p>No se encontraron colaboradores con los criterios seleccionados.</p>
      </div>

      <div v-else class="table-responsive">
        <table class="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Colaborador</th>
              <th>Departamento / Grupo</th>
              <th>Cargo & Profesión</th>
              <th>Estado</th>
              <th class="text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="emp in filteredEmployees" :key="emp.id">
              <td class="emp-id-tag">{{ emp.internal_id }}</td>
              <td>
                <div class="employee-meta-col">
                  <img :src="emp.avatar_url || '/images/illustrations/hero-character.jpg'" :alt="emp.full_name" class="emp-avatar-thumb" />
                  <div>
                    <span class="emp-full-name">{{ emp.full_name }}</span>
                    <span class="emp-email">{{ emp.email }}</span>
                  </div>
                </div>
              </td>
              <td>
                <div class="dept-col">
                  <span class="dept-badge">{{ emp.department_name }}</span>
                  <span class="group-subtext">{{ emp.group_name || 'Sin grupo asignado' }}</span>
                </div>
              </td>
              <td>
                <div class="pos-col">
                  <span class="pos-title">{{ emp.position_title }}</span>
                  <span class="prof-tag">{{ emp.profession }}</span>
                </div>
              </td>
              <td>
                <span :class="['status-chip', emp.status]">
                  {{ emp.status === 'active' ? 'Activo' : (emp.status === 'inactive' ? 'Inactivo' : 'Permiso') }}
                </span>
              </td>
              <td class="text-right">
                <div class="row-actions">
                  <button class="action-btn view" @click="viewEmployeeDetail(emp)" title="Ver expediente">
                    <Eye :size="16" />
                  </button>
                  <button class="action-btn key-btn" @click="handleResetCredentials(emp)" title="Generar nueva clave temporal">
                    <Key :size="16" />
                  </button>
                  <button class="action-btn edit" @click="openEditModal(emp)" title="Editar información">
                    <Edit2 :size="16" />
                  </button>
                  <button
                    :class="['action-btn', emp.status === 'active' ? 'toggle-off' : 'toggle-on']"
                    @click="handleToggleStatus(emp)"
                    :title="emp.status === 'active' ? 'Suspender colaborador' : 'Reactivar colaborador'"
                  >
                    <component :is="emp.status === 'active' ? XCircle : CheckCircle" :size="16" />
                  </button>
                  <button class="action-btn delete" @click="handleDeleteEmployee(emp)" title="Eliminar registro">
                    <Trash2 :size="16" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <BaseModal
      v-model="isFormModalOpen"
      :title="editingEmployee ? `Editar Empleado: ${editingEmployee.full_name}` : 'Registrar Nuevo Empleado'"
    >
      <form @submit.prevent="handleSaveEmployee" class="emp-form">
        <div class="avatar-form-row">
          <div class="avatar-preview-box">
            <img :src="formAvatarUrl" alt="Avatar" class="form-avatar-img" />
            <label class="camera-btn" title="Cargar fotografía">
              <Camera :size="14" />
              <input type="file" accept="image/*" class="hidden-file-input" @change="handlePhotoUpload" />
            </label>
          </div>
          <div class="avatar-info-hint">
            <span class="hint-title">Fotografía del colaborador</span>
            <span class="hint-desc">PNG o JPG menor a 2MB. Se recortará en proporción circular profesional.</span>
          </div>
        </div>

        <div class="form-row-2">
          <div class="form-group">
            <label class="form-label">Nombre completo *</label>
            <input v-model="formFullName" type="text" class="form-input" placeholder="Nombre y apellidos" required />
          </div>
          <div class="form-group">
            <label class="form-label">ID Interno *</label>
            <input v-model="formInternalId" type="text" class="form-input" placeholder="EMP-101" required />
          </div>
        </div>

        <div class="form-row-2">
          <div class="form-group">
            <label class="form-label">Correo empresarial *</label>
            <input v-model="formEmail" type="email" class="form-input" placeholder="nombre@nexora.com" required />
          </div>
          <div class="form-group">
            <label class="form-label">Teléfono de contacto</label>
            <input v-model="formPhone" type="tel" class="form-input" placeholder="+52 55 1234 5678" />
          </div>
        </div>

        <div v-if="!editingEmployee" class="form-group">
          <label class="form-label">Contraseña de acceso inicial</label>
          <div class="pwd-input-field-wrap">
            <input
              v-model="formPassword"
              :type="showFormPassword ? 'text' : 'password'"
              class="form-input pwd-form-input"
              placeholder="Opcional: define una contraseña o déjalo vacío para autogenerar"
            />
            <button type="button" class="pwd-toggle-btn" @click="showFormPassword = !showFormPassword">
              <component :is="showFormPassword ? EyeOff : Eye" :size="16" />
            </button>
          </div>
          <span class="pwd-hint-text">Si se deja vacío, NEXORA generará automáticamente una clave segura institucional.</span>
        </div>

        <div class="form-row-2">
          <div class="form-group">
            <label class="form-label">Departamento asignado *</label>
            <select v-model="formDeptId" class="form-select" required>
              <option v-for="d in departments" :key="d.id" :value="d.id">
                {{ d.name }}
              </option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Grupo de trabajo</label>
            <select v-model="formGroupId" class="form-select">
              <option value="">Sin grupo asignado</option>
              <option v-for="g in filteredGroupsForSelectedDept" :key="g.id" :value="g.id">
                {{ g.name }} ({{ g.code }})
              </option>
            </select>
          </div>
        </div>

        <div class="form-row-2">
          <div class="form-group">
            <label class="form-label">Cargo profesional *</label>
            <select v-model="formPositionId" class="form-select" required>
              <option v-for="p in positions" :key="p.id" :value="p.id">
                {{ p.title }} ({{ p.department_name }})
              </option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Nivel de responsabilidad</label>
            <select v-model="formResponsibility" class="form-select">
              <option value="junior">Junior</option>
              <option value="mid">Mid-level</option>
              <option value="senior">Senior</option>
              <option value="lead">Lead / Coordinador</option>
              <option value="manager">Manager / Gerente</option>
              <option value="director">Director</option>
            </select>
          </div>
        </div>

        <div class="form-row-2">
          <div class="form-group">
            <label class="form-label">Profesión *</label>
            <input v-model="formProfession" type="text" class="form-input" placeholder="Ej. Ingeniero en Ciberseguridad" required />
          </div>
          <div class="form-group">
            <label class="form-label">Carrera universitaria</label>
            <input v-model="formCareer" type="text" class="form-input" placeholder="Ej. Ingeniería en Telemática" />
          </div>
        </div>

        <div class="form-row-2">
          <div class="form-group">
            <label class="form-label">Especialidades (separadas por coma)</label>
            <input v-model="formSpecialties" type="text" class="form-input" placeholder="OWASP, Pentesting, Criptografía" />
          </div>
          <div class="form-group">
            <label class="form-label">Años de experiencia</label>
            <input v-model.number="formYearsExp" type="number" min="0" max="40" class="form-input" />
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">Habilidades y competencias (separadas por coma)</label>
          <input v-model="formSkills" type="text" class="form-input" placeholder="Vue 3, PostgreSQL, Node, Redes" />
        </div>

        <div class="form-row-2">
          <div class="form-group">
            <label class="form-label">Supervisor directo</label>
            <select v-model="formSupervisorId" class="form-select">
              <option value="">Sin supervisor</option>
              <option v-for="emp in employees" :key="emp.id" :value="emp.id">
                {{ emp.full_name }} ({{ emp.position_title }})
              </option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Fecha de contratación</label>
            <input v-model="formHireDate" type="date" class="form-input" required />
          </div>
        </div>

        <div class="modal-btn-row">
          <button type="button" class="btn-cancel" @click="isFormModalOpen = false">Cancelar</button>
          <button type="submit" class="btn-primary-action">Guardar colaborador</button>
        </div>
      </form>
    </BaseModal>

    <BaseModal
      v-model="isDetailModalOpen"
      :title="`Expediente: ${selectedEmpForDetail?.full_name}`"
    >
      <div v-if="selectedEmpForDetail" class="detail-dossier">
        <div class="dossier-top">
          <img :src="selectedEmpForDetail.avatar_url || '/images/illustrations/hero-character.jpg'" class="dossier-avatar" />
          <div>
            <h3 class="dossier-name">{{ selectedEmpForDetail.full_name }}</h3>
            <span class="dossier-pos">{{ selectedEmpForDetail.position_title }}</span>
            <div class="dossier-pills">
              <span class="dossier-id">{{ selectedEmpForDetail.internal_id }}</span>
              <span class="dossier-level">{{ selectedEmpForDetail.responsibility_level.toUpperCase() }}</span>
              <span class="dossier-status">{{ selectedEmpForDetail.status }}</span>
            </div>
          </div>
        </div>

        <div class="dossier-grid">
          <div class="dossier-item">
            <span class="dossier-lbl">Departamento</span>
            <span class="dossier-val">{{ selectedEmpForDetail.department_name }}</span>
          </div>
          <div class="dossier-item">
            <span class="dossier-lbl">Grupo de Trabajo</span>
            <span class="dossier-val">{{ selectedEmpForDetail.group_name || 'Sin grupo asignado' }}</span>
          </div>
          <div class="dossier-item">
            <span class="dossier-lbl">Profesión</span>
            <span class="dossier-val">{{ selectedEmpForDetail.profession }}</span>
          </div>
          <div class="dossier-item">
            <span class="dossier-lbl">Carrera</span>
            <span class="dossier-val">{{ selectedEmpForDetail.career }}</span>
          </div>
          <div class="dossier-item">
            <span class="dossier-lbl">Correo empresarial</span>
            <span class="dossier-val">{{ selectedEmpForDetail.email }}</span>
          </div>
          <div class="dossier-item">
            <span class="dossier-lbl">Teléfono</span>
            <span class="dossier-val">{{ selectedEmpForDetail.phone }}</span>
          </div>
          <div class="dossier-item">
            <span class="dossier-lbl">Fecha de Contratación</span>
            <span class="dossier-val">{{ formatDate(selectedEmpForDetail.hire_date) }}</span>
          </div>
          <div class="dossier-item">
            <span class="dossier-lbl">Experiencia</span>
            <span class="dossier-val">{{ selectedEmpForDetail.years_experience }} años</span>
          </div>
        </div>

        <div class="dossier-skills-block">
          <span class="dossier-lbl">Especialidades:</span>
          <div class="skills-tags">
            <span v-for="sp in selectedEmpForDetail.specialties" :key="sp" class="spec-tag">{{ sp }}</span>
          </div>
        </div>

        <div class="dossier-skills-block">
          <span class="dossier-lbl">Habilidades técnicas:</span>
          <div class="skills-tags">
            <span v-for="sk in selectedEmpForDetail.skills" :key="sk" class="skill-tag">{{ sk }}</span>
          </div>
        </div>
      </div>
    </BaseModal>

    <BaseModal
      v-model="isCredentialModalOpen"
      title="Credencial Temporal de Acceso Generada"
    >
      <div v-if="currentCredential" class="credential-modal-body">
        <div class="credential-badge-header">
          <ShieldCheck :size="24" class="text-blue" />
          <div>
            <h4 class="cred-title">Acceso habilitado para {{ currentCredential.full_name }}</h4>
            <span class="cred-sub">{{ currentCredential.department_name }} · {{ currentCredential.position_title }}</span>
          </div>
        </div>

        <div class="cred-info-grid">
          <div class="cred-field">
            <span class="cred-lbl">Correo institucional de acceso:</span>
            <span class="cred-val font-mono">{{ currentCredential.email }}</span>
          </div>
          <div class="cred-field">
            <span class="cred-lbl">Contraseña temporal segura:</span>
            <div class="password-copy-box">
              <span class="cred-password-display font-mono">
                {{ isPasswordVisible ? currentCredential.temporary_password : '••••••••••••••' }}
              </span>
              <button type="button" class="btn-icon" @click="isPasswordVisible = !isPasswordVisible" title="Mostrar/ocultar">
                <Eye :size="16" />
              </button>
              <button type="button" class="btn-copy" @click="handleCopyPassword">
                <Copy :size="15" />
                <span>Copiar</span>
              </button>
            </div>
          </div>
        </div>

        <div class="cred-alert-box">
          <strong>Protocolo de Seguridad Mandatario:</strong>
          <p>
            Esta contraseña <strong>NO</strong> se enviará por correo electrónico de manera automática.
            El administrador debe entregarla personalmente al colaborador por el medio de su preferencia.
            El colaborador deberá <strong>cambiarla obligatoriamente</strong> en su primer inicio de sesión.
          </p>
        </div>

        <div class="modal-btn-row">
          <button class="btn-primary-action" @click="isCredentialModalOpen = false">
            Entendido y Entregada
          </button>
        </div>
      </div>
    </BaseModal>
  </div>
</template>

<style scoped>
.employees-page {
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

.filters-card {
  background: #FFFFFF;
  border: 1px solid #E3EAF6;
  border-radius: 12px;
  padding: 14px 18px;
  display: flex;
  align-items: center;
  gap: 14px;
  flex-wrap: wrap;
}

.search-wrap {
  flex: 1;
  min-width: 260px;
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

.filter-select-wrap {
  display: flex;
  align-items: center;
  gap: 6px;
}

.filter-icon {
  color: #71809B;
}

.filter-select {
  padding: 8px 12px;
  border: 1px solid #E3EAF6;
  border-radius: 8px;
  font-size: 0.85rem;
  background: #FFFFFF;
  color: #182B49;
  outline: none;
}

.table-card {
  background: #FFFFFF;
  border: 1px solid #E3EAF6;
  border-radius: 14px;
  overflow: hidden;
  box-shadow: 0 4px 16px rgba(8, 123, 250, 0.04);
}

.table-responsive {
  overflow-x: auto;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  text-align: left;
}

.data-table th {
  padding: 12px 16px;
  font-size: 0.75rem;
  font-weight: 700;
  color: #71809B;
  text-transform: uppercase;
  background: #F8FAFD;
  border-bottom: 1px solid #E3EAF6;
}

.data-table td {
  padding: 14px 16px;
  border-bottom: 1px solid #E3EAF6;
  vertical-align: middle;
}

.emp-id-tag {
  font-size: 0.75rem;
  font-weight: 800;
  color: #087BFA;
}

.employee-meta-col {
  display: flex;
  align-items: center;
  gap: 10px;
}

.emp-avatar-thumb {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  object-fit: cover;
  object-position: center 20%;
  border: 2px solid #EBF5FF;
}

.emp-full-name {
  font-size: 0.88rem;
  font-weight: 700;
  color: #182B49;
  display: block;
}

.emp-email {
  font-size: 0.75rem;
  color: #71809B;
  display: block;
}

.dept-badge {
  font-size: 0.74rem;
  font-weight: 700;
  color: #17366C;
  display: block;
}

.group-subtext {
  font-size: 0.7rem;
  color: #8755E9;
  display: block;
  margin-top: 2px;
}

.pos-title {
  font-size: 0.82rem;
  font-weight: 700;
  color: #182B49;
  display: block;
}

.prof-tag {
  font-size: 0.7rem;
  color: #71809B;
  display: block;
}

.status-chip {
  display: inline-block;
  padding: 3px 8px;
  border-radius: 6px;
  font-size: 0.72rem;
  font-weight: 700;
}

.status-chip.active { background: #EBF8F2; color: #00BA88; }
.status-chip.inactive { background: #F3F4F6; color: #6B7280; }
.status-chip.on_leave { background: #FFFBEB; color: #D97706; }

.row-actions {
  display: flex;
  gap: 6px;
  justify-content: flex-end;
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

.action-btn.view { color: #087BFA; }
.action-btn.view:hover { background: #EDF5FF; border-color: #087BFA; }
.action-btn.edit { color: #17366C; }
.action-btn.edit:hover { background: #F1F5F9; border-color: #17366C; }
.action-btn.toggle-off { color: #D97706; }
.action-btn.toggle-off:hover { background: #FFFBEB; border-color: #D97706; }
.action-btn.toggle-on { color: #00BA88; }
.action-btn.toggle-on:hover { background: #EBF8F2; border-color: #00BA88; }
.action-btn.delete { color: #EF4444; }
.action-btn.delete:hover { background: #FEF2F2; border-color: #EF4444; }

.emp-form {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.avatar-form-row {
  display: flex;
  align-items: center;
  gap: 14px;
  background: #F8FAFD;
  border: 1px solid #E3EAF6;
  border-radius: 12px;
  padding: 12px 16px;
}

.avatar-preview-box {
  position: relative;
  width: 56px;
  height: 56px;
}

.form-avatar-img {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
  object-position: center 20%;
  border: 2px solid #087BFA;
}

.camera-btn {
  position: absolute;
  bottom: -2px;
  right: -2px;
  width: 22px;
  height: 22px;
  background: #087BFA;
  color: #FFFFFF;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.hidden-file-input {
  display: none;
}

.hint-title {
  font-size: 0.82rem;
  font-weight: 700;
  color: #182B49;
  display: block;
}

.hint-desc {
  font-size: 0.72rem;
  color: #71809B;
  display: block;
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

.form-input, .form-select {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #E3EAF6;
  border-radius: 8px;
  font-size: 0.85rem;
  outline: none;
  box-sizing: border-box;
}

.form-input:focus, .form-select:focus {
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

.detail-dossier {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.dossier-top {
  display: flex;
  align-items: center;
  gap: 16px;
  background: #F8FAFD;
  border-radius: 12px;
  padding: 16px;
}

.dossier-avatar {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  object-fit: cover;
  object-position: center 20%;
  border: 3px solid #087BFA;
}

.dossier-name {
  font-size: 1.15rem;
  font-weight: 800;
  color: #17366C;
  margin: 0;
}

.dossier-pos {
  font-size: 0.85rem;
  color: #556987;
  font-weight: 600;
  display: block;
}

.dossier-pills {
  display: flex;
  gap: 6px;
  margin-top: 6px;
}

.dossier-id {
  background: #EBF5FF;
  color: #087BFA;
  font-size: 0.7rem;
  font-weight: 700;
  padding: 2px 6px;
  border-radius: 4px;
}

.dossier-level {
  background: #F3E8FF;
  color: #8755E9;
  font-size: 0.7rem;
  font-weight: 700;
  padding: 2px 6px;
  border-radius: 4px;
}

.dossier-status {
  background: #DCFCE7;
  color: #00BA88;
  font-size: 0.7rem;
  font-weight: 700;
  padding: 2px 6px;
  border-radius: 4px;
}

.dossier-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.dossier-item {
  display: flex;
  flex-direction: column;
  background: #FFFFFF;
  border: 1px solid #E3EAF6;
  border-radius: 8px;
  padding: 8px 12px;
}

.dossier-lbl {
  font-size: 0.68rem;
  color: #71809B;
  font-weight: 600;
}

.dossier-val {
  font-size: 0.84rem;
  color: #182B49;
  font-weight: 700;
  margin-top: 2px;
}

.dossier-skills-block {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.skills-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.spec-tag {
  background: #EBF5FF;
  color: #087BFA;
  font-size: 0.72rem;
  padding: 3px 8px;
  border-radius: 6px;
  font-weight: 600;
}

.skill-tag {
  background: #F1F5F9;
  color: #334155;
  font-size: 0.72rem;
  padding: 3px 8px;
  border-radius: 6px;
  font-weight: 600;
}

.credential-modal-body {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  padding: 0.5rem 0;
}

.credential-badge-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  background: #F0FDF4;
  border: 1px solid #BBF7D0;
  padding: 0.85rem 1rem;
  border-radius: 0.75rem;
}

.cred-title {
  font-size: 0.95rem;
  font-weight: 700;
  color: #15803D;
  margin: 0;
}

.cred-sub {
  font-size: 0.75rem;
  color: #166534;
}

.cred-info-grid {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.cred-field {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
}

.cred-lbl {
  font-size: 0.75rem;
  font-weight: 600;
  color: #64748B;
}

.cred-val {
  font-size: 0.9rem;
  font-weight: 700;
  color: #1E293B;
  background: #F8FAFC;
  padding: 0.5rem 0.75rem;
  border-radius: 0.5rem;
  border: 1px solid #E2E8F0;
}

.password-copy-box {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: #F8FAFC;
  padding: 0.4rem 0.6rem;
  border-radius: 0.5rem;
  border: 1px solid #CBD5E1;
}

.cred-password-display {
  flex: 1;
  font-size: 1rem;
  font-weight: 800;
  letter-spacing: 0.05em;
  color: #087BFA;
}

.btn-icon {
  background: transparent;
  border: none;
  cursor: pointer;
  color: #64748B;
  padding: 0.3rem;
  display: flex;
  align-items: center;
}

.btn-copy {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  background: #087BFA;
  color: #FFFFFF;
  border: none;
  border-radius: 0.375rem;
  padding: 0.35rem 0.65rem;
  font-size: 0.75rem;
  font-weight: 700;
  cursor: pointer;
}

.cred-alert-box {
  background: #FFFBEB;
  border: 1px solid #FDE68A;
  border-radius: 0.6rem;
  padding: 0.85rem;
  font-size: 0.8rem;
  color: #92400E;
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
}

.cred-alert-box p {
  margin: 0;
  line-height: 1.4;
}

.modal-btn-row {
  display: flex;
  justify-content: flex-end;
  margin-top: 0.5rem;
}

.key-btn {
  color: #F59E0B;
}

.key-btn:hover {
  background: #FEF3C7;
}

.font-mono { font-family: monospace; }
.text-blue { color: #087BFA; }

.pwd-input-field-wrap {
  position: relative;
  display: flex;
  align-items: center;
}

.pwd-form-input {
  padding-right: 2.5rem;
}

.pwd-toggle-btn {
  position: absolute;
  right: 0.75rem;
  background: transparent;
  border: none;
  cursor: pointer;
  color: #64748B;
  display: flex;
  align-items: center;
  justify-content: center;
}

.pwd-toggle-btn:hover {
  color: #087BFA;
}

.pwd-hint-text {
  font-size: 0.75rem;
  color: #64748B;
  margin-top: 0.25rem;
  display: block;
}
</style>