<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import {
  MessageSquare,
  ShieldCheck,
  Send,
  Paperclip,
  CheckCircle,
  XCircle,
  ArrowRightLeft,
  Lock,
  Plus,
  HelpCircle,
  Sparkles
} from 'lucide-vue-next'
import { conversationsService, type SmartClassification } from '@/shared/infrastructure/adapters/mock/mock.conversations.service'
import { orgService } from '@/shared/infrastructure/adapters/mock/mock.organization.service'
import type { Conversation, ConversationMessage, Department, WorkGroup } from '@/shared/types/organization.types'
import { useAuthStore } from '@/modules/auth/auth.store'
import { useUiStore } from '@/shared/stores/ui.store'
import { formatRelativeTime } from '@/shared/utils/formatters'
import BaseModal from '@/shared/components/BaseModal.vue'

interface Props {
  forcedDepartmentId?: string
  forcedClientId?: string
}

const props = defineProps<Props>()

const authStore = useAuthStore()
const uiStore = useUiStore()

const currentUser = computed(() => authStore.currentUser)
const isClient = computed(() => authStore.isClient)

const conversations = ref<Conversation[]>([])
const selectedConv = ref<Conversation | null>(null)
const messages = ref<Array<ConversationMessage & { decryptedContent?: string }>>([])
const isLoading = ref(true)

const searchQuery = ref('')
const statusFilter = ref('all')

const messageInput = ref('')
const isInternalNote = ref(false)
const selectedAttachmentName = ref<string | null>(null)

const isNewConvModalOpen = ref(false)
const newSubject = ref('')
const newInitialQuery = ref('')
const smartRecommendation = ref<SmartClassification | null>(null)

const isTransferModalOpen = ref(false)
const transferDeptId = ref('')
const transferGroupId = ref('')
const transferReason = ref('')
const departments = ref<Department[]>([])
const groups = ref<WorkGroup[]>([])

const isRejectSolutionModalOpen = ref(false)
const rejectionReason = ref('')

watch(newInitialQuery, (val) => {
  if (val.trim().length >= 8) {
    smartRecommendation.value = conversationsService.classifyClientNeed(val)
  } else {
    smartRecommendation.value = null
  }
})

async function loadConversations() {
  isLoading.value = true
  try {
    const filters: { clientId?: string; departmentId?: string; status?: string } = {}
    if (isClient.value && currentUser.value) {
      filters.clientId = currentUser.value.id
    } else if (props.forcedDepartmentId) {
      filters.departmentId = props.forcedDepartmentId
    }

    conversations.value = await conversationsService.getConversations(filters)
    if (conversations.value.length > 0 && !selectedConv.value) {
      await selectConversation(conversations.value[0]!)
    }
  } finally {
    isLoading.value = false
  }
}

async function selectConversation(conv: Conversation) {
  selectedConv.value = conv
  await loadMessages()
}

async function loadMessages() {
  if (!selectedConv.value || !currentUser.value) return
  messages.value = await conversationsService.getMessages(
    selectedConv.value.id,
    currentUser.value.id,
    currentUser.value.role
  )
}

onMounted(async () => {
  const [d, g] = await Promise.all([
    orgService.getDepartments(),
    orgService.getGroups()
  ])
  departments.value = d
  groups.value = g
  await loadConversations()
})

const filteredConversations = computed(() => {
  return conversations.value.filter(c => {
    const q = searchQuery.value.toLowerCase()
    const matchSearch = c.subject.toLowerCase().includes(q) ||
      c.conversation_number.toLowerCase().includes(q) ||
      c.client_name.toLowerCase().includes(q) ||
      c.department_name.toLowerCase().includes(q)
    const matchStatus = statusFilter.value === 'all' || c.status === statusFilter.value
    return matchSearch && matchStatus
  })
})

const filteredGroupsForTransfer = computed(() => {
  if (!transferDeptId.value) return []
  return groups.value.filter(g => g.department_id === transferDeptId.value)
})

async function handleSendMessage() {
  if (!selectedConv.value || !currentUser.value) return
  if (!messageInput.value.trim() && !selectedAttachmentName.value) return

  const text = messageInput.value.trim()
  const internal = isInternalNote.value
  const att = selectedAttachmentName.value || undefined

  messageInput.value = ''
  selectedAttachmentName.value = null
  isInternalNote.value = false

  await conversationsService.sendMessage({
    conversationId: selectedConv.value.id,
    senderId: currentUser.value.id,
    senderName: currentUser.value.full_name,
    senderRole: currentUser.value.role,
    plainText: text,
    isInternal: internal,
    attachmentName: att
  })

  await loadMessages()
  await loadConversations()
}

