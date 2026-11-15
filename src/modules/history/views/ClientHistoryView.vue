<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { Search, Eye, Filter } from 'lucide-vue-next'
import { repositories } from '@/shared/infrastructure/provider'
import type { ServiceRequest } from '@/shared/types/request.types'
import { formatDate, getStatusLabel } from '@/shared/utils/formatters'
import { useAuthStore } from '@/modules/auth/auth.store'
import StatusBadge from '@/shared/components/StatusBadge.vue'
import BaseModal from '@/shared/components/BaseModal.vue'
import SlaRadarBadge from '@/modules/requests/components/SlaRadarBadge.vue'
import { useRouter } from 'vue-router'

const router = useRouter()

const authStore = useAuthStore()
const requests = ref<ServiceRequest[]>([])
const isLoading = ref(true)

const searchQuery = ref('')
const selectedStatus = ref('all')
const selectedRequest = ref<ServiceRequest | null>(null)
const isModalOpen = ref(false)

onMounted(async () => {
  if (authStore.currentUser) {
    isLoading.value = true
    try {
      const res = await repositories.requests.getRequests({
        client_id: authStore.currentUser.id,
        limit: 100
      })
      requests.value = res.data
    } finally {
      isLoading.value = false
    }
  }
})

const filteredRequests = computed(() => {
  let list = requests.value

  if (selectedStatus.value !== 'all') {
    list = list.filter(r => r.status === selectedStatus.value)
  }

  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase().trim()
    list = list.filter(r =>
      r.request_number.toLowerCase().includes(q) ||
      (r.service_name && r.service_name.toLowerCase().includes(q)) ||
      r.description.toLowerCase().includes(q)
    )
  }

  return list
})

function viewDetails(req: ServiceRequest) {
  selectedRequest.value = req
  isModalOpen.value = true
}
</script>

<template>
  <div class="client-history-page">
    <div class="page-header">
      <div class="breadcrumbs">
        <span class="crumb-root">Mis Solicitudes</span>
        <span class="crumb-separator">&gt;</span>
        <span class="crumb-current">Historial</span>
      </div>
      <h1 class="page-title">Historial de Solicitudes</h1>
      <p class="page-subtitle">Consulta el historial de tus solicitudes.</p>
    </div>

    <div class="filters-bar">
      <div class="search-input-wrap">
        <Search :size="18" class="search-icon" />
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Buscar..."
          class="search-input"
        />
      </div>

      <div class="filter-wrap">
        <Filter :size="16" class="filter-icon" />
        <select v-model="selectedStatus" class="filter-select">
          <option value="all">Todos</option>
          <option value="pending">Pendiente</option>
          <option value="in_progress">En Proceso</option>
          <option value="completed">Finalizada</option>
        </select>
      </div>
    </div>

    <div class="table-card">
      <div v-if="isLoading" class="loading-wrap">
        <div class="skeleton-row" v-for="i in 3" :key="i"></div>
      </div>

      <div v-else-if="filteredRequests.length === 0" class="empty-state">
        <p>No se encontraron solicitudes registradas.</p>
      </div>

      <div v-else class="table-responsive">
        <table class="data-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Servicio</th>
              <th>Fecha</th>
              <th>Estado</th>
              <th>SLA Radar</th>
              <th class="text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="req in filteredRequests" :key="req.id">
              <td class="req-number">{{ req.request_number }}</td>
              <td class="service-name">{{ req.service_name }}</td>
              <td class="req-date">{{ formatDate(req.created_at) }}</td>
              <td>
                <StatusBadge :status="req.status" />
              </td>
              <td>
                <SlaRadarBadge :created-at="req.created_at" :current-status="req.status" :show-details="false" />
              </td>
              <td class="text-right">
                <button class="action-btn view" @click="viewDetails(req)" aria-label="Ver detalle">
                  <Eye :size="16" />
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <BaseModal v-model="isModalOpen" :title="`Detalle de Solicitud: ${selectedRequest?.request_number}`">
      <div v-if="selectedRequest" class="req-detail-content">
        <div class="meta-row">
          <div class="meta-item">
            <span class="meta-label">Servicio</span>
            <span class="meta-val">{{ selectedRequest.service_name }}</span>
          </div>
          <div class="meta-item">
            <span class="meta-label">Fecha de envío</span>
            <span class="meta-val">{{ formatDate(selectedRequest.created_at) }}</span>
          </div>
          <div class="meta-item">
            <span class="meta-label">Estado</span>
            <StatusBadge :status="selectedRequest.status" />
          </div>
        </div>

        <div class="desc-panel">
          <h4 class="panel-heading">Descripción solicitada</h4>
          <p class="panel-text">{{ selectedRequest.description }}</p>
        </div>

        <div class="tracking-panel">
          <h4 class="panel-heading">Trazabilidad de la solicitud</h4>
          <div v-if="!selectedRequest.history || selectedRequest.history.length === 0" class="empty-track">
            Tu solicitud está en cola de atención.
          </div>
          <div v-else class="tracking-timeline">
            <div v-for="h in selectedRequest.history" :key="h.id" class="track-node">
              <div class="node-circle"></div>
              <div class="node-info">
                <div class="node-top">
                  <span class="node-status">{{ getStatusLabel(h.new_status) }}</span>
                  <span class="node-time">{{ formatDate(h.created_at) }}</span>
                </div>
                <p class="node-note">{{ h.note || 'Actualización de estado registrada' }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <template #footer>
        <button class="btn btn-secondary" @click="isModalOpen = false">Cerrar</button>
        <button v-if="selectedRequest" class="btn btn-primary" @click="router.push(`/client/requests/${selectedRequest.id}`)">
          Ver trazabilidad completa
        </button>
      </template>
    </BaseModal>
  </div>
</template>

<style scoped>
.client-history-page {
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

.filters-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  background: var(--color-surface);
  padding: 12px 18px;
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border);
}

