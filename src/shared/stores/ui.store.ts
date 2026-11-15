import { defineStore } from 'pinia'
import { ref } from 'vue'

export interface ToastItem {
  id: string
  type: 'success' | 'info' | 'warning' | 'error'
  title: string
  message: string
  duration?: number
}

export interface ConfirmOptions {
  title: string
  message: string
  consequence?: string
  confirmText?: string
  cancelText?: string
  isDanger?: boolean
}

export const useUiStore = defineStore('ui', () => {
  const toasts = ref<ToastItem[]>([])

  const isConfirmOpen = ref(false)
  const confirmTitle = ref('')
  const confirmMessage = ref('')
  const confirmConsequence = ref('')
  const confirmBtnText = ref('Confirmar')
  const cancelBtnText = ref('Cancelar')
  const confirmIsDanger = ref(false)
  const isConfirmProcessing = ref(false)
  let confirmResolve: ((value: boolean) => void) | null = null

  function showToast(type: 'success' | 'info' | 'warning' | 'error', title: string, message: string, duration = 4000): void {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`
    toasts.value.push({ id, type, title, message, duration })

    if (duration > 0) {
      setTimeout(() => {
        removeToast(id)
      }, duration)
    }
  }

  function removeToast(id: string): void {
    toasts.value = toasts.value.filter(t => t.id !== id)
  }

  function confirm(options: ConfirmOptions): Promise<boolean> {
    confirmTitle.value = options.title
    confirmMessage.value = options.message
    confirmConsequence.value = options.consequence || ''
    confirmBtnText.value = options.confirmText || 'Confirmar'
    cancelBtnText.value = options.cancelText || 'Cancelar'
    confirmIsDanger.value = options.isDanger ?? false
    isConfirmProcessing.value = false
    isConfirmOpen.value = true

    return new Promise<boolean>((resolve) => {
      confirmResolve = resolve
    })
  }

  function handleConfirm(): void {
    isConfirmOpen.value = false
    if (confirmResolve) {
      confirmResolve(true)
      confirmResolve = null
    }
  }

  function handleCancel(): void {
    isConfirmOpen.value = false
    if (confirmResolve) {
      confirmResolve(false)
      confirmResolve = null
    }
  }

  return {
    toasts,
    showToast,
    removeToast,
    isConfirmOpen,
    confirmTitle,
    confirmMessage,
    confirmConsequence,
    confirmBtnText,
    cancelBtnText,
    confirmIsDanger,
    isConfirmProcessing,
    confirm,
    handleConfirm,
    handleCancel
  }
})