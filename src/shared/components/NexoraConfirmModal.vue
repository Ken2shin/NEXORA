<script setup lang="ts">
import { useUiStore } from '@/shared/stores/ui.store'
import { AlertTriangle, AlertCircle, X } from 'lucide-vue-next'

const uiStore = useUiStore()
</script>

<template>
  <Teleport to="body">
    <Transition name="confirm-fade">
      <div v-if="uiStore.isConfirmOpen" class="confirm-backdrop" @click="uiStore.handleCancel">
        <div class="confirm-modal-box" @click.stop role="dialog" aria-modal="true">
          <div class="confirm-header">
            <div :class="['confirm-icon-pill', { danger: uiStore.confirmIsDanger }]">
              <AlertTriangle v-if="uiStore.confirmIsDanger" :size="24" />
              <AlertCircle v-else :size="24" />
            </div>
            <button
              type="button"
              class="close-modal-btn"
              @click="uiStore.handleCancel"
              aria-label="Cerrar ventana"
            >
              <X :size="18" />
            </button>
          </div>

          <div class="confirm-body">
            <h3 class="confirm-title">{{ uiStore.confirmTitle }}</h3>
            <p class="confirm-message">{{ uiStore.confirmMessage }}</p>

            <div v-if="uiStore.confirmConsequence" class="consequence-callout">
              <span class="consequence-label">Consecuencia de la acción:</span>
              <p class="consequence-text">{{ uiStore.confirmConsequence }}</p>
            </div>
          </div>

          <div class="confirm-footer">
            <button
              type="button"
              class="btn-cancel"
              @click="uiStore.handleCancel"
            >
              {{ uiStore.cancelBtnText }}
            </button>

            <button
              type="button"
              :class="['btn-action', { 'btn-danger': uiStore.confirmIsDanger, 'btn-primary': !uiStore.confirmIsDanger }]"
              @click="uiStore.handleConfirm"
            >
              {{ uiStore.confirmBtnText }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.confirm-backdrop {
  position: fixed;
  inset: 0;
  z-index: 10000;
  background: rgba(15, 23, 42, 0.55);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
}

.confirm-modal-box {
  background: #FFFFFF;
  border-radius: 16px;
  width: 100%;
  max-width: 460px;
  box-shadow: 0 20px 45px rgba(15, 23, 42, 0.2);
  border: 1px solid #E3EAF6;
  padding: 24px;
  display: flex;
  flex-direction: column;
  animation: scaleIn 0.2s cubic-bezier(0.16, 1, 0.3, 1);
}

.confirm-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.confirm-icon-pill {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background: #EBF5FF;
  color: #087BFA;
  display: flex;
  align-items: center;
  justify-content: center;
}

.confirm-icon-pill.danger {
  background: #FEF2F2;
  color: #EF4444;
}

.close-modal-btn {
  background: transparent;
  border: none;
  color: #71809B;
  cursor: pointer;
  padding: 6px;
  border-radius: 6px;
}

.close-modal-btn:hover {
  background: #F4F7FD;
  color: #182B49;
}

.confirm-title {
  font-size: 1.15rem;
  font-weight: 800;
  color: #17366C;
  margin: 0 0 8px 0;
}

.confirm-message {
  font-size: 0.88rem;
  color: #556987;
  line-height: 1.5;
  margin: 0 0 14px 0;
}

.consequence-callout {
  background: #FFFBEB;
  border: 1px solid #FDE68A;
  border-radius: 8px;
  padding: 10px 12px;
  margin-bottom: 20px;
}

.consequence-label {
  font-size: 0.72rem;
  font-weight: 700;
  color: #B45309;
  text-transform: uppercase;
  display: block;
  margin-bottom: 2px;
}

.consequence-text {
  font-size: 0.8rem;
  color: #92400E;
  line-height: 1.4;
  margin: 0;
}

.confirm-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 10px;
}

.btn-cancel {
  background: #FFFFFF;
  border: 1px solid #D5E0F2;
  color: #475569;
  font-size: 0.85rem;
  font-weight: 600;
  padding: 9px 18px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.15s;
}

.btn-cancel:hover {
  background: #F8FAFD;
  color: #1E293B;
}

.btn-action {
  font-size: 0.85rem;
  font-weight: 700;
  padding: 9px 20px;
  border-radius: 8px;
  border: none;
  cursor: pointer;
  transition: all 0.15s;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.btn-primary {
  background: #087BFA;
  color: #FFFFFF;
}

.btn-primary:hover {
  background: #0870E8;
}

.btn-danger {
  background: #EF4444;
  color: #FFFFFF;
}

.btn-danger:hover {
  background: #DC2626;
}

.confirm-fade-enter-active,
.confirm-fade-leave-active {
  transition: opacity 0.2s ease;
}

.confirm-fade-enter-from,
.confirm-fade-leave-to {
  opacity: 0;
}

@keyframes scaleIn {
  from {
    transform: scale(0.95);
    opacity: 0;
  }
  to {
    transform: scale(1);
    opacity: 1;
  }
}
</style>