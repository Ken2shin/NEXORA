<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import {
  Scale,
  ShieldCheck,
  FileCheck,
  MessageSquare,
  Plus,
  Clock,
  CheckCircle,
  FolderOpen
} from 'lucide-vue-next'
import { orgService } from '@/shared/infrastructure/adapters/mock/mock.organization.service'
import type { LegalCase, LegalContract, LegalInternalRequest } from '@/shared/types/organization.types'
import { formatDate } from '@/shared/utils/formatters'
import { useUiStore } from '@/shared/stores/ui.store'
import BaseModal from '@/shared/components/BaseModal.vue'

const uiStore = useUiStore()

const activeTab = ref<'cases' | 'contracts' | 'requests' | 'compliance'>('cases')
const legalCases = ref<LegalCase[]>([])
const legalContracts = ref<LegalContract[]>([])
const legalRequests = ref<LegalInternalRequest[]>([])
const isLoading = ref(true)

const searchQuery = ref('')
const statusFilter = ref('all')

const isCaseModalOpen = ref(false)
const caseTitle = ref('')
const caseType = ref<LegalCase['case_type']>('contract')
const caseLawyer = ref('Lic. Sofía Ramos')
const caseDueDate = ref('')
const caseDescription = ref('')

const isRequestModalOpen = ref(false)
const reqRequester = ref('')
const reqDept = ref('Tecnología')
const reqSubject = ref('')
const reqDesc = ref('')
const reqUrgency = ref<LegalInternalRequest['urgency']>('medium')

const isAnswerModalOpen = ref(false)
const selectedRequest = ref<LegalInternalRequest | null>(null)
const answerText = ref('')

async function loadData() {
  isLoading.value = true
  try {
    const [c, k, r] = await Promise.all([
      orgService.getLegalCases(),
      orgService.getLegalContracts(),
      orgService.getLegalRequests()
    ])
    legalCases.value = c
    legalContracts.value = k
    legalRequests.value = r
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  loadData()
})

const activeCasesCount = computed(() => {
  return legalCases.value.filter(c => c.status === 'open' || c.status === 'in_review').length
})

const activeContractsCount = computed(() => {
  return legalContracts.value.filter(c => c.status === 'active').length
})

const pendingRequestsCount = computed(() => {
  return legalRequests.value.filter(r => r.status === 'pending').length
})

const filteredCases = computed(() => {
  return legalCases.value.filter(c => {
    const matchSearch = c.title.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      c.case_number.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      c.responsible_lawyer.toLowerCase().includes(searchQuery.value.toLowerCase())
    const matchStatus = statusFilter.value === 'all' || c.status === statusFilter.value
    return matchSearch && matchStatus
  })
})

const filteredContracts = computed(() => {
  return legalContracts.value.filter(c => {
    const matchSearch = c.title.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      c.contract_number.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      c.parties.some(p => p.toLowerCase().includes(searchQuery.value.toLowerCase()))
    const matchStatus = statusFilter.value === 'all' || c.status === statusFilter.value
    return matchSearch && matchStatus
  })
})

const filteredRequests = computed(() => {
  return legalRequests.value.filter(r => {
    const matchSearch = r.subject.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      r.requester_name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      r.request_number.toLowerCase().includes(searchQuery.value.toLowerCase())
    const matchStatus = statusFilter.value === 'all' || r.status === statusFilter.value
    return matchSearch && matchStatus
  })
})