function handleFileSelect(e: Event) {
  const target = e.target as HTMLInputElement
  if (target.files && target.files[0]) {
    selectedAttachmentName.value = target.files[0].name
  }
}

async function handleCreateConversation() {
  if (!currentUser.value || !newInitialQuery.value.trim()) {
    uiStore.showToast('error', 'Validación', 'Por favor describe tu consulta.')
    return
  }

  const conv = await conversationsService.createConversation({
    clientId: currentUser.value.id,
    clientName: currentUser.value.full_name,
    clientEmail: currentUser.value.email,
    subject: newSubject.value.trim() || 'Consulta de Soporte',
    initialQuery: newInitialQuery.value.trim(),
    category: smartRecommendation.value?.category
  })

  uiStore.showToast('success', 'Conversación Iniciada', 'Canal cifrado de extremo a extremo habilitado.')
  isNewConvModalOpen.value = false
  newSubject.value = ''
  newInitialQuery.value = ''
  smartRecommendation.value = null

  await loadConversations()
  await selectConversation(conv)
}

async function handleProposeSolution() {
  if (!selectedConv.value || !currentUser.value) return
  const ok = await uiStore.confirm({
    title: 'Proponer Solución al Cliente',
    message: '¿Consideras que la consulta técnica ha quedado resuelta?',
    consequence: 'Se enviará un mensaje formal al cliente solicitando su confirmación antes del cierre definitivo.',
    confirmText: 'Proponer Solución'
  })
  if (!ok) return

  await conversationsService.proposeSolution(
    selectedConv.value.id,
    currentUser.value.id,
    currentUser.value.full_name
  )
  uiStore.showToast('success', 'Solución Propuesta', 'Se solicitó confirmación de servicio al cliente.')
  await loadMessages()
  await loadConversations()
}

async function handleConfirmSolution() {
  if (!selectedConv.value || !currentUser.value) return
  await conversationsService.respondToSolution(
    selectedConv.value.id,
    currentUser.value.id,
    currentUser.value.full_name,
    true
  )
  uiStore.showToast('success', 'Resolución Confirmada', 'Gracias por confirmar la solución de tu consulta.')
  await loadMessages()
  await loadConversations()
}

function openRejectSolutionModal() {
  rejectionReason.value = ''
  isRejectSolutionModalOpen.value = true
}

async function handleRejectSolution() {
  if (!selectedConv.value || !currentUser.value) return
  await conversationsService.respondToSolution(
    selectedConv.value.id,
    currentUser.value.id,
    currentUser.value.full_name,
    false,
    rejectionReason.value.trim()
  )
  uiStore.showToast('info', 'Conversación Activa', 'Tu requerimiento continúa en atención.')
  isRejectSolutionModalOpen.value = false
  rejectionReason.value = ''
  await loadMessages()
  await loadConversations()
}

async function handleCloseConversation() {
  if (!selectedConv.value || !currentUser.value) return
  const ok = await uiStore.confirm({
    title: 'Cierre Formal de Conversación',
    message: `¿Deseas cerrar la conversación ${selectedConv.value.conversation_number}?`,
    consequence: 'El historial cifrado quedará archivado y disponible para consulta o eventual reapertura.',
    confirmText: 'Cerrar Conversación'
  })
  if (!ok) return

  await conversationsService.closeConversation(
    selectedConv.value.id,
    currentUser.value.id,
    'confirmed_solution'
  )
  uiStore.showToast('success', 'Conversación Cerrada', 'El caso ha sido archivado conforme al protocolo de atención.')
  await loadMessages()
  await loadConversations()
}

async function handleReopenConversation() {
  if (!selectedConv.value || !currentUser.value) return
  await conversationsService.reopenConversation(
    selectedConv.value.id,
    currentUser.value.id,
    currentUser.value.full_name,
    'El cliente reporta que el problema reapareció.'
  )
  uiStore.showToast('success', 'Caso Reabierto', 'La conversación se ha reactivado en la bandeja del equipo responsable.')
  await loadMessages()
  await loadConversations()
}

