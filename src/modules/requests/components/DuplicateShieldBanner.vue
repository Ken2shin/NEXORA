<script setup lang="ts">
import { computed } from 'vue'
import { AlertTriangle, ExternalLink } from 'lucide-vue-next'
import type { ServiceRequest } from '@/shared/types/request.types'
import { useRouter } from 'vue-router'

interface Props {
  activeRequests: ServiceRequest[]
  serviceId?: string
  description?: string
}

const props = defineProps<Props>()
const router = useRouter()

const duplicateMatch = computed(() => {
  if (!props.serviceId && !props.description) return null
  const desc = (props.description || '').toLowerCase().trim()

  return props.activeRequests.find(r => {
    if (r.status === 'completed') return false
    if (props.serviceId && r.service_id === props.serviceId) return true
    if (desc.length > 8 && r.description.toLowerCase().includes(desc)) return true
    return false
  }) || null
})

function navigateToExisting() {
  if (duplicateMatch.value) {
    router.push(`/client/requests/${duplicateMatch.value.id}`)
  }
}
</script>

<template>
  <div v-if="duplicateMatch" class="duplicate-shield-card">
    <div class="shield-icon-wrap">
      <AlertTriangle :size="20" class="shield-icon" />
    </div>
    <div class="shield-body">
      <div class="shield-title">NEXORA Duplicate Shield: Posible coincidencia activa</div>
      <p class="shield-desc">
        Detectamos que ya tienes una solicitud abierta (<strong>{{ duplicateMatch.request_number }} - {{ duplicateMatch.service_name }}</strong>) en estado activo.
        Para evitar duplicidades y acelerar tu atención, puedes consultar su avance o adjuntar información allí.
      </p>
      <div class="shield-actions">
        <button type="button" class="view-existing-btn" @click="navigateToExisting">
          <span>Ver mi solicitud {{ duplicateMatch.request_number }}</span>
          <ExternalLink :size="14" />
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.duplicate-shield-card {
  display: flex;
  gap: 14px;
  background: #FFF8E6;
  border: 1px solid #FFE082;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 20px;
  box-shadow: 0 4px 12px rgba(255, 193, 7, 0.08);
  animation: fadeIn 0.3s ease-out;
}

.shield-icon-wrap {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: #FFE082;
  color: #B78103;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.shield-body {
  flex: 1;
}

.shield-title {
  font-size: 0.92rem;
  font-weight: 700;
  color: #8C6200;
  margin-bottom: 4px;
}

.shield-desc {
  font-size: 0.85rem;
  color: #6D4C00;
  line-height: 1.45;
  margin: 0 0 10px 0;
}

.shield-actions {
  display: flex;
  gap: 10px;
}

.view-existing-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: #B78103;
  color: #FFFFFF;
  border: none;
  border-radius: 8px;
  padding: 6px 14px;
  font-size: 0.82rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
}

.view-existing-btn:hover {
  background: #966700;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-4px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>