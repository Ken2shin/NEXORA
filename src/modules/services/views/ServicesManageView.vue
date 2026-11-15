<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Filter,
  AlertTriangle,
  Upload
} from 'lucide-vue-next'
import { repositories } from '@/shared/infrastructure/provider'
import type { Service, ServiceCategory } from '@/shared/types/service.types'
import { formatCurrency, slugify } from '@/shared/utils/formatters'
import BaseModal from '@/shared/components/BaseModal.vue'
import { serviceSchema } from '@/shared/validators/service.validator'
import { useAuthStore } from '@/modules/auth/auth.store'
import { useUiStore } from '@/shared/stores/ui.store'

const authStore = useAuthStore()
const uiStore = useUiStore()

const services = ref<Service[]>([])
const categories = ref<ServiceCategory[]>([])
const totalServices = ref(0)
const isLoading = ref(true)

const searchQuery = ref('')
const selectedCategory = ref('all')
const currentPage = ref(1)
const itemsPerPage = 6

const isModalOpen = ref(false)
const isDeleteModalOpen = ref(false)
const serviceToDelete = ref<Service | null>(null)
const editingServiceId = ref<string | null>(null)

const formName = ref('')
const formCategoryId = ref('')
const formShortDesc = ref('')
const formDescription = ref('')
const formPrice = ref<number | null>(null)
const formImage = ref('/images/services/web-design.jpg')
const formIsActive = ref(true)
const fieldErrors = ref<Record<string, string>>({})
const formError = ref<string | null>(null)
const isSubmitting = ref(false)

const fileInputRef = ref<HTMLInputElement | null>(null)
const uploadError = ref<string | null>(null)

const availableImages = [
  { label: 'Diseño Web', path: '/images/services/web-design.jpg' },
  { label: 'Soporte Técnico', path: '/images/services/tech-support.jpg' },
  { label: 'Consultoría IT', path: '/images/services/it-consulting.jpg' },
  { label: 'Mantenimiento', path: '/images/services/maintenance.jpg' }
]

async function loadData() {
  isLoading.value = true
  try {
    const [catsRes, servsRes] = await Promise.all([
      repositories.services.getCategories(),
      repositories.services.getServices({
        search: searchQuery.value,
        category_id: selectedCategory.value,
        page: currentPage.value,
        limit: itemsPerPage
      })
    ])
    categories.value = catsRes
    services.value = servsRes.data
    totalServices.value = servsRes.total
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  loadData()
})

let debounceTimer: ReturnType<typeof setTimeout> | null = null
watch(searchQuery, () => {
  if (debounceTimer) clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => {
    currentPage.value = 1
    loadData()
  }, 300)
})

watch(selectedCategory, () => {
  currentPage.value = 1
  loadData()
})

function triggerFileInput() {
  uploadError.value = null
  fileInputRef.value?.click()
}

function handleFileUpload(event: Event) {
  uploadError.value = null
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return

  if (!file.type.startsWith('image/')) {
    uploadError.value = 'El archivo debe ser una imagen válida'
    return
  }

  if (file.size > 5 * 1024 * 1024) {
    uploadError.value = 'La imagen no debe superar los 5MB'
    return
  }

  const reader = new FileReader()
  reader.onload = (e) => {
    const result = e.target?.result as string
    if (result) {
      formImage.value = result
    }
  }
  reader.onerror = () => {
    uploadError.value = 'Error al procesar la imagen'
  }
  reader.readAsDataURL(file)
}

function openCreateModal() {
  editingServiceId.value = null
  formName.value = ''
  formCategoryId.value = categories.value[0]?.id || ''
  formShortDesc.value = ''
  formDescription.value = ''
  formPrice.value = null
  formImage.value = availableImages[0]!.path
  formIsActive.value = true
  fieldErrors.value = {}
  formError.value = null
  uploadError.value = null
  isModalOpen.value = true
}

function openEditModal(service: Service) {
  editingServiceId.value = service.id
  formName.value = service.name
  formCategoryId.value = service.category_id
  formShortDesc.value = service.short_description
  formDescription.value = service.description
  formPrice.value = service.price_amount
  formImage.value = service.image_path
  formIsActive.value = service.is_active
  fieldErrors.value = {}
  formError.value = null
  uploadError.value = null
  isModalOpen.value = true
}

