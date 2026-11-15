<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import {
  Code,
  GitBranch,
  CheckCircle2,
  Clock,
  Plus,
  Layers,
  ExternalLink
} from 'lucide-vue-next'
import { orgService } from '@/shared/infrastructure/adapters/mock/mock.organization.service'
import type { DevProject, DevTask } from '@/shared/types/organization.types'
import { formatDate } from '@/shared/utils/formatters'
import { useUiStore } from '@/shared/stores/ui.store'
import BaseModal from '@/shared/components/BaseModal.vue'

const uiStore = useUiStore()

const activeTab = ref<'tasks' | 'projects' | 'releases'>('tasks')
const projects = ref<DevProject[]>([])
const tasks = ref<DevTask[]>([])
const isLoading = ref(true)

const searchQuery = ref('')
const typeFilter = ref('all')
const statusFilter = ref('all')

const isTaskModalOpen = ref(false)
const taskTitle = ref('')
const taskProjectId = ref('prj-1')
const taskType = ref<DevTask['type']>('feature')
const taskPriority = ref<DevTask['priority']>('high')
const taskHours = ref(8)

async function loadData() {
  isLoading.value = true
  try {
    const [p, t] = await Promise.all([
      orgService.getDevProjects(),
      orgService.getDevTasks()
    ])
    projects.value = p
    tasks.value = t
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  loadData()
})

const inProgressCount = computed(() => {
  return tasks.value.filter(t => t.status === 'in_progress' || t.status === 'in_review').length
})

const doneCount = computed(() => {
  return tasks.value.filter(t => t.status === 'done').length
})

const filteredTasks = computed(() => {
  return tasks.value.filter(t => {
    const matchSearch = t.title.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      t.task_number.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      t.project_name.toLowerCase().includes(searchQuery.value.toLowerCase())
    const matchType = typeFilter.value === 'all' || t.type === typeFilter.value
    const matchStatus = statusFilter.value === 'all' || t.status === statusFilter.value
    return matchSearch && matchType && matchStatus
  })
})

async function handleCreateTask() {
  if (!taskTitle.value.trim()) {
    uiStore.showToast('error', 'Validación', 'Ingresa el título de la tarea técnica.')
    return
  }

  const proj = projects.value.find(p => p.id === taskProjectId.value)

  await orgService.createDevTask({
    task_number: `DEV-${Math.floor(400 + Math.random() * 500)}`,
    project_id: taskProjectId.value,
    project_name: proj?.name || 'NEXORA Core',
    title: taskTitle.value.trim(),
    type: taskType.value,
    priority: taskPriority.value,
    status: 'backlog',
    estimated_hours: Number(taskHours.value) || 4
  })

  uiStore.showToast('success', 'Tarea Registrada', 'El requerimiento fue agregado al backlog del equipo de desarrollo.')
  isTaskModalOpen.value = false
  taskTitle.value = ''
  taskHours.value = 8
  await loadData()
}

async function handleAdvanceStatus(task: DevTask) {
  const nextStatusMap: Record<DevTask['status'], DevTask['status']> = {
    backlog: 'in_progress',
    in_progress: 'in_review',
    in_review: 'done',
    done: 'backlog'
  }
  const next = nextStatusMap[task.status]
  await orgService.updateDevTaskStatus(task.id, next)
  uiStore.showToast('info', 'Estado Actualizado', `La tarea ${task.task_number} avanzó a ${next}.`)
  await loadData()
}

function getTypeBadge(type: DevTask['type']) {
  const map: Record<string, string> = {
    feature: 'badge-blue',
    bugfix: 'badge-red',
    refactor: 'badge-purple',
    security_patch: 'badge-amber'
  }
  return map[type] || 'badge-gray'
}

function getPriorityBadge(p: DevTask['priority']) {
  const map: Record<string, string> = {
    urgent: 'badge-red',
    high: 'badge-orange',
    medium: 'badge-amber',
    low: 'badge-gray'
  }
  return map[p] || 'badge-gray'
}
</script>

