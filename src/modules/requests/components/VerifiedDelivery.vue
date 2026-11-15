<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { CheckCircle2, ShieldCheck, AlertCircle, Star, ThumbsUp, RotateCcw } from 'lucide-vue-next'

interface DeliveryData {
  evidenceUrl?: string
  evidenceNotes?: string
  deliveredAt?: string
  acceptedAt?: string
  clientRating?: number
  correctionRequested?: boolean
  correctionNotes?: string
}

interface Props {
  requestId: string
  currentStatus: string
  isClient: boolean
  isStaff: boolean
}

const props = defineProps<Props>()

const emit = defineEmits<{
  (e: 'accepted', rating: number): void
  (e: 'correctionRequested', notes: string): void
  (e: 'delivered', notes: string): void
}>()

const deliveryData = ref<DeliveryData>({})
const staffNotes = ref('')
const correctionReason = ref('')
const rating = ref(5)
const isAccepting = ref(false)
const isCorrecting = ref(false)

onMounted(() => {
  const stored = localStorage.getItem(`nexora_delivery_${props.requestId}`)
  if (stored) {
    try {
      deliveryData.value = JSON.parse(stored)
    } catch {
      deliveryData.value = {}
    }
  }
})

function saveDelivery() {
  localStorage.setItem(`nexora_delivery_${props.requestId}`, JSON.stringify(deliveryData.value))
}

function handleStaffSubmitDelivery() {
  if (!staffNotes.value.trim()) return
  deliveryData.value = {
    ...deliveryData.value,
    evidenceNotes: staffNotes.value.trim(),
    deliveredAt: new Date().toISOString(),
    correctionRequested: false
  }
  saveDelivery()
  emit('delivered', staffNotes.value.trim())
}

function handleClientAccept() {
  deliveryData.value = {
    ...deliveryData.value,
    acceptedAt: new Date().toISOString(),
    clientRating: rating.value,
    correctionRequested: false
  }
  saveDelivery()
  isAccepting.value = false
  emit('accepted', rating.value)
}

function handleClientRequestCorrection() {
  if (!correctionReason.value.trim()) return
  deliveryData.value = {
    ...deliveryData.value,
    correctionRequested: true,
    correctionNotes: correctionReason.value.trim()
  }
  saveDelivery()
  isCorrecting.value = false
  emit('correctionRequested', correctionReason.value.trim())
}
</script>

