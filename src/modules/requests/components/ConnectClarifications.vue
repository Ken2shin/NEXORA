<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { MessageSquare, Send, Lock, Paperclip } from 'lucide-vue-next'
import { formatDate } from '@/shared/utils/formatters'

interface Message {
  id: string
  requestId: string
  senderId: string
  senderName: string
  senderRole: 'client' | 'employee' | 'admin'
  content: string
  isInternal: boolean
  createdAt: string
  attachmentName?: string
}

interface Props {
  requestId: string
  currentUserRole: 'admin' | 'employee' | 'client'
  currentUserId: string
  currentUserName: string
}

const props = defineProps<Props>()

const messages = ref<Message[]>([])
const newMessageText = ref('')
const isInternalNote = ref(false)
const selectedFileName = ref<string | null>(null)

function isCleanMessage(content: string): boolean {
  const vulgarPattern = /cerote|mierda|cagame|puta|verga|pendej|malparid|hijodeputa/i
  return !vulgarPattern.test(content)
}

function getDefaultMessages(): Message[] {
  return [
    {
      id: 'msg-1',
      requestId: props.requestId,
      senderId: 'sys',
      senderName: 'NEXORA Sistema',
      senderRole: 'admin',
      content: 'Canal de comunicación seguro habilitado para la solicitud.',
      isInternal: false,
      createdAt: new Date(Date.now() - 3600000 * 4).toISOString()
    }
  ]
}

onMounted(() => {
  const stored = localStorage.getItem(`nexora_messages_${props.requestId}`)
  if (stored) {
    try {
      const parsed: Message[] = JSON.parse(stored)
      const sanitized = parsed.filter(m => isCleanMessage(m.content))
      messages.value = sanitized.length > 0 ? sanitized : getDefaultMessages()
      if (sanitized.length !== parsed.length) {
        saveMessages()
      }
    } catch {
      initDefaultMessages()
    }
  } else {
    initDefaultMessages()
  }
})

function initDefaultMessages() {
  messages.value = getDefaultMessages()
  saveMessages()
}

function saveMessages() {
  localStorage.setItem(`nexora_messages_${props.requestId}`, JSON.stringify(messages.value))
}

function handleSendMessage() {
  const trimmed = newMessageText.value.trim()
  if (!trimmed && !selectedFileName.value) return
  if (trimmed && !isCleanMessage(trimmed)) {
    newMessageText.value = ''
    return
  }

  const newMsg: Message = {
    id: `msg-${Date.now()}`,
    requestId: props.requestId,
    senderId: props.currentUserId,
    senderName: props.currentUserName,
    senderRole: props.currentUserRole,
    content: trimmed,
    isInternal: props.currentUserRole !== 'client' && isInternalNote.value,
    createdAt: new Date().toISOString(),
    attachmentName: selectedFileName.value || undefined
  }

  messages.value.push(newMsg)
  saveMessages()

  newMessageText.value = ''
  selectedFileName.value = null
  isInternalNote.value = false
}

function handleFileSelect(e: Event) {
  const target = e.target as HTMLInputElement
  if (target.files && target.files[0]) {
    selectedFileName.value = target.files[0].name
  }
}
</script>

<template>
  <div class="connect-chat-card">
    <div class="chat-header">
      <div class="header-left">
        <MessageSquare :size="18" class="chat-header-icon" />
        <h3 class="chat-title">NEXORA Connect — Centro de Aclaraciones</h3>
      </div>
      <span class="chat-badge">Mensajería bidireccional segura</span>
    </div>

    <div class="messages-container">
      <div
        v-for="msg in messages"
        :key="msg.id"
        v-show="!msg.isInternal || currentUserRole !== 'client'"
        :class="[
          'message-bubble',
          {
            'my-message': msg.senderId === currentUserId,
            'internal-note': msg.isInternal,
            'client-msg': msg.senderRole === 'client' && msg.senderId !== currentUserId
          }
        ]"
      >
        <div class="bubble-header">
          <div class="sender-info">
            <span class="sender-name">{{ msg.senderName }}</span>
            <span v-if="msg.senderRole === 'admin'" class="role-pill admin">Supervisión</span>
            <span v-else-if="msg.senderRole === 'employee'" class="role-pill staff">Soporte Técnico</span>
            <span v-else class="role-pill client">Cliente</span>
            <span v-if="msg.isInternal" class="internal-pill">
              <Lock :size="10" />
              <span>Nota interna de equipo</span>
            </span>
          </div>
          <span class="message-time">{{ formatDate(msg.createdAt) }}</span>
        </div>

        <div class="bubble-content">
          <p class="text-body">{{ msg.content }}</p>
          <div v-if="msg.attachmentName" class="attachment-pill">
            <Paperclip :size="12" />
            <span>{{ msg.attachmentName }}</span>
          </div>
        </div>
      </div>
    </div>

    <form class="chat-input-area" @submit.prevent="handleSendMessage">
      <div v-if="currentUserRole !== 'client'" class="internal-toggle-bar">
        <label class="toggle-label">
          <input type="checkbox" v-model="isInternalNote" />
          <span class="toggle-text">
            <Lock :size="12" />
            <span>Nota interna confidencial (no visible para el cliente)</span>
          </span>
        </label>
      </div>

      <div v-if="selectedFileName" class="selected-file-chip">
        <Paperclip :size="12" />
        <span>{{ selectedFileName }}</span>
        <button type="button" class="remove-file-btn" @click="selectedFileName = null">×</button>
      </div>

      <div class="input-row">
        <label class="attach-btn" title="Adjuntar comprobante o archivo">
          <Paperclip :size="16" />
          <input type="file" class="hidden-input" @change="handleFileSelect" />
        </label>
        <input
          v-model="newMessageText"
          type="text"
          :placeholder="isInternalNote ? 'Escribe una nota privada para el equipo...' : 'Escribe un mensaje o aclaración...'"
          :class="['chat-input', { 'internal-input': isInternalNote }]"
        />
        <button type="submit" class="send-btn" :disabled="!newMessageText.trim() && !selectedFileName">
          <Send :size="16" />
        </button>
      </div>
    </form>
  </div>