function openTransferModal() {
  transferDeptId.value = departments.value[0]?.id || ''
  transferGroupId.value = ''
  transferReason.value = ''
  isTransferModalOpen.value = true
}

async function handleTransferConversation() {
  if (!selectedConv.value || !currentUser.value || !transferDeptId.value || !transferReason.value.trim()) {
    uiStore.showToast('error', 'Validación', 'Selecciona el departamento destino e indica el motivo de la transferencia.')
    return
  }

  const targetDept = departments.value.find(d => d.id === transferDeptId.value)
  const targetGrp = groups.value.find(g => g.id === transferGroupId.value)

  await conversationsService.transferConversation({
    conversationId: selectedConv.value.id,
    toDeptId: transferDeptId.value,
    toDeptName: targetDept?.name || 'Departamento Destino',
    toGroupId: transferGroupId.value || undefined,
    toGroupName: targetGrp?.name || undefined,
    transferredBy: currentUser.value.full_name,
    reason: transferReason.value.trim()
  })

  uiStore.showToast('success', 'Conversación Derivada', `El caso fue transferido a ${targetDept?.name} conservando el historial.`)
  isTransferModalOpen.value = false
  await loadMessages()
  await loadConversations()
}

async function handleDeleteMessage(msg: ConversationMessage, mode: 'for_me' | 'for_all') {
  if (!currentUser.value) return
  const ok = await uiStore.confirm({
    title: mode === 'for_all' ? 'Eliminar para todos' : 'Eliminar para mí',
    message: mode === 'for_all'
      ? '¿Deseas eliminar este mensaje para todos los participantes?'
      : '¿Deseas ocultar este mensaje en tu vista?',
    consequence: mode === 'for_all'
      ? 'El contenido cifrado será reemplazado por un marcador de eliminación en todos los dispositivos.'
      : 'Solo tú dejarás de ver el mensaje.',
    confirmText: 'Eliminar',
    isDanger: true
  })
  if (!ok) return

  await conversationsService.deleteMessage(msg.id, currentUser.value.id, mode)
  uiStore.showToast('info', 'Mensaje eliminado', 'La acción fue procesada correctamente.')
  await loadMessages()
}

function getStatusBadge(status: Conversation['status']) {
  const map: Record<string, string> = {
    new: 'badge-blue',
    pending_assignment: 'badge-amber',
    assigned: 'badge-purple',
    in_progress: 'badge-blue',
    waiting_client: 'badge-amber',
    solution_proposed: 'badge-green',
    resolved: 'badge-green',
    closed: 'badge-gray'
  }
  return map[status] || 'badge-gray'
}

function getStatusLabel(status: Conversation['status']) {
  const map: Record<string, string> = {
    new: 'Nueva',
    pending_assignment: 'Pendiente Asignación',
    assigned: 'Asignada',
    in_progress: 'En Atención',
    waiting_client: 'Esperando al Cliente',
    solution_proposed: 'Solución Propuesta',
    resolved: 'Resuelta',
    closed: 'Cerrada'
  }
  return map[status] || status
}
</script>

