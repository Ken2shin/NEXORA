<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import {
  ShieldAlert,
  ShieldCheck,
  Activity,
  Lock,
  Plus,
  CheckCircle
} from 'lucide-vue-next'
import { orgService } from '@/shared/infrastructure/adapters/mock/mock.organization.service'
import type { SecurityIncident, SecurityEvent } from '@/shared/types/organization.types'
import { formatDate } from '@/shared/utils/formatters'
import { useUiStore } from '@/shared/stores/ui.store'
import BaseModal from '@/shared/components/BaseModal.vue'

const uiStore = useUiStore()

const activeTab = ref<'incidents' | 'events' | 'defenses'>('incidents')
const incidents = ref<SecurityIncident[]>([])
const events = ref<SecurityEvent[]>([])
const isLoading = ref(true)

const searchQuery = ref('')
const severityFilter = ref('all')

const isIncidentModalOpen = ref(false)
const incTitle = ref('')
const incSeverity = ref<SecurityIncident['severity']>('high')
const incCategory = ref<SecurityIncident['category']>('brute_force')
const incSourceIp = ref('')
const incDesc = ref('')

const isMitigateModalOpen = ref(false)
const selectedIncident = ref<SecurityIncident | null>(null)
const mitigationAction = ref('')
const liveLatencyMs = ref(38)

async function loadData() {
  isLoading.value = true
  const t0 = performance.now()
  try {
    const [inc, ev] = await Promise.all([
      orgService.getSecurityIncidents(),
      orgService.getSecurityEvents()
    ])
    incidents.value = inc
    events.value = ev
    liveLatencyMs.value = Math.max(16, Math.round(performance.now() - t0))
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  loadData()
})

const activeIncidentsCount = computed(() => {
  return incidents.value.filter(i => i.status === 'open' || i.status === 'investigating').length
})

const mitigatedIncidentsCount = computed(() => {
  return incidents.value.filter(i => i.status === 'mitigated' || i.status === 'closed').length
})

const blockedEventsCount = computed(() => {
  return events.value.filter(e => e.status === 'blocked').length
})

const filteredIncidents = computed(() => {
  return incidents.value.filter(i => {
    const matchSearch = i.title.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      i.incident_number.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      i.source_ip.toLowerCase().includes(searchQuery.value.toLowerCase())
    const matchSev = severityFilter.value === 'all' || i.severity === severityFilter.value
    return matchSearch && matchSev
  })
})

