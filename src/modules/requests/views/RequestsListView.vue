<script setup lang="ts">
import { ref, onMounted, watch, computed } from 'vue'
import {
  Eye,
  Edit2,
  ChevronLeft,
  ChevronRight,
  ArrowRight
} from 'lucide-vue-next'
import { repositories } from '@/shared/infrastructure/provider'
import type { ServiceRequest, RequestStatus } from '@/shared/types/request.types'
import { formatDate, getStatusLabel } from '@/shared/utils/formatters'
import BaseModal from '@/shared/components/BaseModal.vue'
import StatusBadge from '@/shared/components/StatusBadge.vue'
import SlaRadarBadge from '../components/SlaRadarBadge.vue'
import { useAuthStore } from '@/modules/auth/auth.store'
import { useRouter } from 'vue-router'

const router = useRouter()

const authStore = useAuthStore()

const requests = ref<ServiceRequest[]>([])
const totalRequests = ref(0)
const isLoading = ref(true)

const activeTab = ref<RequestStatus | 'all'>('all')
const employeeScope = ref<'assigned' | 'all'>(authStore.isEmployee ? 'assigned' : 'all')
const currentPage = ref(1)
const itemsPerPage = 10

const isViewModalOpen = ref(false)
const isStatusModalOpen = ref(false)
const selectedRequest = ref<ServiceRequest | null>(null)

const newStatus = ref<RequestStatus>('in_progress')
const statusNote = ref('')
const isSubmitting = ref(false)

function isAssigned(req: ServiceRequest): boolean {
  const u = authStore.currentUser
  if (!u) return false
  return Boolean(
    (req.assigned_to && req.assigned_to === u.id) ||
    (req.assigned_name && req.assigned_name.toLowerCase() === u.full_name.toLowerCase())
  )
}

const displayedRequests = computed(() => {
  if (authStore.isAdmin || employeeScope.value === 'all') {
    return requests.value
  }
  return requests.value.filter(r => isAssigned(r))
})

const tabs = [
  { key: 'all' as const, label: 'Todas' },
  { key: 'pending' as const, label: 'Pendientes' },
  { key: 'in_progress' as const, label: 'En Proceso' },
  { key: 'completed' as const, label: 'Finalizadas' }
]

async function loadRequests() {
  isLoading.value = true
  try {
    const res = await repositories.requests.getRequests({
      status: activeTab.value,
      page: currentPage.value,
      limit: itemsPerPage
    })
    requests.value = res.data
    totalRequests.value = res.total
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  loadRequests()
})

watch(activeTab, () => {
  currentPage.value = 1
  loadRequests()
})

function openViewModal(req: ServiceRequest) {
  selectedRequest.value = req
  isViewModalOpen.value = true
}

function openStatusModal(req: ServiceRequest) {
  selectedRequest.value = req
  newStatus.value = req.status
  statusNote.value = ''
  isStatusModalOpen.value = true
}

async function handleSaveStatus() {
  if (!selectedRequest.value) return
  isSubmitting.value = true
  try {
    const updated = await repositories.requests.updateStatus(
      {
        request_id: selectedRequest.value.id,
        status: newStatus.value,
        note: statusNote.value
      },
      authStore.currentUser?.id || 'admin'
    )

    isStatusModalOpen.value = false
    selectedRequest.value = updated
    await loadRequests()
  } finally {
    isSubmitting.value = false
  }
}

const totalPages = () => Math.ceil(totalRequests.value / itemsPerPage) || 1
</script>

