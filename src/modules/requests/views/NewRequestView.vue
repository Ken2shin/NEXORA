<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute, RouterLink } from 'vue-router'
import { UploadCloud, ArrowRight, CheckCircle2, FileText, X } from 'lucide-vue-next'
import { repositories } from '@/shared/infrastructure/provider'
import type { Service } from '@/shared/types/service.types'
import { useAuthStore } from '@/modules/auth/auth.store'
import { createRequestSchema } from '@/shared/validators/request.validator'
import AnimatedClipboard from '../components/AnimatedClipboard.vue'
import IntakeFormEngine from '../components/IntakeFormEngine.vue'
import DuplicateShieldBanner from '../components/DuplicateShieldBanner.vue'
import type { ServiceRequest } from '@/shared/types/request.types'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

const services = ref<Service[]>([])
const userActiveRequests = ref<ServiceRequest[]>([])
const selectedServiceId = ref('')
const description = ref('')
const uploadedFiles = ref<File[]>([])
const isDragging = ref(false)

const intakeSummary = ref('')
const intakeValid = ref(true)

const fieldErrors = ref<Record<string, string>>({})
const formError = ref<string | null>(null)
const isSubmitting = ref(false)
const isSuccess = ref(false)
const createdNumber = ref('')

const selectedServiceName = computed(() => {
  const match = services.value.find(s => s.id === selectedServiceId.value)
  return match?.name || 'Servicio General'
})

onMounted(async () => {
  const res = await repositories.services.getServices({ is_active: true, limit: 100 })
  services.value = res.data

  if (authStore.currentUser) {
    try {
      const active = await repositories.requests.getRequests({
        client_id: authStore.currentUser.id,
        limit: 20
      })
      userActiveRequests.value = active.data
    } catch {}
  }

  const queryId = route.query.serviceId as string | undefined
  if (queryId && services.value.some(s => s.id === queryId)) {
    selectedServiceId.value = queryId
  } else if (services.value.length > 0) {
    selectedServiceId.value = services.value[0]!.id
  }
})

function onIntakeSummary(summary: string) {
  intakeSummary.value = summary
}

function onIntakeValidity(isValid: boolean) {
  intakeValid.value = isValid
}

function handleFileDrop(e: DragEvent) {
  isDragging.value = false
  if (e.dataTransfer?.files) {
    addFiles(Array.from(e.dataTransfer.files))
  }
}

function handleFileInput(e: Event) {
  const target = event?.target as HTMLInputElement | null
  const files = e.target ? (e.target as HTMLInputElement).files : target?.files
  if (files) {
    addFiles(Array.from(files))
  }
}

function addFiles(files: File[]) {
  const validFiles = files.filter(f => f.size <= 10 * 1024 * 1024)
  uploadedFiles.value = [...uploadedFiles.value, ...validFiles]
}

function removeFile(index: number) {
  uploadedFiles.value.splice(index, 1)
}

function handleCancel() {
  router.push('/client/dashboard')
}