async function handleCreateIncident() {
  if (!incTitle.value.trim() || !incDesc.value.trim()) {
    uiStore.showToast('error', 'Validación', 'Ingresa el título y descripción del incidente.')
    return
  }

  await orgService.createSecurityIncident({
    incident_number: `SEC-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
    title: incTitle.value.trim(),
    severity: incSeverity.value,
    category: incCategory.value,
    status: 'open',
    assigned_group_id: 'grp-4',
    assigned_group_name: 'Análisis de Vulnerabilidades & SOC',
    source_ip: incSourceIp.value.trim() || 'Desconocida',
    description: incDesc.value.trim()
  })

  uiStore.showToast('success', 'Incidente Registrado', 'El incidente fue registrado y asignado al equipo SOC.')
  isIncidentModalOpen.value = false
  incTitle.value = ''
  incDesc.value = ''
  incSourceIp.value = ''
  await loadData()
}

function openMitigateModal(inc: SecurityIncident) {
  selectedIncident.value = inc
  mitigationAction.value = inc.defensive_action || ''
  isMitigateModalOpen.value = true
}

async function handleSaveMitigation() {
  if (!selectedIncident.value || !mitigationAction.value.trim()) {
    uiStore.showToast('error', 'Validación', 'Describe la contramedida o acción defensiva aplicada.')
    return
  }

  await orgService.mitigateSecurityIncident(selectedIncident.value.id, mitigationAction.value.trim())
  uiStore.showToast('success', 'Incidente Mitigado', 'La acción defensiva fue registrada en la bitácora de seguridad.')
  isMitigateModalOpen.value = false
  selectedIncident.value = null
  mitigationAction.value = ''
  await loadData()
}

function getSeverityBadge(sev: SecurityIncident['severity']) {
  const map: Record<string, string> = {
    low: 'badge-gray',
    medium: 'badge-amber',
    high: 'badge-orange',
    critical: 'badge-red'
  }
  return map[sev] || 'badge-gray'
}
</script>

<template>
  <div class="security-portal-page">
    <div class="page-header">
      <div>
        <h1 class="page-title">Portal de Ciberseguridad Corporativa</h1>
        <p class="page-subtitle">Supervisión perimetral, auditoría de eventos de autenticación y gestión defensiva de incidentes de NEXORA.</p>
      </div>

      <button class="btn btn-primary" @click="isIncidentModalOpen = true">
        <Plus :size="16" />
        <span>Registrar Incidente</span>
      </button>
    </div>

    <div class="kpi-grid">
      <div class="kpi-card">
        <div class="kpi-icon icon-red">
          <ShieldAlert :size="22" />
        </div>
        <div class="kpi-info">
          <span class="kpi-label">Incidentes Activos</span>
          <span class="kpi-val">{{ activeIncidentsCount }}</span>
          <span class="kpi-desc">En investigación por SOC</span>
        </div>
      </div>

      <div class="kpi-card">
        <div class="kpi-icon icon-green">
          <ShieldCheck :size="22" />
        </div>
        <div class="kpi-info">
          <span class="kpi-label">Mitigados / Resueltos</span>
          <span class="kpi-val">{{ mitigatedIncidentsCount }}</span>
          <span class="kpi-desc">Contramedidas aplicadas</span>
        </div>
      </div>

      <div class="kpi-card">
        <div class="kpi-icon icon-amber">
          <Lock :size="22" />
        </div>
        <div class="kpi-info">
          <span class="kpi-label">Ataques Bloqueados (24h)</span>
          <span class="kpi-val">{{ blockedEventsCount }}</span>
          <span class="kpi-desc">Fuerza bruta & payload neutralizados</span>
        </div>
      </div>

      <div class="kpi-card">
        <div class="kpi-icon icon-blue">
          <Activity :size="22" />
        </div>
        <div class="kpi-info">
          <span class="kpi-label">Telemetría de Red</span>
          <span class="kpi-val">{{ liveLatencyMs }}ms</span>
          <span class="kpi-desc">Latencia Supabase PostgreSQL · SSL Activo</span>
        </div>
      </div>
    </div>

    <div class="portal-tabs">
      <button
        class="tab-btn"
        :class="{ active: activeTab === 'incidents' }"
        @click="activeTab = 'incidents'"
      >
        <ShieldAlert :size="16" />
        <span>Gestión de Incidentes</span>
        <span class="tab-badge">{{ incidents.length }}</span>
      </button>

      <button
        class="tab-btn"
        :class="{ active: activeTab === 'events' }"
        @click="activeTab = 'events'"
      >
        <Activity :size="16" />
        <span>Bitácora de Eventos y Accesos</span>
        <span class="tab-badge">{{ events.length }}</span>
      </button>

      <button
        class="tab-btn"
        :class="{ active: activeTab === 'defenses' }"
        @click="activeTab = 'defenses'"
      >
        <ShieldCheck :size="16" />
        <span>Defensas Perimetrales</span>
      </button>
    </div>

    <div v-if="activeTab === 'incidents'" class="content-view">
      <div class="filters-bar">
        <div class="search-box">
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Buscar por folio, título o IP de origen..."
            class="search-input"
          />
        </div>
        <select v-model="severityFilter" class="filter-select">
          <option value="all">Todas las severidades</option>
          <option value="critical">Crítica</option>
          <option value="high">Alta</option>
          <option value="medium">Media</option>
          <option value="low">Baja</option>
        </select>
      </div>

      <div class="incidents-grid">
        <div v-for="inc in filteredIncidents" :key="inc.id" class="incident-card">
          <div class="inc-header">
            <span class="inc-folio">{{ inc.incident_number }}</span>
            <span class="badge" :class="getSeverityBadge(inc.severity)">
              Severidad: {{ inc.severity }}
            </span>
          </div>

          <h3 class="inc-title">{{ inc.title }}</h3>
          <p class="inc-desc">{{ inc.description }}</p>

          <div class="inc-meta-box">
            <span>IP Origen: <strong class="font-mono">{{ inc.source_ip }}</strong></span>
            <span>Equipo Asignado: <strong>{{ inc.assigned_group_name }}</strong></span>
            <span>Fecha Detección: {{ formatDate(inc.reported_at) }}</span>
          </div>

          <div v-if="inc.defensive_action" class="mitigation-box">
            <CheckCircle :size="15" class="text-green" />
            <div>
              <strong>Acción defensiva aplicada:</strong>
              <p>{{ inc.defensive_action }}</p>
            </div>
          </div>

          <div class="inc-footer">
            <span
              class="badge"
              :class="{
                'badge-green': inc.status === 'mitigated' || inc.status === 'closed',
                'badge-amber': inc.status === 'investigating',
                'badge-red': inc.status === 'open'
              }"
            >
              {{ inc.status === 'mitigated' ? 'Mitigado' : (inc.status === 'closed' ? 'Cerrado' : (inc.status === 'investigating' ? 'Investigando' : 'Abierto')) }}
            </span>

            <button class="btn btn-sm btn-outline" @click="openMitigateModal(inc)">
              {{ inc.status === 'mitigated' ? 'Editar Mitigación' : 'Aplicar Mitigación' }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <div v-else-if="activeTab === 'events'" class="content-view">
      <div class="table-container">
        <table class="data-table">
          <thead>
            <tr>
              <th>Tipo de Evento</th>
              <th>Usuario / Identidad</th>
              <th>Dirección IP</th>
              <th>Agente de Usuario</th>
              <th>Estado</th>
              <th>Detalles</th>
              <th>Fecha y Hora</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="ev in events" :key="ev.id">
              <td class="bold font-mono">{{ ev.event_type }}</td>
              <td>{{ ev.user_email }}</td>
              <td class="font-mono">{{ ev.ip_address }}</td>
              <td class="text-muted font-sm">{{ ev.user_agent }}</td>
              <td>
                <span
                  class="badge"
                  :class="ev.status === 'allowed' ? 'badge-green' : (ev.status === 'blocked' ? 'badge-red' : 'badge-amber')"
                >
                  {{ ev.status === 'allowed' ? 'Permitido' : (ev.status === 'blocked' ? 'Bloqueado' : 'Auditado') }}
                </span>
              </td>
              <td class="font-sm">{{ ev.details }}</td>
              <td class="text-muted font-sm">{{ formatDate(ev.created_at) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div v-else-if="activeTab === 'defenses'" class="content-view">
      <div class="defenses-container">
        <div class="defense-row">
          <div class="def-icon"><ShieldCheck :size="24" class="text-green" /></div>
          <div class="def-body">
            <h4>Protección contra Inyecciones SQL y XSS</h4>
            <p>Sanitización estricta mediante validadores de esquema Zod, tipado seguro TypeScript y consultas con parámetros preparados.</p>
            <span class="badge badge-green">Activo · 100% Cobertura</span>
          </div>
        </div>

        <div class="defense-row">
          <div class="def-icon"><ShieldCheck :size="24" class="text-green" /></div>
          <div class="def-body">
            <h4>Aislamiento Criptográfico de Extremo a Extremo</h4>
            <p>Cifrado en navegador cliente mediante Web Crypto API (AES-GCM 256 bits). El servidor no posee claves maestras para descifrar contenido privado.</p>
            <span class="badge badge-green">E2EE Operativo</span>
          </div>
        </div>

        <div class="defense-row">
          <div class="def-icon"><ShieldCheck :size="24" class="text-green" /></div>
          <div class="def-body">
            <h4>Políticas de Seguridad a Nivel de Fila (PostgreSQL RLS)</h4>
            <p>Reglas granulares de Row Level Security que restringen consultas y mutaciones estrictamente al ámbito de usuario, grupo y departamento autorizado.</p>
            <span class="badge badge-green">Habilitado en Base de Datos</span>
          </div>
        </div>

        <div class="defense-row">
          <div class="def-icon"><ShieldCheck :size="24" class="text-green" /></div>
          <div class="def-body">
            <h4>Rate Limiting & Prevención de Fuerza Bruta</h4>
            <p>Límites configurados para autenticación, restablecimiento de contraseña y despacho de mensajes bidireccionales.</p>
            <span class="badge badge-green">En Forzamiento</span>
          </div>
        </div>
      </div>
    </div>

    <BaseModal
      v-model="isIncidentModalOpen"
      title="Registrar Incidente de Ciberseguridad"
    >
      <form class="modal-form" @submit.prevent="handleCreateIncident">
        <div class="form-group">
          <label>Título del Incidente *</label>
          <input v-model="incTitle" type="text" class="form-input" placeholder="Ej. Detección de intentos de autenticación anómalos" required />
        </div>

        <div class="form-row">
          <div class="form-group">
            <label>Severidad</label>
            <select v-model="incSeverity" class="form-select">
              <option value="low">Baja</option>
              <option value="medium">Media</option>
              <option value="high">Alta</option>
              <option value="critical">Crítica</option>
            </select>
          </div>

          <div class="form-group">
            <label>Categoría</label>
            <select v-model="incCategory" class="form-select">
              <option value="brute_force">Fuerza Bruta</option>
              <option value="unauthorized_access">Acceso No Autorizado</option>
              <option value="privilege_escalation">Escalamiento de Privilegios</option>
              <option value="ddos_anomaly">Tráfico Anómalo / DoS</option>
              <option value="data_leak">Riesgo de Fuga</option>
            </select>
          </div>
        </div>

        <div class="form-group">
          <label>Dirección IP de Origen</label>
          <input v-model="incSourceIp" type="text" class="form-input" placeholder="Ej. 185.220.101.44" />
        </div>

        <div class="form-group">
          <label>Descripción Técnica y Hallazgos *</label>
          <textarea v-model="incDesc" rows="4" class="form-textarea" placeholder="Detalla los vectores de entrada, payloads detectados y evidencias..." required></textarea>
        </div>

        <div class="modal-actions">
          <button type="button" class="btn btn-outline" @click="isIncidentModalOpen = false">Cancelar</button>
          <button type="submit" class="btn btn-primary">Registrar en SOC</button>
        </div>
      </form>
    </BaseModal>

    <BaseModal
      v-model="isMitigateModalOpen"
      title="Registrar Acción Defensiva / Mitigación"
    >
      <form class="modal-form" @submit.prevent="handleSaveMitigation">
        <div v-if="selectedIncident" class="inc-context-box">
          <div><strong>Incidente:</strong> {{ selectedIncident.incident_number }} - {{ selectedIncident.title }}</div>
          <div><strong>IP Origen:</strong> {{ selectedIncident.source_ip }} (Severidad: {{ selectedIncident.severity }})</div>
        </div>

        <div class="form-group">
          <label>Acción Defensiva Aplicada *</label>
          <textarea v-model="mitigationAction" rows="4" class="form-textarea" placeholder="Describe la contramedida aplicada: regla de firewall, revocación de token, parche de sanitización..." required></textarea>
        </div>

        <div class="modal-actions">
          <button type="button" class="btn btn-outline" @click="isMitigateModalOpen = false">Cancelar</button>
          <button type="submit" class="btn btn-primary">Confirmar Mitigación</button>
        </div>
      </form>
    </BaseModal>
  </div>
</template>

<style scoped>
.security-portal-page {
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
.icon-red { background: #FEF2F2; color: #EF4444; }

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

.tab-btn:hover {
  color: #087BFA;
}

.tab-btn.active {
  color: #087BFA;
  border-bottom-color: #087BFA;
}

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

.search-box {
  flex: 1;
  min-width: 260px;
}

.search-input, .filter-select {
  padding: 0.65rem 1rem;
  border-radius: 0.5rem;
  border: 1px solid #CBD5E1;
  font-size: 0.875rem;
  background: #FFFFFF;
}

.search-input {
  width: 100%;
}

.incidents-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 1.25rem;
}

.incident-card {
  background: #FFFFFF;
  border: 1px solid #E2E8F0;
  border-radius: 1rem;
  padding: 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.02);
}

.inc-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.inc-folio {
  font-family: monospace;
  font-weight: 700;
  color: #64748B;
  font-size: 0.8rem;
}

.inc-title {
  font-size: 1rem;
  font-weight: 700;
  color: #1E293B;
  line-height: 1.3;
}

.inc-desc {
  font-size: 0.85rem;
  color: #475569;
  line-height: 1.4;
}

.inc-meta-box {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  font-size: 0.75rem;
  color: #64748B;
  background: #F8FAFC;
  padding: 0.6rem;
  border-radius: 0.5rem;
}

.mitigation-box {
  background: #F0FDF4;
  border: 1px solid #BBF7D0;
  border-radius: 0.5rem;
  padding: 0.75rem;
  font-size: 0.82rem;
  color: #166534;
  display: flex;
  gap: 0.5rem;
}

.mitigation-box p {
  margin: 0.2rem 0 0 0;
}

.inc-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: auto;
  padding-top: 0.5rem;
  border-top: 1px solid #F1F5F9;
}

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

.defenses-container {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.defense-row {
  display: flex;
  gap: 1rem;
  padding: 1.25rem;
  background: #FFFFFF;
  border: 1px solid #E2E8F0;
  border-radius: 1rem;
}

.def-body {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.def-body h4 {
  font-size: 1rem;
  font-weight: 700;
  color: #1E293B;
  margin: 0;
}

.def-body p {
  font-size: 0.85rem;
  color: #64748B;
  margin: 0;
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
.badge-amber { background: #FEF3C7; color: #B45309; }
.badge-orange { background: #FFEDD5; color: #C2410C; }
.badge-red { background: #FEE2E2; color: #B91C1C; }
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
.form-input, .form-select, .form-textarea { padding: 0.65rem 0.85rem; border-radius: 0.5rem; border: 1px solid #CBD5E1; font-size: 0.875rem; outline: none; }
.form-input:focus, .form-select:focus, .form-textarea:focus { border-color: #087BFA; }
.modal-actions { display: flex; justify-content: flex-end; gap: 0.75rem; margin-top: 1rem; }
.inc-context-box { background: #F8FAFC; padding: 0.75rem; border-radius: 0.5rem; border: 1px solid #E2E8F0; font-size: 0.85rem; display: flex; flex-direction: column; gap: 0.25rem; }

.bold { font-weight: 700; }
.font-mono { font-family: monospace; }
.font-sm { font-size: 0.8rem; }
.text-muted { color: #64748B; }
.text-green { color: #10B981; }
</style>
