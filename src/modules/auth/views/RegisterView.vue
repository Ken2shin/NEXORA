<script setup lang="ts">
import { ref } from 'vue'
import { useRouter, RouterLink } from 'vue-router'
import { User, Mail, Lock, Phone, ArrowRight } from 'lucide-vue-next'
import { useAuthStore } from '../auth.store'
import { registerSchema } from '@/shared/validators/auth.validator'

const router = useRouter()
const authStore = useAuthStore()

const fullName = ref('')
const email = ref('')
const phone = ref('')
const password = ref('')
const errorMessage = ref<string | null>(null)
const fieldErrors = ref<Record<string, string>>({})
const isSubmitting = ref(false)

async function handleSubmit() {
  errorMessage.value = null
  fieldErrors.value = {}

  const validation = registerSchema.safeParse({
    full_name: fullName.value,
    email: email.value,
    phone: phone.value,
    password: password.value
  })

  if (!validation.success) {
    for (const issue of validation.error.issues) {
      const field = issue.path[0] as string
      fieldErrors.value[field] = issue.message
    }
    return
  }

  isSubmitting.value = true
  try {
    await authStore.register({
      full_name: fullName.value,
      email: email.value,
      phone: phone.value,
      password: password.value
    })
    router.push('/client/dashboard')
  } catch (err: unknown) {
    errorMessage.value = err instanceof Error ? err.message : 'Error al registrarse'
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <div class="register-card">
    <div class="card-brand-header">
      <img src="/brand/logo.svg" alt="NEXORA" class="card-logo" />
    </div>

    <div class="card-titles">
      <h2 class="auth-title">Crear cuenta</h2>
      <p class="auth-subtitle">Regístrate para solicitar servicios empresariales</p>
    </div>

    <div v-if="errorMessage" class="error-banner" role="alert">
      {{ errorMessage }}
    </div>

    <form @submit.prevent="handleSubmit" class="auth-form" novalidate>
      <div class="form-group">
        <label for="fullName" class="form-label">Nombre completo</label>
        <div class="input-wrapper" :class="{ error: fieldErrors.full_name }">
          <User :size="18" class="input-icon" />
          <input
            id="fullName"
            v-model="fullName"
            type="text"
            placeholder="Ej. Juan Pérez"
            required
          />
        </div>
        <span v-if="fieldErrors.full_name" class="field-error">{{ fieldErrors.full_name }}</span>
      </div>

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

      <div class="form-group">
        <label for="phone" class="form-label">Teléfono (opcional)</label>
        <div class="input-wrapper" :class="{ error: fieldErrors.phone }">
          <Phone :size="18" class="input-icon" />
          <input
            id="phone"
            v-model="phone"
            type="tel"
            placeholder="+52 55 1234 5678"
          />
        </div>
        <span v-if="fieldErrors.phone" class="field-error">{{ fieldErrors.phone }}</span>
      </div>

      <div class="form-group">
        <label for="password" class="form-label">Contraseña</label>
        <div class="input-wrapper" :class="{ error: fieldErrors.password }">
          <Lock :size="18" class="input-icon" />
          <input
            id="password"
            v-model="password"
            type="password"
            placeholder="Mínimo 6 caracteres"
            required
          />
        </div>
        <span v-if="fieldErrors.password" class="field-error">{{ fieldErrors.password }}</span>
      </div>

      <button type="submit" class="submit-btn" :disabled="isSubmitting">
        <span>{{ isSubmitting ? 'Registrando...' : 'Crear mi cuenta' }}</span>
        <ArrowRight :size="18" />
      </button>

      <div class="form-aux-links">
        <RouterLink to="/login" class="aux-link">¿Ya tienes cuenta? Inicia sesión</RouterLink>
      </div>
    </form>
  </div>
</template>

<style scoped>
.register-card {
  background: rgba(255, 255, 255, 0.96);
  backdrop-filter: blur(12px);
  border-radius: var(--radius-xl);
  padding: 36px 32px;
  box-shadow: 0 20px 45px rgba(8, 123, 250, 0.18);
  border: 1px solid rgba(255, 255, 255, 0.8);
}

.card-brand-header {
  text-align: center;
  margin-bottom: 20px;
}

.card-logo {
  height: 44px;
  width: auto;
}

.card-titles {
  text-align: center;
  margin-bottom: 20px;
}

.auth-title {
  font-size: 22px;
  font-weight: 800;
  color: var(--color-blue-title);
  margin-bottom: 4px;
}

.auth-subtitle {
  font-size: 13px;
  color: var(--color-text-secondary);
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
  gap: 14px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 5px;
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
  padding: 11px 14px 11px 40px;
  border: none;
  background: transparent;
  font-size: 14px;
}

.field-error {
  font-size: 11px;
  color: var(--color-danger);
}

.submit-btn {
  margin-top: 10px;
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

.aux-link {
  font-size: 13px;
  font-weight: 600;
  color: var(--color-primary);
}
</style>