function confirmDelete(service: Service) {
  serviceToDelete.value = service
  isDeleteModalOpen.value = true
}

async function handleDelete() {
  if (!serviceToDelete.value) return
  try {
    await repositories.services.deleteService(serviceToDelete.value.id)
    isDeleteModalOpen.value = false
    serviceToDelete.value = null
    uiStore.showToast('success', 'Servicio eliminado', 'El servicio fue eliminado del catálogo correctamente.')
    await loadData()
  } catch (err: unknown) {
    uiStore.showToast('error', 'Error al eliminar', err instanceof Error ? err.message : 'No se pudo eliminar el servicio')
  }
}

async function handleSaveService() {
  fieldErrors.value = {}
  formError.value = null

  const validation = serviceSchema.safeParse({
    name: formName.value,
    category_id: formCategoryId.value,
    short_description: formShortDesc.value,
    description: formDescription.value,
    image_path: formImage.value,
    price_amount: formPrice.value,
    currency_code: 'USD',
    is_active: formIsActive.value
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
    const slug = slugify(formName.value)
    if (editingServiceId.value) {
      await repositories.services.updateService({
        id: editingServiceId.value,
        name: formName.value,
        category_id: formCategoryId.value,
        slug,
        short_description: formShortDesc.value,
        description: formDescription.value,
        image_path: formImage.value,
        price_amount: formPrice.value,
        is_active: formIsActive.value
      })
    } else {
      await repositories.services.createService(
        {
          name: formName.value,
          category_id: formCategoryId.value,
          slug,
          short_description: formShortDesc.value,
          description: formDescription.value,
          image_path: formImage.value,
          price_amount: formPrice.value,
          currency_code: 'USD',
          is_active: formIsActive.value
        },
        authStore.currentUser?.id || 'admin'
      )
    }
    isModalOpen.value = false
    await loadData()
  } catch (err: unknown) {
    formError.value = err instanceof Error ? err.message : 'Error al guardar el servicio'
  } finally {
    isSubmitting.value = false
  }
}

const totalPages = () => Math.ceil(totalServices.value / itemsPerPage) || 1
</script>

<template>
  <div class="services-manage-page">
    <div class="page-header">
      <div class="breadcrumbs">
        <span class="crumb-root">Servicios</span>
        <span class="crumb-separator">&gt;</span>
        <span class="crumb-current">Gestión de Servicios</span>
      </div>
      <div class="header-main">
        <div>
          <h1 class="page-title">Gestión de Servicios</h1>
          <p class="page-subtitle">Administra los servicios de la empresa.</p>
        </div>
        <button class="btn btn-primary" @click="openCreateModal">
          <Plus :size="18" />
          <span>Nuevo servicio</span>
        </button>
      </div>
    </div>

    <div class="filters-bar">
      <div class="search-input-wrap">
        <Search :size="18" class="search-icon" />
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Buscar servicio..."
          class="search-input"
        />
      </div>

      <div class="category-filter-wrap">
        <Filter :size="16" class="filter-icon" />
        <select v-model="selectedCategory" class="filter-select">
          <option value="all">Todos</option>
          <option v-for="cat in categories" :key="cat.id" :value="cat.id">
            {{ cat.name }}
          </option>
        </select>
      </div>
    </div>

    <div v-if="isLoading" class="loading-services">
      <div class="services-skeleton-grid">
        <div v-for="i in 3" :key="i" class="service-skeleton-card"></div>
      </div>
    </div>

    <div v-else-if="services.length === 0" class="empty-state card">
      <p class="empty-title">No se encontraron servicios</p>
      <p class="empty-desc">Intenta ajustar tu búsqueda o crea un nuevo servicio.</p>
    </div>

    <div v-else class="services-grid">
      <div v-for="service in services" :key="service.id" class="service-card">
        <div class="service-img-wrap">
          <img :src="service.image_path" :alt="service.name" class="service-img" />
          <span :class="['service-status-pill', service.is_active ? 'active' : 'inactive']">
            {{ service.is_active ? 'Activo' : 'Inactivo' }}
          </span>
        </div>

        <div class="service-content">
          <h3 class="service-title">{{ service.name }}</h3>
          <p class="service-desc">{{ service.short_description }}</p>
          <div class="service-price">{{ formatCurrency(service.price_amount, service.currency_code) }}</div>
        </div>

        <div class="service-actions">
          <button class="btn-edit" @click="openEditModal(service)">
            <Edit2 :size="15" />
            <span>Editar</span>
          </button>
          <button class="btn-delete" @click="confirmDelete(service)" aria-label="Eliminar servicio">
            <Trash2 :size="16" />
          </button>
        </div>
      </div>
    </div>

    <div class="pagination-bar" v-if="totalServices > itemsPerPage">
      <button
        class="page-btn"
        :disabled="currentPage === 1"
        @click="currentPage--; loadData()"
      >
        <ChevronLeft :size="16" />
      </button>

      <button
        v-for="p in totalPages()"
        :key="p"
        :class="['page-btn', { active: currentPage === p }]"
        @click="currentPage = p; loadData()"
      >
        {{ p }}
      </button>

      <button
        class="page-btn"
        :disabled="currentPage === totalPages()"
        @click="currentPage++; loadData()"
      >
        <ChevronRight :size="16" />
      </button>
    </div>

    <BaseModal
      v-model="isModalOpen"
      :title="editingServiceId ? 'Editar Servicio' : 'Nuevo Servicio'"
    >
      <div v-if="formError" class="modal-error">{{ formError }}</div>

      <div class="modal-form-grid">
        <div class="form-group">
          <label class="form-label">Nombre del servicio *</label>
          <input v-model="formName" type="text" placeholder="Ej. Diseño Web" />
          <span v-if="fieldErrors.name" class="field-error">{{ fieldErrors.name }}</span>
        </div>

        <div class="form-group">
          <label class="form-label">Categoría *</label>
          <select v-model="formCategoryId">
            <option v-for="cat in categories" :key="cat.id" :value="cat.id">
              {{ cat.name }}
            </option>
          </select>
          <span v-if="fieldErrors.category_id" class="field-error">{{ fieldErrors.category_id }}</span>
        </div>

        <div class="form-group">
          <label class="form-label">Descripción corta *</label>
          <input v-model="formShortDesc" type="text" placeholder="Resumen conciso en una línea" />
          <span v-if="fieldErrors.short_description" class="field-error">{{ fieldErrors.short_description }}</span>
        </div>

        <div class="form-group">
          <label class="form-label">Precio (USD opcional)</label>
          <input v-model.number="formPrice" type="number" step="0.01" placeholder="120.00" />
        </div>

        <div class="form-group full-width">
          <label class="form-label">Descripción detallada *</label>
          <textarea v-model="formDescription" rows="4" placeholder="Explica detalladamente qué incluye este servicio..."></textarea>
          <span v-if="fieldErrors.description" class="field-error">{{ fieldErrors.description }}</span>
        </div>

        <div class="form-group full-width">
          <label class="form-label">Imagen del servicio (Archivo Base64 o predefinida) *</label>
          
          <div class="image-uploader-section">
            <div class="current-image-preview">
              <img :src="formImage" alt="Vista previa de imagen" class="preview-img" />
              <div class="preview-meta">
                <span v-if="formImage.startsWith('data:image')" class="badge-base64">
                  Imagen personalizada (Base64)
                </span>
                <span v-else class="badge-preset">
                  Imagen predefinida
                </span>
                <button type="button" class="btn-upload-file" @click="triggerFileInput">
                  <Upload :size="16" />
                  <span>Subir archivo de imagen</span>
                </button>
                <input
                  ref="fileInputRef"
                  type="file"
                  accept="image/*"
                  class="hidden-file-input"
                  @change="handleFileUpload"
                />
                <span v-if="uploadError" class="field-error">{{ uploadError }}</span>
              </div>
            </div>

            <div class="presets-section">
              <span class="presets-title">O selecciona una imagen corporativa:</span>
              <div class="image-selector-grid">
                <div
                  v-for="img in availableImages"
                  :key="img.path"
                  :class="['img-opt-card', { selected: formImage === img.path }]"
                  @click="formImage = img.path"
                >
                  <img :src="img.path" :alt="img.label" />
                  <span>{{ img.label }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="form-group full-width checkbox-row">
          <label class="checkbox-label">
            <input type="checkbox" v-model="formIsActive" />
            <span>Servicio activo y visible para clientes</span>
          </label>
        </div>
      </div>

      <template #footer>
        <button class="btn btn-secondary" @click="isModalOpen = false">Cancelar</button>
        <button class="btn btn-primary" :disabled="isSubmitting" @click="handleSaveService">
          {{ isSubmitting ? 'Guardando...' : (editingServiceId ? 'Actualizar' : 'Crear servicio') }}
        </button>
      </template>
    </BaseModal>

    <BaseModal v-model="isDeleteModalOpen" title="Confirmar eliminación">
      <div class="delete-confirm-box">
        <div class="warn-icon-wrap">
          <AlertTriangle :size="36" class="warn-icon" />
        </div>
        <p class="delete-msg">
          ¿Estás seguro de que deseas eliminar el servicio <strong>{{ serviceToDelete?.name }}</strong>?
        </p>
        <p class="delete-subtext">
          Esta acción no se puede deshacer. Si el servicio cuenta con solicitudes históricas asociadas, te recomendamos desactivarlo en lugar de eliminarlo.
        </p>
      </div>

      <template #footer>
        <button class="btn btn-secondary" @click="isDeleteModalOpen = false">Cancelar</button>
        <button class="btn btn-danger" @click="handleDelete">Eliminar definitivamente</button>
      </template>
    </BaseModal>
  </div>
</template>

<style scoped>
.services-manage-page {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.breadcrumbs {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: var(--color-text-secondary);
  margin-bottom: 8px;
}

.crumb-separator {
  color: var(--color-text-muted);
}

.crumb-current {
  color: var(--color-blue-title);
  font-weight: 700;
}

.header-main {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.page-title {
  font-size: 24px;
  font-weight: 800;
  color: var(--color-blue-title);
}

.page-subtitle {
  font-size: 13px;
  color: var(--color-text-secondary);
  margin-top: 2px;
}

.filters-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  background: var(--color-surface);
  padding: 12px 18px;
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border);
  box-shadow: var(--shadow-xs);
}

.search-input-wrap {
  position: relative;
  display: flex;
  align-items: center;
  flex: 1;
  max-width: 380px;
}

.search-icon {
  position: absolute;
  left: 12px;
  color: var(--color-text-muted);
}

.search-input {
  width: 100%;
  padding: 8px 12px 8px 38px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  background: #F8FAFC;
}

.category-filter-wrap {
  display: flex;
  align-items: center;
  gap: 8px;
}

.filter-icon {
  color: var(--color-text-secondary);
}

.filter-select {
  padding: 8px 16px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  background: #F8FAFC;
  font-size: 13px;
  font-weight: 600;
  color: var(--color-text-secondary);
  cursor: pointer;
}

.services-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 24px;
}

.service-card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  overflow: hidden;
  box-shadow: var(--shadow-card);
  display: flex;
  flex-direction: column;
  transition: transform var(--transition-fast), box-shadow var(--transition-fast);
}