<template>
  <div class="dev-portal-page">
    <div class="page-header">
      <div>
        <h1 class="page-title">Portal de Desarrollo de Software</h1>
        <p class="page-subtitle">Evolución técnica interna de NEXORA, arquitectura de software, gestión de versiones y control de backlog.</p>
      </div>

      <button class="btn btn-primary" @click="isTaskModalOpen = true">
        <Plus :size="16" />
        <span>Nueva Tarea Técnica</span>
      </button>
    </div>

    <div class="kpi-grid">
      <div class="kpi-card">
        <div class="kpi-icon icon-blue">
          <Code :size="22" />
        </div>
        <div class="kpi-info">
          <span class="kpi-label">Proyectos Activos</span>
          <span class="kpi-val">{{ projects.length }}</span>
          <span class="kpi-desc">Módulos en evolución</span>
        </div>
      </div>

      <div class="kpi-card">
        <div class="kpi-icon icon-amber">
          <Clock :size="22" />
        </div>
        <div class="kpi-info">
          <span class="kpi-label">Tareas en Progreso</span>
          <span class="kpi-val">{{ inProgressCount }}</span>
          <span class="kpi-desc">Sprint activo</span>
        </div>
      </div>

      <div class="kpi-card">
        <div class="kpi-icon icon-green">
          <CheckCircle2 :size="22" />
        </div>
        <div class="kpi-info">
          <span class="kpi-label">Entregadas / Listas</span>
          <span class="kpi-val">{{ doneCount }}</span>
          <span class="kpi-desc">Revisión y despliegue</span>
        </div>
      </div>

      <div class="kpi-card">
        <div class="kpi-icon icon-purple">
          <GitBranch :size="22" />
        </div>
        <div class="kpi-info">
          <span class="kpi-label">Versión Plataforma</span>
          <span class="kpi-val">v2.1.0</span>
          <span class="kpi-desc">Despliegue verificado</span>
        </div>
      </div>
    </div>

    <div class="portal-tabs">
      <button
        class="tab-btn"
        :class="{ active: activeTab === 'tasks' }"
        @click="activeTab = 'tasks'"
      >
        <Layers :size="16" />
        <span>Sprint Backlog</span>
        <span class="tab-badge">{{ tasks.length }}</span>
      </button>

      <button
        class="tab-btn"
        :class="{ active: activeTab === 'projects' }"
        @click="activeTab = 'projects'"
      >
        <Code :size="16" />
        <span>Proyectos y Repositorios</span>
        <span class="tab-badge">{{ projects.length }}</span>
      </button>

      <button
        class="tab-btn"
        :class="{ active: activeTab === 'releases' }"
        @click="activeTab = 'releases'"
      >
        <GitBranch :size="16" />
        <span>Historial de Versiones</span>
      </button>
    </div>

    <div v-if="activeTab === 'tasks'" class="content-view">
      <div class="filters-bar">
        <div class="search-box">
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Buscar tarea técnica por folio o descripción..."
            class="search-input"
          />
        </div>
        <div class="filter-controls">
          <select v-model="typeFilter" class="filter-select">
            <option value="all">Todos los tipos</option>
            <option value="feature">Funcionalidad</option>
            <option value="bugfix">Corrección (Bugfix)</option>
            <option value="refactor">Refactorización</option>
            <option value="security_patch">Parche de Seguridad</option>
          </select>
          <select v-model="statusFilter" class="filter-select">
            <option value="all">Todos los estados</option>
            <option value="backlog">Backlog</option>
            <option value="in_progress">En Progreso</option>
            <option value="in_review">En Revisión</option>
            <option value="done">Completada</option>
          </select>
        </div>
      </div>

      <div class="table-container">
        <table class="data-table">
          <thead>
            <tr>
              <th>Folio</th>
              <th>Título y Alcance</th>
              <th>Proyecto</th>
              <th>Tipo</th>
              <th>Prioridad</th>
              <th>Estimación</th>
              <th>Estado</th>
              <th>Acción</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="t in filteredTasks" :key="t.id">
              <td class="bold font-mono">{{ t.task_number }}</td>
              <td class="bold">{{ t.title }}</td>
              <td><span class="project-tag">{{ t.project_name }}</span></td>
              <td><span class="badge" :class="getTypeBadge(t.type)">{{ t.type }}</span></td>
              <td><span class="badge" :class="getPriorityBadge(t.priority)">{{ t.priority }}</span></td>
              <td class="font-mono text-muted">{{ t.estimated_hours }}h</td>
              <td>
                <span
                  class="badge"
                  :class="{
                    'badge-green': t.status === 'done',
                    'badge-blue': t.status === 'in_progress',
                    'badge-purple': t.status === 'in_review',
                    'badge-gray': t.status === 'backlog'
                  }"
                >
                  {{ t.status === 'done' ? 'Completada' : (t.status === 'in_progress' ? 'En Progreso' : (t.status === 'in_review' ? 'En Revisión' : 'Backlog')) }}
                </span>
              </td>
              <td>
                <button class="btn btn-sm btn-outline" @click="handleAdvanceStatus(t)">
                  Avanzar Fase
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div v-else-if="activeTab === 'projects'" class="content-view">
      <div class="projects-grid">
        <div v-for="p in projects" :key="p.id" class="project-card">
          <div class="prj-header">
            <span class="prj-code font-mono">{{ p.code }}</span>
            <span class="badge badge-green">{{ p.current_version }}</span>
          </div>

          <h3 class="prj-title">{{ p.name }}</h3>
          <p class="prj-desc">{{ p.description }}</p>

          <div class="prj-meta">
            <span>Líder Técnico: <strong>{{ p.lead_employee_name || 'Carlos Mendoza' }}</strong></span>
            <span>Actualización: {{ formatDate(p.updated_at) }}</span>
          </div>

          <div class="prj-footer">
            <a :href="p.repository_url" target="_blank" class="repo-link">
              <span>Repositorio Git</span>
              <ExternalLink :size="14" />
            </a>
            <span class="badge badge-blue">Activo</span>
          </div>
        </div>
      </div>
    </div>

    <div v-else-if="activeTab === 'releases'" class="content-view">
      <div class="releases-container">
        <div class="release-item">
          <div class="rel-badge-col">
            <span class="rel-version">v2.1.0</span>
            <span class="rel-tag current">Versión Actual</span>
          </div>
          <div class="rel-content">
            <h4>Expansión Organizacional y Cifrado E2EE</h4>
            <p>Incorporación de portales corporativos para Ciberseguridad, Desarrollo, RRHH, Finanzas y Legal; Web Crypto API en centro de mensajería.</p>
            <span class="text-muted font-sm">Desplegado en producción</span>
          </div>
        </div>

        <div class="release-item">
          <div class="rel-badge-col">
            <span class="rel-version">v2.0.0</span>
            <span class="rel-tag">Lanzamiento</span>
          </div>
          <div class="rel-content">
            <h4>Motor de Solicitudes Guiadas e Intake Dinámico</h4>
            <p>Formularios contextuales por servicio, prevención de duplicados, SLA Radar reactivo y auditoría en PostgreSQL.</p>
            <span class="text-muted font-sm">Estable</span>
          </div>
        </div>
      </div>
    </div>

    <BaseModal
      v-model="isTaskModalOpen"
      title="Nueva Tarea Técnica / Requerimiento"
    >
      <form class="modal-form" @submit.prevent="handleCreateTask">
        <div class="form-group">
          <label>Proyecto Destino</label>
          <select v-model="taskProjectId" class="form-select">
            <option v-for="p in projects" :key="p.id" :value="p.id">{{ p.name }} ({{ p.code }})</option>
          </select>
        </div>

        <div class="form-group">
          <label>Título del Requerimiento / Tarea *</label>
          <input v-model="taskTitle" type="text" class="form-input" placeholder="Ej. Optimizar consultas agregadas en módulo de finanzas" required />
        </div>

        <div class="form-row">
          <div class="form-group">
            <label>Tipo de Tarea</label>
            <select v-model="taskType" class="form-select">
              <option value="feature">Funcionalidad Nueva</option>
              <option value="bugfix">Corrección de Error (Bugfix)</option>
              <option value="refactor">Refactorización / Arquitectura</option>
              <option value="security_patch">Parche de Seguridad</option>
            </select>
          </div>

          <div class="form-group">
            <label>Prioridad</label>
            <select v-model="taskPriority" class="form-select">
              <option value="low">Baja</option>
              <option value="medium">Media</option>
              <option value="high">Alta</option>
              <option value="urgent">Urgente</option>
            </select>
          </div>
        </div>

        <div class="form-group">
          <label>Horas Estimadas de Ingeniería</label>
          <input v-model="taskHours" type="number" min="1" max="100" class="form-input" required />
        </div>

        <div class="modal-actions">
          <button type="button" class="btn btn-outline" @click="isTaskModalOpen = false">Cancelar</button>
          <button type="submit" class="btn btn-primary">Registrar en Backlog</button>
        </div>
      </form>
    </BaseModal>
  </div>
