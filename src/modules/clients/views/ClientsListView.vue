<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import {
  Search,
  Eye,
  Edit2,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Filter
} from 'lucide-vue-next'
import { repositories } from '@/shared/infrastructure/provider'
import type { UserProfile } from '@/shared/types/user.types'
import type { ServiceRequest } from '@/shared/types/request.types'
import { formatDate } from '@/shared/utils/formatters'
import BaseModal from '@/shared/components/BaseModal.vue'
import StatusBadge from '@/shared/components/StatusBadge.vue'
import { useUiStore } from '@/shared/stores/ui.store'

const uiStore = useUiStore()

const clients = ref<UserProfile[]>([])
const totalClients = ref(0)
const isLoading = ref(true)

const searchQuery = ref('')
const selectedStatus = ref('all')
const currentPage = ref(1)
const itemsPerPage = 10

const isViewModalOpen = ref(false)
const isEditModalOpen = ref(false)
const selectedClient = ref<UserProfile | null>(null)
const clientRequests = ref<ServiceRequest[]>([])
const isLoadingRequests = ref(false)

const editFullName = ref('')
const editPhone = ref('')
const editIsActive = ref(true)
const isSubmitting = ref(false)

async function loadClients() {
  isLoading.value = true
  try {
    const res = await repositories.clients.getClients(searchQuery.value, currentPage.value, itemsPerPage)
    let filtered = res.data
    if (selectedStatus.value === 'active') {
      filtered = filtered.filter(c => c.is_active)
    } else if (selectedStatus.value === 'inactive') {
      filtered = filtered.filter(c => !c.is_active)
    }
    clients.value = filtered
    totalClients.value = res.total
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  loadClients()
})

let debounceTimer: ReturnType<typeof setTimeout> | null = null
watch(searchQuery, () => {
  if (debounceTimer) clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => {
    currentPage.value = 1
    loadClients()
  }, 300)
})

watch(selectedStatus, () => {
  currentPage.value = 1
  loadClients()
})

async function openViewModal(client: UserProfile) {
  selectedClient.value = client
  isViewModalOpen.value = true
  isLoadingRequests.value = true
  try {
    const res = await repositories.requests.getRequests({ client_id: client.id })
    clientRequests.value = res.data
  } finally {
    isLoadingRequests.value = false
  }
}

function openEditModal(client: UserProfile) {
  selectedClient.value = client
  editFullName.value = client.full_name
  editPhone.value = client.phone || ''
  editIsActive.value = client.is_active
  isEditModalOpen.value = true
}

async function handleUpdateClient() {
  if (!selectedClient.value) return
  isSubmitting.value = true
  try {
    await repositories.auth.updateProfile(selectedClient.value.id, {
      full_name: editFullName.value,
      phone: editPhone.value
    })
    await repositories.clients.toggleClientStatus(selectedClient.value.id, editIsActive.value)
    isEditModalOpen.value = false
    await loadClients()
  } finally {
    isSubmitting.value = false
  }
}

async function handleToggleStatus(client: UserProfile) {
  const willDeactivate = client.is_active
  const ok = await uiStore.confirm({
    title: willDeactivate ? 'Suspender cuenta de usuario' : 'Reactivar cuenta de usuario',
    message: willDeactivate
      ? `¿Estás seguro de suspender el acceso de ${client.full_name}?`
      : `¿Deseas reactivar el acceso de ${client.full_name}?`,
    consequence: willDeactivate
      ? 'El usuario no podrá iniciar sesión ni tramitar nuevas solicitudes hasta que sea reactivado.'
      : 'El usuario recuperará inmediatamente el acceso a sus servicios y portal.',
    confirmText: willDeactivate ? 'Suspender acceso' : 'Reactivar cuenta',
    isDanger: willDeactivate
  })

  if (ok) {
    await repositories.clients.toggleClientStatus(client.id, !client.is_active)
    uiStore.showToast('success', 'Estado actualizado', `La cuenta de ${client.full_name} fue actualizada correctamente.`)
    await loadClients()
  }
}

const totalPages = () => Math.ceil(totalClients.value / itemsPerPage) || 1
</script>

