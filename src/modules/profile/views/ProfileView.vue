<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { User, Mail, Phone, Shield, CheckCircle, Save, Camera, Sliders } from 'lucide-vue-next'
import { useAuthStore } from '@/modules/auth/auth.store'
import { formatDate } from '@/shared/utils/formatters'
import { updateProfileSchema } from '@/shared/validators/profile.validator'

const authStore = useAuthStore()
const user = computed(() => authStore.currentUser)

const fullName = ref(user.value?.full_name || '')
const phone = ref(user.value?.phone || '')
const isSubmitting = ref(false)
const successMessage = ref<string | null>(null)
const errorMessage = ref<string | null>(null)
const fieldErrors = ref<Record<string, string>>({})
const reduceMotion = ref(false)

const userRoleLabel = computed(() => {
  if (user.value?.role === 'admin') return 'Administrador'
  if (user.value?.role === 'employee') return 'Empleado / Especialista'
  return 'Cliente'
})

const employeeDept = ref('Tecnología e Infraestructura')
const employeeGroup = ref('Desarrollo Frontend & UI')
const employeePosition = ref('Ingeniero de Software Senior')

onMounted(() => {
  reduceMotion.value = localStorage.getItem('nexora_reduce_motion') === 'true'
  if (reduceMotion.value) {
    document.documentElement.classList.add('reduce-motion')
  }
})

function toggleReduceMotion() {
  localStorage.setItem('nexora_reduce_motion', String(reduceMotion.value))
  if (reduceMotion.value) {
    document.documentElement.classList.add('reduce-motion')
  } else {
    document.documentElement.classList.remove('reduce-motion')
  }
}

function handleAvatarUpload(e: Event) {
  const input = e.target as HTMLInputElement
  if (input.files && input.files[0]) {
    const file = input.files[0]
    if (file.size > 2 * 1024 * 1024) {
      errorMessage.value = 'La imagen debe ser menor a 2MB'
      return
    }
    const reader = new FileReader()
    reader.onload = async () => {
      const base64 = reader.result as string
      try {
        await authStore.updateProfile({ avatar_path: base64 })
        successMessage.value = 'Foto de perfil actualizada exitosamente'
      } catch (err: unknown) {
        errorMessage.value = err instanceof Error ? err.message : 'Error al guardar foto'
      }
    }
    reader.readAsDataURL(file)
  }
}

