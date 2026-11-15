<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  pendingPct: number
  inProgressPct: number
  completedPct: number
}>()

const radius = 56
const circumference = 2 * Math.PI * radius

const pendingLength = computed(() => (props.pendingPct / 100) * circumference)
const inProgressLength = computed(() => (props.inProgressPct / 100) * circumference)
const completedLength = computed(() => (props.completedPct / 100) * circumference)

const pendingOffset = 0
const inProgressOffset = computed(() => -pendingLength.value)
const completedOffset = computed(() => -(pendingLength.value + inProgressLength.value))
</script>

<template>
  <div class="donut-container">
    <div class="donut-chart-wrapper">
      <svg viewBox="0 0 160 160" class="donut-svg">
        <circle
          cx="80"
          cy="80"
          :r="radius"
          fill="none"
          stroke="#E2E8F0"
          stroke-width="18"
        />
        <circle
          cx="80"
          cy="80"
          :r="radius"
          fill="none"
          stroke="#FFC83D"
          stroke-width="18"
          :stroke-dasharray="`${pendingLength} ${circumference}`"
          :stroke-dashoffset="pendingOffset"
          transform="rotate(-90 80 80)"
          stroke-linecap="round"
        />
        <circle
          cx="80"
          cy="80"
          :r="radius"
          fill="none"
          stroke="#087BFA"
          stroke-width="18"
          :stroke-dasharray="`${inProgressLength} ${circumference}`"
          :stroke-dashoffset="inProgressOffset"
          transform="rotate(-90 80 80)"
          stroke-linecap="round"
        />
        <circle
          cx="80"
          cy="80"
          :r="radius"
          fill="none"
          stroke="#10B981"
          stroke-width="18"
          :stroke-dasharray="`${completedLength} ${circumference}`"
          :stroke-dashoffset="completedOffset"
          transform="rotate(-90 80 80)"
          stroke-linecap="round"
        />
      </svg>
      <div class="donut-center-label">
        <span class="pct-val">100%</span>
      </div>
    </div>

    <div class="donut-legend">
      <div class="legend-item">
        <span class="dot dot-pending"></span>
        <span class="legend-text">Pendiente</span>
        <span class="legend-val">{{ pendingPct }}%</span>
      </div>
      <div class="legend-item">
        <span class="dot dot-progress"></span>
        <span class="legend-text">En Proceso</span>
        <span class="legend-val">{{ inProgressPct }}%</span>
      </div>
      <div class="legend-item">
        <span class="dot dot-completed"></span>
        <span class="legend-text">Finalizadas</span>
        <span class="legend-val">{{ completedPct }}%</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.donut-container {
  display: flex;
  align-items: center;
  justify-content: space-around;
  gap: 24px;
  width: 100%;
}

.donut-chart-wrapper {
  position: relative;
  width: 150px;
  height: 150px;
  flex-shrink: 0;
}

.donut-svg {
  width: 100%;
  height: 100%;
}

.donut-center-label {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
}

.pct-val {
  font-size: 22px;
  font-weight: 800;
  color: var(--color-blue-title);
}

.donut-legend {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 14px;
}

.dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  flex-shrink: 0;
}

.dot-pending {
  background-color: #FFC83D;
}

.dot-progress {
  background-color: #087BFA;
}

.dot-completed {
  background-color: #10B981;
}

.legend-text {
  color: var(--color-text-secondary);
  font-weight: 600;
  min-width: 90px;
}

.legend-val {
  color: var(--color-text-main);
  font-weight: 800;
  margin-left: auto;
}
</style>