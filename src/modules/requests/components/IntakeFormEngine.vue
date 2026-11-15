<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import {
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  RotateCcw,
  Sparkles
} from 'lucide-vue-next'

const props = defineProps<{
  serviceName: string
}>()

const emit = defineEmits<{
  (e: 'updateSummary', summary: string): void
  (e: 'validityChange', isValid: boolean): void
}>()

const currentStep = ref(1)
const hasDraft = ref(false)

const formData = ref<Record<string, any>>({
  siteType: 'Corporativo',
  hasDomain: 'Sí',
  domainName: '',
  hasBranding: 'Solo logotipo',
  features: [] as string[],
  referenceUrls: '',
  deviceType: 'Computadora de escritorio',
  osType: 'Windows 11',
  impactLevel: 'Moderado',
  errorMessage: '',
  whenStarted: 'Hoy',
  consultingArea: 'Arquitectura de software',
  teamSize: '1 a 5 personas',
  timeframe: '1 mes',
  expectedDeliverable: 'Auditoría y Plan de Acción',
  maintenanceType: 'Preventivo',
  preferredSchedule: 'Horario laboral'
})

const isWebDesign = computed(() => props.serviceName.toLowerCase().includes('diseño') || props.serviceName.toLowerCase().includes('web'))
const isTechSupport = computed(() => props.serviceName.toLowerCase().includes('soporte') || props.serviceName.toLowerCase().includes('técnico'))
const isConsulting = computed(() => props.serviceName.toLowerCase().includes('consultoría') || props.serviceName.toLowerCase().includes('it'))

const step1Valid = computed(() => {
  if (isWebDesign.value) return !!formData.value.siteType
  if (isTechSupport.value) return !!formData.value.deviceType && !!formData.value.impactLevel
  if (isConsulting.value) return !!formData.value.consultingArea
  return true
})

const step2Valid = computed(() => {
  if (isWebDesign.value && formData.value.hasDomain === 'Sí') {
    return formData.value.domainName.trim().length > 0
  }
  return true
})

const isAllValid = computed(() => step1Valid.value && step2Valid.value)

function generateStructuredSummary(): string {
  const parts: string[] = []

  if (isWebDesign.value) {
    parts.push(`- Tipo de sitio web: ${formData.value.siteType}`)
    parts.push(`- Dominio registrado: ${formData.value.hasDomain}${formData.value.domainName ? ` (${formData.value.domainName})` : ''}`)
    parts.push(`- Identidad gráfica: ${formData.value.hasBranding}`)
    if (formData.value.features?.length > 0) {
      parts.push(`- Funcionalidades requeridas: ${formData.value.features.join(', ')}`)
    }
    if (formData.value.referenceUrls?.trim()) {
      parts.push(`- Referencias visuales: ${formData.value.referenceUrls.trim()}`)
    }
  } else if (isTechSupport.value) {
    parts.push(`- Dispositivo / Equipo: ${formData.value.deviceType}`)
    parts.push(`- Sistema Operativo: ${formData.value.osType}`)
    parts.push(`- Nivel de criticidad: ${formData.value.impactLevel}`)
    parts.push(`- Cuándo inició la falla: ${formData.value.whenStarted}`)
    if (formData.value.errorMessage?.trim()) {
      parts.push(`- Código / Mensaje de error: ${formData.value.errorMessage.trim()}`)
    }
  } else if (isConsulting.value) {
    parts.push(`- Área de enfoque: ${formData.value.consultingArea}`)
    parts.push(`- Tamaño del equipo: ${formData.value.teamSize}`)
    parts.push(`- Plazo deseado: ${formData.value.timeframe}`)
    parts.push(`- Entregable esperado: ${formData.value.expectedDeliverable}`)
  } else {
    parts.push(`- Tipo de mantenimiento: ${formData.value.maintenanceType}`)
    parts.push(`- Ventana horaria preferida: ${formData.value.preferredSchedule}`)
  }

  return parts.join('\n')
}

