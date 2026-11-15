<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import {
  LifeBuoy,
  Clock,
  CheckCircle,
  AlertTriangle
} from 'lucide-vue-next'
import { conversationsService } from '@/shared/infrastructure/adapters/mock/mock.conversations.service'
import type { Conversation } from '@/shared/types/organization.types'
import ConversationsWorkspace from '@/modules/conversations/views/ConversationsWorkspace.vue'

const conversations = ref<Conversation[]>([])
const isLoading = ref(true)

async function loadData() {
  isLoading.value = true
  try {
    conversations.value = await conversationsService.getConversations()
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  loadData()
})

const inAttentionCount = computed(() => {
  return conversations.value.filter(c => c.status === 'in_progress').length
})

const waitingClientCount = computed(() => {
  return conversations.value.filter(c => c.status === 'waiting_client' || c.status === 'solution_proposed').length
})

const resolvedCount = computed(() => {
  return conversations.value.filter(c => c.status === 'resolved' || c.status === 'closed').length
})
</script>

<template>
  <div class="support-portal-page">
    <div class="page-header">
      <div>
        <h1 class="page-title">Portal de Soporte Técnico y Atención al Cliente</h1>
        <p class="page-subtitle">Mesa de servicio corporativa, atención directa de clientes con cifrado E2EE y cumplimiento de SLA.</p>
      </div>
    </div>

    <div class="kpi-grid">
      <div class="kpi-card">
        <div class="kpi-icon icon-blue">
          <LifeBuoy :size="22" />
        </div>
        <div class="kpi-info">
          <span class="kpi-label">En Atención Activa</span>
          <span class="kpi-val">{{ inAttentionCount }}</span>
          <span class="kpi-desc">Casos con respuesta en curso</span>
        </div>
      </div>

      <div class="kpi-card">
        <div class="kpi-icon icon-amber">
          <Clock :size="22" />
        </div>
        <div class="kpi-info">
          <span class="kpi-label">Esperando al Cliente</span>
          <span class="kpi-val">{{ waitingClientCount }}</span>
          <span class="kpi-desc">Solución o datos solicitados</span>
        </div>
      </div>

      <div class="kpi-card">
        <div class="kpi-icon icon-green">
          <CheckCircle :size="22" />
        </div>
        <div class="kpi-info">
          <span class="kpi-label">Casos Resueltos</span>
          <span class="kpi-val">{{ resolvedCount }}</span>
          <span class="kpi-desc">Confirmados satisfactoriamente</span>
        </div>
      </div>

      <div class="kpi-card">
        <div class="kpi-icon icon-purple">
          <AlertTriangle :size="22" />
        </div>
        <div class="kpi-info">
          <span class="kpi-label">Primera Respuesta SLA</span>
          <span class="kpi-val">1.4h</span>
          <span class="kpi-desc">Promedio dentro del límite</span>
        </div>
      </div>
    </div>

    <div class="support-workspace-wrapper">
      <ConversationsWorkspace forced-department-id="dept-1" />
    </div>
  </div>
</template>

<style scoped>
.support-portal-page {
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

.support-workspace-wrapper {
  margin-top: 0.5rem;
}
</style>
