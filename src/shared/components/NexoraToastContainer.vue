<script setup lang="ts">
import { useUiStore } from '@/shared/stores/ui.store'
import { CheckCircle2, AlertTriangle, XCircle, Info, X } from 'lucide-vue-next'

const uiStore = useUiStore()
</script>

<template>
  <div class="toast-portal-container" aria-live="polite">
    <TransitionGroup name="toast-slide">
      <div
        v-for="toast in uiStore.toasts"
        :key="toast.id"
        :class="['toast-item', toast.type]"
      >
        <div class="toast-icon-wrap">
          <CheckCircle2 v-if="toast.type === 'success'" :size="20" />
          <AlertTriangle v-else-if="toast.type === 'warning'" :size="20" />
          <XCircle v-else-if="toast.type === 'error'" :size="20" />
          <Info v-else :size="20" />
        </div>

        <div class="toast-content">
          <div class="toast-title">{{ toast.title }}</div>
          <div class="toast-msg">{{ toast.message }}</div>
        </div>

        <button
          type="button"
          class="toast-close-btn"
          @click="uiStore.removeToast(toast.id)"
          aria-label="Cerrar notificación"
        >
          <X :size="16" />
        </button>
      </div>
    </TransitionGroup>
  </div>
</template>

<style scoped>
.toast-portal-container {
  position: fixed;
  bottom: 24px;
  right: 24px;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  gap: 10px;
  max-width: 400px;
  width: calc(100% - 48px);
  pointer-events: none;
}

.toast-item {
  pointer-events: auto;
  display: flex;
  align-items: flex-start;
  gap: 12px;
  background: #FFFFFF;
  border-radius: 12px;
  padding: 14px 16px;
  box-shadow: 0 10px 30px rgba(24, 43, 73, 0.15);
  border: 1px solid #E3EAF6;
  position: relative;
  overflow: hidden;
}

.toast-item::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 4px;
}

.toast-item.success::before { background: #00BA88; }
.toast-item.warning::before { background: #FFC83D; }
.toast-item.error::before { background: #EF4444; }
.toast-item.info::before { background: #087BFA; }

.toast-icon-wrap {
  flex-shrink: 0;
  margin-top: 1px;
}

.toast-item.success .toast-icon-wrap { color: #00BA88; }
.toast-item.warning .toast-icon-wrap { color: #D97706; }
.toast-item.error .toast-icon-wrap { color: #EF4444; }
.toast-item.info .toast-icon-wrap { color: #087BFA; }

.toast-content {
  flex: 1;
}

.toast-title {
  font-size: 0.88rem;
  font-weight: 700;
  color: #17366C;
  line-height: 1.25;
}

.toast-msg {
  font-size: 0.8rem;
  color: #556987;
  margin-top: 3px;
  line-height: 1.4;
}

.toast-close-btn {
  background: transparent;
  border: none;
  color: #71809B;
  cursor: pointer;
  padding: 2px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s;
}

.toast-close-btn:hover {
  background: #F4F7FD;
  color: #182B49;
}

.toast-slide-enter-active,
.toast-slide-leave-active {
  transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
}

.toast-slide-enter-from {
  opacity: 0;
  transform: translateX(30px);
}

.toast-slide-leave-to {
  opacity: 0;
  transform: scale(0.92);
}
</style>