watch(
  formData,
  () => {
    try {
      localStorage.setItem('nexora_intake_draft', JSON.stringify({
        service: props.serviceName,
        data: formData.value,
        timestamp: Date.now()
      }))
    } catch {}

    const summary = generateStructuredSummary()
    emit('updateSummary', summary)
    emit('validityChange', isAllValid.value)
  },
  { deep: true }
)

onMounted(() => {
  try {
    const raw = localStorage.getItem('nexora_intake_draft')
    if (raw) {
      const parsed = JSON.parse(raw)
      if (parsed.data && parsed.service === props.serviceName) {
        hasDraft.value = true
      }
    }
  } catch {}

  emit('updateSummary', generateStructuredSummary())
  emit('validityChange', isAllValid.value)
})

function restoreDraft() {
  try {
    const raw = localStorage.getItem('nexora_intake_draft')
    if (raw) {
      const parsed = JSON.parse(raw)
      formData.value = { ...formData.value, ...parsed.data }
    }
  } catch {}
  hasDraft.value = false
}

function discardDraft() {
  try {
    localStorage.removeItem('nexora_intake_draft')
  } catch {}
  hasDraft.value = false
}

function toggleFeature(feat: string) {
  const arr = formData.value.features as string[]
  const idx = arr.indexOf(feat)
  if (idx > -1) {
    arr.splice(idx, 1)
  } else {
    arr.push(feat)
  }
}
</script>