async function handleCreateCase() {
  if (!caseTitle.value.trim() || !caseDescription.value.trim()) {
    uiStore.showToast('error', 'Validación', 'Completa el título y descripción del expediente.')
    return
  }

  await orgService.createLegalCase({
    case_number: `EXP-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
    title: caseTitle.value.trim(),
    case_type: caseType.value,
    responsible_lawyer: caseLawyer.value,
    status: 'open',
    opening_date: new Date().toISOString().split('T')[0] ?? '',
    due_date: caseDueDate.value || undefined,
    description: caseDescription.value.trim(),
    document_count: 1
  })

  uiStore.showToast('success', 'Expediente Abierto', 'El caso legal ha sido registrado con folio oficial.')
  isCaseModalOpen.value = false
  caseTitle.value = ''
  caseDescription.value = ''
  caseDueDate.value = ''
  await loadData()
}

async function handleCreateRequest() {
  if (!reqRequester.value.trim() || !reqSubject.value.trim() || !reqDesc.value.trim()) {
    uiStore.showToast('error', 'Validación', 'Por favor llena los campos obligatorios.')
    return
  }

  await orgService.createLegalRequest({
    request_number: `REQ-LEG-${Math.floor(100 + Math.random() * 900)}`,
    requester_name: reqRequester.value.trim(),
    requester_dept: reqDept.value,
    subject: reqSubject.value.trim(),
    description: reqDesc.value.trim(),
    urgency: reqUrgency.value
  })

  uiStore.showToast('success', 'Consulta Enviada', 'Tu solicitud fue recibida por el departamento legal.')
  isRequestModalOpen.value = false
  reqRequester.value = ''
  reqSubject.value = ''
  reqDesc.value = ''
  await loadData()
}

function openAnswerModal(req: LegalInternalRequest) {
  selectedRequest.value = req
  answerText.value = req.response || ''
  isAnswerModalOpen.value = true
}

async function handleSaveAnswer() {
  if (!selectedRequest.value || !answerText.value.trim()) {
    uiStore.showToast('error', 'Validación', 'Escribe el dictamen o respuesta legal.')
    return
  }

  await orgService.answerLegalRequest(selectedRequest.value.id, answerText.value.trim())
  uiStore.showToast('success', 'Dictamen Guardado', 'La consulta ha sido respondida y notificada.')
  isAnswerModalOpen.value = false
  selectedRequest.value = null
  answerText.value = ''
  await loadData()
}

function getCaseTypeBadge(type: LegalCase['case_type']) {
  const map: Record<string, string> = {
    contract: 'badge-blue',
    labor: 'badge-purple',
    compliance: 'badge-green',
    intellectual_property: 'badge-amber',
    litigation: 'badge-red'
  }
  return map[type] || 'badge-gray'
}

function getCaseTypeLabel(type: LegalCase['case_type']) {
  const map: Record<string, string> = {
    contract: 'Contractual',
    labor: 'Laboral',
    compliance: 'Cumplimiento',
    intellectual_property: 'Propiedad Intelectual',
    litigation: 'Litigio'
  }
  return map[type] || type
}

function getUrgencyBadge(urgency: LegalInternalRequest['urgency']) {
  const map: Record<string, string> = {
    low: 'badge-gray',
    medium: 'badge-blue',
    high: 'badge-amber',
    urgent: 'badge-red'
  }
  return map[urgency] || 'badge-gray'
}
</script>

<template>
  <div class="legal-portal-page">
    <div class="page-header">
      <div>
        <h1 class="page-title">Portal de Asesoría Legal</h1>
        <p class="page-subtitle">Gestión de expedientes jurídicos, contratos mercantiles, asesorías internas y cumplimiento normativo.</p>
      </div>

      <div class="header-actions">
        <button class="btn btn-outline" @click="isRequestModalOpen = true">
          <MessageSquare :size="16" />
          <span>Solicitar Asesoría</span>
        </button>
        <button class="btn btn-primary" @click="isCaseModalOpen = true">
          <Plus :size="16" />
          <span>Nuevo Expediente</span>
        </button>
      </div>
    </div>

    <div class="kpi-grid">
      <div class="kpi-card">
        <div class="kpi-icon icon-blue">
          <Scale :size="22" />
        </div>
        <div class="kpi-info">
          <span class="kpi-label">Expedientes Activos</span>
          <span class="kpi-val">{{ activeCasesCount }}</span>
          <span class="kpi-desc">Procesos en revisión</span>
        </div>
      </div>

      <div class="kpi-card">
        <div class="kpi-icon icon-green">
          <FileCheck :size="22" />
        </div>
        <div class="kpi-info">
          <span class="kpi-label">Contratos Vigentes</span>
          <span class="kpi-val">{{ activeContractsCount }}</span>
          <span class="kpi-desc">Convenios con validez legal</span>
        </div>
      </div>

      <div class="kpi-card">
        <div class="kpi-icon icon-amber">
          <Clock :size="22" />
        </div>
        <div class="kpi-info">
          <span class="kpi-label">Consultas Pendientes</span>
          <span class="kpi-val">{{ pendingRequestsCount }}</span>
          <span class="kpi-desc">Asesorías por dictaminar</span>
        </div>
      </div>

      <div class="kpi-card">
        <div class="kpi-icon icon-purple">
          <ShieldCheck :size="22" />
        </div>
        <div class="kpi-info">
          <span class="kpi-label">Índice Cumplimiento</span>
          <span class="kpi-val">99.2%</span>
          <span class="kpi-desc">Blindaje legal empresarial</span>
        </div>
      </div>
    </div>

    <div class="portal-tabs">
      <button
        class="tab-btn"
        :class="{ active: activeTab === 'cases' }"
        @click="activeTab = 'cases'"
      >
        <Scale :size="16" />
        <span>Expedientes Legales</span>
        <span class="tab-badge">{{ legalCases.length }}</span>
      </button>

      <button
        class="tab-btn"
        :class="{ active: activeTab === 'contracts' }"
        @click="activeTab = 'contracts'"
      >
        <FileCheck :size="16" />
        <span>Contratos y Convenios</span>
        <span class="tab-badge">{{ legalContracts.length }}</span>
      </button>

      <button
        class="tab-btn"
        :class="{ active: activeTab === 'requests' }"
        @click="activeTab = 'requests'"
      >
        <MessageSquare :size="16" />
        <span>Asesorías Internas</span>
        <span class="tab-badge">{{ legalRequests.length }}</span>
      </button>

      <button
        class="tab-btn"
        :class="{ active: activeTab === 'compliance' }"
        @click="activeTab = 'compliance'"
      >
        <ShieldCheck :size="16" />
        <span>Matriz de Cumplimiento</span>
      </button>
    </div>

    <div v-if="activeTab !== 'compliance'" class="filters-bar">
      <div class="search-box">
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Buscar por número, título, abogado o parte..."
          class="search-input"
        />
      </div>
      <div class="filter-controls">
        <select v-model="statusFilter" class="filter-select">
          <option value="all">Todos los estados</option>
          <option value="open">Abierto / Pendiente</option>
          <option value="in_review">En Revisión / Análisis</option>
          <option value="resolved">Resuelto / Vigente</option>
          <option value="active">Activo</option>
        </select>
      </div>
    </div>

    <div v-if="activeTab === 'cases'" class="content-view">
      <div class="table-container">
        <table class="data-table">
          <thead>
            <tr>
              <th>Folio</th>
              <th>Título del Expediente</th>
              <th>Tipo</th>
              <th>Abogado Responsable</th>
              <th>Apertura</th>
              <th>Vencimiento</th>
              <th>Documentos</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="c in filteredCases" :key="c.id">
              <td class="bold font-mono">{{ c.case_number }}</td>
              <td>
                <div class="case-title-box">
                  <span class="main-title">{{ c.title }}</span>
                  <span class="sub-desc">{{ c.description }}</span>
                </div>
              </td>
              <td>
                <span class="badge" :class="getCaseTypeBadge(c.case_type)">
                  {{ getCaseTypeLabel(c.case_type) }}
                </span>
              </td>
              <td class="lawyer-cell">
                <div class="lawyer-pill">
                  <div class="avatar-dot"></div>
                  <span>{{ c.responsible_lawyer }}</span>
                </div>
              </td>
              <td class="text-muted">{{ formatDate(c.opening_date) }}</td>
              <td class="text-muted">{{ c.due_date ? formatDate(c.due_date) : 'Sin límite' }}</td>
              <td>
                <div class="doc-badge">
                  <FolderOpen :size="14" />
                  <span>{{ c.document_count }} docs</span>
                </div>
              </td>
              <td>
                <span
                  class="badge"
                  :class="{
                    'badge-green': c.status === 'resolved',
                    'badge-blue': c.status === 'in_review',
                    'badge-amber': c.status === 'open',
                    'badge-gray': c.status === 'archived'
                  }"
                >
                  {{ c.status === 'resolved' ? 'Resuelto' : c.status === 'in_review' ? 'En Revisión' : c.status === 'open' ? 'Abierto' : 'Archivado' }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div v-else-if="activeTab === 'contracts'" class="content-view">
      <div class="table-container">
        <table class="data-table">
          <thead>
            <tr>
              <th>Contrato</th>
              <th>Descripción</th>
              <th>Tipo</th>
              <th>Partes</th>
              <th>Vigencia</th>
              <th>Renovación Auto</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="k in filteredContracts" :key="k.id">
              <td class="bold font-mono">{{ k.contract_number }}</td>
              <td class="bold">{{ k.title }}</td>
              <td>
                <span class="badge badge-purple">{{ k.contract_type }}</span>
              </td>
              <td>
                <div class="parties-list">
                  <span v-for="(p, i) in k.parties" :key="i" class="party-tag">{{ p }}</span>
                </div>
              </td>
              <td class="text-muted">{{ formatDate(k.effective_date) }} - {{ formatDate(k.expiration_date) }}</td>
              <td>
                <span class="badge" :class="k.auto_renew ? 'badge-green' : 'badge-gray'">
                  {{ k.auto_renew ? 'Sí' : 'No' }}
                </span>
              </td>
              <td>
                <span
                  class="badge"
                  :class="{
                    'badge-green': k.status === 'active',
                    'badge-amber': k.status === 'in_negotiation',
                    'badge-blue': k.status === 'draft',
                    'badge-red': k.status === 'expired' || k.status === 'terminated'
                  }"
                >
                  {{ k.status === 'active' ? 'Vigente' : k.status === 'in_negotiation' ? 'Negociación' : k.status === 'draft' ? 'Borrador' : 'Vencido' }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div v-else-if="activeTab === 'requests'" class="content-view">
      <div class="requests-grid">
        <div v-for="req in filteredRequests" :key="req.id" class="req-card">
          <div class="req-card-header">
            <span class="req-code">{{ req.request_number }}</span>
            <span class="badge" :class="getUrgencyBadge(req.urgency)">
              Urgencia: {{ req.urgency }}
            </span>
          </div>

          <h3 class="req-title">{{ req.subject }}</h3>
          <p class="req-desc">{{ req.description }}</p>

          <div class="req-meta">
            <span>Solicitante: <strong>{{ req.requester_name }}</strong> ({{ req.requester_dept }})</span>
            <span>Fecha: {{ formatDate(req.created_at) }}</span>
          </div>

          <div v-if="req.response" class="req-response-box">
            <div class="response-header">
              <CheckCircle :size="15" class="text-green" />
              <strong>Dictamen Legal:</strong>
            </div>
            <p>{{ req.response }}</p>
          </div>

          <div class="req-card-footer">
            <span
              class="badge"
              :class="{
                'badge-green': req.status === 'answered',
                'badge-blue': req.status === 'in_analysis',
                'badge-amber': req.status === 'pending'
              }"
            >
              {{ req.status === 'answered' ? 'Respondida' : req.status === 'in_analysis' ? 'En Análisis' : 'Pendiente' }}
            </span>

            <button class="btn btn-sm btn-outline" @click="openAnswerModal(req)">
              {{ req.response ? 'Modificar Dictamen' : 'Dictaminar Asesoría' }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <div v-else-if="activeTab === 'compliance'" class="content-view">
      <div class="compliance-container">
        <div class="compliance-header">
          <ShieldCheck :size="28" class="text-blue" />
          <div>
            <h3>Matriz de Cumplimiento Regulatorio y Blindaje Jurídico</h3>
            <p>Protocolos auditables de seguridad normativa, protección de datos y propiedad intelectual empresarial.</p>
          </div>
        </div>

        <div class="compliance-grid">
          <div class="comp-item">
            <div class="comp-icon"><CheckCircle :size="20" class="text-green" /></div>
            <div class="comp-body">
              <h4>Protección de Datos Personales (GDPR / LFPDPPP)</h4>
              <p>Avisos de privacidad actualizados, consentimiento explícito de usuarios y políticas de retención activas.</p>
              <span class="badge badge-green">Auditado 100%</span>
            </div>
          </div>

          <div class="comp-item">
            <div class="comp-icon"><CheckCircle :size="20" class="text-green" /></div>
            <div class="comp-body">
              <h4>Propiedad Intelectual y Software</h4>
              <p>Registro de marca NEXORA, cesión de derechos de código fuente y patentes de algoritmos propios.</p>
              <span class="badge badge-green">Protegido</span>
            </div>
          </div>

          <div class="comp-item">
            <div class="comp-icon"><CheckCircle :size="20" class="text-green" /></div>
            <div class="comp-body">
              <h4>Acuerdos de Confidencialidad (NDA)</h4>
              <p>Cláusulas de secreto industrial firmadas para el 100% de los empleados y proveedores externos.</p>
              <span class="badge badge-green">Vigente</span>
            </div>
          </div>

          <div class="comp-item">
            <div class="comp-icon"><CheckCircle :size="20" class="text-green" /></div>
            <div class="comp-body">
              <h4>Cumplimiento Laboral y Seguridad Social</h4>
              <p>Contratos de trabajo individualizados, constancias fiscales y reglamentos internos de trabajo.</p>
              <span class="badge badge-green">En regla</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <BaseModal
      v-model="isCaseModalOpen"
      title="Nuevo Expediente Legal"
    >
      <form class="modal-form" @submit.prevent="handleCreateCase">
        <div class="form-group">
          <label>Título del Asunto o Expediente *</label>
          <input v-model="caseTitle" type="text" class="form-input" placeholder="Ej. Registro de Marca y Patente de Software" required />
        </div>

        <div class="form-row">
          <div class="form-group">
            <label>Materia Jurídica</label>
            <select v-model="caseType" class="form-select">
              <option value="contract">Contractual</option>
              <option value="labor">Laboral</option>
              <option value="compliance">Cumplimiento / Regulatorio</option>
              <option value="intellectual_property">Propiedad Intelectual</option>
              <option value="litigation">Litigio o Controversia</option>
            </select>
          </div>

          <div class="form-group">
            <label>Abogado Responsable</label>
            <input v-model="caseLawyer" type="text" class="form-input" required />
          </div>
        </div>

        <div class="form-group">
          <label>Fecha Límite / Vencimiento</label>
          <input v-model="caseDueDate" type="date" class="form-input" />
        </div>

        <div class="form-group">
          <label>Descripción y Antecedentes *</label>
          <textarea v-model="caseDescription" rows="4" class="form-textarea" placeholder="Detalla el alcance jurídico y las acciones requeridas..." required></textarea>
        </div>

        <div class="modal-actions">
          <button type="button" class="btn btn-outline" @click="isCaseModalOpen = false">Cancelar</button>
          <button type="submit" class="btn btn-primary">Registrar Expediente</button>
        </div>
      </form>
    </BaseModal>

    <BaseModal
      v-model="isRequestModalOpen"
      title="Solicitar Dictamen o Asesoría Legal"
    >
      <form class="modal-form" @submit.prevent="handleCreateRequest">
        <div class="form-row">
          <div class="form-group">
            <label>Nombre del Solicitante *</label>
            <input v-model="reqRequester" type="text" class="form-input" placeholder="Tu nombre completo" required />
          </div>
          <div class="form-group">
            <label>Departamento</label>
            <select v-model="reqDept" class="form-select">
              <option value="Tecnología">Tecnología</option>
              <option value="Ciberseguridad">Ciberseguridad</option>
              <option value="Recursos Humanos">Recursos Humanos</option>
              <option value="Finanzas">Finanzas</option>
              <option value="Operaciones">Operaciones</option>
            </select>
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label>Asunto de la Consulta *</label>
            <input v-model="reqSubject" type="text" class="form-input" placeholder="Ej. Revisión cláusula de rescisión contrato SaaS" required />
          </div>
          <div class="form-group">
            <label>Urgencia</label>
            <select v-model="reqUrgency" class="form-select">
              <option value="low">Baja</option>
              <option value="medium">Media</option>
              <option value="high">Alta</option>
              <option value="urgent">Urgente</option>
            </select>
          </div>
        </div>

        <div class="form-group">
          <label>Detalle de la Consulta Jurídica *</label>
          <textarea v-model="reqDesc" rows="4" class="form-textarea" placeholder="Explica tu duda o describe el documento a evaluar..." required></textarea>
        </div>

        <div class="modal-actions">
          <button type="button" class="btn btn-outline" @click="isRequestModalOpen = false">Cancelar</button>
          <button type="submit" class="btn btn-primary">Enviar Consulta</button>
        </div>
      </form>
    </BaseModal>

    <BaseModal
      v-model="isAnswerModalOpen"
      title="Emitir Dictamen Jurídico"
    >
      <form class="modal-form" @submit.prevent="handleSaveAnswer">
        <div v-if="selectedRequest" class="req-context-box">
          <div class="context-item">
            <strong>Solicitud:</strong> {{ selectedRequest.request_number }} - {{ selectedRequest.subject }}
          </div>
          <div class="context-item">
            <strong>Solicitante:</strong> {{ selectedRequest.requester_name }} ({{ selectedRequest.requester_dept }})
          </div>
          <div class="context-desc">
            {{ selectedRequest.description }}
          </div>
        </div>

        <div class="form-group">
          <label>Dictamen / Respuesta Legal *</label>
          <textarea v-model="answerText" rows="5" class="form-textarea" placeholder="Escribe la opinión legal, fundamento y recomendaciones..." required></textarea>
        </div>

        <div class="modal-actions">
          <button type="button" class="btn btn-outline" @click="isAnswerModalOpen = false">Cancelar</button>
          <button type="submit" class="btn btn-primary">Guardar y Notificar</button>
        </div>
      </form>
    </BaseModal>
  </div>
</template>

<style scoped>
.legal-portal-page {
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

.header-actions {
  display: flex;
  gap: 0.75rem;
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
}

.search-box {
  flex: 1;
  min-width: 260px;
}

.search-input {
  width: 100%;
  padding: 0.65rem 1rem;
  border-radius: 0.5rem;
  border: 1px solid #CBD5E1;
  font-size: 0.875rem;
  outline: none;
}

.search-input:focus {
  border-color: #087BFA;
  box-shadow: 0 0 0 3px rgba(8, 123, 250, 0.15);
}

.filter-select {
  padding: 0.65rem 1rem;
  border-radius: 0.5rem;
  border: 1px solid #CBD5E1;
  font-size: 0.875rem;
  background: #FFFFFF;
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
  font-size: 0.875rem;
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

.case-title-box {
  display: flex;
  flex-direction: column;
}

.main-title {
  font-weight: 700;
  color: #1E293B;
}

.sub-desc {
  font-size: 0.75rem;
  color: #64748B;
  max-width: 380px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.lawyer-cell {
  white-space: nowrap;
}

.lawyer-pill {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.25rem 0.6rem;
  background: #F1F5F9;
  border-radius: 9999px;
  font-weight: 600;
  font-size: 0.8rem;
  color: #334155;
}

.avatar-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #087BFA;
}

.doc-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  color: #475569;
  font-size: 0.8rem;
  font-weight: 600;
}

.parties-list {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}

.party-tag {
  font-size: 0.75rem;
  background: #F8FAFC;
  border: 1px solid #E2E8F0;
  padding: 0.15rem 0.4rem;
  border-radius: 0.25rem;
  color: #475569;
}

.requests-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 1.25rem;
}

.req-card {
  background: #FFFFFF;
  border: 1px solid #E2E8F0;
  border-radius: 1rem;
  padding: 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.02);
}

.req-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.req-code {
  font-family: monospace;
  font-weight: 700;
  color: #64748B;
  font-size: 0.8rem;
}

.req-title {
  font-size: 1rem;
  font-weight: 700;
  color: #1E293B;
  line-height: 1.3;
}

.req-desc {
  font-size: 0.85rem;
  color: #475569;
  line-height: 1.4;
}

.req-meta {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  font-size: 0.75rem;
  color: #64748B;
  background: #F8FAFC;
  padding: 0.6rem;
  border-radius: 0.5rem;
}

.req-response-box {
  background: #F0FDF4;
  border: 1px solid #BBF7D0;
  border-radius: 0.5rem;
  padding: 0.75rem;
  font-size: 0.85rem;
  color: #166534;
}

.response-header {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  margin-bottom: 0.3rem;
}

.req-card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: auto;
  padding-top: 0.5rem;
  border-top: 1px solid #F1F5F9;
}

.compliance-container {
  background: #FFFFFF;
  border-radius: 1rem;
  border: 1px solid #E2E8F0;
  padding: 1.5rem;
}

.compliance-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #E2E8F0;
}

.compliance-header h3 {
  font-size: 1.15rem;
  font-weight: 700;
  color: #1E293B;
}

.compliance-header p {
  font-size: 0.85rem;
  color: #64748B;
}

.compliance-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1.25rem;
}

.comp-item {
  display: flex;
  gap: 0.75rem;
  padding: 1.25rem;
  background: #F8FAFC;
  border-radius: 0.75rem;
  border: 1px solid #E2E8F0;
}

.comp-body {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.comp-body h4 {
  font-size: 0.95rem;
  font-weight: 700;
  color: #1E293B;
}

.comp-body p {
  font-size: 0.8rem;
  color: #64748B;
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
  transition: all 0.2s ease;
  border: none;
}

.btn-primary {
  background: #087BFA;
  color: #FFFFFF;
}

.btn-primary:hover {
  background: #0662C7;
}

.btn-outline {
  background: #FFFFFF;
  border: 1px solid #CBD5E1;
  color: #334155;
}

.btn-outline:hover {
  background: #F8FAFC;
  border-color: #94A3B8;
}

.btn-sm {
  padding: 0.4rem 0.75rem;
  font-size: 0.75rem;
}

.modal-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.form-group label {
  font-size: 0.8rem;
  font-weight: 600;
  color: #475569;
}

.form-input, .form-select, .form-textarea {
  padding: 0.65rem 0.85rem;
  border-radius: 0.5rem;
  border: 1px solid #CBD5E1;
  font-size: 0.875rem;
  outline: none;
}

.form-input:focus, .form-select:focus, .form-textarea:focus {
  border-color: #087BFA;
  box-shadow: 0 0 0 3px rgba(8, 123, 250, 0.15);
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  margin-top: 1rem;
}

.req-context-box {
  background: #F8FAFC;
  padding: 0.75rem;
  border-radius: 0.5rem;
  border: 1px solid #E2E8F0;
  font-size: 0.85rem;
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
}

.context-desc {
  margin-top: 0.3rem;
  padding-top: 0.3rem;
  border-top: 1px dashed #CBD5E1;
  color: #475569;
}

.bold { font-weight: 700; }
.font-mono { font-family: monospace; }
.text-muted { color: #64748B; }
.text-blue { color: #087BFA; }
.text-green { color: #10B981; }
</style>
