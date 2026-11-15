<script setup lang="ts">
import { ref, computed } from 'vue'
import { Search, CheckSquare, Copy, Check } from 'lucide-vue-next'
import BaseModal from '@/shared/components/BaseModal.vue'

interface Article {
  id: string
  title: string
  category: string
  summary: string
  steps: string[]
  estimatedMinutes: number
}

interface Props {
  modelValue: boolean
  defaultCategory?: string
}

const props = defineProps<Props>()
const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'selectProcedure', title: string, steps: string[]): void
}>()

const searchQuery = ref('')
const selectedCategory = ref(props.defaultCategory || 'all')
const copiedId = ref<string | null>(null)

const articles = ref<Article[]>([
  {
    id: 'sop-01',
    title: 'SOP-01: Provisión de Diseños Web y Configuración SSL',
    category: 'Diseño Web',
    summary: 'Procedimiento estándar para validación de maquetas, assets responsivos y despliegue SSL seguro.',
    steps: [
      'Revisar especificaciones técnicas y paleta de colores corporativos del cliente.',
      'Comprobar compatibilidad responsive en resoluciones móviles, tablets y desktops.',
      'Optimizar imágenes a formatos modernos WebP o SVG para acelerar tiempo de carga.',
      'Configurar cabeceras de seguridad CSP, HSTS y certificados SSL TLS 1.3.',
      'Ejecutar auditoría de accesibilidad WCAG 2.2 AA.'
    ],
    estimatedMinutes: 25
  },
  {
    id: 'sop-02',
    title: 'SOP-02: Diagnóstico y Resolución Rápida de Soporte Técnico',
    category: 'Soporte Técnico',
    summary: 'Protocolo de triage, análisis de logs y restauración de servicios críticos.',
    steps: [
      'Identificar versión del sistema operativo y código de error reportado.',
      'Verificar estado de red, DNS primario y conectividad de puertos seguros.',
      'Inspeccionar trazas de logs del sistema para aislar el fallo.',
      'Aplicar parche correctivo o reinicio de daemon según política.',
      'Solicitar validación final de funcionamiento al usuario solicitante.'
    ],
    estimatedMinutes: 15
  },
  {
    id: 'sop-03',
    title: 'SOP-03: Auditoría y Arquitectura Cloud en Consultoría IT',
    category: 'Consultoría IT',
    summary: 'Revisión de infraestructura, dimensionamiento de bases de datos y cálculo de costos operativos.',
    steps: [
      'Analizar matriz de riesgos e inventario de activos del cliente.',
      'Evaluar cumplimiento de mejores prácticas OWASP y cifrado en tránsito/reposo.',
      'Diseñar diagrama de arquitectura modular con redundancia.',
      'Generar informe ejecutivo con estimaciones de costos y plan de migración.'
    ],
    estimatedMinutes: 45
  },
  {
    id: 'sop-04',
    title: 'SOP-04: Protocolo de Escalamiento Inmediato ante Alerta SLA',
    category: 'General',
    summary: 'Instrucciones obligatorias cuando un ticket entra en estado SLA at_risk o near_breach.',
    steps: [
      'Notificar al supervisor operativo a través del canal interno de NEXORA Connect.',
      'Reasignar especialistas adicionales si la capacidad actual está saturada.',
      'Contactar al cliente para mantenerlo informado del estatus de contingencia.',
      'Registrar justificación técnica en la bitácora inmutable de auditoría.'
    ],
    estimatedMinutes: 10
  }
])

const filteredArticles = computed(() => {
  return articles.value.filter(a => {
    if (selectedCategory.value !== 'all' && a.category !== selectedCategory.value) {
      return false
    }
    if (searchQuery.value) {
      const q = searchQuery.value.toLowerCase().trim()
      return a.title.toLowerCase().includes(q) || a.summary.toLowerCase().includes(q)
    }
    return true
  })
})

function copySteps(art: Article) {
  const text = `${art.title}\n${art.steps.map((s, i) => `${i + 1}. ${s}`).join('\n')}`
  navigator.clipboard.writeText(text)
  copiedId.value = art.id
  setTimeout(() => {
    copiedId.value = null
  }, 2000)
}

function handleSelect(art: Article) {
  emit('selectProcedure', art.title, art.steps)
  emit('update:modelValue', false)
}
</script>

