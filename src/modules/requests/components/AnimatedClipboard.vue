<script setup lang="ts">
import { computed } from 'vue'
import { Check, Loader2, Sparkles, Send } from 'lucide-vue-next'

const props = defineProps<{
  serviceSelected: boolean
  hasDescription: boolean
  hasFiles: boolean
  isSubmitting: boolean
  isSuccess: boolean
}>()

const step1 = computed(() => props.serviceSelected || props.isSuccess)
const step2 = computed(() => props.hasDescription || props.isSuccess)
const step3 = computed(() => (step1.value && step2.value) || props.isSuccess)

const isAllReady = computed(() => step1.value && step2.value)

const progressPercent = computed(() => {
  if (props.isSuccess) return 100
  let p = 0
  if (step1.value) p += 35
  if (step2.value) p += 45
  if (props.hasFiles) p += 20
  return Math.min(p, 100)
})

const statusText = computed(() => {
  if (props.isSuccess) return '¡Enviado con éxito!'
  if (props.isSubmitting) return 'Enviando solicitud...'
  if (isAllReady.value) return '¡Listo para enviar!'
  return 'En preparación'
})
</script>

<template>
  <div class="clipboard-wrapper">
    <div class="clipboard-card">
      <div class="clipboard-clip">
        <div class="clip-metal"></div>
      </div>

      <div class="clipboard-header">
        <div class="header-top">
          <span class="board-title">Checklist</span>
          <span class="progress-badge">{{ progressPercent }}%</span>
        </div>
        <div class="progress-bar-bg">
          <div class="progress-bar-fill" :style="{ width: `${progressPercent}%` }"></div>
        </div>
      </div>

      <div class="checklist-items">
        <div class="check-row" :class="{ completed: step1 }">
          <div class="check-box" :class="{ checked: step1 }">
            <Check v-if="step1" :size="14" class="check-svg" />
          </div>
          <div class="check-content">
            <span class="row-label">Servicio</span>
            <div class="row-line" :class="{ filled: step1 }"></div>
          </div>
        </div>

        <div class="check-row" :class="{ completed: step2 }">
          <div class="check-box" :class="{ checked: step2 }">
            <Check v-if="step2" :size="14" class="check-svg" />
          </div>
          <div class="check-content">
            <span class="row-label">Descripción</span>
            <div class="row-line" :class="{ filled: step2 }"></div>
          </div>
        </div>

        <div class="check-row" :class="{ completed: step3 }">
          <div class="check-box" :class="{ checked: step3 }">
            <Check v-if="step3" :size="14" class="check-svg" />
          </div>
          <div class="check-content">
            <span class="row-label">Revisión</span>
            <div class="row-line" :class="{ filled: step3 }"></div>
          </div>
        </div>
      </div>

      <div class="status-pill-wrap">
        <div
          class="status-pill"
          :class="{
            sent: isSuccess,
            submitting: isSubmitting,
            ready: isAllReady && !isSuccess && !isSubmitting,
            preparing: !isAllReady && !isSuccess && !isSubmitting
          }"
        >
          <Loader2 v-if="isSubmitting" :size="13" class="spin-icon" />
          <Send v-else-if="isSuccess" :size="13" class="sent-icon" />
          <Sparkles v-else-if="isAllReady" :size="13" class="ready-icon" />
          <span v-else class="prep-dot"></span>
          <span class="status-label">{{ statusText }}</span>
        </div>
      </div>
    </div>

    <div
      class="floating-success-badge"
      :class="{
        celebrate: isSuccess,
        ready: isAllReady && !isSuccess
      }"
    >
      <Check :size="24" class="badge-check-icon" />
    </div>
  </div>
</template>

<style scoped>
.clipboard-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 230px;
}