<template>
  <div class="delivery-card">
    <div class="delivery-header">
      <div class="header-left">
        <ShieldCheck :size="20" class="shield-icon" />
        <h3 class="delivery-title">NEXORA Verified Delivery — Control de Entrega</h3>
      </div>
      <span v-if="deliveryData.acceptedAt" class="seal-badge">
        <CheckCircle2 :size="13" />
        <span>Entrega Verificada y Conforme</span>
      </span>
      <span v-else-if="deliveryData.deliveredAt" class="review-badge">
        En espera de validación del cliente
      </span>
    </div>

    <div v-if="deliveryData.acceptedAt" class="conformance-banner">
      <div class="seal-circle">
        <ShieldCheck :size="28" />
      </div>
      <div class="seal-details">
        <h4 class="seal-title">Servicio Aceptado a Plena Conformidad</h4>
        <p class="seal-desc">El cliente ha validado el resultado y calificado el servicio.</p>
        <div class="rating-display">
          <Star
            v-for="i in 5"
            :key="i"
            :size="16"
            :class="['star-icon', { filled: i <= (deliveryData.clientRating || 5) }]"
          />
          <span class="rating-num">{{ deliveryData.clientRating || 5 }}/5 estrellas</span>
        </div>
      </div>
    </div>

    <div v-else-if="deliveryData.correctionRequested" class="correction-alert">
      <AlertCircle :size="18" class="alert-icon" />
      <div class="alert-body">
        <span class="alert-title">Corrección solicitada por el cliente:</span>
        <p class="alert-text">{{ deliveryData.correctionNotes }}</p>
      </div>
    </div>

    <div v-if="deliveryData.deliveredAt && !deliveryData.acceptedAt" class="delivery-review-panel">
      <div class="evidence-box">
        <h5 class="evidence-subtitle">Detalle de la entrega técnica:</h5>
        <p class="evidence-content">{{ deliveryData.evidenceNotes || 'Entregable completado conforme a requerimientos.' }}</p>
      </div>

      <div v-if="isClient" class="client-actions-block">
        <p class="prompt-text">¿Has verificado los resultados de la entrega?</p>
        
        <div v-if="!isAccepting && !isCorrecting" class="choice-btns">
          <button type="button" class="accept-btn" @click="isAccepting = true">
            <ThumbsUp :size="15" />
            <span>Aceptar entrega y calificar</span>
          </button>
          <button type="button" class="request-corr-btn" @click="isCorrecting = true">
            <RotateCcw :size="15" />
            <span>Solicitar corrección</span>
          </button>
        </div>

        <div v-if="isAccepting" class="rating-flow">
          <span class="rating-prompt">Califica tu experiencia con el servicio:</span>
          <div class="stars-picker">
            <button
              v-for="s in 5"
              :key="s"
              type="button"
              class="star-btn"
              @click="rating = s"
            >
              <Star :size="22" :class="{ active: s <= rating }" />
            </button>
          </div>
          <div class="confirm-btns">
            <button type="button" class="confirm-accept-btn" @click="handleClientAccept">
              Confirmar aceptación
            </button>
            <button type="button" class="cancel-btn" @click="isAccepting = false">
              Cancelar
            </button>
          </div>
        </div>

        <div v-if="isCorrecting" class="correction-flow">
          <label class="form-label">Indica qué detalles requieren corrección o ajuste:</label>
          <textarea
            v-model="correctionReason"
            rows="3"
            class="correction-textarea"
            placeholder="Especifica el motivo del ajuste..."
          ></textarea>
          <div class="confirm-btns">
            <button
              type="button"
              class="submit-corr-btn"
              :disabled="!correctionReason.trim()"
              @click="handleClientRequestCorrection"
            >
              Enviar solicitud de corrección
            </button>
            <button type="button" class="cancel-btn" @click="isCorrecting = false">
              Cancelar
            </button>
          </div>
        </div>
      </div>
    </div>

    <div v-if="isStaff && !deliveryData.deliveredAt && currentStatus !== 'completed'" class="staff-delivery-block">
      <h5 class="block-subtitle">Registrar entregable de servicio:</h5>
      <textarea
        v-model="staffNotes"
        rows="2"
        class="delivery-textarea"
        placeholder="Resume los entregables completados, enlaces o notas de entrega para el cliente..."
      ></textarea>
      <div class="btn-wrap">
        <button
          type="button"
          class="submit-delivery-btn"
          :disabled="!staffNotes.trim()"
          @click="handleStaffSubmitDelivery"
        >
          <ShieldCheck :size="16" />
          <span>Presentar entregable al cliente</span>
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.delivery-card {
  background: #FFFFFF;
  border: 1px solid #E3EAF6;
  border-radius: 14px;
  padding: 18px 20px;
  box-shadow: 0 4px 16px rgba(8, 123, 250, 0.04);
  margin-bottom: 20px;
}

.delivery-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 14px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.shield-icon {
  color: #00BA88;
}

.delivery-title {
  font-size: 0.95rem;
  font-weight: 700;
  color: #17366C;
  margin: 0;
}

.seal-badge {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  background: #EBF8F2;
  color: #00BA88;
  padding: 3px 10px;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 700;
}

.review-badge {
  background: #EDF5FF;
  color: #087BFA;
  padding: 3px 8px;
  border-radius: 6px;
  font-size: 0.72rem;
  font-weight: 600;
}