<template>
  <div class="requests-page">
    <div class="page-header">
      <div class="breadcrumbs">
        <span class="crumb-root">Solicitudes</span>
        <span class="crumb-separator">&gt;</span>
        <span class="crumb-current">Todas</span>
      </div>
      <h1 class="page-title">Solicitudes de Servicios</h1>
      <p class="page-subtitle">Gestiona y da seguimiento a las solicitudes.</p>
    </div>

    <div class="tabs-container">
      <button
        v-for="tab in tabs"
        :key="tab.key"
        :class="['tab-btn', { active: activeTab === tab.key }]"
        @click="activeTab = tab.key"
      >
        {{ tab.label }}
      </button>
    </div>

    <div v-if="authStore.isEmployee" class="scope-toggle-bar">
      <button
        :class="['scope-pill', { active: employeeScope === 'assigned' }]"
        @click="employeeScope = 'assigned'"
      >
        Mis Asignaciones
      </button>
      <button
        :class="['scope-pill', { active: employeeScope === 'all' }]"
        @click="employeeScope = 'all'"
      >
        Todas las Solicitudes
      </button>
    </div>

    <div class="table-card">
      <div v-if="isLoading" class="loading-wrap">
        <div class="skeleton-row" v-for="i in 4" :key="i"></div>
      </div>

      <div v-else-if="displayedRequests.length === 0" class="empty-state">
        <p v-if="authStore.isEmployee && employeeScope === 'assigned'">
          No tienes solicitudes asignadas en este momento. El administrador te asignará tareas de tu especialidad.
        </p>
        <p v-else>No hay solicitudes en esta categoría.</p>
      </div>

      <div v-else class="table-responsive">
        <table class="data-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Cliente</th>
              <th>Servicio</th>
              <th>Fecha</th>
              <th>Estado</th>
              <th>SLA Radar</th>
              <th class="text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="req in displayedRequests" :key="req.id">
              <td class="req-number">{{ req.request_number }}</td>
              <td class="client-name">{{ req.client_name || 'Cliente' }}</td>
              <td class="service-name">{{ req.service_name || 'Servicio' }}</td>
              <td class="req-date">{{ formatDate(req.created_at) }}</td>
              <td>
                <StatusBadge :status="req.status" />
              </td>
              <td>
                <SlaRadarBadge :created-at="req.created_at" :current-status="req.status" :show-details="false" />
              </td>
              <td class="text-right">
                <div class="row-actions">
                  <button class="action-btn view" @click="openViewModal(req)" aria-label="Vista rápida">
                    <Eye :size="16" />
                  </button>
                  <button class="action-btn edit" @click="router.push(`/admin/requests/${req.id}`)" aria-label="Ver trazabilidad completa">
                    <ArrowRight :size="16" />
                  </button>
                  <button
                    v-if="authStore.isAdmin || isAssigned(req)"
                    class="action-btn edit"
                    @click="openStatusModal(req)"
                    aria-label="Cambiar estado"
                  >
                    <Edit2 :size="16" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="table-footer">
        <span class="showing-text">
          Mostrando 1-{{ requests.length }} de {{ totalRequests }}
        </span>

        <div class="pagination-bar" v-if="totalPages() > 1">
          <button
            class="page-btn"
            :disabled="currentPage === 1"
            @click="currentPage--; loadRequests()"
          >
            <ChevronLeft :size="16" />
          </button>

          <button
            v-for="p in totalPages()"
            :key="p"
            :class="['page-btn', { active: currentPage === p }]"
            @click="currentPage = p; loadRequests()"
          >
            {{ p }}
          </button>

          <button
            class="page-btn"
            :disabled="currentPage === totalPages()"
            @click="currentPage++; loadRequests()"
          >
            <ChevronRight :size="16" />
          </button>
        </div>
      </div>
    </div>

    <BaseModal v-model="isViewModalOpen" :title="`Detalle de Solicitud: ${selectedRequest?.request_number}`">
      <div v-if="selectedRequest" class="req-details-body">
        <div class="details-top-grid">
          <div class="info-block">
            <span class="info-label">Cliente</span>
            <span class="info-val">{{ selectedRequest.client_name }}</span>
            <span class="info-subval">{{ selectedRequest.client_email }}</span>
          </div>

          <div class="info-block">
            <span class="info-label">Servicio</span>
            <span class="info-val">{{ selectedRequest.service_name }}</span>
          </div>

          <div class="info-block">
            <span class="info-label">Fecha de registro</span>
            <span class="info-val">{{ formatDate(selectedRequest.created_at) }}</span>
          </div>

          <div class="info-block">
            <span class="info-label">Estado actual</span>
            <StatusBadge :status="selectedRequest.status" />
          </div>
        </div>

        <div class="desc-box">
          <h4 class="section-title">Descripción del requerimiento</h4>
          <p class="desc-text">{{ selectedRequest.description }}</p>
        </div>

        <div class="history-box">
          <h4 class="section-title">Historial de trazabilidad</h4>
          <div v-if="!selectedRequest.history || selectedRequest.history.length === 0" class="empty-history">
            Sin cambios de estado adicionales.
          </div>
          <div v-else class="timeline">
            <div v-for="h in selectedRequest.history" :key="h.id" class="timeline-item">
              <div class="timeline-dot"></div>
              <div class="timeline-content">
                <div class="timeline-head">
                  <span class="timeline-status">{{ getStatusLabel(h.new_status) }}</span>
                  <span class="timeline-date">{{ formatDate(h.created_at) }}</span>
                </div>
                <p class="timeline-note">{{ h.note || 'Sin nota adjunta' }}</p>
                <span class="timeline-author">Por: {{ h.changed_by_name || 'Sistema' }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <template #footer>
        <button class="btn btn-secondary" @click="isViewModalOpen = false">Cerrar</button>
        <button class="btn btn-primary" @click="isViewModalOpen = false; openStatusModal(selectedRequest!)">
          <span>Actualizar estado</span>
          <ArrowRight :size="16" />
        </button>
      </template>
    </BaseModal>

    <BaseModal v-model="isStatusModalOpen" :title="`Actualizar Estado: ${selectedRequest?.request_number}`">
      <div v-if="selectedRequest" class="modal-form-vertical">
        <div class="current-state-info">
          <span>Estado actual: </span>
          <StatusBadge :status="selectedRequest.status" />
        </div>

        <div class="form-group">
          <label class="form-label">Nuevo estado *</label>
          <select v-model="newStatus" class="status-select">
            <option value="pending">Pendiente</option>
            <option value="in_progress">En Proceso</option>
            <option value="completed">Finalizada</option>
          </select>
        </div>

        <div class="form-group">
          <label class="form-label">Nota explicativa para el cliente y auditoría</label>
          <textarea
            v-model="statusNote"
            rows="3"
            placeholder="Ej. Técnico asignado y trabajando en el requerimiento..."
          ></textarea>
        </div>
      </div>

      <template #footer>
        <button class="btn btn-secondary" @click="isStatusModalOpen = false">Cancelar</button>
        <button class="btn btn-primary" :disabled="isSubmitting" @click="handleSaveStatus">
          {{ isSubmitting ? 'Guardando...' : 'Confirmar cambio' }}
        </button>
      </template>
    </BaseModal>
  </div>
</template>

<style scoped>
.requests-page {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.breadcrumbs {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: var(--color-text-secondary);
  margin-bottom: 6px;
}

.crumb-separator {
  color: var(--color-text-muted);
}

.crumb-current {
  color: var(--color-blue-title);
  font-weight: 700;
}

.page-title {
  font-size: 24px;
  font-weight: 800;
  color: var(--color-blue-title);
}

.page-subtitle {
  font-size: 13px;
  color: var(--color-text-secondary);
}

.tabs-container {
  display: flex;
  align-items: center;
  gap: 10px;
  border-bottom: 1px solid var(--color-border);
  padding-bottom: 12px;
}

.tab-btn {
  padding: 8px 18px;
  font-size: 13px;
  font-weight: 600;
  border-radius: var(--radius-full);
  color: var(--color-text-secondary);
  background: transparent;
  transition: all var(--transition-fast);
}

.tab-btn:hover {
  background: #EDF2F7;
  color: var(--color-text-main);
}

.tab-btn.active {
  background: var(--color-primary);
  color: #FFFFFF;
  box-shadow: 0 4px 12px rgba(8, 123, 250, 0.25);
}

.table-card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-card);
  overflow: hidden;
}

