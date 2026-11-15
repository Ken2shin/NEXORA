<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { Search, Filter, ArrowRight } from 'lucide-vue-next'
import { repositories } from '@/shared/infrastructure/provider'
import type { Service, ServiceCategory } from '@/shared/types/service.types'
import { formatCurrency } from '@/shared/utils/formatters'

const router = useRouter()
const services = ref<Service[]>([])
const categories = ref<ServiceCategory[]>([])
const isLoading = ref(true)

const searchQuery = ref('')
const selectedCategory = ref('all')
const sortBy = ref<'name' | 'price_asc' | 'price_desc'>('name')

onMounted(async () => {
  try {
    const [catsRes, servsRes] = await Promise.all([
      repositories.services.getCategories(),
      repositories.services.getServices({ is_active: true, limit: 50 })
    ])
    categories.value = catsRes
    services.value = servsRes.data
  } finally {
    isLoading.value = false
  }
})

const filteredServices = computed(() => {
  let list = services.value

  if (selectedCategory.value !== 'all') {
    list = list.filter(s => s.category_id === selectedCategory.value)
  }

  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase().trim()
    list = list.filter(s =>
      s.name.toLowerCase().includes(q) ||
      s.short_description.toLowerCase().includes(q) ||
      s.description.toLowerCase().includes(q)
    )
  }

  return [...list].sort((a, b) => {
    if (sortBy.value === 'price_asc') {
      return (a.price_amount || 0) - (b.price_amount || 0)
    }
    if (sortBy.value === 'price_desc') {
      return (b.price_amount || 0) - (a.price_amount || 0)
    }
    return a.name.localeCompare(b.name)
  })
})

function requestService(serviceId: string) {
  router.push({
    path: '/client/requests/new',
    query: { serviceId }
  })
}
</script>

<template>
  <div class="catalog-page">
    <div class="page-header">
      <h1 class="page-title">Catálogo de Servicios</h1>
      <p class="page-subtitle">Explora y solicita soluciones empresariales a la medida de tu organización.</p>
    </div>

    <div class="filters-bar">
      <div class="search-input-wrap">
        <Search :size="18" class="search-icon" />
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Buscar soluciones, diseño, soporte..."
          class="search-input"
        />
      </div>

      <div class="filter-controls">
        <div class="control-wrap">
          <Filter :size="16" class="control-icon" />
          <select v-model="selectedCategory" class="control-select">
            <option value="all">Todas las categorías</option>
            <option v-for="cat in categories" :key="cat.id" :value="cat.id">
              {{ cat.name }}
            </option>
          </select>
        </div>

        <div class="control-wrap">
          <select v-model="sortBy" class="control-select">
            <option value="name">Ordenar: Nombre (A-Z)</option>
            <option value="price_asc">Precio: Menor a Mayor</option>
            <option value="price_desc">Precio: Mayor a Menor</option>
          </select>
        </div>
      </div>
    </div>

    <div v-if="isLoading" class="catalog-loading">
      <div class="skeleton-grid">
        <div v-for="i in 3" :key="i" class="skeleton-catalog-card"></div>
      </div>
    </div>

    <div v-else-if="filteredServices.length === 0" class="empty-catalog card">
      <p class="empty-title">No hay servicios que coincidan con tu búsqueda</p>
      <p class="empty-desc">Intenta seleccionar otra categoría o cambiar las palabras clave.</p>
    </div>

    <div v-else class="catalog-grid">
      <div v-for="service in filteredServices" :key="service.id" class="catalog-card">
        <div class="card-img-wrap">
          <img :src="service.image_path" :alt="service.name" class="catalog-img" />
          <span class="category-tag">{{ service.category_name || 'Servicio' }}</span>
        </div>

        <div class="card-body">
          <h3 class="service-name">{{ service.name }}</h3>
          <p class="service-desc">{{ service.short_description }}</p>
          <p class="service-detail">{{ service.description }}</p>

          <div class="price-and-action">
            <div class="price-box">
              <span class="price-label">Tarifa base</span>
              <span class="price-value">{{ formatCurrency(service.price_amount, service.currency_code) }}</span>
            </div>

            <button class="btn btn-primary" @click="requestService(service.id)">
              <span>Solicitar</span>
              <ArrowRight :size="16" />
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.catalog-page {
  display: flex;
  flex-direction: column;
  gap: 24px;
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
  max-width: 400px;
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

.filter-controls {
  display: flex;
  align-items: center;
  gap: 12px;
}

.control-wrap {
  display: flex;
  align-items: center;
  gap: 6px;
}

.control-icon {
  color: var(--color-text-secondary);
}

.control-select {
  padding: 8px 14px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  background: #F8FAFC;
  font-size: 13px;
  font-weight: 600;
  color: var(--color-text-secondary);
  cursor: pointer;
}

.catalog-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 24px;
}

.catalog-card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  overflow: hidden;
  box-shadow: var(--shadow-card);
  display: flex;
  flex-direction: column;
  transition: transform var(--transition-fast), box-shadow var(--transition-fast);
}

.catalog-card:hover {
  transform: translateY(-3px);
  box-shadow: var(--shadow-md);
}

.card-img-wrap {
  position: relative;
  width: 100%;
  height: 180px;
  overflow: hidden;
}

.catalog-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;
}

.catalog-card:hover .catalog-img {
  transform: scale(1.04);
}

.category-tag {
  position: absolute;
  top: 12px;
  left: 12px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(4px);
  padding: 4px 10px;
  border-radius: var(--radius-full);
  font-size: 11px;
  font-weight: 700;
  color: var(--color-primary);
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
}

.card-body {
  padding: 20px;
  flex: 1;
  display: flex;
  flex-direction: column;
}

.service-name {
  font-size: 18px;
  font-weight: 800;
  color: var(--color-blue-title);
  margin-bottom: 4px;
}

.service-desc {
  font-size: 13px;
  font-weight: 600;
  color: var(--color-text-secondary);
  margin-bottom: 10px;
}

.service-detail {
  font-size: 12px;
  color: var(--color-text-muted);
  line-height: 1.5;
  margin-bottom: 20px;
  flex: 1;
}

.price-and-action {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: 16px;
  border-top: 1px solid var(--color-border);
}

.price-box {
  display: flex;
  flex-direction: column;
}

.price-label {
  font-size: 10px;
  font-weight: 600;
  color: var(--color-text-muted);
  text-transform: uppercase;
}

.price-value {
  font-size: 18px;
  font-weight: 800;
  color: var(--color-blue-title);
}

.skeleton-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 24px;
}

.skeleton-catalog-card {
  height: 380px;
  background: #EDF2F7;
  border-radius: var(--radius-md);
}

.empty-catalog {
  padding: 60px 20px;
  text-align: center;
}

.empty-title {
  font-size: 16px;
  font-weight: 700;
  color: var(--color-blue-title);
}

.empty-desc {
  font-size: 13px;
  color: var(--color-text-secondary);
  margin-top: 4px;
}

@media (max-width: 1024px) {
  .catalog-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 640px) {
  .catalog-grid {
    grid-template-columns: 1fr;
  }
  .filters-bar {
    flex-direction: column;
    align-items: stretch;
  }
  .filter-controls {
    flex-direction: column;
    align-items: stretch;
  }
}
</style>