<template>
  <div class="intake-engine-card">
    <div class="intake-header">
      <div class="header-tag">
        <Sparkles :size="14" class="sparkle-icon" />
        <span>NEXORA Intake · Formulario Inteligente</span>
      </div>
      <div class="steps-indicator">
        <span :class="['step-num', { active: currentStep === 1, done: currentStep > 1 }]">1</span>
        <div class="step-line" :class="{ filled: currentStep > 1 }"></div>
        <span :class="['step-num', { active: currentStep === 2, done: currentStep > 2 }]">2</span>
        <div class="step-line" :class="{ filled: currentStep > 2 }"></div>
        <span :class="['step-num', { active: currentStep === 3 }]">3</span>
      </div>
    </div>

    <div v-if="hasDraft" class="draft-alert-banner">
      <div class="draft-text">
        <RotateCcw :size="15" />
        <span>Borrador detectado para este servicio. ¿Deseas recuperarlo?</span>
      </div>
      <div class="draft-buttons">
        <button type="button" class="btn-restore" @click="restoreDraft">Recuperar</button>
        <button type="button" class="btn-discard" @click="discardDraft">Descartar</button>
      </div>
    </div>

    <div v-if="currentStep === 1" class="step-body">
      <h3 class="step-title">Paso 1: Requerimientos clave de {{ serviceName }}</h3>
      <p class="step-subtitle">Selecciona los parámetros iniciales para estructurar tu solicitud.</p>

      <div v-if="isWebDesign" class="questions-grid">
        <div class="intake-field">
          <label class="intake-label">¿Qué tipo de sitio web necesitas? *</label>
          <div class="options-pills">
            <button
              v-for="opt in ['Landing Page', 'Corporativo', 'Tienda en Línea', 'Plataforma SaaS']"
              :key="opt"
              type="button"
              :class="['option-pill', { selected: formData.siteType === opt }]"
              @click="formData.siteType = opt"
            >
              {{ opt }}
            </button>
          </div>
        </div>

        <div class="intake-field">
          <label class="intake-label">¿Cuentas con nombre de dominio web? *</label>
          <div class="options-pills">
            <button
              v-for="opt in ['Sí', 'No', 'Necesito asesoría']"
              :key="opt"
              type="button"
              :class="['option-pill', { selected: formData.hasDomain === opt }]"
              @click="formData.hasDomain = opt"
            >
              {{ opt }}
            </button>
          </div>
        </div>
      </div>

      <div v-else-if="isTechSupport" class="questions-grid">
        <div class="intake-field">
          <label class="intake-label">¿Qué equipo o componente presenta la falla? *</label>
          <div class="options-pills">
            <button
              v-for="opt in ['Servidor', 'PC de escritorio', 'Laptop', 'Red / Router', 'Otro']"
              :key="opt"
              type="button"
              :class="['option-pill', { selected: formData.deviceType === opt }]"
              @click="formData.deviceType = opt"
            >
              {{ opt }}
            </button>
          </div>
        </div>

        <div class="intake-field">
          <label class="intake-label">Nivel de criticidad para tu operación *</label>
          <div class="options-pills">
            <button
              v-for="opt in ['Crítico (Trabajo detenido)', 'Alto', 'Moderado', 'Consulta general']"
              :key="opt"
              type="button"
              :class="['option-pill', { selected: formData.impactLevel === opt }]"
              @click="formData.impactLevel = opt"
            >
              {{ opt }}
            </button>
          </div>
        </div>
      </div>

      <div v-else class="questions-grid">
        <div class="intake-field">
          <label class="intake-label">Área principal de enfoque *</label>
          <div class="options-pills">
            <button
              v-for="opt in ['Arquitectura de software', 'Migración Cloud', 'Seguridad OWASP', 'Optimización DB']"
              :key="opt"
              type="button"
              :class="['option-pill', { selected: formData.consultingArea === opt }]"
              @click="formData.consultingArea = opt"
            >
              {{ opt }}
            </button>
          </div>
        </div>
      </div>

      <div class="step-nav-bar">
        <button type="button" class="btn-step-next" :disabled="!step1Valid" @click="currentStep = 2">
          <span>Continuar</span>
          <ChevronRight :size="16" />
        </button>
      </div>
    </div>

    <div v-else-if="currentStep === 2" class="step-body">
      <h3 class="step-title">Paso 2: Especificaciones complementarias</h3>
      <p class="step-subtitle">Información técnica para que nuestro equipo comience sin retrasos.</p>

      <div v-if="isWebDesign" class="questions-grid">
        <div v-if="formData.hasDomain === 'Sí'" class="intake-field">
          <label class="intake-label">Nombre de tu dominio actual *</label>
          <input
            v-model="formData.domainName"
            type="text"
            placeholder="ejemplo.com"
            class="intake-input"
          />
        </div>

        <div class="intake-field">
          <label class="intake-label">¿Cuentas con identidad gráfica?</label>
          <div class="options-pills">
            <button
              v-for="opt in ['Manual de marca', 'Solo logotipo', 'Diseñar desde cero']"
              :key="opt"
              type="button"
              :class="['option-pill', { selected: formData.hasBranding === opt }]"
              @click="formData.hasBranding = opt"
            >
              {{ opt }}
            </button>
          </div>
        </div>

        <div class="intake-field">
          <label class="intake-label">Funcionalidades requeridas (selecciona las que apliquen)</label>
          <div class="checkbox-chips-grid">
            <button
              v-for="f in ['Pasarela de pagos', 'Blog corporativo', 'Sistema de citas', 'Multi-idioma', 'Panel de clientes']"
              :key="f"
              type="button"
              :class="['chip-btn', { active: formData.features.includes(f) }]"
              @click="toggleFeature(f)"
            >
              <CheckCircle2 v-if="formData.features.includes(f)" :size="14" />
              <span>{{ f }}</span>
            </button>
          </div>
        </div>

        <div class="intake-field">
          <label class="intake-label">Enlaces de referencia visual (opcional)</label>
          <input
            v-model="formData.referenceUrls"
            type="text"
            placeholder="https://ejemplo-uno.com, https://ejemplo-dos.com"
            class="intake-input"
          />
        </div>
      </div>

      <div v-else-if="isTechSupport" class="questions-grid">
        <div class="intake-field">
          <label class="intake-label">Sistema Operativo</label>
          <div class="options-pills">
            <button
              v-for="opt in ['Windows 11 / 10', 'Windows Server', 'Linux (Ubuntu/Debian)', 'macOS']"
              :key="opt"
              type="button"
              :class="['option-pill', { selected: formData.osType === opt }]"
              @click="formData.osType = opt"
            >
              {{ opt }}
            </button>
          </div>
        </div>

        <div class="intake-field">
          <label class="intake-label">¿Cuándo comenzó la incidencia?</label>
          <div class="options-pills">
            <button
              v-for="opt in ['Hoy', 'Esta semana', 'Falla recurrente']"
              :key="opt"
              type="button"
              :class="['option-pill', { selected: formData.whenStarted === opt }]"
              @click="formData.whenStarted = opt"
            >
              {{ opt }}
            </button>
          </div>
        </div>

        <div class="intake-field">
          <label class="intake-label">Código o mensaje de error visible (si aplica)</label>
          <input
            v-model="formData.errorMessage"
            type="text"
            placeholder="Ej. Error 500, Pantalla azul 0x0000000A, Timeout"
            class="intake-input"
          />
        </div>
      </div>

      <div v-else class="questions-grid">
        <div class="intake-field">
          <label class="intake-label">Plazo estimado deseado</label>
          <div class="options-pills">
            <button
              v-for="opt in ['Inmediato (1-2 semanas)', '1 mes', 'Trimestral']"
              :key="opt"
              type="button"
              :class="['option-pill', { selected: formData.timeframe === opt }]"
              @click="formData.timeframe = opt"
            >
              {{ opt }}
            </button>
          </div>
        </div>
      </div>

      <div class="step-nav-bar space-between">
        <button type="button" class="btn-step-prev" @click="currentStep = 1">
          <ChevronLeft :size="16" />
          <span>Atrás</span>
        </button>
        <button type="button" class="btn-step-next" :disabled="!step2Valid" @click="currentStep = 3">
          <span>Ver resumen</span>
          <ChevronRight :size="16" />
        </button>
      </div>
    </div>

    <div v-else class="step-body">
      <h3 class="step-title">Paso 3: Resumen estructurado</h3>
      <p class="step-subtitle">Estos datos se integrarán automáticamente en tu solicitud técnica.</p>

      <div class="summary-preview-box">
        <div class="summary-badge">
          <CheckCircle2 :size="14" />
          <span>Parámetros estructurados</span>
        </div>
        <div class="summary-content">
          <div v-if="isWebDesign">
            <div class="sum-row"><span class="k">Sitio:</span><span class="v">{{ formData.siteType }}</span></div>
            <div class="sum-row"><span class="k">Dominio:</span><span class="v">{{ formData.hasDomain }} {{ formData.domainName ? `(${formData.domainName})` : '' }}</span></div>
            <div class="sum-row"><span class="k">Branding:</span><span class="v">{{ formData.hasBranding }}</span></div>
            <div v-if="formData.features.length" class="sum-row"><span class="k">Extras:</span><span class="v">{{ formData.features.join(', ') }}</span></div>
          </div>
          <div v-else-if="isTechSupport">
            <div class="sum-row"><span class="k">Equipo:</span><span class="v">{{ formData.deviceType }}</span></div>
            <div class="sum-row"><span class="k">Criticidad:</span><span class="v">{{ formData.impactLevel }}</span></div>
            <div class="sum-row"><span class="k">S.O.:</span><span class="v">{{ formData.osType }}</span></div>
            <div v-if="formData.errorMessage" class="sum-row"><span class="k">Error:</span><span class="v">{{ formData.errorMessage }}</span></div>
          </div>
          <div v-else>
            <div class="sum-row"><span class="k">Área:</span><span class="v">{{ formData.consultingArea }}</span></div>
            <div class="sum-row"><span class="k">Plazo:</span><span class="v">{{ formData.timeframe }}</span></div>
          </div>
        </div>
      </div>

      <div class="step-nav-bar">
        <button type="button" class="btn-step-prev" @click="currentStep = 2">
          <ChevronLeft :size="16" />
          <span>Modificar respuestas</span>
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.intake-engine-card {
  background: #FFFFFF;
  border: 1.5px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  box-shadow: 0 4px 16px rgba(8, 123, 250, 0.05);
}