.data-table th {
  padding: 16px 20px;
  font-size: 13px;
  font-weight: 700;
  color: var(--color-text-secondary);
  text-align: left;
  border-bottom: 1px solid var(--color-border);
  background: #FAFBFD;
}

.data-table td {
  padding: 16px 20px;
  font-size: 14px;
  color: var(--color-text-main);
  border-bottom: 1px solid var(--color-border);
  vertical-align: middle;
}

.req-number {
  font-weight: 800;
  color: var(--color-primary);
}

.client-name {
  font-weight: 600;
  color: var(--color-blue-title);
}

.service-name {
  font-weight: 500;
}

.req-date {
  color: var(--color-text-secondary);
}

.text-right {
  text-align: right;
}

.row-actions {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.action-btn {
  padding: 6px;
  border-radius: var(--radius-sm);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-text-secondary);
  background: #F1F5F9;
  border: 1px solid var(--color-border);
}

.action-btn.view:hover {
  color: var(--color-primary);
  background: #EBF5FF;
}

.action-btn.edit:hover {
  color: var(--color-warning);
  background: var(--color-warning-bg);
}

.table-footer {
  padding: 14px 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #FAFBFD;
}

.showing-text {
  font-size: 13px;
  color: var(--color-text-secondary);
}

.pagination-bar {
  display: flex;
  align-items: center;
  gap: 6px;
}

