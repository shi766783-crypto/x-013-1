<script setup>
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { getMetricRange } from '../data'

const props = defineProps({
  records: { type: Array, default: () => [] },
  type: { type: String, default: 'weight' },
  pet: { type: Object, default: null },
})
const canvas = ref(null)
const range = computed(() => getMetricRange(props.pet, props.type))

function draw() {
  const element = canvas.value
  if (!element) return
  const rect = element.getBoundingClientRect()
  const ratio = window.devicePixelRatio || 1
  element.width = rect.width * ratio
  element.height = rect.height * ratio
  const ctx = element.getContext('2d')
  ctx.scale(ratio, ratio)
  const width = rect.width
  const height = rect.height
  ctx.clearRect(0, 0, width, height)
  ctx.font = '11px Inter, sans-serif'
  ctx.strokeStyle = '#e7ebe4'
  ctx.lineWidth = 1
  ;[0.25, 0.5, 0.75].forEach((step) => {
    ctx.beginPath(); ctx.moveTo(0, height * step); ctx.lineTo(width, height * step); ctx.stroke()
  })
  if (!props.records.length) return
  const values = props.records.map((item) => Number(item.value))
  // 无参考区间时（如鱼的体温/心率），以数据自身为纵轴范围，不画参考带
  const baseMin = range.value ? Math.min(...values, range.value.min) : Math.min(...values)
  const baseMax = range.value ? Math.max(...values, range.value.max) : Math.max(...values)
  const span = range.value ? range.value.max - range.value.min : Math.abs(baseMax - baseMin) || Math.abs(baseMax) || 1
  const min = baseMin - span * 0.2
  const max = baseMax + span * 0.2
  const x = (index) => props.records.length === 1 ? width / 2 : (index / (props.records.length - 1)) * (width - 24) + 12
  const y = (value) => height - ((value - min) / (max - min)) * (height - 24) - 12
  if (range.value) {
    ctx.fillStyle = '#f0f7dd'
    ctx.fillRect(0, Math.max(0, y(range.value.max)), width, Math.max(0, y(range.value.min) - y(range.value.max)))
  }
  ctx.beginPath()
  props.records.forEach((item, index) => index ? ctx.lineTo(x(index), y(item.value)) : ctx.moveTo(x(index), y(item.value)))
  ctx.strokeStyle = '#b5cf3e'
  ctx.lineWidth = 2.5
  ctx.stroke()
  props.records.forEach((item, index) => {
    ctx.beginPath(); ctx.arc(x(index), y(item.value), 4, 0, Math.PI * 2); ctx.fillStyle = '#ffffff'; ctx.fill(); ctx.strokeStyle = '#87a52f'; ctx.lineWidth = 2; ctx.stroke()
  })
  if (range.value) {
    ctx.fillStyle = '#8b9686'
    ctx.fillText(`${range.value.max}`, 6, Math.max(12, y(range.value.max) - 6))
    ctx.fillText(`${range.value.min}`, 6, Math.min(height - 4, y(range.value.min) + 13))
  }
}

watch(() => [props.records, props.type, props.pet?.species, props.pet?.breed], () => nextTick(draw), { deep: true })
onMounted(() => { draw(); window.addEventListener('resize', draw) })
</script>

<template>
  <div class="trend-chart">
    <canvas ref="canvas"></canvas>
    <div v-if="!records.length" class="chart-empty">还没有记录，添加一次健康数据吧</div>
  </div>
</template>