<template>
  <div class="clients-page">
    <div class="page-header">
      <div class="breadcrumbs">
        <span class="crumb-root">Usuarios</span>
        <span class="crumb-separator">&gt;</span>
        <span class="crumb-current">Clientes</span>
      </div>
      <h1 class="page-title">Clientes Registrados</h1>
      <p class="page-subtitle">Consulta la lista de usuarios del sistema.</p>
    </div>

    <div class="filters-bar">
      <div class="search-input-wrap">
        <Search :size="18" class="search-icon" />
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Buscar cliente..."
          class="search-input"
        />
      </div>

      <div class="status-filter-wrap">
        <Filter :size="16" class="filter-icon" />
        <select v-model="selectedStatus" class="filter-select">
          <option value="all">Todos</option>
          <option value="active">Activos</option>
          <option value="inactive">Inactivos</option>
        </select>
      </div>
    </div>

    <div class="table-card">
      <div v-if="isLoading" class="loading-wrap">
        <div class="skeleton-row" v-for="i in 4" :key="i"></div>
      </div>

      <div v-else-if="clients.length === 0" class="empty-state">
        <p>No se encontraron clientes registrados.</p>
      </div>

      <div v-else class="table-responsive">
        <table class="data-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Nombre</th>
              <th>Correo</th>
              <th>Estado</th>
              <th class="text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(client, index) in clients" :key="client.id">
              <td class="client-num">{{ String(index + 1).padStart(3, '0') }}</td>
              <td class="client-name">
                <div class="name-chip">
                  <img :src="client.avatar_path || '/images/illustrations/avatar-client.svg'" alt="" class="table-avatar" />
                  <span>{{ client.full_name }}</span>
                </div>
              </td>
              <td class="client-email">{{ client.email }}</td>
              <td>
                <span :class="['badge', client.is_active ? 'badge-active' : 'badge-pending']">
                  {{ client.is_active ? 'Activo' : 'Inactivo' }}
                </span>
              </td>
              <td class="text-right">
                <div class="row-actions">
                  <button class="action-btn view" @click="openViewModal(client)" aria-label="Ver ficha">
                    <Eye :size="16" />
                  </button>
                  <button class="action-btn edit" @click="openEditModal(client)" aria-label="Editar">
                    <Edit2 :size="16" />
                  </button>
                  <button
                    class="action-btn delete"
                    :class="{ suspended: !client.is_active }"
                    @click="handleToggleStatus(client)"
                    :aria-label="client.is_active ? 'Suspender cliente' : 'Activar cliente'"
                  >
                    <Trash2 :size="16" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="table-footer">
        <span class="showing-text">
          Mostrando 1-{{ clients.length }} de {{ totalClients }}
        </span>

        <div class="pagination-bar" v-if="totalPages() > 1">
          <button
            class="page-btn"
            :disabled="currentPage === 1"
            @click="currentPage--; loadClients()"
          >
            <ChevronLeft :size="16" />
          </button>

          <button
            v-for="p in totalPages()"
            :key="p"
            :class="['page-btn', { active: currentPage === p }]"
            @click="currentPage = p; loadClients()"
          >
            {{ p }}
          </button>

          <button
            class="page-btn"
            :disabled="currentPage === totalPages()"
            @click="currentPage++; loadClients()"
          >
            <ChevronRight :size="16" />
          </button>
        </div>
      </div>
    </div>

    <BaseModal v-model="isViewModalOpen" :title="`Ficha de Cliente: ${selectedClient?.full_name}`">
      <div v-if="selectedClient" class="client-detail-layout">
        <div class="client-summary-box">
          <img :src="selectedClient.avatar_path || '/images/illustrations/avatar-client.svg'" alt="" class="modal-client-avatar" />
          <div>
            <h4 class="modal-client-name">{{ selectedClient.full_name }}</h4>
            <p class="modal-client-email">{{ selectedClient.email }}</p>
            <p class="modal-client-phone">{{ selectedClient.phone || 'Sin teléfono registrado' }}</p>
            <span :class="['badge', selectedClient.is_active ? 'badge-active' : 'badge-pending']" style="margin-top: 8px;">
              {{ selectedClient.is_active ? 'Activo' : 'Inactivo' }}
            </span>
          </div>
        </div>

        <div class="client-history-section">
          <h4 class="history-title">Historial de solicitudes ({{ clientRequests.length }})</h4>
          <div v-if="isLoadingRequests" class="loading-requests">Cargando solicitudes...</div>
          <div v-else-if="clientRequests.length === 0" class="empty-requests">
            Este cliente no ha registrado solicitudes aún.
          </div>
          <div v-else class="requests-mini-list">
            <div v-for="req in clientRequests" :key="req.id" class="req-mini-card">
              <div class="req-mini-head">
                <span class="req-num">{{ req.request_number }}</span>
                <span class="req-service">{{ req.service_name }}</span>
                <StatusBadge :status="req.status" />
              </div>
              <p class="req-mini-desc">{{ req.description }}</p>
              <span class="req-mini-date">{{ formatDate(req.created_at) }}</span>
            </div>
          </div>
        </div>
      </div>

      <template #footer>
        <button class="btn btn-secondary" @click="isViewModalOpen = false">Cerrar</button>
      </template>
    </BaseModal>

    <BaseModal v-model="isEditModalOpen" title="Editar Información de Cliente">
      <div class="modal-form-vertical">
        <div class="form-group">
          <label class="form-label">Nombre completo</label>
          <input v-model="editFullName" type="text" />
        </div>

        <div class="form-group">
          <label class="form-label">Teléfono</label>
          <input v-model="editPhone" type="tel" />
        </div>

        <div class="form-group checkbox-row">
          <label class="checkbox-label">
            <input type="checkbox" v-model="editIsActive" />
            <span>Cuenta activa y habilitada para solicitar servicios</span>
          </label>
        </div>
      </div>

      <template #footer>
        <button class="btn btn-secondary" @click="isEditModalOpen = false">Cancelar</button>
        <button class="btn btn-primary" :disabled="isSubmitting" @click="handleUpdateClient">
          {{ isSubmitting ? 'Guardando...' : 'Guardar cambios' }}
        </button>
      </template>
    </BaseModal>
  </div>
