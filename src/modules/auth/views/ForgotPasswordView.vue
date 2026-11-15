<script setup lang="ts">
import { ref } from 'vue'
import { RouterLink } from 'vue-router'
import { Mail, ArrowRight, ArrowLeft, CheckCircle2 } from 'lucide-vue-next'
import { repositories } from '@/shared/infrastructure/provider'
import { passwordRecoverySchema } from '@/shared/validators/auth.validator'

const email = ref('')
const isSubmitted = ref(false)
const errorMessage = ref<string | null>(null)
const fieldErrors = ref<Record<string, string>>({})
const isSubmitting = ref(false)

async function handleSubmit() {
  errorMessage.value = null
  fieldErrors.value = {}

  const validation = passwordRecoverySchema.safeParse({ email: email.value })
  if (!validation.success) {
    for (const issue of validation.error.issues) {
      const field = issue.path[0] as string
      fieldErrors.value[field] = issue.message
    }
    return
  }

  isSubmitting.value = true
  try {
    await repositories.auth.resetPassword(email.value)
    isSubmitted.value = true
  } catch (err: unknown) {
    errorMessage.value = err instanceof Error ? err.message : 'Error al solicitar recuperación'
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <div class="recovery-card">
    <div class="card-brand-header">
      <img src="/brand/logo.svg" alt="NEXORA" class="card-logo" />
    </div>

    <div v-if="isSubmitted" class="success-state">
      <div class="success-icon-wrap">
        <CheckCircle2 :size="48" class="success-icon" />
      </div>
      <h2 class="auth-title">Correo enviado</h2>
      <p class="auth-subtitle">
        Hemos enviado un enlace de recuperación a <strong>{{ email }}</strong>. Sigue las instrucciones del mensaje.
      </p>
      <RouterLink to="/login" class="back-login-btn">
        <ArrowLeft :size="18" />
        <span>Volver a iniciar sesión</span>
      </RouterLink>
    </div>

    <div v-else>
      <div class="card-titles">
        <h2 class="auth-title">Recuperar contraseña</h2>
        <p class="auth-subtitle">Ingresa tu correo para recibir instrucciones de recuperación</p>
      </div>

      <div v-if="errorMessage" class="error-banner" role="alert">
        {{ errorMessage }}
      </div>

      <form @submit.prevent="handleSubmit" class="auth-form" novalidate>
        <div class="form-group">
          <label for="email" class="form-label">Correo electrónico</label>
          <div class="input-wrapper" :class="{ error: fieldErrors.email }">
            <Mail :size="18" class="input-icon" />
            <input
              id="email"
              v-model="email"
              type="email"
              placeholder="correo@ejemplo.com"
              required
            />
          </div>
          <span v-if="fieldErrors.email" class="field-error">{{ fieldErrors.email }}</span>
        </div>

        <button type="submit" class="submit-btn" :disabled="isSubmitting">
          <span>{{ isSubmitting ? 'Enviando...' : 'Enviar instrucciones' }}</span>
          <ArrowRight :size="18" />
        </button>

        <div class="form-aux-links">
          <RouterLink to="/login" class="aux-link back">
            <ArrowLeft :size="16" />
            <span>Volver a iniciar sesión</span>
          </RouterLink>
        </div>
      </form>
    </div>
  </div>
</template>

<style scoped>
.recovery-card {
  background: rgba(255, 255, 255, 0.96);
  backdrop-filter: blur(12px);
  border-radius: var(--radius-xl);
  padding: 36px 32px;
  box-shadow: 0 20px 45px rgba(8, 123, 250, 0.18);
  border: 1px solid rgba(255, 255, 255, 0.8);
}

.card-brand-header {
  text-align: center;
  margin-bottom: 24px;
}

.card-logo {
  height: 48px;
  width: auto;
}

.card-titles {
  text-align: center;
  margin-bottom: 24px;
}

.auth-title {
  font-size: 22px;
  font-weight: 800;
  color: var(--color-blue-title);
  margin-bottom: 6px;
}

.auth-subtitle {
  font-size: 13px;
  color: var(--color-text-secondary);
  line-height: 1.4;
}

.error-banner {
  background-color: var(--color-danger-bg);
  border: 1px solid var(--color-danger-border);
  color: var(--color-danger);
  padding: 10px 14px;
  border-radius: var(--radius-sm);
  font-size: 13px;
  margin-bottom: 16px;
}

.auth-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-label {
  font-size: 13px;
  font-weight: 600;
  color: var(--color-text-main);
}

.input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  background: #FFFFFF;
}

.input-wrapper:focus-within {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(8, 123, 250, 0.15);
}

.input-wrapper.error {
  border-color: var(--color-danger);
}

.input-icon {
  position: absolute;
  left: 12px;
  color: var(--color-text-muted);
}

.input-wrapper input {
  width: 100%;
  padding: 12px 14px 12px 40px;
  border: none;
  background: transparent;
  font-size: 14px;
}

.field-error {
  font-size: 11px;
  color: var(--color-danger);
}

.submit-btn {
  margin-top: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  width: 100%;
  padding: 13px;
  background: var(--button-gradient);
  color: #FFFFFF;
  font-size: 15px;
  font-weight: 700;
  border-radius: var(--radius-sm);
  box-shadow: 0 6px 18px rgba(8, 123, 250, 0.3);
}

.submit-btn:disabled {
  opacity: 0.6;
}

.form-aux-links {
  text-align: center;
  margin-top: 14px;
}

.aux-link.back {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  font-weight: 600;
  color: var(--color-text-secondary);
}

.aux-link.back:hover {
  color: var(--color-primary);
}

.success-state {
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.success-icon-wrap {
  width: 72px;
  height: 72px;
  border-radius: 50%;
  background-color: var(--color-success-bg);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 8px;
}

.success-icon {
  color: var(--color-success);
}

.back-login-btn {
  margin-top: 16px;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  border-radius: var(--radius-sm);
  background: var(--button-gradient);
  color: #FFFFFF;
  font-weight: 600;
  font-size: 14px;
}
</style>