.clipboard-card {
  position: relative;
  width: 100%;
  background: #FFFFFF;
  border: 2px solid var(--color-border);
  border-radius: 24px;
  padding: 38px 20px 24px 20px;
  box-shadow: 0 16px 36px rgba(8, 123, 250, 0.14), 0 2px 8px rgba(0, 0, 0, 0.04);
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.clipboard-clip {
  position: absolute;
  top: -14px;
  left: 50%;
  transform: translateX(-50%);
  width: 64px;
  height: 26px;
  background: linear-gradient(135deg, var(--color-purple) 0%, var(--color-primary) 100%);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 10px rgba(130, 82, 232, 0.35);
}

.clip-metal {
  width: 24px;
  height: 6px;
  background: rgba(255, 255, 255, 0.85);
  border-radius: 3px;
}

.clipboard-header {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.header-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.board-title {
  font-size: 13px;
  font-weight: 800;
  color: var(--color-blue-title);
  letter-spacing: -0.2px;
}

.progress-badge {
  font-size: 11px;
  font-weight: 700;
  color: var(--color-primary);
  background: #EBF5FF;
  padding: 2px 7px;
  border-radius: var(--radius-full);
}

.progress-bar-bg {
  width: 100%;
  height: 5px;
  background: #F1F5F9;
  border-radius: 3px;
  overflow: hidden;
}

.progress-bar-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--color-primary) 0%, var(--color-blue-bright) 100%);
  border-radius: 3px;
  transition: width 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.checklist-items {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.check-row {
  display: flex;
  align-items: center;
  gap: 12px;
  transition: all var(--transition-fast);
}

.check-box {
  width: 24px;
  height: 24px;
  border-radius: 8px;
  border: 2px solid #CBD5E1;
  background: #FFFFFF;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.check-box.checked {
  background: var(--color-primary);
  border-color: var(--color-primary);
  transform: scale(1.08);
  box-shadow: 0 4px 10px rgba(8, 123, 250, 0.35);
}

.check-svg {
  color: #FFFFFF;
  stroke-width: 3.5;
  animation: checkPop 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.check-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.row-label {
  font-size: 12px;
  font-weight: 700;
  color: var(--color-text-secondary);
  transition: color var(--transition-fast);
}

.check-row.completed .row-label {
  color: var(--color-blue-title);
}

.row-line {
  width: 100%;
  height: 6px;
  background: #F1F5F9;
  border-radius: 3px;
  position: relative;
  overflow: hidden;
}

.row-line::after {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 0%;
  background: linear-gradient(90deg, #BAE6FD 0%, var(--color-primary) 100%);
  border-radius: 3px;
  transition: width 0.4s ease;
}

.row-line.filled::after {
  width: 100%;
}

.status-pill-wrap {
  display: flex;
  justify-content: center;
  margin-top: 4px;
}

.status-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  border-radius: var(--radius-full);
  font-size: 11.5px;
  font-weight: 800;
  transition: all 0.3s ease;
}

.status-pill.preparing {
  background: #F8FAFC;
  color: var(--color-text-secondary);
  border: 1px solid var(--color-border);
}

.status-pill.ready {
  background: #EBF5FF;
  color: var(--color-primary);
  border: 1px solid #BAE6FD;
  box-shadow: 0 4px 12px rgba(8, 123, 250, 0.2);
  animation: gentlePulse 2s infinite ease-in-out;
}

.status-pill.submitting {
  background: #FEF3C7;
  color: var(--color-yellow-dark);
  border: 1px solid #FDE68A;
}

.status-pill.sent {
  background: var(--color-success-bg);
  color: var(--color-success);
  border: 1px solid var(--color-success-border);
  box-shadow: 0 4px 14px rgba(22, 163, 74, 0.25);
  animation: checkPop 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.prep-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--color-text-muted);
}

.ready-icon {
  color: var(--color-primary);
}

.sent-icon {
  color: var(--color-success);
}

.spin-icon {
  animation: spin 1s linear infinite;
}

.floating-success-badge {
  position: absolute;
  right: -14px;
  bottom: 8px;
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: #10B981;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #FFFFFF;
  box-shadow: 0 8px 20px rgba(16, 185, 129, 0.38), 0 2px 6px rgba(0, 0, 0, 0.08);
  border: 3px solid #FFFFFF;
  transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
  animation: floatBadge 3.5s ease-in-out infinite;
}

.floating-success-badge.ready {
  background: var(--color-primary);
  box-shadow: 0 8px 22px rgba(8, 123, 250, 0.45);
}

.floating-success-badge.celebrate {
  background: #10B981;
  transform: scale(1.18);
  box-shadow: 0 10px 28px rgba(16, 185, 129, 0.55);
}

.badge-check-icon {
  stroke-width: 3.5;
}

@keyframes checkPop {
  0% { transform: scale(0.6); opacity: 0; }
  70% { transform: scale(1.2); opacity: 1; }
  100% { transform: scale(1); opacity: 1; }
}

@keyframes floatBadge {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-6px); }
}

@keyframes gentlePulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.03); }
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
</style>