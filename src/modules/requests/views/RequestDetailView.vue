<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  ChevronLeft,
  CheckCircle,
  Clock,
  Layers,
  User,
  Shield,
  FileText,
  AlertCircle
} from 'lucide-vue-next'
import { repositories } from '@/shared/infrastructure/provider'
import type { ServiceRequest } from '@/shared/types/request.types'
import { formatDate } from '@/shared/utils/formatters'
import StatusBadge from '@/shared/components/StatusBadge.vue'
import SlaRadarBadge from '../components/SlaRadarBadge.vue'
import TraceTimeline from '../components/TraceTimeline.vue'
import MatchEngine from '../components/MatchEngine.vue'
import ConnectClarifications from '../components/ConnectClarifications.vue'
import VerifiedDelivery from '../components/VerifiedDelivery.vue'
import { useAuthStore } from '@/modules/auth/auth.store'
import { useUiStore } from '@/shared/stores/ui.store'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const uiStore = useUiStore()

const request = ref<ServiceRequest | null>(null)
const isLoading = ref(true)
const errorMessage = ref<string | null>(null)
const statusNote = ref('')
const isUpdating = ref(false)

const requestId = computed(() => route.params.id as string)
const isStaff = computed(() => authStore.isStaff)

const isAssignedToCurrentUser = computed(() => {
  if (!request.value || !authStore.currentUser) return false
  const u = authStore.currentUser
  if (request.value.assigned_to && request.value.assigned_to === u.id) return true
  if (request.value.assigned_name && request.value.assigned_name.toLowerCase() === u.full_name.toLowerCase()) return true
  return false
})

async function loadRequest() {
  isLoading.value = true
  errorMessage.value = null
  try {
    const data = await repositories.requests.getRequestById(requestId.value)
    if (!data) {
      errorMessage.value = 'La solicitud no fue encontrada o no tienes permisos para consultarla.'
    } else {
      request.value = data
    }
  } catch (err: unknown) {
    errorMessage.value = err instanceof Error ? err.message : 'Error al cargar la solicitud'
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  loadRequest()
})

function goBack() {
  if (authStore.role === 'client') {
    router.push('/client/requests')
  } else {
    router.push('/admin/requests')
  }
}

async function handleStatusChange(newStatus: 'pending' | 'in_progress' | 'completed') {
  if (!request.value) return
  isUpdating.value = true
  try {
    const updated = await repositories.requests.updateStatus(
      {
        request_id: request.value.id,
        status: newStatus,
        note: statusNote.value.trim() || undefined
      },
      authStore.currentUser?.id || 'sys'
    )
    request.value = updated
    statusNote.value = ''
    uiStore.showToast('success', 'Estado actualizado', 'El estado de la solicitud fue modificado exitosamente.')
  } catch (err: unknown) {
    uiStore.showToast('error', 'Error operativo', err instanceof Error ? err.message : 'Error al actualizar estado')
  } finally {
    isUpdating.value = false
  }
}

async function handleAssign(empId: string, empName: string) {
  if (!request.value) return
  isUpdating.value = true
  try {
    const updated = await repositories.requests.assignSpecialist(request.value.id, empId, empName)
    request.value = updated
    uiStore.showToast('success', 'Especialista asignado', `Se ha asignado a ${empName} para atender esta solicitud.`)
  } catch (err: unknown) {
    uiStore.showToast('error', 'Error al asignar', err instanceof Error ? err.message : 'Error al asignar especialista')
  } finally {
    isUpdating.value = false
  }
}

function handleDelivered(_notes: string) {
  handleStatusChange('completed')
}

function handleAccepted(_rating: number) {
  if (request.value) {
    request.value.status = 'completed'
  }
}

function handleCorrectionRequested(_notes: string) {
  handleStatusChange('in_progress')
}
</script>

