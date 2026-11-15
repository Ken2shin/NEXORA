<script setup lang="ts">
import { ref } from 'vue'
import { useRouter, RouterLink } from 'vue-router'
import { User, Lock, Eye, EyeOff, ArrowRight, ShieldCheck } from 'lucide-vue-next'
import { useAuthStore } from '../auth.store'
import { loginSchema } from '@/shared/validators/auth.validator'
import type { UserProfile } from '@/shared/types/user.types'
import BaseModal from '@/shared/components/BaseModal.vue'
import { getSupabaseClient } from '@/shared/infrastructure/supabase'

const router = useRouter()
const authStore = useAuthStore()

const email = ref('')
const password = ref('')
const showPassword = ref(false)
const errorMessage = ref<string | null>(null)
const fieldErrors = ref<Record<string, string>>({})
const isSubmitting = ref(false)

const isPasswordChangeModalOpen = ref(false)
const pendingUser = ref<UserProfile | null>(null)
const newPassword = ref('')
const confirmNewPassword = ref('')
const pwdChangeError = ref<string | null>(null)

function resolvePortalRoute(user: UserProfile): string {
  if (user.role === 'client') {
    return '/client/dashboard'
  }
  if (user.role === 'admin') {
    return '/admin/dashboard'
  }

  const dept = (user.department_name || '').toLowerCase()
  const deptId = (user.department_id || '').toLowerCase()

  if (dept.includes('ciberseguridad') || dept.includes('seguridad') || deptId === 'dept-2' || deptId === 'dept-security') {
    return '/admin/security'
  }
  if (dept.includes('desarrollo') || dept.includes('tecnología') || dept.includes('sistemas') || deptId === 'dept-1' || deptId === 'dept-3' || deptId === 'dept-dev' || deptId === 'dept-tech') {
    return '/admin/development'
  }
  if (dept.includes('soporte') || dept.includes('atención') || deptId === 'dept-support') {
    return '/admin/support'
  }
  if (dept.includes('recursos humanos') || dept.includes('rrhh') || dept.includes('talento') || deptId === 'dept-4' || deptId === 'dept-hr') {
    return '/admin/hr'
  }
  if (dept.includes('contabilidad') || dept.includes('finanzas') || deptId === 'dept-5' || deptId === 'dept-finance') {
    return '/admin/finance'
  }
  if (dept.includes('legal') || dept.includes('jurídico') || deptId === 'dept-6' || deptId === 'dept-legal') {
    return '/admin/legal'
  }

  return '/admin/requests'
}