.conformance-banner {
  display: flex;
  align-items: center;
  gap: 16px;
  background: linear-gradient(135deg, #F0FDF4 0%, #DCFCE7 100%);
  border: 1px solid #BBF7D0;
  border-radius: 12px;
  padding: 14px 18px;
}

.seal-circle {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: #00BA88;
  color: #FFFFFF;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.seal-title {
  font-size: 0.95rem;
  font-weight: 700;
  color: #166534;
  margin: 0 0 2px 0;
}

.seal-desc {
  font-size: 0.8rem;
  color: #15803D;
  margin: 0 0 6px 0;
}

.rating-display {
  display: flex;
  align-items: center;
  gap: 4px;
}

.star-icon {
  color: #D1D5DB;
}

.star-icon.filled {
  color: #FFC83D;
  fill: #FFC83D;
}

.rating-num {
  font-size: 0.8rem;
  font-weight: 700;
  color: #166534;
  margin-left: 6px;
}

.correction-alert {
  display: flex;
  gap: 10px;
  background: #FEF2F2;
  border: 1px solid #FECACA;
  border-radius: 10px;
  padding: 12px 14px;
  margin-bottom: 12px;
}

.alert-icon {
  color: #EF4444;
  flex-shrink: 0;
  margin-top: 2px;
}

.alert-title {
  font-size: 0.85rem;
  font-weight: 700;
  color: #991B1B;
}

.alert-text {
  font-size: 0.82rem;
  color: #7F1D1D;
  margin: 4px 0 0 0;
}

.evidence-box {
  background: #F8FAFD;
  border: 1px solid #E3EAF6;
  border-radius: 10px;
  padding: 12px 14px;
  margin-bottom: 14px;
}

.evidence-subtitle {
  font-size: 0.8rem;
  font-weight: 700;
  color: #71809B;
  margin: 0 0 4px 0;
  text-transform: uppercase;
}

.evidence-content {
  font-size: 0.85rem;
  color: #182B49;
  line-height: 1.5;
  margin: 0;
}

.prompt-text {
  font-size: 0.88rem;
  font-weight: 600;
  color: #182B49;
  margin-bottom: 10px;
}

.choice-btns {
  display: flex;
  gap: 10px;
}

.accept-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: #00BA88;
  color: #FFFFFF;
  border: none;
  border-radius: 8px;
  padding: 8px 16px;
  font-size: 0.84rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.accept-btn:hover {
  background: #009e74;
}

.request-corr-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: #FFFFFF;
  color: #71809B;
  border: 1px solid #D5E0F2;
  border-radius: 8px;
  padding: 8px 16px;
  font-size: 0.84rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.request-corr-btn:hover {
  background: #F4F7FD;
  color: #182B49;
}

.rating-flow {
  background: #F8FAFD;
  border: 1px solid #E3EAF6;
  border-radius: 10px;
  padding: 14px;
}

.rating-prompt {
  font-size: 0.84rem;
  font-weight: 600;
  color: #182B49;
  display: block;
  margin-bottom: 8px;
}

.stars-picker {
  display: flex;
  gap: 6px;
  margin-bottom: 12px;
}

.star-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 2px;
  color: #CBD5E1;
  transition: transform 0.15s;
}

.star-btn:hover {
  transform: scale(1.15);
}

.star-btn svg.active {
  color: #FFC83D;
  fill: #FFC83D;
}

.confirm-btns {
  display: flex;
  gap: 8px;
}

.confirm-accept-btn {
  background: #00BA88;
  color: #FFFFFF;
  border: none;
  border-radius: 8px;
  padding: 7px 14px;
  font-size: 0.82rem;
  font-weight: 600;
  cursor: pointer;
}

.submit-corr-btn {
  background: #EF4444;
  color: #FFFFFF;
  border: none;
  border-radius: 8px;
  padding: 7px 14px;
  font-size: 0.82rem;
  font-weight: 600;
  cursor: pointer;
}

.cancel-btn {
  background: transparent;
  border: 1px solid #D5E0F2;
  color: #71809B;
  border-radius: 8px;
  padding: 7px 12px;
  font-size: 0.82rem;
  cursor: pointer;
}

.correction-flow {
  background: #F8FAFD;
  border: 1px solid #E3EAF6;
  border-radius: 10px;
  padding: 14px;
}

.form-label {
  font-size: 0.8rem;
  font-weight: 600;
  color: #182B49;
  display: block;
  margin-bottom: 6px;
}

.correction-textarea, .delivery-textarea {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #E3EAF6;
  border-radius: 8px;
  font-size: 0.84rem;
  outline: none;
  box-sizing: border-box;
  margin-bottom: 10px;
  font-family: inherit;
}

.correction-textarea:focus, .delivery-textarea:focus {
  border-color: #087BFA;
}

.block-subtitle {
  font-size: 0.82rem;
  font-weight: 700;
  color: #182B49;
  margin: 0 0 6px 0;
}

.submit-delivery-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: #087BFA;
  color: #FFFFFF;
  border: none;
  border-radius: 8px;
  padding: 8px 16px;
  font-size: 0.84rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
}

.submit-delivery-btn:hover:not(:disabled) {
  background: #0870E8;
}

.submit-delivery-btn:disabled {
  background: #D5E0F2;
  cursor: not-allowed;
}
</style>