<template>
  <div class="request-detail-page">
    <div class="page-top-bar">
      <button class="back-link-btn" @click="goBack">
        <ChevronLeft :size="18" />
        <span>Volver a la lista</span>
      </button>

      <div v-if="request" class="top-status-group">
        <SlaRadarBadge
          :created-at="request.created_at"
          :current-status="request.status"
          :show-details="true"
        />
        <StatusBadge :status="request.status" />
      </div>
    </div>

    <div v-if="isLoading" class="loading-state">
      <div class="skeleton-banner"></div>
      <div class="skeleton-grid">
        <div class="skeleton-col"></div>
        <div class="skeleton-col"></div>
      </div>
    </div>

    <div v-else-if="errorMessage" class="error-card card">
      <AlertCircle :size="32" class="error-icon" />
      <p class="error-text">{{ errorMessage }}</p>
      <button class="btn btn-secondary" @click="goBack">Regresar</button>
    </div>

    <div v-else-if="request" class="detail-layout">
      <div class="main-column">
        <div class="card request-hero-card">
          <div class="folio-header">
            <span class="folio-tag">{{ request.request_number }}</span>
            <span class="hero-date">Creada: {{ formatDate(request.created_at) }}</span>
          </div>

          <h1 class="hero-service-name">{{ request.service_name || 'Servicio NEXORA' }}</h1>

          <div class="meta-pills-row">
            <div class="meta-pill">
              <Layers :size="14" />
              <span>Servicio Empresarial</span>
            </div>
            <div class="meta-pill">
              <User :size="14" />
              <span>Solicitante: {{ request.client_name || request.client_email }}</span>
            </div>
            <div v-if="request.assigned_name" class="meta-pill staff">
              <Shield :size="14" />
              <span>Asignado a: {{ request.assigned_name }}</span>
            </div>
          </div>

          <div class="desc-section">
            <h3 class="section-title">Descripción y Parámetros Intake</h3>
            <div class="desc-content-box">
              <p class="desc-text">{{ request.description }}</p>
            </div>
          </div>

          <div v-if="request.attachments && request.attachments.length > 0" class="attachments-section">
            <h3 class="section-title">Documentos Adjuntos</h3>
            <div class="attachments-grid">
              <div v-for="att in request.attachments" :key="att.id" class="attachment-item">
                <FileText :size="16" class="file-icon" />
                <span class="file-name">{{ att.original_filename }}</span>
              </div>
            </div>
          </div>
        </div>

        <MatchEngine
          v-if="authStore.isAdmin"
          :service-name="request.service_name"
          :current-assignee-id="request.assigned_to || undefined"
          :current-assignee-name="request.assigned_name"
          :is-staff="authStore.isAdmin"
          @assign="handleAssign"
        />

        <div v-else-if="authStore.isEmployee && request.assigned_name" class="card assignee-info-card">
          <div class="assignee-info-inner">
            <Shield :size="20" class="assignee-icon" />
            <div>
              <span class="assignee-label">Especialista Responsable</span>
              <span class="assignee-name-val">{{ request.assigned_name }}</span>
            </div>
          </div>
          <span v-if="isAssignedToCurrentUser" class="assigned-you-badge">Asignado a ti</span>
        </div>

        <VerifiedDelivery
          :request-id="request.id"
          :current-status="request.status"
          :is-client="authStore.role === 'client'"
          :is-staff="isStaff"
          @accepted="handleAccepted"
          @correction-requested="handleCorrectionRequested"
          @delivered="handleDelivered"
        />

        <ConnectClarifications
          :request-id="request.id"
          :current-user-role="authStore.role || 'client'"
          :current-user-id="authStore.currentUser?.id || 'anon'"
          :current-user-name="authStore.currentUser?.full_name || 'Usuario'"
        />

        <div v-if="authStore.isAdmin || isAssignedToCurrentUser" class="card staff-action-card">
          <h3 class="action-card-title">Gestión Operativa de Estado</h3>
          <p class="action-card-desc">Actualiza el avance de la orden de trabajo con registro inmutable en auditoría.</p>

          <div class="status-buttons-row">
            <button
              class="btn-status-act btn-in-prog"
              :disabled="isUpdating || request.status === 'in_progress'"
              @click="handleStatusChange('in_progress')"
            >
              <Clock :size="16" />
              <span>Marcar En Proceso</span>
            </button>

            <button
              class="btn-status-act btn-complete"
              :disabled="isUpdating || request.status === 'completed'"
              @click="handleStatusChange('completed')"
            >
              <CheckCircle :size="16" />
              <span>Finalizar y Entregar</span>
            </button>
          </div>
        </div>

        <div v-else-if="authStore.isEmployee && !isAssignedToCurrentUser" class="card not-assigned-notice">
          <AlertCircle :size="20" class="notice-icon" />
          <div class="notice-body">
            <span class="notice-title">Solicitud asignada a otro especialista</span>
            <p class="notice-desc">Esta orden de trabajo está asignada a {{ request.assigned_name || 'otro integrante' }}. Como colaborador, solo puedes actualizar el avance de tareas asignadas a tu expediente.</p>
          </div>
        </div>
      </div>

      <div class="side-column">
        <TraceTimeline
          :current-status="request.status"
          :created-at="request.created_at"
          :updated-at="request.updated_at"
          :assigned-to-name="request.assigned_name"
          :client-name="request.client_name"
          :history="request.history"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
.request-detail-page {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.page-top-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.back-link-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: transparent;
  color: var(--color-primary);
  font-size: 13.5px;
  font-weight: 700;
  cursor: pointer;
  padding: 6px 10px;
  border-radius: var(--radius-sm);
  transition: background-color var(--transition-fast);
}

.back-link-btn:hover {
  background-color: #EBF5FF;
}

.top-status-group {
  display: flex;
  align-items: center;
  gap: 12px;
}

