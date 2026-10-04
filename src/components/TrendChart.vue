<script setup>
import { nextTick, onMounted, ref, watch } from 'vue'

const props = defineProps({ records: { type: Array, default: () => [] }, range: { type: Object, required: true } })
const canvas = ref(null)

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
  const min = Math.min(...values, props.range.min) - (props.range.max - props.range.min) * 0.2
  const max = Math.max(...values, props.range.max) + (props.range.max - props.range.min) * 0.2
  const x = (index) => props.records.length === 1 ? width / 2 : (index / (props.records.length - 1)) * (width - 24) + 12
  const y = (value) => height - ((value - min) / (max - min)) * (height - 24) - 12
  ctx.fillStyle = '#f0f7dd'
  ctx.fillRect(0, Math.max(0, y(props.range.max)), width, Math.max(0, y(props.range.min) - y(props.range.max)))
  ctx.beginPath()
  props.records.forEach((item, index) => index ? ctx.lineTo(x(index), y(item.value)) : ctx.moveTo(x(index), y(item.value)))
  ctx.strokeStyle = '#b5cf3e'
  ctx.lineWidth = 2.5
  ctx.stroke()
  props.records.forEach((item, index) => {
    ctx.beginPath(); ctx.arc(x(index), y(item.value), 4, 0, Math.PI * 2); ctx.fillStyle = '#ffffff'; ctx.fill(); ctx.strokeStyle = '#87a52f'; ctx.lineWidth = 2; ctx.stroke()
  })
  ctx.fillStyle = '#8b9686'
  ctx.fillText(`${props.range.max}`, 6, Math.max(12, y(props.range.max) - 6))
  ctx.fillText(`${props.range.min}`, 6, Math.min(height - 4, y(props.range.min) + 13))
}

watch(() => [props.records, props.range], () => nextTick(draw), { deep: true })
onMounted(() => { draw(); window.addEventListener('resize', draw) })
</script>

<template>
  <div class="trend-chart">
    <canvas ref="canvas"></canvas>
    <div v-if="!records.length" class="chart-empty">还没有记录，添加一次健康数据吧</div>
  </div>
</template>