.page-btn {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-sm);
  border: 1px solid var(--color-border);
  background: #FFFFFF;
  color: var(--color-text-secondary);
  font-weight: 600;
  font-size: 12px;
}

.page-btn.active {
  background: var(--color-primary);
  color: #FFFFFF;
  border-color: var(--color-primary);
}

.req-details-body {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.details-top-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
  background: #F8FAFC;
  padding: 16px;
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border);
}

.info-block {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.info-label {
  font-size: 12px;
  font-weight: 600;
  color: var(--color-text-secondary);
}

.info-val {
  font-size: 14px;
  font-weight: 700;
  color: var(--color-blue-title);
}

.info-subval {
  font-size: 12px;
  color: var(--color-text-muted);
}

.desc-box {
  background: #FFFFFF;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  padding: 16px;
}

.section-title {
  font-size: 14px;
  font-weight: 700;
  color: var(--color-blue-title);
  margin-bottom: 8px;
}

.desc-text {
  font-size: 13px;
  color: var(--color-text-main);
  line-height: 1.5;
}

.timeline {
  display: flex;
  flex-direction: column;
  gap: 16px;
  position: relative;
  padding-left: 18px;
  border-left: 2px solid var(--color-border);
  margin-top: 12px;
}

.timeline-item {
  position: relative;
}

.timeline-dot {
  position: absolute;
  left: -24px;
  top: 4px;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background-color: var(--color-primary);
  border: 2px solid #FFFFFF;
}

.timeline-content {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.timeline-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.timeline-status {
  font-weight: 700;
  font-size: 13px;
  color: var(--color-blue-title);
}

.timeline-date {
  font-size: 11px;
  color: var(--color-text-muted);
}

.timeline-note {
  font-size: 12px;
  color: var(--color-text-secondary);
}

.timeline-author {
  font-size: 11px;
  color: var(--color-text-muted);
}

.modal-form-vertical {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.current-state-info {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  font-weight: 600;
  color: var(--color-text-main);
  padding-bottom: 10px;
  border-bottom: 1px solid var(--color-border);
}

.status-select {
  padding: 10px 14px;
}

.loading-wrap {
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.skeleton-row {
  height: 48px;
  background: #EDF2F7;
  border-radius: var(--radius-sm);
}

.empty-state {
  padding: 40px 20px;
  text-align: center;
  color: var(--color-text-secondary);
}

@media (max-width: 768px) {
  .table-responsive {
    overflow-x: auto;
  }
}

.scope-toggle-bar {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
}

.scope-pill {
  padding: 6px 14px;
  border-radius: 9999px;
  border: 1px solid #CBD5E1;
  background: #FFFFFF;
  color: #64748B;
  font-size: 12.5px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s ease;
}

.scope-pill.active {
  background: #087BFA;
  border-color: #087BFA;
  color: #FFFFFF;
}

.scope-pill:hover:not(.active) {
  border-color: #087BFA;
  color: #087BFA;
}
</style>
