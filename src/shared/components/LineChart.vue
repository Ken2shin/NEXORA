<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    data: { day: string; count: number }[]
    height?: number
  }>(),
  {
    height: 220
  }
)

const svgWidth = 500
const svgHeight = 220
const padding = { top: 24, right: 24, bottom: 34, left: 40 }

const chartWidth = computed(() => svgWidth - padding.left - padding.right)
const chartHeight = computed(() => svgHeight - padding.top - padding.bottom)

const maxY = computed(() => {
  if (!props.data || props.data.length === 0) return 5
  const max = Math.max(...props.data.map(d => d.count), 0)
  if (max === 0) return 5
  return Math.max(Math.ceil(max * 1.25), 4)
})

const yTicks = computed(() => {
  const m = maxY.value
  const t1 = m
  const t2 = Math.round(m * 0.75)
  const t3 = Math.round(m * 0.5)
  const t4 = Math.round(m * 0.25)
  return Array.from(new Set([t1, t2, t3, t4, 0]))
})

const coordinates = computed(() => {
  if (!props.data || props.data.length === 0) return []
  const stepX = chartWidth.value / (props.data.length - 1)
  return props.data.map((item, index) => {
    const x = padding.left + index * stepX
    const y = padding.top + chartHeight.value - (item.count / maxY.value) * chartHeight.value
    return { x, y, day: item.day, count: item.count }
  })
})

const pathD = computed(() => {
  const pts = coordinates.value
  if (pts.length === 0) return ''
  return pts.reduce((acc, pt, i, arr) => {
    if (i === 0) return `M ${pt.x} ${pt.y}`
    const prev = arr[i - 1]!
    const cx1 = prev.x + (pt.x - prev.x) / 2
    const cy1 = prev.y
    const cx2 = prev.x + (pt.x - prev.x) / 2
    const cy2 = pt.y
    return `${acc} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${pt.x} ${pt.y}`
  }, '')
})

const areaD = computed(() => {
  const line = pathD.value
  if (!line || coordinates.value.length === 0) return ''
  const first = coordinates.value[0]!
  const last = coordinates.value[coordinates.value.length - 1]!
  const bottomY = padding.top + chartHeight.value
  return `${line} L ${last.x} ${bottomY} L ${first.x} ${bottomY} Z`
})
</script>

<template>
  <div class="line-chart-container">
    <svg :viewBox="`0 0 ${svgWidth} ${svgHeight}`" class="chart-svg" preserveAspectRatio="none">
      <defs>
        <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#087BFA" stop-opacity="0.35" />
          <stop offset="100%" stop-color="#087BFA" stop-opacity="0.01" />
        </linearGradient>
      </defs>

      <g class="grid-lines">
        <line
          v-for="tick in yTicks"
          :key="tick"
          :x1="padding.left"
          :y1="padding.top + chartHeight - (tick / maxY) * chartHeight"
          :x2="svgWidth - padding.right"
          :y2="padding.top + chartHeight - (tick / maxY) * chartHeight"
          stroke="#EDF2F7"
          stroke-dasharray="3 3"
        />
        <text
          v-for="tick in yTicks"
          :key="'label-' + tick"
          :x="padding.left - 10"
          :y="padding.top + chartHeight - (tick / maxY) * chartHeight + 4"
          text-anchor="end"
          class="tick-label"
        >
          {{ tick }}
        </text>
      </g>

      <path :d="areaD" fill="url(#chartGradient)" />
      <path :d="pathD" fill="none" stroke="#087BFA" stroke-width="3" stroke-linecap="round" />

      <g v-for="pt in coordinates" :key="pt.day">
        <circle :cx="pt.x" :cy="pt.y" r="5" fill="#FFFFFF" stroke="#087BFA" stroke-width="3" />
        <text :x="pt.x" :y="svgHeight - 12" text-anchor="middle" class="x-label">
          {{ pt.day }}
        </text>
      </g>
    </svg>
  </div>
</template>

<style scoped>
.line-chart-container {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
}

.chart-svg {
  width: 100%;
  height: 220px;
  overflow: visible;
}

.tick-label {
  font-size: 11px;
  font-family: inherit;
  fill: #94A3B8;
  font-weight: 600;
}

.x-label {
  font-size: 12px;
  font-family: inherit;
  fill: #475569;
  font-weight: 700;
}
</style>