.service-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.service-img-wrap {
  position: relative;
  width: 100%;
  height: 160px;
  overflow: hidden;
}

.service-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;
}

.service-card:hover .service-img {
  transform: scale(1.03);
}

.service-status-pill {
  position: absolute;
  top: 10px;
  right: 10px;
  padding: 4px 10px;
  border-radius: var(--radius-full);
  font-size: 11px;
  font-weight: 700;
}

.service-status-pill.active {
  background-color: var(--color-success-bg);
  color: var(--color-success);
  border: 1px solid var(--color-success-border);
}

.service-status-pill.inactive {
  background-color: #F1F5F9;
  color: var(--color-text-secondary);
  border: 1px solid var(--color-border);
}

.service-content {
  padding: 18px 20px;
  flex: 1;
  display: flex;
  flex-direction: column;
}

.service-title {
  font-size: 17px;
  font-weight: 700;
  color: var(--color-blue-title);
  margin-bottom: 6px;
}

.service-desc {
  font-size: 13px;
  color: var(--color-text-secondary);
  line-height: 1.4;
  margin-bottom: 14px;
  flex: 1;
}

.service-price {
  font-size: 18px;
  font-weight: 800;
  color: var(--color-blue-title);
}

.service-actions {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 20px;
  border-top: 1px solid var(--color-border);
  background: #FAFBFD;
}