</template>

<style scoped>
.connect-chat-card {
  background: #FFFFFF;
  border: 1px solid #E3EAF6;
  border-radius: 14px;
  overflow: hidden;
  box-shadow: 0 4px 16px rgba(8, 123, 250, 0.04);
  margin-bottom: 20px;
}

.chat-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 18px;
  background: #F8FAFD;
  border-bottom: 1px solid #E3EAF6;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.chat-header-icon {
  color: #087BFA;
}

.chat-title {
  font-size: 0.95rem;
  font-weight: 700;
  color: #17366C;
  margin: 0;
}

.chat-badge {
  font-size: 0.72rem;
  color: #71809B;
  background: #FFFFFF;
  padding: 3px 8px;
  border-radius: 6px;
  border: 1px solid #E3EAF6;
}

.messages-container {
  padding: 16px;
  max-height: 280px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 12px;
  background: #FCFDFF;
}

.message-bubble {
  max-width: 85%;
  background: #FFFFFF;
  border: 1px solid #E3EAF6;
  border-radius: 12px;
  padding: 10px 14px;
  align-self: flex-start;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.02);
}

.message-bubble.my-message {
  align-self: flex-end;
  background: #F0F6FF;
  border-color: #C8DCFC;
}

.message-bubble.internal-note {
  background: #FFF9E6;
  border-color: #FFE082;
  align-self: center;
  max-width: 92%;
  width: 100%;
}

.bubble-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 6px;
}

.sender-info {
  display: flex;
  align-items: center;
  gap: 6px;
}

.sender-name {
  font-size: 0.78rem;
  font-weight: 700;
  color: #182B49;
}

.role-pill {
  font-size: 0.65rem;
  font-weight: 600;
  padding: 1px 6px;
  border-radius: 4px;
}

.role-pill.admin {
  background: #E8EEF8;
  color: #17366C;
}

.role-pill.staff {
  background: #EAF4FE;
  color: #087BFA;
}

.role-pill.client {
  background: #EBF8F2;
  color: #00BA88;
}

.internal-pill {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  background: #FFD54F;
  color: #6D4C00;
  font-size: 0.65rem;
  font-weight: 700;
  padding: 1px 6px;
  border-radius: 4px;
}

.message-time {
  font-size: 0.68rem;
  color: #8C9BAE;
}

.bubble-content .text-body {
  font-size: 0.84rem;
  color: #2D3748;
  line-height: 1.45;
  margin: 0;
}

.attachment-pill {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  margin-top: 6px;
  background: #EBF3FF;
  color: #087BFA;
  padding: 3px 8px;
  border-radius: 6px;
  font-size: 0.72rem;
  font-weight: 600;
}

.chat-input-area {
  padding: 12px 16px;
  border-top: 1px solid #E3EAF6;
  background: #FFFFFF;
}

.internal-toggle-bar {
  margin-bottom: 8px;
}

.toggle-label {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  font-size: 0.76rem;
  color: #8C6200;
}

.toggle-text {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-weight: 600;
}

.selected-file-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: #EDF5FF;
  border: 1px solid #C8DCFC;
  padding: 2px 8px;
  border-radius: 6px;
  font-size: 0.74rem;
  color: #087BFA;
  margin-bottom: 8px;
}

.remove-file-btn {
  background: none;
  border: none;
  color: #71809B;
  cursor: pointer;
  font-size: 0.9rem;
  line-height: 1;
}

.input-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.attach-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 8px;
  background: #F4F7FD;
  color: #71809B;
  cursor: pointer;
  border: 1px solid #E3EAF6;
  transition: all 0.2s;
}

.attach-btn:hover {
  background: #EDF5FF;
  color: #087BFA;
}

.hidden-input {
  display: none;
}

.chat-input {
  flex: 1;
  height: 38px;
  padding: 0 14px;
  border: 1px solid #E3EAF6;
  border-radius: 8px;
  font-size: 0.85rem;
  outline: none;
  transition: border-color 0.2s;
}

.chat-input:focus {
  border-color: #087BFA;
}

.chat-input.internal-input {
  background: #FFFDF5;
  border-color: #FFE082;
}

.send-btn {
  width: 38px;
  height: 38px;
  border-radius: 8px;
  background: #087BFA;
  color: #FFFFFF;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
}

.send-btn:hover:not(:disabled) {
  background: #0870E8;
}

.send-btn:disabled {
  background: #D5E0F2;
  cursor: not-allowed;
}
</style>