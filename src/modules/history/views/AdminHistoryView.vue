<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { Search, Download, Filter } from 'lucide-vue-next'
import { repositories } from '@/shared/infrastructure/provider'
import type { ServiceRequest } from '@/shared/types/request.types'
import { formatDate } from '@/shared/utils/formatters'
import { exportToCsv } from '@/shared/utils/csv'
import StatusBadge from '@/shared/components/StatusBadge.vue'

const requests = ref<ServiceRequest[]>([])
const isLoading = ref(true)
const searchQuery = ref('')
const selectedStatus = ref('all')

async function loadHistory() {
  isLoading.value = true
  try {
    const res = await repositories.requests.getRequests({ limit: 100 })
    requests.value = res.data
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  loadHistory()
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
      (r.client_name && r.client_name.toLowerCase().includes(q)) ||
      (r.service_name && r.service_name.toLowerCase().includes(q))
    )
  }
  return list
})

function handleExportCsv() {
  const headers = ['Número', 'Cliente', 'Correo', 'Servicio', 'Fecha Creación', 'Estado', 'Última Actualización']
  const rows = filteredRequests.value.map(r => [
    r.request_number,
    r.client_name || 'N/A',
    r.client_email || 'N/A',
    r.service_name || 'N/A',
    formatDate(r.created_at),
    r.status,
    formatDate(r.updated_at)
  ])
  exportToCsv('nexora_historial_solicitudes', headers, rows)
}
</script>

<template>
  <div class="history-page">
    <div class="page-header">
      <div class="header-main">
        <div>
          <h1 class="page-title">Historial Administrativo</h1>
          <p class="page-subtitle">Registro cronológico de todas las solicitudes procesadas por la empresa.</p>
        </div>
        <button class="btn btn-secondary" @click="handleExportCsv">
          <Download :size="16" />
          <span>Exportar CSV</span>
        </button>
      </div>
    </div>

    <div class="filters-bar">
      <div class="search-input-wrap">
        <Search :size="18" class="search-icon" />
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Buscar por cliente, servicio o número..."
          class="search-input"
        />
      </div>

      <div class="filter-wrap">
        <Filter :size="16" class="filter-icon" />
        <select v-model="selectedStatus" class="filter-select">
          <option value="all">Todos los estados</option>
          <option value="pending">Pendientes</option>
          <option value="in_progress">En Proceso</option>
          <option value="completed">Finalizadas</option>
        </select>
      </div>
    </div>

    <div class="table-card">
      <div v-if="isLoading" class="loading-wrap">
        <div class="skeleton-row" v-for="i in 5" :key="i"></div>
      </div>

      <div v-else-if="filteredRequests.length === 0" class="empty-state">
        <p>No se encontraron registros con los filtros seleccionados.</p>
      </div>

      <div v-else class="table-responsive">
        <table class="data-table">
          <thead>
            <tr>
              <th>Número</th>
              <th>Cliente</th>
              <th>Servicio</th>
              <th>Fecha Creación</th>
              <th>Última Actualización</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="req in filteredRequests" :key="req.id">
              <td class="req-number">{{ req.request_number }}</td>
              <td class="client-name">{{ req.client_name }}</td>
              <td class="service-name">{{ req.service_name }}</td>
              <td class="date-cell">{{ formatDate(req.created_at) }}</td>
              <td class="date-cell">{{ formatDate(req.updated_at) }}</td>
              <td>
                <StatusBadge :status="req.status" />
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<style scoped>
.history-page {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.header-main {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.page-title {
  font-size: 24px;
  font-weight: 800;
  color: var(--color-blue-title);
}

.page-subtitle {
  font-size: 13px;
  color: var(--color-text-secondary);
  margin-top: 2px;
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
  max-width: 400px;
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

.date-cell {
  color: var(--color-text-secondary);
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
</style>