.btn-edit {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 8px 14px;
  border: 1px solid var(--color-primary);
  color: var(--color-primary);
  border-radius: var(--radius-sm);
  font-size: 13px;
  font-weight: 600;
  background: #FFFFFF;
}

.btn-edit:hover {
  background: rgba(8, 123, 250, 0.08);
}

.btn-delete {
  padding: 8px 10px;
  color: var(--color-danger);
  border: 1px solid var(--color-danger-border);
  background: var(--color-danger-bg);
  border-radius: var(--radius-sm);
  display: flex;
  align-items: center;
  justify-content: center;
}

.btn-delete:hover {
  background: #FCA5A5;
}

.pagination-bar {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 6px;
  margin-top: 12px;
}

.page-btn {
  width: 34px;
  height: 34px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-sm);
  border: 1px solid var(--color-border);
  background: #FFFFFF;
  color: var(--color-text-secondary);
  font-weight: 600;
  font-size: 13px;
}

.page-btn.active {
  background: var(--color-primary);
  color: #FFFFFF;
  border-color: var(--color-primary);
}

.page-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.modal-form-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-group.full-width {
  grid-column: span 2;
}

.form-label {
  font-size: 13px;
  font-weight: 600;
  color: var(--color-text-main);
}

.field-error {
  font-size: 11px;
  color: var(--color-danger);
}