.detail-layout {
  display: grid;
  grid-template-columns: 1.5fr 1fr;
  gap: 24px;
}

.main-column {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.side-column {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.request-hero-card {
  padding: 28px;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-card);
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.folio-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.folio-tag {
  font-size: 14px;
  font-weight: 800;
  color: var(--color-primary);
  background: #EBF5FF;
  padding: 4px 12px;
  border-radius: var(--radius-full);
  border: 1px solid #BAE6FD;
}

.hero-date {
  font-size: 12.5px;
  color: var(--color-text-secondary);
}

.hero-service-name {
  font-size: 24px;
  font-weight: 800;
  color: var(--color-blue-title);
  letter-spacing: -0.3px;
}

.meta-pills-row {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.meta-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 5px 12px;
  border-radius: var(--radius-full);
  background: #F8FAFC;
  border: 1px solid var(--color-border);
  font-size: 12px;
  color: var(--color-text-secondary);
  font-weight: 600;
}

.meta-pill.staff {
  background: #F3E8FF;
  color: var(--color-purple);
  border-color: #E9D5FF;
}

.section-title {
  font-size: 14px;
  font-weight: 700;
  color: var(--color-blue-title);
  margin-bottom: 8px;
}

.desc-content-box {
  background: #F8FAFC;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  padding: 16px;
}

.desc-text {
  font-size: 14px;
  color: var(--color-text-main);
  line-height: 1.6;
  white-space: pre-wrap;
}

.attachments-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.attachment-item {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 14px;
  border-radius: var(--radius-sm);
  background: #FFFFFF;
  border: 1px solid var(--color-border);
  font-size: 12.5px;
  color: var(--color-text-main);
}

.file-icon {
  color: var(--color-primary);
}

.staff-action-card {
  padding: 24px;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-card);
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.action-card-title {
  font-size: 15px;
  font-weight: 800;
  color: var(--color-blue-title);
}

.action-card-desc {
  font-size: 12.5px;
  color: var(--color-text-secondary);
}

.status-buttons-row {
  display: flex;
  gap: 12px;
  margin-top: 6px;
}

.btn-status-act {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 10px 18px;
  border-radius: var(--radius-sm);
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.btn-status-act:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-in-prog {
  background: #EBF5FF;
  color: var(--color-primary);
  border: 1px solid #BAE6FD;
}

.btn-in-prog:hover:not(:disabled) {
  background: var(--color-primary);
  color: #FFFFFF;
}

.btn-complete {
  background: #DCFCE7;
  color: var(--color-success);
  border: 1px solid #BBF7D0;
}

.btn-complete:hover:not(:disabled) {
  background: var(--color-success);
  color: #FFFFFF;
}

.loading-state {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.skeleton-banner {
  height: 180px;
  background: #E2E8F0;
  border-radius: var(--radius-md);
  animation: pulse 1.5s infinite;
}

.skeleton-grid {
  display: grid;
  grid-template-columns: 1.5fr 1fr;
  gap: 20px;
}

.skeleton-col {
  height: 350px;
  background: #E2E8F0;
  border-radius: var(--radius-md);
  animation: pulse 1.5s infinite;
}

.error-card {
  padding: 40px;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 14px;
}

.error-icon {
  color: var(--color-danger);
}

.error-text {
  font-size: 14px;
  color: var(--color-text-main);
  font-weight: 600;
}

@keyframes pulse {
  0%, 100% { opacity: 0.6; }
  50% { opacity: 0.3; }
}

.assignee-info-card {
  padding: 16px 20px;
  background: #F0FDF4;
  border: 1px solid #BBF7D0;
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.assignee-info-inner {
  display: flex;
  align-items: center;
  gap: 12px;
}

.assignee-icon {
  color: #16A34A;
}

.assignee-label {
  display: block;
  font-size: 11.5px;
  color: #166534;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.assignee-name-val {
  font-size: 14.5px;
  font-weight: 800;
  color: #14532D;
}

.assigned-you-badge {
  background: #16A34A;
  color: #FFFFFF;
  font-size: 11px;
  font-weight: 700;
  padding: 4px 10px;
  border-radius: 9999px;
}

.not-assigned-notice {
  padding: 16px 20px;
  background: #FFFBEB;
  border: 1px solid #FDE68A;
  border-radius: var(--radius-md);
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.notice-icon {
  color: #D97706;
  flex-shrink: 0;
  margin-top: 2px;
}

.notice-title {
  display: block;
  font-size: 13.5px;
  font-weight: 800;
  color: #92400E;
}

.notice-desc {
  margin: 4px 0 0;
  font-size: 12px;
  color: #B45309;
  line-height: 1.4;
}

@media (max-width: 992px) {
  .detail-layout {
    grid-template-columns: 1fr;
  }
}
</style>