</template>

<style scoped>
.clients-page {
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
  box-shadow: var(--shadow-xs);
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

.status-filter-wrap {
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

.client-num {
  font-weight: 700;
  color: var(--color-text-secondary);
  width: 60px;
}

.name-chip {
  display: flex;
  align-items: center;
  gap: 12px;
}

.table-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: #EBF3FF;
}

.client-name {
  font-weight: 600;
  color: var(--color-blue-title);
}

.client-email {
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

.action-btn.delete:hover {
  color: var(--color-danger);
  background: var(--color-danger-bg);
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

.client-detail-layout {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.client-summary-box {
  display: flex;
  align-items: center;
  gap: 16px;
  background: #F8FAFC;
  padding: 16px;
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border);
}

.modal-client-avatar {
  width: 56px;
  height: 56px;
  border-radius: 50%;
}

.modal-client-name {
  font-size: 16px;
  font-weight: 700;
  color: var(--color-blue-title);
}

.modal-client-email, .modal-client-phone {
  font-size: 13px;
  color: var(--color-text-secondary);
}

.history-title {
  font-size: 14px;
  font-weight: 700;
  color: var(--color-blue-title);
  margin-bottom: 12px;
}

.requests-mini-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  max-height: 240px;
  overflow-y: auto;
}

.req-mini-card {
  background: #FFFFFF;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.req-mini-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.req-num {
  font-weight: 800;
  color: var(--color-primary);
  font-size: 13px;
}

.req-service {
  font-weight: 600;
  font-size: 13px;
}

.req-mini-desc {
  font-size: 12px;
  color: var(--color-text-secondary);
}

.req-mini-date {
  font-size: 11px;
  color: var(--color-text-muted);
}

.modal-form-vertical {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-label {
  font-size: 13px;
  font-weight: 600;
  color: var(--color-text-main);
}

.checkbox-row {
  display: flex;
  align-items: center;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  font-weight: 600;
  color: var(--color-text-main);
  cursor: pointer;
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
</style>