.image-uploader-section {
  display: flex;
  flex-direction: column;
  gap: 16px;
  background: #F8FAFC;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  padding: 16px;
}

.current-image-preview {
  display: flex;
  align-items: center;
  gap: 16px;
}

.preview-img {
  width: 100px;
  height: 70px;
  object-fit: cover;
  border-radius: var(--radius-sm);
  border: 1px solid var(--color-border);
  background: #FFFFFF;
}

.preview-meta {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 8px;
}

.badge-base64 {
  font-size: 11px;
  font-weight: 700;
  color: #0870E8;
  background: #EBF5FF;
  border: 1px solid #BAE6FD;
  padding: 3px 8px;
  border-radius: var(--radius-full);
}

.badge-preset {
  font-size: 11px;
  font-weight: 600;
  color: var(--color-text-secondary);
  background: #F1F5F9;
  border: 1px solid var(--color-border);
  padding: 3px 8px;
  border-radius: var(--radius-full);
}

.btn-upload-file {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 7px 14px;
  background: #FFFFFF;
  border: 1.5px dashed var(--color-primary);
  color: var(--color-primary);
  border-radius: var(--radius-sm);
  font-size: 12.5px;
  font-weight: 600;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.btn-upload-file:hover {
  background: #EBF5FF;
}

.hidden-file-input {
  display: none;
}

.presets-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.presets-title {
  font-size: 12px;
  font-weight: 600;
  color: var(--color-text-secondary);
}

.image-selector-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px;
}

.img-opt-card {
  border: 2px solid var(--color-border);
  border-radius: var(--radius-sm);
  overflow: hidden;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding-bottom: 6px;
  background: #FFFFFF;
  transition: all var(--transition-fast);
}

.img-opt-card img {
  width: 100%;
  height: 60px;
  object-fit: cover;
}

.img-opt-card span {
  font-size: 11px;
  font-weight: 600;
  color: var(--color-text-secondary);
}

.img-opt-card.selected {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(8, 123, 250, 0.18);
}

.checkbox-row {
  display: flex;
  align-items: center;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  font-weight: 600;
  color: var(--color-text-main);
  cursor: pointer;
}

.delete-confirm-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 12px;
  padding: 10px 0;
}

.warn-icon-wrap {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: var(--color-danger-bg);
  display: flex;
  align-items: center;
  justify-content: center;
}

.warn-icon {
  color: var(--color-danger);
}

.delete-msg {
  font-size: 15px;
  font-weight: 600;
  color: var(--color-text-main);
}

.delete-subtext {
  font-size: 13px;
  color: var(--color-text-secondary);
  line-height: 1.4;
}

@media (max-width: 1024px) {
  .services-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 640px) {
  .services-grid {
    grid-template-columns: 1fr;
  }

  .filters-bar {
    flex-direction: column;
    align-items: stretch;
  }

  .search-input-wrap {
    max-width: none;
  }

  .modal-form-grid {
    grid-template-columns: 1fr;
  }

  .form-group.full-width {
    grid-column: span 1;
  }

  .image-selector-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>