async function handleSubmit() {
  fieldErrors.value = {}
  formError.value = null

  const validation = createRequestSchema.safeParse({
    service_id: selectedServiceId.value,
    description: description.value
  })

  if (!validation.success) {
    for (const issue of validation.error.issues) {
      const field = issue.path[0] as string
      fieldErrors.value[field] = issue.message
    }
    return
  }

  if (!authStore.currentUser) {
    formError.value = 'Debes iniciar sesión para enviar una solicitud'
    return
  }

  isSubmitting.value = true
  try {
    const combinedDesc = intakeSummary.value.trim()
      ? `${description.value.trim()}\n\nRequerimientos Intake:\n${intakeSummary.value.trim()}`
      : description.value.trim()

    const created = await repositories.requests.createRequest(authStore.currentUser.id, {
      service_id: selectedServiceId.value,
      description: combinedDesc,
      files: uploadedFiles.value
    })

    createdNumber.value = created.request_number
    isSuccess.value = true
    try {
      localStorage.removeItem('nexora_intake_draft')
    } catch {}
  } catch (err: unknown) {
    formError.value = err instanceof Error ? err.message : 'Error al registrar la solicitud'
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <div class="new-request-page">
    <div class="page-header">
      <div class="breadcrumbs">
        <span class="crumb-root">Solicitudes</span>
        <span class="crumb-separator">&gt;</span>
        <span class="crumb-current">Nueva Solicitud</span>
      </div>
      <h1 class="page-title">Solicitar un servicio</h1>
      <p class="page-subtitle">Completa el formulario guiado para realizar tu solicitud.</p>
    </div>

    <div v-if="isSuccess" class="success-card card">
      <div class="success-icon-wrap">
        <CheckCircle2 :size="56" class="success-icon" />
      </div>
      <h2 class="success-title">¡Solicitud recibida con éxito!</h2>
      <p class="success-desc">
        Tu solicitud ha sido registrada bajo el folio <strong>{{ createdNumber }}</strong>.
        Nuestro equipo técnico ha sido notificado y comenzará a atenderla de inmediato.
      </p>
      <div class="success-actions">
        <button class="btn btn-secondary" @click="isSuccess = false; description = ''; uploadedFiles = []">
          Realizar otra solicitud
        </button>
        <RouterLink to="/client/requests" class="btn btn-primary">
          <span>Ver mis solicitudes</span>
          <ArrowRight :size="16" />
        </RouterLink>
      </div>
    </div>

    <div v-else class="request-form-card">
      <div class="illustration-side">
        <AnimatedClipboard
          :service-selected="!!selectedServiceId"
          :has-description="description.trim().length >= 10"
          :has-files="uploadedFiles.length > 0"
          :is-submitting="isSubmitting"
          :is-success="isSuccess"
        />
      </div>

      <div class="form-side">
        <div v-if="formError" class="error-banner">
          {{ formError }}
        </div>

        <DuplicateShieldBanner
          :active-requests="userActiveRequests"
          :service-id="selectedServiceId"
          :description="description"
        />

        <form @submit.prevent="handleSubmit" class="request-form" novalidate>
          <div class="form-group">
            <label for="serviceSelect" class="form-label">Servicio requerido *</label>
            <select id="serviceSelect" v-model="selectedServiceId" class="service-select">
              <option v-for="s in services" :key="s.id" :value="s.id">
                {{ s.name }} ({{ s.category_name }})
              </option>
            </select>
            <span v-if="fieldErrors.service_id" class="field-error">{{ fieldErrors.service_id }}</span>
          </div>

          <IntakeFormEngine
            :service-name="selectedServiceName"
            @update-summary="onIntakeSummary"
            @validity-change="onIntakeValidity"
          />

          <div class="form-group">
            <label for="descriptionText" class="form-label">Descripción adicional y comentarios *</label>
            <textarea
              id="descriptionText"
              v-model="description"
              rows="4"
              placeholder="Describe cualquier detalle adicional o especificación importante..."
              class="desc-textarea"
            ></textarea>
            <span v-if="fieldErrors.description" class="field-error">{{ fieldErrors.description }}</span>
          </div>

          <div class="form-group">
            <label class="form-label">Archivos y Evidencias (Opcional)</label>
            <div
              :class="['dropzone', { dragging: isDragging }]"
              @dragover.prevent="isDragging = true"
              @dragleave.prevent="isDragging = false"
              @drop.prevent="handleFileDrop"
            >
              <UploadCloud :size="32" class="upload-icon" />
              <p class="dropzone-text">
                Arrastra archivos aquí o
                <label class="file-browse-btn">
                  <span>selecciona archivos</span>
                  <input type="file" multiple class="hidden-file-input" @change="handleFileInput" />
                </label>
              </p>
              <span class="dropzone-hint">Formatos soportados: PDF, JPG, PNG, ZIP (Máx. 10MB por archivo)</span>
            </div>

            <div v-if="uploadedFiles.length > 0" class="uploaded-files-list">
              <div v-for="(file, i) in uploadedFiles" :key="i" class="file-chip">
                <FileText :size="14" />
                <span class="file-name">{{ file.name }}</span>
                <button type="button" class="remove-file-btn" @click="removeFile(i)">
                  <X :size="12" />
                </button>
              </div>
            </div>
          </div>

          <div class="form-actions-bar">
            <button type="button" class="btn btn-secondary" @click="handleCancel">Cancelar</button>
            <button type="submit" class="btn btn-primary" :disabled="isSubmitting || !intakeValid">
              <span>{{ isSubmitting ? 'Enviando...' : 'Enviar solicitud' }}</span>
              <ArrowRight :size="16" />
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<style scoped>
.new-request-page {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.breadcrumbs {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: var(--color-text-secondary);
  margin-bottom: 6px;
}

.crumb-separator {
  color: var(--color-text-muted);
}

.crumb-current {
  color: var(--color-blue-title);
  font-weight: 700;
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

.request-form-card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-card);
  display: grid;
  grid-template-columns: 310px 1fr;
  overflow: hidden;
}

.illustration-side {
  background: linear-gradient(135deg, #F0F6FF 0%, #EEF2FF 100%);
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding: 40px 20px;
  border-right: 1px solid var(--color-border);
}

.form-side {
  padding: 34px 38px;
}

.error-banner {
  background: var(--color-danger-bg);
  color: var(--color-danger);
  border: 1px solid var(--color-danger-border);
  padding: 12px 16px;
  border-radius: var(--radius-sm);
  margin-bottom: 20px;
  font-size: 13.5px;
  font-weight: 600;
}

.request-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-label {
  font-size: 13.5px;
  font-weight: 700;
  color: var(--color-blue-title);
}

.service-select {
  padding: 11px 14px;
  border-radius: var(--radius-sm);
  background: #F8FAFC;
  font-size: 14.5px;
  border: 1px solid var(--color-border);
}

.desc-textarea {
  padding: 12px 14px;
  border-radius: var(--radius-sm);
  background: #F8FAFC;
  font-size: 14.5px;
  border: 1px solid var(--color-border);
  resize: vertical;
}

.field-error {
  font-size: 11.5px;
  color: var(--color-danger);
}

.dropzone {
  border: 2px dashed #CBD5E1;
  border-radius: var(--radius-md);
  padding: 24px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  background: #FAFBFD;
  transition: all var(--transition-fast);
}

.dropzone.dragging {
  border-color: var(--color-primary);
  background: #EBF5FF;
}

.upload-icon {
  color: var(--color-primary);
}

.dropzone-text {
  font-size: 13px;
  color: var(--color-text-secondary);
}

.file-browse-btn {
  color: var(--color-primary);
  font-weight: 700;
  cursor: pointer;
  text-decoration: underline;
}

.hidden-file-input {
  display: none;
}

.dropzone-hint {
  font-size: 11px;
  color: var(--color-text-muted);
}

.uploaded-files-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 10px;
}

.file-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: #F1F5F9;
  border: 1px solid var(--color-border);
  padding: 4px 10px;
  border-radius: var(--radius-full);
  font-size: 12px;
  color: var(--color-text-main);
}

.remove-file-btn {
  color: var(--color-text-muted);
  display: flex;
  align-items: center;
  padding: 2px;
}

.remove-file-btn:hover {
  color: var(--color-danger);
}

.form-actions-bar {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 14px;
  margin-top: 10px;
  padding-top: 20px;
  border-top: 1px solid var(--color-border);
}

.success-card {
  padding: 50px 30px;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  max-width: 600px;
  margin: 20px auto;
}

.success-icon-wrap {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: var(--color-success-bg);
  display: flex;
  align-items: center;
  justify-content: center;
}

.success-icon {
  color: var(--color-success);
}

.success-title {
  font-size: 22px;
  font-weight: 800;
  color: var(--color-blue-title);
}

.success-desc {
  font-size: 14px;
  color: var(--color-text-secondary);
  line-height: 1.5;
  max-width: 480px;
}

.success-actions {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 12px;
}

@media (max-width: 860px) {
  .request-form-card {
    grid-template-columns: 1fr;
  }
  .illustration-side {
    padding: 24px;
    border-right: none;
    border-bottom: 1px solid var(--color-border);
  }
  .form-side {
    padding: 24px;
  }
}
</style>