<script setup lang="ts">
import { computed } from 'vue'
import { getStatusLabel, getStatusBadgeClass } from '@/shared/utils/formatters'

const props = defineProps<{
  status: string
}>()

const label = computed(() => getStatusLabel(props.status))
const badgeClass = computed(() => getStatusBadgeClass(props.status))
</script>

<template>
  <span :class="['badge', badgeClass]">
    <span class="badge-dot"></span>
    {{ label }}
  </span>
</template>

<style scoped>
.badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 12px;
  border-radius: var(--radius-full);
  font-size: 12px;
  font-weight: 600;
  white-space: nowrap;
}

.badge-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background-color: currentColor;
}
</style>