</template>

<style scoped>
.dev-portal-page {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  padding: 1.5rem;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 1rem;
}

.page-title {
  font-size: 1.6rem;
  font-weight: 800;
  color: #17366C;
  letter-spacing: -0.02em;
}

.page-subtitle {
  font-size: 0.9rem;
  color: #64748B;
  margin-top: 0.2rem;
}

.kpi-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 1rem;
}

.kpi-card {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1.25rem;
  background: #FFFFFF;
  border-radius: 1rem;
  border: 1px solid #E2E8F0;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.03);
}

.kpi-icon {
  width: 48px;
  height: 48px;
  border-radius: 0.75rem;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.icon-blue { background: #EFF6FF; color: #087BFA; }
.icon-green { background: #ECFDF5; color: #10B981; }
.icon-amber { background: #FFFBEB; color: #F59E0B; }
.icon-purple { background: #F5F3FF; color: #8755E9; }

.kpi-info {
  display: flex;
  flex-direction: column;
}

.kpi-label {
  font-size: 0.8rem;
  font-weight: 600;
  color: #64748B;
}

.kpi-val {
  font-size: 1.4rem;
  font-weight: 800;
  color: #1E293B;
  margin: 0.2rem 0;
}

.kpi-desc {
  font-size: 0.75rem;
  color: #94A3B8;
}

.portal-tabs {
  display: flex;
  gap: 0.5rem;
  border-bottom: 2px solid #E2E8F0;
  padding-bottom: 0.25rem;
  overflow-x: auto;
}

.tab-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.25rem;
  background: transparent;
  border: none;
  border-bottom: 2px solid transparent;
  font-size: 0.9rem;
  font-weight: 600;
  color: #64748B;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.tab-btn:hover { color: #087BFA; }
.tab-btn.active { color: #087BFA; border-bottom-color: #087BFA; }

.tab-badge {
  background: #EFF6FF;
  color: #087BFA;
  padding: 0.15rem 0.5rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 700;
}

.filters-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
  margin-bottom: 1.25rem;
}

.search-box { flex: 1; min-width: 260px; }
.filter-controls { display: flex; gap: 0.5rem; }
.search-input, .filter-select {
  padding: 0.65rem 1rem;
  border-radius: 0.5rem;
  border: 1px solid #CBD5E1;
  font-size: 0.875rem;
  background: #FFFFFF;
}
.search-input { width: 100%; }

.table-container {
  background: #FFFFFF;
  border-radius: 1rem;
  border: 1px solid #E2E8F0;
  overflow-x: auto;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  text-align: left;
  font-size: 0.85rem;
}

.data-table th {
  padding: 1rem;
  background: #F8FAFC;
  font-weight: 700;
  color: #475569;
  border-bottom: 1px solid #E2E8F0;
}

.data-table td {
  padding: 1rem;
  border-bottom: 1px solid #F1F5F9;
  vertical-align: middle;
}

.project-tag {
  background: #EFF6FF;
  color: #087BFA;
  padding: 0.2rem 0.5rem;
  border-radius: 0.25rem;
  font-size: 0.75rem;
  font-weight: 600;
}

.projects-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 1.25rem;
}

.project-card {
  background: #FFFFFF;
  border: 1px solid #E2E8F0;
  border-radius: 1rem;
  padding: 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.prj-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.prj-code {
  font-size: 0.8rem;
  font-weight: 700;
  color: #64748B;
}

.prj-title {
  font-size: 1.05rem;
  font-weight: 700;
  color: #1E293B;
  margin: 0;
}

.prj-desc {
  font-size: 0.85rem;
  color: #64748B;
  line-height: 1.4;
  margin: 0;
}

.prj-meta {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  background: #F8FAFC;
  padding: 0.6rem;
  border-radius: 0.5rem;
  font-size: 0.75rem;
  color: #64748B;
}

.prj-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: auto;
  padding-top: 0.5rem;
  border-top: 1px solid #F1F5F9;
}

.repo-link {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.8rem;
  font-weight: 600;
  color: #087BFA;
  text-decoration: none;
}

.repo-link:hover { text-decoration: underline; }

.releases-container {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.release-item {
  display: flex;
  gap: 1.25rem;
  padding: 1.25rem;
  background: #FFFFFF;
  border: 1px solid #E2E8F0;
  border-radius: 1rem;
}

.rel-badge-col {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.4rem;
  min-width: 100px;
}

.rel-version {
  font-size: 1.15rem;
  font-weight: 800;
  color: #087BFA;
  font-family: monospace;
}

.rel-tag {
  font-size: 0.7rem;
  padding: 0.15rem 0.45rem;
  border-radius: 9999px;
  background: #F1F5F9;
  color: #64748B;
  font-weight: 700;
}

.rel-tag.current {
  background: #DCFCE7;
  color: #15803D;
}

.rel-content h4 {
  font-size: 1rem;
  font-weight: 700;
  color: #1E293B;
  margin: 0 0 0.3rem 0;
}

.rel-content p {
  font-size: 0.85rem;
  color: #64748B;
  margin: 0 0 0.4rem 0;
  line-height: 1.4;
}

.badge {
  display: inline-flex;
  align-items: center;
  padding: 0.25rem 0.6rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 700;
}

.badge-green { background: #DCFCE7; color: #15803D; }
.badge-blue { background: #DBEAFE; color: #1D4ED8; }
.badge-amber { background: #FEF3C7; color: #B45309; }
.badge-orange { background: #FFEDD5; color: #C2410C; }
.badge-red { background: #FEE2E2; color: #B91C1C; }
.badge-purple { background: #EDE9FE; color: #6D28D9; }
.badge-gray { background: #F1F5F9; color: #475569; }

.btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.65rem 1.25rem;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  border: none;
  transition: all 0.2s ease;
}

.btn-primary { background: #087BFA; color: #FFFFFF; }
.btn-primary:hover { background: #0662C7; }
.btn-outline { background: #FFFFFF; border: 1px solid #CBD5E1; color: #334155; }
.btn-outline:hover { background: #F8FAFC; }
.btn-sm { padding: 0.4rem 0.75rem; font-size: 0.75rem; }

.modal-form { display: flex; flex-direction: column; gap: 1rem; }
.form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
.form-group { display: flex; flex-direction: column; gap: 0.35rem; }
.form-group label { font-size: 0.8rem; font-weight: 600; color: #475569; }
.form-input, .form-select { padding: 0.65rem 0.85rem; border-radius: 0.5rem; border: 1px solid #CBD5E1; font-size: 0.875rem; outline: none; }
.modal-actions { display: flex; justify-content: flex-end; gap: 0.75rem; margin-top: 1rem; }

.bold { font-weight: 700; }
.font-mono { font-family: monospace; }
.font-sm { font-size: 0.8rem; }
.text-muted { color: #64748B; }
</style>