<template>
  <div class="workspace-shell">
    <div class="inbox-pane">
      <div class="inbox-header">
        <div class="inbox-title-row">
          <div class="inbox-title-box">
            <MessageSquare :size="20" class="text-blue" />
            <h2 class="inbox-title">Conversaciones y Soporte</h2>
          </div>
          <button class="btn btn-sm btn-primary" @click="isNewConvModalOpen = true">
            <Plus :size="15" />
            <span>Nueva Consulta</span>
          </button>
        </div>

        <div class="inbox-search">
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Buscar por folio, cliente o asunto..."
            class="search-input"
          />
        </div>

        <div class="inbox-filters">
          <select v-model="statusFilter" class="filter-select">
            <option value="all">Todas las conversaciones</option>
            <option value="in_progress">En Atención</option>
            <option value="waiting_client">Esperando al Cliente</option>
            <option value="solution_proposed">Solución Propuesta</option>
            <option value="resolved">Resueltas</option>
            <option value="closed">Cerradas</option>
          </select>
        </div>
      </div>

      <div class="conversation-list">
        <div v-if="filteredConversations.length === 0" class="empty-inbox">
          <HelpCircle :size="32" class="text-muted" />
          <p>No se encontraron conversaciones en esta bandeja.</p>
        </div>

        <div
          v-for="c in filteredConversations"
          :key="c.id"
          class="conv-item"
          :class="{ active: selectedConv?.id === c.id }"
          @click="selectConversation(c)"
        >
          <div class="conv-item-top">
            <span class="conv-folio font-mono">{{ c.conversation_number }}</span>
            <span class="badge" :class="getStatusBadge(c.status)">
              {{ getStatusLabel(c.status) }}
            </span>
          </div>

          <h4 class="conv-subject">{{ c.subject }}</h4>
          <p class="conv-snippet">{{ c.initial_query }}</p>

          <div class="conv-item-bottom">
            <span class="conv-dept">{{ c.department_name }}</span>
            <span class="conv-time">{{ formatRelativeTime(c.last_activity_at) }}</span>
          </div>
        </div>
      </div>
    </div>

    <div v-if="selectedConv" class="chat-pane">
      <div class="chat-header">
        <div class="chat-header-main">
          <div class="chat-title-row">
            <h3 class="chat-subject">{{ selectedConv.subject }}</h3>
            <span class="chat-folio font-mono">{{ selectedConv.conversation_number }}</span>
          </div>
          <div class="chat-meta-row">
            <span>Cliente: <strong>{{ selectedConv.client_name }}</strong></span>
            <span>Área: <strong>{{ selectedConv.department_name }}</strong> ({{ selectedConv.group_name || 'General' }})</span>
            <span class="e2ee-indicator">
              <ShieldCheck :size="14" class="text-green" />
              <span>Cifrado E2EE Web Crypto Activo</span>
            </span>
          </div>
        </div>

        <div class="chat-header-actions">
          <template v-if="!isClient">
            <button
              v-if="selectedConv.status !== 'closed' && selectedConv.status !== 'resolved'"
              class="btn btn-sm btn-outline"
              @click="openTransferModal"
            >
              <ArrowRightLeft :size="14" />
              <span>Derivar / Transferir</span>
            </button>
            <button
              v-if="selectedConv.status !== 'closed' && selectedConv.status !== 'resolved' && selectedConv.status !== 'solution_proposed'"
              class="btn btn-sm btn-secondary-action"
              @click="handleProposeSolution"
            >
              <CheckCircle :size="14" />
              <span>Proponer Solución</span>
            </button>
            <button
              v-if="selectedConv.status !== 'closed'"
              class="btn btn-sm btn-danger-action"
              @click="handleCloseConversation"
            >
              <span>Cerrar Conversación</span>
            </button>
          </template>

          <template v-else>
            <button
              v-if="selectedConv.status === 'closed'"
              class="btn btn-sm btn-outline"
              @click="handleReopenConversation"
            >
              <span>Reabrir Consulta</span>
            </button>
          </template>
        </div>
      </div>

      <div v-if="selectedConv.status === 'solution_proposed' && isClient" class="solution-banner">
        <div class="banner-icon"><Sparkles :size="20" class="text-amber" /></div>
        <div class="banner-body">
          <h4>Propuesta de Solución Técnica</h4>
          <p>¿La información y asistencia técnica proporcionada resolvió tu consulta y te ha servido la solución?</p>
          <div class="banner-buttons">
            <button class="btn btn-sm btn-primary" @click="handleConfirmSolution">
              <CheckCircle :size="14" />
              <span>Sí, mi problema está resuelto</span>
            </button>
            <button class="btn btn-sm btn-outline" @click="openRejectSolutionModal">
              <XCircle :size="14" />
              <span>No, todavía necesito ayuda</span>
            </button>
          </div>
        </div>
      </div>

      <div v-if="selectedConv.transfer_history && selectedConv.transfer_history.length > 0" class="transfer-alert">
        <ArrowRightLeft :size="15" class="text-blue" />
        <div>
          <strong>Trazabilidad de Transferencia:</strong>
          <span v-for="(tr, idx) in selectedConv.transfer_history" :key="idx" class="tr-item">
            Transferido de {{ tr.from_dept }} a {{ tr.to_dept }} por {{ tr.transferred_by }} (Motivo: {{ tr.reason }}).
          </span>
        </div>
      </div>

      <div class="messages-stream">
        <div
          v-for="m in messages"
          :key="m.id"
          class="message-wrap"
          :class="{
            'my-message': m.sender_id === currentUser?.id,
            'internal-note': m.is_internal
          }"
        >
          <div class="message-bubble">
            <div class="message-meta-top">
              <span class="sender-name">{{ m.sender_name }}</span>
              <span class="sender-role-pill" :class="m.sender_role">{{ m.sender_role }}</span>
              <span v-if="m.is_internal" class="internal-tag">
                <Lock :size="12" />
                <span>Nota Interna (Confidencial)</span>
              </span>
              <span class="message-time">{{ formatRelativeTime(m.created_at) }}</span>
            </div>

            <div class="message-content">
              {{ m.decryptedContent }}
            </div>

            <div v-if="m.attachment_name" class="message-attachment">
              <Paperclip :size="14" />
              <span>{{ m.attachment_name }}</span>
            </div>

            <div v-if="!m.deleted_for_all" class="message-actions-hover">
              <button
                class="msg-act-btn"
                @click="handleDeleteMessage(m, 'for_me')"
                title="Eliminar solo para mí"
              >
                Eliminar para mí
              </button>
              <button
                v-if="m.sender_id === currentUser?.id"
                class="msg-act-btn"
                @click="handleDeleteMessage(m, 'for_all')"
                title="Eliminar para todos"
              >
                Eliminar para todos
              </button>
            </div>
          </div>
        </div>
      </div>

      <div v-if="selectedConv.status !== 'closed'" class="chat-input-bar">
        <div v-if="selectedAttachmentName" class="attachment-preview">
          <Paperclip :size="14" />
          <span>{{ selectedAttachmentName }}</span>
          <button type="button" class="clear-att-btn" @click="selectedAttachmentName = null">×</button>
        </div>

        <div v-if="!isClient" class="internal-toggle-bar">
          <label class="internal-checkbox-lbl">
            <input v-model="isInternalNote" type="checkbox" />
            <Lock :size="13" />
            <span>Redactar como Nota Interna (Privada para el equipo)</span>
          </label>
        </div>

        <form @submit.prevent="handleSendMessage" class="input-form">
          <label class="file-btn" title="Adjuntar archivo o evidencia">
            <Paperclip :size="18" />
            <input type="file" class="hidden-input" @change="handleFileSelect" />
          </label>

          <input
            v-model="messageInput"
            type="text"
            :placeholder="isInternalNote ? 'Escribe una nota interna para el equipo...' : 'Escribe tu mensaje protegido con cifrado E2EE...'"
            class="chat-text-input"
          />

          <button type="submit" class="send-btn" :disabled="!messageInput.trim() && !selectedAttachmentName">
            <Send :size="18" />
          </button>
        </form>
      </div>

      <div v-else class="closed-notice">
        <CheckCircle :size="18" class="text-green" />
        <span>Esta conversación ha sido concluida formalmente. El historial cifrado se encuentra archivado.</span>
      </div>
    </div>

    <div v-else class="no-selection-pane">
      <MessageSquare :size="48" class="text-muted" />
      <p>Selecciona una conversación o inicia una nueva consulta.</p>
    </div>

    <BaseModal
      v-model="isNewConvModalOpen"
      title="Iniciar Nueva Consulta de Soporte"
    >
      <form class="modal-form" @submit.prevent="handleCreateConversation">
        <div class="form-group">
          <label>Asunto Breve</label>
          <input v-model="newSubject" type="text" class="form-input" placeholder="Ej. Acceso bloqueado a la plataforma" required />
        </div>

        <div class="form-group">
          <label>Describe tu problema o necesidad con tus propias palabras *</label>
          <textarea
            v-model="newInitialQuery"
            rows="4"
            class="form-textarea"
            placeholder="Explica qué necesitas resolver. El sistema identificará automáticamente el departamento y equipo idóneo..."
            required
          ></textarea>
        </div>

        <div v-if="smartRecommendation" class="recommendation-card">
          <div class="rec-icon"><Sparkles :size="20" class="text-blue" /></div>
          <div class="rec-body">
            <h4>Enrutamiento Inteligente NEXORA</h4>
            <p>{{ smartRecommendation.explanation }}</p>
            <div class="rec-assignment">
              <span>Área sugerida: <strong>{{ smartRecommendation.departmentName }}</strong></span>
              <span>Equipo: <strong>{{ smartRecommendation.groupName }}</strong></span>
            </div>
          </div>
        </div>

        <div class="modal-actions">
          <button type="button" class="btn btn-outline" @click="isNewConvModalOpen = false">Cancelar</button>
          <button type="submit" class="btn btn-primary">Iniciar Canal Cifrado E2EE</button>
        </div>
      </form>
    </BaseModal>

    <BaseModal
      v-model="isTransferModalOpen"
      title="Derivar / Transferir Conversación"
    >
      <form class="modal-form" @submit.prevent="handleTransferConversation">
        <div class="form-group">
          <label>Departamento Destino *</label>
          <select v-model="transferDeptId" class="form-select" required>
            <option v-for="d in departments" :key="d.id" :value="d.id">{{ d.name }}</option>
          </select>
        </div>

        <div class="form-group">
          <label>Grupo Especializado (Opcional)</label>
          <select v-model="transferGroupId" class="form-select">
            <option value="">Cualquier grupo disponible</option>
            <option v-for="g in filteredGroupsForTransfer" :key="g.id" :value="g.id">{{ g.name }}</option>
          </select>
        </div>

        <div class="form-group">
          <label>Motivo de la Derivación *</label>
          <textarea
            v-model="transferReason"
            rows="3"
            class="form-textarea"
            placeholder="Explica por qué se deriva el caso para que el nuevo equipo cuente con el contexto..."
            required
          ></textarea>
        </div>

        <div class="modal-actions">
          <button type="button" class="btn btn-outline" @click="isTransferModalOpen = false">Cancelar</button>
          <button type="submit" class="btn btn-primary">Confirmar Derivación</button>
        </div>
      </form>
    </BaseModal>

    <BaseModal
      v-model="isRejectSolutionModalOpen"
      title="Continuar con la Asistencia"
    >
      <form class="modal-form" @submit.prevent="handleRejectSolution">
        <p class="modal-text">Por favor indícanos qué aspecto sigue sin resolverse para que el equipo técnico continúe asistiéndote.</p>
        <div class="form-group">
          <label>Detalle del inconveniente persistente</label>
          <textarea v-model="rejectionReason" rows="3" class="form-textarea" placeholder="Describe qué ocurre actualmente..." required></textarea>
        </div>
        <div class="modal-actions">
          <button type="button" class="btn btn-outline" @click="isRejectSolutionModalOpen = false">Cancelar</button>
          <button type="submit" class="btn btn-primary">Enviar al Equipo</button>
        </div>
      </form>
    </BaseModal>
  </div>