.intake-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--color-border);
}

.header-tag {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12.5px;
  font-weight: 800;
  color: var(--color-primary);
  background: #EBF5FF;
  padding: 4px 10px;
  border-radius: var(--radius-full);
}

.sparkle-icon {
  color: var(--color-primary);
}

.steps-indicator {
  display: flex;
  align-items: center;
  gap: 6px;
}

.step-num {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: #F1F5F9;
  color: var(--color-text-secondary);
  font-size: 11px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all var(--transition-fast);
}

.step-num.active {
  background: var(--color-primary);
  color: #FFFFFF;
}

.step-num.done {
  background: #DCFCE7;
  color: var(--color-success);
}

.step-line {
  width: 20px;
  height: 2px;
  background: #E2E8F0;
  border-radius: 1px;
}

.step-line.filled {
  background: var(--color-primary);
}

.draft-alert-banner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  background: #FEF3C7;
  border: 1px solid #FDE68A;
  border-radius: var(--radius-sm);
  padding: 8px 12px;
  font-size: 12px;
  color: #B45309;
}

.draft-text {
  display: flex;
  align-items: center;
  gap: 6px;
  font-weight: 600;
}

.draft-buttons {
  display: flex;
  align-items: center;
  gap: 8px;
}

.btn-restore {
  background: #D97706;
  color: #FFFFFF;
  border: none;
  padding: 4px 10px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 700;
  cursor: pointer;
}

