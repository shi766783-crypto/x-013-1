import { computed, reactive, watch } from 'vue'
import { achievementDefinitions, createDemoState, daysFromToday, getMetricRange, isThisWeek, isValueInRange, todayISO, uid } from '../data'

const STORAGE_KEY = 'petcare-home-state'
const saved = localStorage.getItem(STORAGE_KEY)
const state = reactive(saved ? JSON.parse(saved) : createDemoState())

watch(state, (value) => localStorage.setItem(STORAGE_KEY, JSON.stringify(value)), { deep: true })

export function usePetStore() {
  const petById = (id) => state.pets.find((pet) => pet.id === id)
  const petName = (id) => petById(id)?.name || '未命名宠物'
  const totalActivity = computed(() => state.activities.filter((item) => isThisWeek(item.date)).reduce((sum, item) => sum + Number(item.duration || 0), 0))
  const pendingVaccines = computed(() => state.vaccines.filter((item) => daysFromToday(item.nextDate) <= 7).length)
  const feedingTasks = computed(() => state.feedings.reduce((sum, item) => sum + Number(item.times || 0), 0))
  const medicationsToday = computed(() => state.medications.filter((item) => item.startDate <= todayISO() && item.endDate >= todayISO()).length)
  const achievements = computed(() => achievementDefinitions.map((item) => ({ ...item, unlocked: item.condition(state) })))
  const healthCompleteness = (petId) => {
    const fields = ['weight', 'temperature', 'heartRate']
    const count = fields.filter((type) => state.healthRecords.some((item) => item.petId === petId && item.type === type)).length
    return Math.round((count / fields.length) * 100)
  }
  // 健康达标率：用这只宠物当前种类/品种的参考区间，逐条判断历史记录。
  // 区间是判断时现算的，因此区间变化不会改动任何已保存记录。
  // 该种类没有参考区间的指标（如鱼的体温）不参与统计；无任何可评估记录时返回 null。
  const healthCompliance = (petId) => {
    const pet = petById(petId)
    const records = state.healthRecords.filter((item) => item.petId === petId)
    const evaluable = records.filter((item) => getMetricRange(pet, item.type))
    if (!evaluable.length) return null
    const passed = evaluable.filter((item) => isValueInRange(item.value, getMetricRange(pet, item.type))).length
    return Math.round((passed / evaluable.length) * 100)
  }

  function add(itemType, payload) {
    state[itemType].unshift({ id: uid(itemType.slice(0, -1)), ...payload })
  }
  function addPet(payload) {
    add('pets', payload)
  }
  function resetDemo() {
    const fresh = createDemoState()
    Object.keys(state).forEach((key) => { state[key].splice(0, state[key].length, ...(fresh[key] || [])) })
  }

  return { state, petById, petName, totalActivity, pendingVaccines, feedingTasks, medicationsToday, achievements, healthCompleteness, healthCompliance, add, addPet, resetDemo }
}