</template>

<style scoped>
.workspace-shell {
  display: flex;
  height: calc(100vh - 120px);
  background: #FFFFFF;
  border-radius: 1.25rem;
  border: 1px solid #E2E8F0;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.03);
}

.inbox-pane {
  width: 380px;
  border-right: 1px solid #E2E8F0;
  display: flex;
  flex-direction: column;
  background: #F8FAFC;
  flex-shrink: 0;
}

.inbox-header {
  padding: 1.25rem;
  border-bottom: 1px solid #E2E8F0;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  background: #FFFFFF;
}

.inbox-title-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.inbox-title-box {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.inbox-title {
  font-size: 1.1rem;
  font-weight: 800;
  color: #17366C;
  margin: 0;
}

.search-input, .filter-select {
  width: 100%;
  padding: 0.6rem 0.85rem;
  border-radius: 0.5rem;
  border: 1px solid #CBD5E1;
  font-size: 0.82rem;
  background: #FFFFFF;
}

.conversation-list {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
}

.empty-inbox {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  padding: 3rem 1.5rem;
  text-align: center;
  font-size: 0.85rem;
  color: #64748B;
}

.conv-item {
  padding: 1rem 1.25rem;
  border-bottom: 1px solid #F1F5F9;
  cursor: pointer;
  transition: all 0.15s ease;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.conv-item:hover {
  background: #EFF6FF;
}

.conv-item.active {
  background: #E0E7FF;
  border-left: 4px solid #087BFA;
}

.conv-item-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.conv-folio {
  font-size: 0.75rem;
  font-weight: 700;
  color: #64748B;
}

.conv-subject {
  font-size: 0.92rem;
  font-weight: 700;
  color: #1E293B;
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.conv-snippet {
  font-size: 0.8rem;
  color: #64748B;
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.conv-item-bottom {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.75rem;
  color: #94A3B8;
  margin-top: 0.2rem;
}

.conv-dept {
  font-weight: 600;
  color: #087BFA;
}

.chat-pane {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: #FFFFFF;
}

.chat-header {
  padding: 1rem 1.5rem;
  border-bottom: 1px solid #E2E8F0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 1rem;
}

.chat-title-row {
  display: flex;
  align-items: center;
  gap: 0.6rem;
}

.chat-subject {
  font-size: 1.15rem;
  font-weight: 800;
  color: #1E293B;
  margin: 0;
}

.chat-folio {
  font-size: 0.8rem;
  font-weight: 700;
  color: #64748B;
  background: #F1F5F9;
  padding: 0.15rem 0.5rem;
  border-radius: 9999px;
}

.chat-meta-row {
  display: flex;
  align-items: center;
  gap: 1rem;
  font-size: 0.8rem;
  color: #64748B;
  margin-top: 0.25rem;
}

.e2ee-indicator {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  color: #15803D;
  font-weight: 700;
  background: #DCFCE7;
  padding: 0.15rem 0.5rem;
  border-radius: 9999px;
  font-size: 0.72rem;
}

.chat-header-actions {
  display: flex;
  gap: 0.5rem;
}

.solution-banner {
  display: flex;
  gap: 1rem;
  padding: 1rem 1.5rem;
  background: #FFFBEB;
  border-bottom: 1px solid #FDE68A;
}

.solution-banner h4 {
  margin: 0 0 0.25rem 0;
  font-size: 0.95rem;
  font-weight: 700;
  color: #92400E;
}

.solution-banner p {
  margin: 0 0 0.75rem 0;
  font-size: 0.85rem;
  color: #B45309;
}

.banner-buttons {
  display: flex;
  gap: 0.75rem;
}

.transfer-alert {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.65rem 1.5rem;
  background: #EFF6FF;
  border-bottom: 1px solid #BFDBFE;
  font-size: 0.8rem;
  color: #1E40AF;
}

.messages-stream {
  flex: 1;
  overflow-y: auto;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  background: #F8FAFC;
}

.message-wrap {
  display: flex;
  width: 100%;
}

.message-wrap.my-message {
  justify-content: flex-end;
}

.message-bubble {
  max-width: 65%;
  background: #FFFFFF;
  border: 1px solid #E2E8F0;
  border-radius: 1rem;
  padding: 0.85rem 1.15rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.03);
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  position: relative;
}

.my-message .message-bubble {
  background: #EFF6FF;
  border-color: #BFDBFE;
}

.internal-note .message-bubble {
  background: #FEF3C7;
  border: 1px dashed #D97706;
}

.message-meta-top {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.75rem;
}

.sender-name {
  font-weight: 700;
  color: #1E293B;
}

.sender-role-pill {
  font-size: 0.65rem;
  font-weight: 700;
  padding: 0.1rem 0.4rem;
  border-radius: 9999px;
  background: #E2E8F0;
  color: #475569;
}

.sender-role-pill.client { background: #DCFCE7; color: #15803D; }
.sender-role-pill.employee { background: #DBEAFE; color: #1D4ED8; }
.sender-role-pill.admin { background: #EDE9FE; color: #6D28D9; }

.internal-tag {
  display: inline-flex;
  align-items: center;
  gap: 0.2rem;
  font-size: 0.68rem;
  font-weight: 700;
  color: #B45309;
}

.message-time {
  margin-left: auto;
  color: #94A3B8;
}

.message-content {
  font-size: 0.88rem;
  color: #334155;
  line-height: 1.45;
  white-space: pre-wrap;
}

.message-attachment {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  background: #F1F5F9;
  padding: 0.3rem 0.6rem;
  border-radius: 0.35rem;
  font-size: 0.78rem;
  color: #475569;
  margin-top: 0.25rem;
  width: fit-content;
}

.message-actions-hover {
  display: flex;
  gap: 0.5rem;
  margin-top: 0.25rem;
  padding-top: 0.25rem;
  border-top: 1px solid rgba(0, 0, 0, 0.05);
}

.msg-act-btn {
  background: transparent;
  border: none;
  font-size: 0.7rem;
  color: #94A3B8;
  cursor: pointer;
  padding: 0;
}

.msg-act-btn:hover {
  color: #EF4444;
  text-decoration: underline;
}

.chat-input-bar {
  padding: 1rem 1.5rem;
  border-top: 1px solid #E2E8F0;
  background: #FFFFFF;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.attachment-preview {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  background: #EFF6FF;
  padding: 0.25rem 0.6rem;
  border-radius: 0.35rem;
  font-size: 0.78rem;
  color: #087BFA;
  width: fit-content;
}

.clear-att-btn {
  background: transparent;
  border: none;
  cursor: pointer;
  font-weight: 700;
  color: #087BFA;
}

.internal-toggle-bar {
  display: flex;
  align-items: center;
}

.internal-checkbox-lbl {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.78rem;
  font-weight: 600;
  color: #B45309;
  cursor: pointer;
}

.input-form {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.file-btn {
  color: #64748B;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 0.5rem;
  transition: all 0.15s ease;
}

.file-btn:hover {
  background: #F1F5F9;
  color: #087BFA;
}

.hidden-input {
  display: none;
}

.chat-text-input {
  flex: 1;
  padding: 0.75rem 1rem;
  border-radius: 0.75rem;
  border: 1px solid #CBD5E1;
  font-size: 0.88rem;
  outline: none;
}

.chat-text-input:focus {
  border-color: #087BFA;
  box-shadow: 0 0 0 3px rgba(8, 123, 250, 0.15);
}

.send-btn {
  width: 44px;
  height: 44px;
  border-radius: 0.75rem;
  background: #087BFA;
  color: #FFFFFF;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.15s ease;
}

.send-btn:hover:not(:disabled) {
  background: #0662C7;
}

.send-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.closed-notice {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.6rem;
  padding: 1.25rem;
  background: #F8FAFC;
  border-top: 1px solid #E2E8F0;
  font-size: 0.88rem;
  color: #475569;
}

.no-selection-pane {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  color: #64748B;
  font-size: 0.95rem;
}

.recommendation-card {
  display: flex;
  gap: 0.75rem;
  padding: 1rem;
  background: #EFF6FF;
  border: 1px solid #BFDBFE;
  border-radius: 0.75rem;
}

.rec-body h4 {
  font-size: 0.9rem;
  font-weight: 700;
  color: #1D4ED8;
  margin: 0 0 0.25rem 0;
}

.rec-body p {
  font-size: 0.8rem;
  color: #1E3A8A;
  margin: 0 0 0.5rem 0;
}

.rec-assignment {
  display: flex;
  gap: 1rem;
  font-size: 0.78rem;
  color: #1E40AF;
}

.badge {
  display: inline-flex;
  align-items: center;
  padding: 0.2rem 0.5rem;
  border-radius: 9999px;
  font-size: 0.72rem;
  font-weight: 700;
}

.badge-green { background: #DCFCE7; color: #15803D; }
.badge-blue { background: #DBEAFE; color: #1D4ED8; }
.badge-amber { background: #FEF3C7; color: #B45309; }
.badge-purple { background: #EDE9FE; color: #6D28D9; }
.badge-gray { background: #F1F5F9; color: #475569; }

.btn {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.6rem 1.15rem;
  border-radius: 0.5rem;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  border: none;
  transition: all 0.2s ease;
}

.btn-primary { background: #087BFA; color: #FFFFFF; }
.btn-primary:hover { background: #0662C7; }
.btn-outline { background: #FFFFFF; border: 1px solid #CBD5E1; color: #334155; }
.btn-outline:hover { background: #F8FAFC; }
.btn-secondary-action { background: #10B981; color: #FFFFFF; }
.btn-secondary-action:hover { background: #059669; }
.btn-danger-action { background: #EF4444; color: #FFFFFF; }
.btn-danger-action:hover { background: #DC2626; }
.btn-sm { padding: 0.35rem 0.7rem; font-size: 0.75rem; }

.modal-form { display: flex; flex-direction: column; gap: 1rem; }
.form-group { display: flex; flex-direction: column; gap: 0.35rem; }
.form-group label { font-size: 0.8rem; font-weight: 600; color: #475569; }
.form-input, .form-select, .form-textarea { padding: 0.65rem 0.85rem; border-radius: 0.5rem; border: 1px solid #CBD5E1; font-size: 0.875rem; outline: none; }
.modal-actions { display: flex; justify-content: flex-end; gap: 0.75rem; margin-top: 1rem; }

.font-mono { font-family: monospace; }
.text-blue { color: #087BFA; }
.text-green { color: #10B981; }
.text-amber { color: #F59E0B; }
.text-muted { color: #64748B; }
</style>