.search-input-wrap {
  position: relative;
  display: flex;
  align-items: center;
  flex: 1;
  max-width: 380px;
}

.search-icon {
  position: absolute;
  left: 12px;
  color: var(--color-text-muted);
}

.search-input {
  width: 100%;
  padding: 8px 12px 8px 38px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  background: #F8FAFC;
}

.filter-wrap {
  display: flex;
  align-items: center;
  gap: 8px;
}

.filter-icon {
  color: var(--color-text-secondary);
}

.filter-select {
  padding: 8px 16px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  background: #F8FAFC;
  font-size: 13px;
  font-weight: 600;
  color: var(--color-text-secondary);
  cursor: pointer;
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

.service-name {
  font-weight: 600;
  color: var(--color-blue-title);
}

.req-date {
  color: var(--color-text-secondary);
}

.text-right {
  text-align: right;
}

.action-btn {
  padding: 6px;
  border-radius: var(--radius-sm);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: var(--color-text-secondary);
  background: #F1F5F9;
  border: 1px solid var(--color-border);
}

.action-btn:hover {
  color: var(--color-primary);
  background: #EBF5FF;
}

.req-detail-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.meta-row {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  background: #F8FAFC;
  padding: 16px;
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border);
}

.meta-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.meta-label {
  font-size: 12px;
  color: var(--color-text-secondary);
  font-weight: 600;
}

.meta-val {
  font-size: 14px;
  font-weight: 700;
  color: var(--color-blue-title);
}

.desc-panel {
  background: #FFFFFF;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  padding: 16px;
}

.panel-heading {
  font-size: 14px;
  font-weight: 700;
  color: var(--color-blue-title);
  margin-bottom: 6px;
}

.panel-text {
  font-size: 13px;
  color: var(--color-text-main);
  line-height: 1.5;
}

.tracking-timeline {
  display: flex;
  flex-direction: column;
  gap: 14px;
  position: relative;
  padding-left: 18px;
  border-left: 2px solid var(--color-border);
  margin-top: 10px;
}

.track-node {
  position: relative;
}

.node-circle {
  position: absolute;
  left: -24px;
  top: 4px;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: var(--color-primary);
  border: 2px solid #FFFFFF;
}

.node-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.node-status {
  font-size: 13px;
  font-weight: 700;
  color: var(--color-blue-title);
}

.node-time {
  font-size: 11px;
  color: var(--color-text-muted);
}

.node-note {
  font-size: 12px;
  color: var(--color-text-secondary);
  margin-top: 2px;
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

@media (max-width: 640px) {
  .meta-row {
    grid-template-columns: 1fr;
  }
}
</style>