async function handleSubmit() {
  errorMessage.value = null
  fieldErrors.value = {}

  const validation = loginSchema.safeParse({
    email: email.value,
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
    const user = await authStore.login({
      email: email.value,
      password: password.value
    })

    if (user.must_change_password) {
      pendingUser.value = user
      isPasswordChangeModalOpen.value = true
      return
    }

    router.push(resolvePortalRoute(user))
  } catch (err: unknown) {
    errorMessage.value = err instanceof Error ? err.message : 'Error al iniciar sesión'
  } finally {
    isSubmitting.value = false
  }
}

async function handleSaveNewPassword() {
  pwdChangeError.value = null
  if (!newPassword.value || newPassword.value.length < 8) {
    pwdChangeError.value = 'La contraseña debe contener al menos 8 caracteres.'
    return
  }
  if (newPassword.value !== confirmNewPassword.value) {
    pwdChangeError.value = 'Las contraseñas no coinciden.'
    return
  }

  if (pendingUser.value) {
    try {
      const client = getSupabaseClient()
      if (client) {
        await client.auth.updateUser({ password: newPassword.value })
        const { data: emp } = await client
          .from('employees')
          .select('id')
          .or(`user_id.eq.${pendingUser.value.id},email.eq.${pendingUser.value.email.toLowerCase()}`)
          .maybeSingle()
        if (emp) {
          await client
            .from('temporary_credentials')
            .update({ must_change_password: false, used_at: new Date().toISOString() })
            .eq('employee_id', emp.id)
        }
      }
    } catch {}

    pendingUser.value.must_change_password = false
    authStore.setDirectUser(pendingUser.value)

    const storedCreds = localStorage.getItem('nexora_org_credentials')
    if (storedCreds) {
      try {
        const creds = JSON.parse(storedCreds)
        const matched = creds.find((c: { email: string }) => c.email.toLowerCase() === pendingUser.value!.email.toLowerCase())
        if (matched) {
          matched.must_change_password = false
          localStorage.setItem('nexora_org_credentials', JSON.stringify(creds))
        }
      } catch {}
    }

    isPasswordChangeModalOpen.value = false
    router.push(resolvePortalRoute(pendingUser.value))
  }
}
</script>

<template>
  <div class="login-card">
    <div class="card-brand-header">
      <img src="/brand/logo.svg" alt="NEXORA" class="card-logo" />
    </div>

    <div class="card-titles">
      <h2 class="auth-title">Iniciar sesión</h2>
      <p class="auth-subtitle">Accede a tu cuenta para continuar</p>
    </div>

    <div v-if="errorMessage" class="error-banner" role="alert">
      {{ errorMessage }}
    </div>

    <form @submit.prevent="handleSubmit" class="auth-form" novalidate>
      <div class="form-group">
        <label for="email" class="form-label"> Correo Electronico</label>
        <div class="input-wrapper" :class="{ error: fieldErrors.email }">
          <User :size="20" class="input-icon" />
          <input
            id="email"
            v-model="email"
            type="email"
            placeholder="correo@ejemplo.com"
            autocomplete="email"
            required
            aria-required="true"
          />
        </div>
        <span v-if="fieldErrors.email" class="field-error">{{ fieldErrors.email }}</span>
      </div>

      <div class="form-group">
        <label for="password" class="form-label">Contraseña</label>
        <div class="input-wrapper" :class="{ error: fieldErrors.password }">
          <Lock :size="20" class="input-icon" />
          <input
            id="password"
            v-model="password"
            :type="showPassword ? 'text' : 'password'"
            placeholder="••••••••"
            autocomplete="current-password"
            required
            aria-required="true"
          />
          <button
            type="button"
            class="toggle-pwd-btn"
            @click="showPassword = !showPassword"
            :aria-label="showPassword ? 'Ocultar contraseña' : 'Ver contraseña'"
          >
            <EyeOff v-if="showPassword" :size="20" />
            <Eye v-else :size="20" />
          </button>
        </div>
        <span v-if="fieldErrors.password" class="field-error">{{ fieldErrors.password }}</span>
      </div>

      <button type="submit" class="submit-btn" :disabled="isSubmitting">
        <span>{{ isSubmitting ? 'Iniciando sesión...' : 'Iniciar sesión' }}</span>
        <ArrowRight :size="20" />
      </button>

      <div class="form-aux-links">
        <RouterLink to="/forgot-password" class="aux-link">¿Olvidaste tu contraseña?</RouterLink>
        <RouterLink to="/register" class="aux-link highlight">¿No tienes cuenta? Regístrate</RouterLink>
      </div>
    </form>

    <BaseModal
      v-model="isPasswordChangeModalOpen"
      title="Cambio Obligatorio de Contraseña Inicial"
    >
      <form @submit.prevent="handleSaveNewPassword" class="pwd-change-form">
        <div class="pwd-change-header">
          <ShieldCheck :size="24" class="text-blue" />
          <p class="pwd-change-desc">
            Has ingresado con una contraseña temporal de primer uso. Por políticas de seguridad de NEXORA, debes establecer una contraseña definitiva y personal para ingresar a tu portal asignado.
          </p>
        </div>

        <div v-if="pwdChangeError" class="error-banner">
          {{ pwdChangeError }}
        </div>

        <div class="form-group">
          <label class="form-label">Nueva Contraseña Definitiva</label>
          <div class="input-wrapper">
            <Lock :size="18" class="input-icon" />
            <input
              v-model="newPassword"
              type="password"
              placeholder="Mínimo 8 caracteres"
              required
            />
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">Confirmar Nueva Contraseña</label>
          <div class="input-wrapper">
            <Lock :size="18" class="input-icon" />
            <input
              v-model="confirmNewPassword"
              type="password"
              placeholder="Repite la contraseña"
              required
            />
          </div>
        </div>

        <button type="submit" class="submit-btn" style="margin-top: 10px;">
          <span>Guardar y Acceder a mi Portal</span>
          <ArrowRight :size="18" />
        </button>
      </form>
    </BaseModal>
  </div>
</template>

<style scoped>
.login-card {
  background: rgba(255, 255, 255, 0.98);
  backdrop-filter: blur(14px);
  border-radius: 24px;
  padding: 46px 44px;
  box-shadow: 0 24px 50px rgba(8, 123, 250, 0.20), 0 4px 14px rgba(0, 0, 0, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.9);
  width: 100%;
}

.card-brand-header {
  text-align: center;
  margin-bottom: 24px;
}

.card-logo {
  height: 56px;
  width: auto;
}

.card-titles {
  text-align: center;
  margin-bottom: 26px;
}

.auth-title {
  font-size: 26px;
  font-weight: 800;
  color: var(--color-blue-title);
  margin-bottom: 6px;
  letter-spacing: -0.3px;
}

.auth-subtitle {
  font-size: 15px;
  color: var(--color-text-secondary);
}

.error-banner {
  background-color: var(--color-danger-bg);
  border: 1px solid var(--color-danger-border);
  color: var(--color-danger);
  padding: 12px 16px;
  border-radius: var(--radius-sm);
  font-size: 14px;
  margin-bottom: 20px;
}

.auth-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-label {
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text-main);
}