<template>
  <BaseModal
    :model-value="modelValue"
    title="NEXORA Memory — Base de Conocimiento y Procedimientos SOP"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <div class="memory-modal-content">
      <div class="search-filter-row">
        <div class="search-wrap">
          <Search :size="16" class="search-icon" />
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Buscar guías o procedimientos..."
            class="search-input"
          />
        </div>
        <select v-model="selectedCategory" class="cat-select">
          <option value="all">Todas las categorías</option>
          <option value="Diseño Web">Diseño Web</option>
          <option value="Soporte Técnico">Soporte Técnico</option>
          <option value="Consultoría IT">Consultoría IT</option>
          <option value="General">General</option>
        </select>
      </div>

      <div class="articles-list">
        <div
          v-for="art in filteredArticles"
          :key="art.id"
          class="article-card"
        >
          <div class="article-top">
            <span class="cat-badge">{{ art.category }}</span>
            <span class="time-est">~{{ art.estimatedMinutes }} min</span>
          </div>
          <h4 class="article-title">{{ art.title }}</h4>
          <p class="article-summary">{{ art.summary }}</p>

          <div class="steps-box">
            <h5 class="steps-title">Lista de verificación estándar:</h5>
            <ul class="steps-list">
              <li v-for="(st, idx) in art.steps" :key="idx">
                <CheckSquare :size="13" class="step-icon" />
                <span>{{ st }}</span>
              </li>
            </ul>
          </div>

          <div class="article-actions">
            <button type="button" class="action-btn copy-btn" @click="copySteps(art)">
              <component :is="copiedId === art.id ? Check : Copy" :size="14" />
              <span>{{ copiedId === art.id ? '¡Copiado!' : 'Copiar checklist' }}</span>
            </button>
            <button type="button" class="action-btn select-btn" @click="handleSelect(art)">
              <span>Aplicar a tarea actual</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </BaseModal>
</template>

<style scoped>
.memory-modal-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
  max-height: 70vh;
  overflow-y: auto;
}

.search-filter-row {
  display: flex;
  gap: 10px;
}

.search-wrap {
  flex: 1;
  position: relative;
  display: flex;
  align-items: center;
}

.search-icon {
  position: absolute;
  left: 12px;
  color: #71809B;
}

.search-input {
  width: 100%;
  height: 38px;
  padding: 0 12px 0 36px;
  border: 1px solid #E3EAF6;
  border-radius: 8px;
  font-size: 0.85rem;
  outline: none;
}

.search-input:focus {
  border-color: #087BFA;
}

.cat-select {
  height: 38px;
  padding: 0 12px;
  border: 1px solid #E3EAF6;
  border-radius: 8px;
  font-size: 0.85rem;
  background: #FFFFFF;
  outline: none;
  color: #182B49;
}

.articles-list {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.article-card {
  background: #F8FAFD;
  border: 1px solid #E3EAF6;
  border-radius: 12px;
  padding: 16px;
}

.article-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
}

.cat-badge {
  font-size: 0.72rem;
  font-weight: 700;
  color: #087BFA;
  background: #EDF5FF;
  padding: 2px 8px;
  border-radius: 6px;
}

.time-est {
  font-size: 0.72rem;
  color: #71809B;
}

.article-title {
  font-size: 0.95rem;
  font-weight: 700;
  color: #17366C;
  margin: 0 0 6px 0;
}

.article-summary {
  font-size: 0.82rem;
  color: #556987;
  line-height: 1.45;
  margin: 0 0 12px 0;
}

.steps-box {
  background: #FFFFFF;
  border: 1px solid #E3EAF6;
  border-radius: 8px;
  padding: 12px;
  margin-bottom: 12px;
}

.steps-title {
  font-size: 0.76rem;
  font-weight: 700;
  color: #71809B;
  text-transform: uppercase;
  margin: 0 0 8px 0;
}

.steps-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.steps-list li {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  font-size: 0.8rem;
  color: #2D3748;
  line-height: 1.4;
}

.step-icon {
  color: #00BA88;
  margin-top: 2px;
  flex-shrink: 0;
}

.article-actions {
  display: flex;
  gap: 10px;
}

.action-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 0.78rem;
  font-weight: 600;
  padding: 6px 12px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.15s;
}

.copy-btn {
  background: #FFFFFF;
  border: 1px solid #D5E0F2;
  color: #182B49;
}

.copy-btn:hover {
  background: #EDF5FF;
  border-color: #087BFA;
  color: #087BFA;
}

.select-btn {
  background: #087BFA;
  border: none;
  color: #FFFFFF;
}

.select-btn:hover {
  background: #0870E8;
}
</style>