.btn-discard {
  background: transparent;
  color: #78350F;
  border: none;
  font-size: 11px;
  font-weight: 600;
  cursor: pointer;
}

.step-body {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.step-title {
  font-size: 15px;
  font-weight: 800;
  color: var(--color-blue-title);
  margin-bottom: -10px;
}

.step-subtitle {
  font-size: 12.5px;
  color: var(--color-text-secondary);
}

.questions-grid {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.intake-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.intake-label {
  font-size: 12.5px;
  font-weight: 700;
  color: var(--color-text-main);
}

.options-pills {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.option-pill {
  padding: 6px 14px;
  border-radius: var(--radius-full);
  border: 1px solid var(--color-border);
  background: #F8FAFC;
  color: var(--color-text-secondary);
  font-size: 12.5px;
  font-weight: 600;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.option-pill:hover {
  border-color: var(--color-primary);
  color: var(--color-primary);
}

.option-pill.selected {
  background: var(--color-primary);
  color: #FFFFFF;
  border-color: var(--color-primary);
  box-shadow: 0 2px 6px rgba(8, 123, 250, 0.25);
}

.intake-input {
  padding: 9px 12px;
  border-radius: var(--radius-sm);
  border: 1px solid var(--color-border);
  background: #F8FAFC;
  font-size: 13.5px;
  outline: none;
}

.intake-input:focus {
  border-color: var(--color-primary);
  background: #FFFFFF;
}

.checkbox-chips-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.chip-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: var(--radius-sm);
  border: 1px solid var(--color-border);
  background: #FFFFFF;
  color: var(--color-text-secondary);
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.chip-btn.active {
  background: #EBF5FF;
  border-color: var(--color-primary);
  color: var(--color-primary);
  font-weight: 700;
}

.step-nav-bar {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  margin-top: 8px;
  padding-top: 12px;
  border-top: 1px solid #F1F5F9;
}

.step-nav-bar.space-between {
  justify-content: space-between;
}

.btn-step-next {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 7px 16px;
  background: var(--button-gradient);
  color: #FFFFFF;
  border: none;
  border-radius: var(--radius-sm);
  font-size: 12.5px;
  font-weight: 700;
  cursor: pointer;
  box-shadow: 0 4px 10px rgba(8, 123, 250, 0.25);
}

.btn-step-next:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-step-prev {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 7px 14px;
  background: #FFFFFF;
  color: var(--color-text-secondary);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  font-size: 12.5px;
  font-weight: 600;
  cursor: pointer;
}

.summary-preview-box {
  background: #FAFBFD;
  border: 1px solid #E2E8F0;
  border-radius: var(--radius-sm);
  padding: 14px 16px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.summary-badge {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #16A34A;
  font-size: 12px;
  font-weight: 700;
}

.summary-content {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.sum-row {
  display: flex;
  gap: 8px;
  font-size: 12.5px;
}

.sum-row .k {
  font-weight: 700;
  color: var(--color-blue-title);
  min-width: 80px;
}

.sum-row .v {
  color: var(--color-text-main);
}
</style>