async function handleUpdateProfile() {
  if (!user.value) return
  successMessage.value = null
  errorMessage.value = null
  fieldErrors.value = {}

  const validation = updateProfileSchema.safeParse({
    full_name: fullName.value,
    phone: phone.value
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
    await authStore.updateProfile({
      full_name: fullName.value,
      phone: phone.value
    })
    successMessage.value = 'Perfil actualizado exitosamente'
  } catch (err: unknown) {
    errorMessage.value = err instanceof Error ? err.message : 'Error al actualizar perfil'
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <div class="profile-page">
    <div class="page-header">
      <h1 class="page-title">Mi Perfil</h1>
      <p class="page-subtitle">Gestiona tu información personal y preferencias de cuenta.</p>
    </div>

    <div v-if="successMessage" class="success-banner">
      <CheckCircle :size="18" />
      <span>{{ successMessage }}</span>
    </div>

    <div v-if="errorMessage" class="error-banner">
      {{ errorMessage }}
    </div>

    <div class="profile-layout">
      <div class="profile-card user-badge-card">
        <div class="badge-cover-bg">
          <div class="cover-glow-circle"></div>
          <div class="cover-mesh-lines"></div>
        </div>
        <div class="avatar-container">
          <div class="avatar-outer-ring">
            <div class="avatar-holder">
              <img :src="user?.avatar_path || '/images/illustrations/hero-character.jpg'" alt="Avatar" class="profile-avatar" />
              <label class="avatar-upload-btn" title="Cambiar foto de perfil">
                <Camera :size="14" />
                <input type="file" accept="image/*" class="hidden-file-input" @change="handleAvatarUpload" />
              </label>
            </div>
          </div>
          <span class="online-indicator" title="Estado: Disponible"></span>
        </div>

        <div class="user-main-info">
          <h3 class="user-display-name">{{ user?.full_name }}</h3>
          <p class="user-display-email">{{ user?.email }}</p>

          <div class="badge-role-row">
            <div class="role-pill">
              <Shield :size="14" />
              <span>{{ userRoleLabel }}</span>
            </div>
            <span class="status-pill active">🟢 Activo</span>
          </div>
        </div>

        <div class="profile-org-meta">
          <div v-if="user?.role !== 'client'" class="org-meta-item">
            <span class="meta-title">Departamento</span>
            <span class="meta-value">{{ employeeDept }}</span>
          </div>
          <div v-if="user?.role !== 'client'" class="org-meta-item">
            <span class="meta-title">Grupo Operativo</span>
            <span class="meta-value">{{ employeeGroup }}</span>
          </div>
          <div v-if="user?.role !== 'client'" class="org-meta-item">
            <span class="meta-title">Cargo Profesional</span>
            <span class="meta-value">{{ employeePosition }}</span>
          </div>
          <div v-else class="org-meta-item">
            <span class="meta-title">Cuenta</span>
            <span class="meta-value">Cliente Empresarial Verificado</span>
          </div>
          <div class="org-meta-item">
            <span class="meta-title">Miembro Desde</span>
            <span class="meta-value">{{ formatDate(user?.created_at || new Date().toISOString()) }}</span>
          </div>
        </div>
      </div>

      <div class="profile-card form-card">
        <h3 class="card-section-title">Información de contacto autorizada</h3>
        <p class="card-section-desc">Actualiza tus datos de contacto registrados para recibir notificaciones sobre tus solicitudes.</p>

        <form @submit.prevent="handleUpdateProfile" class="profile-form">
          <div class="form-group">
            <label class="form-label">Nombre completo</label>
            <div class="input-wrapper" :class="{ error: fieldErrors.full_name }">
              <User :size="18" class="input-icon" />
              <input v-model="fullName" type="text" />
            </div>
            <span v-if="fieldErrors.full_name" class="field-error">{{ fieldErrors.full_name }}</span>
          </div>

          <div class="form-group">
            <label class="form-label">Correo electrónico (solo lectura)</label>
            <div class="input-wrapper readonly">
              <Mail :size="18" class="input-icon" />
              <input :value="user?.email" type="email" readonly disabled />
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Teléfono de contacto</label>
            <div class="input-wrapper" :class="{ error: fieldErrors.phone }">
              <Phone :size="18" class="input-icon" />
              <input v-model="phone" type="tel" placeholder="+52 55 1234 5678" />
            </div>
            <span v-if="fieldErrors.phone" class="field-error">{{ fieldErrors.phone }}</span>
          </div>

          <button type="submit" class="btn btn-primary submit-btn" :disabled="isSubmitting">
            <Save :size="16" />
            <span>{{ isSubmitting ? 'Guardando...' : 'Guardar cambios' }}</span>
          </button>
        </form>

        <div class="preferences-divider"></div>

        <div class="preferences-block">
          <div class="pref-head">
            <Sliders :size="18" class="pref-icon" />
            <div>
              <h4 class="pref-title">Preferencias de Interfaz y Accesibilidad</h4>
              <p class="pref-desc">Configuración de animaciones y rendimiento visual conforme a WCAG 2.2.</p>
            </div>
          </div>

          <label class="pref-toggle-row">
            <div>
              <span class="toggle-name">Reducir animaciones e interacciones dinámicas</span>
              <span class="toggle-hint">Desactiva transiciones complejas para mejorar la concentración y rendimiento</span>
            </div>
            <input type="checkbox" v-model="reduceMotion" @change="toggleReduceMotion" class="toggle-switch" />
          </label>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.profile-page {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.page-title {
  font-size: 24px;
  font-weight: 800;
  color: var(--color-blue-title);
}

.page-subtitle {
  font-size: 13px;
  color: var(--color-text-secondary);
}

.success-banner {
  display: flex;
  align-items: center;
  gap: 10px;
  background-color: var(--color-success-bg);
  border: 1px solid var(--color-success-border);
  color: var(--color-success);
  padding: 12px 16px;
  border-radius: var(--radius-sm);
  font-size: 13px;
  font-weight: 600;
}

.error-banner {
  background-color: var(--color-danger-bg);
  border: 1px solid var(--color-danger-border);
  color: var(--color-danger);
  padding: 12px 16px;
  border-radius: var(--radius-sm);
  font-size: 13px;
}

.profile-layout {
  display: grid;
  grid-template-columns: 320px 1fr;
  gap: 24px;
}

.profile-card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: 28px;
  box-shadow: var(--shadow-card);
}

.user-badge-card {
  display: flex;
  flex-direction: column;
  padding: 0 0 24px 0;
  overflow: hidden;
}

.badge-cover-bg {
  height: 110px;
  width: 100%;
  background: linear-gradient(135deg, #0870E8 0%, #24B8FF 45%, #8755E9 100%);
  position: relative;
  overflow: hidden;
}

.cover-glow-circle {
  position: absolute;
  top: -30px;
  right: -30px;
  width: 130px;
  height: 130px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(255, 255, 255, 0.35) 0%, rgba(255, 255, 255, 0) 70%);
}

.cover-mesh-lines {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 100%;
  background-image: radial-gradient(rgba(255, 255, 255, 0.2) 1px, transparent 1px);
  background-size: 14px 14px;
  opacity: 0.6;
}

.avatar-container {
  position: relative;
  margin-top: -55px;
  margin-bottom: 12px;
  display: flex;
  justify-content: center;
}

.avatar-outer-ring {
  padding: 4px;
  border-radius: 50%;
  background: linear-gradient(135deg, #24B8FF 0%, #087BFA 50%, #8755E9 100%);
  box-shadow: 0 8px 24px rgba(8, 123, 250, 0.28);
}

.avatar-holder {
  position: relative;
  width: 96px;
  height: 96px;
  border-radius: 50%;
  border: 3px solid #FFFFFF;
  background: #FFFFFF;
  overflow: hidden;
}

.online-indicator {
  position: absolute;
  bottom: 8px;
  right: calc(50% - 46px);
  width: 15px;
  height: 15px;
  border-radius: 50%;
  background: #00BA88;
  border: 2px solid #FFFFFF;
  box-shadow: 0 0 8px rgba(0, 186, 136, 0.6);
}

.user-main-info {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 0 20px;
}

.badge-role-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 10px;
  justify-content: center;
}

.status-pill.active {
  font-size: 11px;
  font-weight: 700;
  color: #00BA88;
  background: #EBF8F2;
  padding: 3px 8px;
  border-radius: 12px;
}

.profile-org-meta {
  margin-top: 20px;
  padding: 16px 24px 0 24px;
  border-top: 1px solid var(--color-border);
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.org-meta-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
}

.meta-title {
  color: var(--color-text-secondary);
  font-weight: 500;
}

.meta-value {
  color: var(--color-blue-title);
  font-weight: 700;
}

.avatar-upload-btn {
  position: absolute;
  bottom: 0;
  right: 0;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: var(--color-primary);
  color: #FFFFFF;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
  transition: transform 0.15s;
}

.avatar-upload-btn:hover {
  transform: scale(1.1);
}

.hidden-file-input {
  display: none;
}

.profile-avatar {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center 20%;
}

.user-display-name {
  font-size: 18px;
  font-weight: 800;
  color: var(--color-blue-title);
}

.user-display-email {
  font-size: 13px;
  color: var(--color-text-secondary);
  margin-top: 4px;
}

.role-pill {
  margin-top: 14px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  border-radius: var(--radius-full);
  background: #EBF5FF;
  color: var(--color-primary);
  font-size: 12px;
  font-weight: 700;
}

.member-since {
  margin-top: 20px;
  padding-top: 16px;
  border-top: 1px solid var(--color-border);
  width: 100%;
  font-size: 12px;
  color: var(--color-text-muted);
}

.card-section-title {
  font-size: 17px;
  font-weight: 700;
  color: var(--color-blue-title);
  margin-bottom: 4px;
}

.card-section-desc {
  font-size: 13px;
  color: var(--color-text-secondary);
  margin-bottom: 24px;
}

.profile-form {
  display: flex;
  flex-direction: column;
  gap: 18px;
  max-width: 540px;
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

.input-wrapper.readonly {
  background: #F8FAFC;
  cursor: not-allowed;
}

.input-wrapper:focus-within:not(.readonly) {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(8, 123, 250, 0.15);
}

.input-icon {
  position: absolute;
  left: 12px;
  color: var(--color-text-muted);
}

.input-wrapper input {
  width: 100%;
  padding: 10px 14px 10px 38px;
  border: none;
  background: transparent;
  font-size: 14px;
}

.field-error {
  font-size: 11px;
  color: var(--color-danger);
}

.submit-btn {
  align-self: flex-start;
  margin-top: 8px;
}

.preferences-divider {
  margin: 24px 0;
  border-top: 1px solid var(--color-border);
}

.preferences-block {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.pref-head {
  display: flex;
  align-items: center;
  gap: 10px;
}

.pref-icon {
  color: var(--color-primary);
}

.pref-title {
  font-size: 14px;
  font-weight: 700;
  color: var(--color-blue-title);
  margin: 0;
}

.pref-desc {
  font-size: 12px;
  color: var(--color-text-secondary);
  margin: 2px 0 0 0;
}

.pref-toggle-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #F8FAFD;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  padding: 12px 14px;
  cursor: pointer;
}

.toggle-name {
  font-size: 13px;
  font-weight: 600;
  color: var(--color-text-main);
  display: block;
}

.toggle-hint {
  font-size: 11px;
  color: var(--color-text-secondary);
  display: block;
}

.toggle-switch {
  width: 18px;
  height: 18px;
  accent-color: var(--color-primary);
  cursor: pointer;
}

@media (max-width: 860px) {
  .profile-layout {
    grid-template-columns: 1fr;
  }
}
</style>