.input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  border: 1.5px solid var(--color-border);
  border-radius: 10px;
  background: #FFFFFF;
  transition: border-color var(--transition-fast), box-shadow var(--transition-fast);
}

.input-wrapper:focus-within {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3.5px rgba(8, 123, 250, 0.16);
}

.input-wrapper.error {
  border-color: var(--color-danger);
}

.input-icon {
  position: absolute;
  left: 14px;
  color: var(--color-text-muted);
  pointer-events: none;
}

.input-wrapper input {
  width: 100%;
  padding: 14px 16px 14px 46px;
  border: none;
  background: transparent;
  font-size: 15px;
  color: var(--color-text-main);
  outline: none;
}

.toggle-pwd-btn {
  padding: 0 14px;
  color: var(--color-text-muted);
  display: flex;
  align-items: center;
  justify-content: center;
}

.toggle-pwd-btn:hover {
  color: var(--color-text-main);
}

.field-error {
  font-size: 12px;
  color: var(--color-danger);
  font-weight: 500;
}

.submit-btn {
  margin-top: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  width: 100%;
  padding: 15px;
  background: var(--button-gradient);
  color: #FFFFFF;
  font-size: 16px;
  font-weight: 700;
  border-radius: 10px;
  box-shadow: 0 8px 22px rgba(8, 123, 250, 0.32);
  transition: all var(--transition-fast);
}

.submit-btn:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 10px 26px rgba(8, 123, 250, 0.42);
}

.submit-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.form-aux-links {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  margin-top: 16px;
}

.aux-link {
  font-size: 14px;
  font-weight: 600;
  color: var(--color-primary);
}

.aux-link.highlight {
  color: var(--color-text-secondary);
}

.aux-link.highlight:hover {
  color: var(--color-primary);
}

.pwd-change-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 8px 0;
}

.pwd-change-header {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  background: #EFF6FF;
  border: 1px solid #BFDBFE;
  padding: 14px 16px;
  border-radius: 10px;
}

.pwd-change-desc {
  font-size: 13px;
  color: #1E3A8A;
  line-height: 1.45;
  margin: 0;
}

.text-blue {
  color: var(--color-primary);
  flex-shrink: 0;
  margin-top: 2px;
}

@media (max-width: 520px) {
  .login-card {
    padding: 34px 22px;
    border-radius: 18px;
  }

  .auth-title {
    font-size: 22px;
  }

  .card-logo {
    height: 48px;
  }
}
</style>