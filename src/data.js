export const speciesOptions = ['狗', '猫', '兔', '鸟', '鱼', '其他']
export const activityTypes = ['散步', '奔跑', '玩耍']

export const metricMeta = {
  weight: { unit: 'kg', label: '体重' },
  temperature: { unit: '°C', label: '体温' },
  heartRate: { unit: 'bpm', label: '心率' },
}

// 参考区间按「种类 -> 品种」两级配置：
// 先匹配该种类下的品种覆盖区间，匹配不到再回退到种类通用区间。
// min/max 为 null 表示该种类暂无此项指标的参考区间（如鱼类不测量体温、心率）。
// 注意：区间只用于展示与判断，历史健康记录始终保存原始数值，区间调整不会改写旧数据。
export const speciesRanges = {
  狗: {
    weight: { min: 3, max: 30 },
    temperature: { min: 37.5, max: 39.2 },
    heartRate: { min: 60, max: 140 },
    breeds: {
      吉娃娃: { weight: { min: 1.5, max: 3 } },
      泰迪: { weight: { min: 2, max: 4 } },
      贵宾: { weight: { min: 2, max: 8 } },
      比熊: { weight: { min: 3, max: 6 } },
      柯基: { weight: { min: 9, max: 14 } },
      柴犬: { weight: { min: 7, max: 11 } },
      边境牧羊犬: { weight: { min: 12, max: 20 } },
      金毛: { weight: { min: 25, max: 34 } },
      拉布拉多: { weight: { min: 25, max: 36 } },
      哈士奇: { weight: { min: 16, max: 27 } },
      阿拉斯加: { weight: { min: 32, max: 45 } },
      藏獒: { weight: { min: 40, max: 70 } },
    },
  },
  猫: {
    weight: { min: 3, max: 6 },
    temperature: { min: 38, max: 39.5 },
    heartRate: { min: 120, max: 180 },
    breeds: {
      英国短毛猫: { weight: { min: 4, max: 8 } },
      美国短毛猫: { weight: { min: 3, max: 7 } },
      布偶猫: { weight: { min: 4.5, max: 9 } },
      缅因猫: { weight: { min: 5, max: 11 } },
      暹罗猫: { weight: { min: 2.5, max: 5 } },
      橘猫: { weight: { min: 3.5, max: 7 } },
      狸花猫: { weight: { min: 3, max: 6 } },
    },
  },
  兔: {
    weight: { min: 1, max: 5 },
    temperature: { min: 38.5, max: 40 },
    heartRate: { min: 130, max: 325 },
  },
  鸟: {
    weight: { min: 0.03, max: 1.5 },
    temperature: { min: 40, max: 42.5 },
    heartRate: { min: 200, max: 500 },
    breeds: {
      虎皮鹦鹉: { weight: { min: 0.03, max: 0.05 } },
      玄凤鹦鹉: { weight: { min: 0.07, max: 0.12 } },
      八哥: { weight: { min: 0.1, max: 0.18 } },
      金丝雀: { weight: { min: 0.015, max: 0.03 } },
    },
  },
  鱼: {
    weight: { min: 0.01, max: 3 },
    temperature: null,
    heartRate: null,
  },
  其他: {
    weight: null,
    temperature: null,
    heartRate: null,
  },
}

function breedOverride(pet, type) {
  const config = speciesRanges[pet?.species]
  if (!config?.breeds || !pet?.breed) return null
  const breeds = config.breeds
  const exact = breeds[pet.breed.trim()]
  if (exact?.[type]) return exact[type]
  const fuzzyKey = Object.keys(breeds).find((name) => pet.breed.includes(name) || name.includes(pet.breed.trim()))
  return fuzzyKey ? breeds[fuzzyKey][type] || null : null
}

// 返回某只宠物某项指标当前的参考区间 { min, max }，无参考时返回 null。
export function getMetricRange(pet, type) {
  const config = speciesRanges[pet?.species]
  if (!config) return null
  const override = breedOverride(pet, type)
  const range = override || config[type]
  if (!range || range.min == null || range.max == null) return null
  return { ...range, unit: metricMeta[type]?.unit, label: metricMeta[type]?.label }
}

// 参考区间为空时不做正常/异常判断，统一视为无法评估。
export function isValueInRange(value, range) {
  if (!range) return null
  const number = Number(value)
  if (Number.isNaN(number)) return null
  return number >= range.min && number <= range.max
}

export const achievementDefinitions = [
  { id: 'first-pet', icon: 'paw', title: '初次养宠', desc: '完成第一个宠物档案', condition: (s) => s.pets.length >= 1 },
  { id: 'health-keeper', icon: 'heart', title: '健康记录家', desc: '累计记录 5 次健康指标', condition: (s) => s.healthRecords.length >= 5 },
  { id: 'vaccine-on-time', icon: 'shield', title: '疫苗按时', desc: '添加一项完整疫苗计划', condition: (s) => s.vaccines.some((item) => item.nextDate) },
  { id: 'walk-master', icon: 'footprints', title: '遛狗达人', desc: '本周活动达到 180 分钟', condition: (s) => s.activities.filter((item) => isThisWeek(item.date)).reduce((sum, item) => sum + Number(item.duration || 0), 0) >= 180 },
  { id: 'pet-star', icon: 'star', title: '宠物之星', desc: '拥有 2 个及以上宠物', condition: (s) => s.pets.length >= 2 },
  { id: 'food-planner', icon: 'utensils', title: '营养规划师', desc: '为宠物设置喂食计划', condition: (s) => s.feedings.length >= 1 },
  { id: 'medication-pro', icon: 'pill', title: '用药管家', desc: '完成一项用药记录', condition: (s) => s.medications.length >= 1 },
  { id: 'trend-watcher', icon: 'chart', title: '趋势观察员', desc: '记录连续 3 天的体重', condition: (s) => new Set(s.healthRecords.filter((item) => item.type === 'weight').map((item) => item.date)).size >= 3 },
  { id: 'active-family', icon: 'sun', title: '活力家庭', desc: '累计完成 10 次活动', condition: (s) => s.activities.length >= 10 },
  { id: 'care-routine', icon: 'calendar', title: '规律生活', desc: '同时拥有喂食和用药计划', condition: (s) => s.feedings.length >= 1 && s.medications.length >= 1 },
  { id: 'wellness', icon: 'sparkles', title: '元气满满', desc: '完成 3 类健康记录', condition: (s) => new Set(s.healthRecords.map((item) => item.type)).size >= 3 },
  { id: 'family-record', icon: 'book', title: '家庭档案', desc: '填写宠物芯片或备注信息', condition: (s) => s.pets.some((item) => item.microchip || item.notes) },
]

export function uid(prefix = 'item') {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

export function todayISO() {
  const date = new Date()
  const offset = date.getTimezoneOffset()
  return new Date(date.getTime() - offset * 60000).toISOString().slice(0, 10)
}

export function daysFromToday(dateString) {
  const start = new Date(`${todayISO()}T00:00:00`)
  const target = new Date(`${dateString}T00:00:00`)
  return Math.round((target - start) / 86400000)
}

export function isThisWeek(dateString) {
  const date = new Date(`${dateString}T00:00:00`)
  const today = new Date(`${todayISO()}T00:00:00`)
  const day = today.getDay() || 7
  const monday = new Date(today)
  monday.setDate(today.getDate() - day + 1)
  monday.setHours(0, 0, 0, 0)
  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)
  return date >= monday && date <= sunday
}

export function calculateAge(birthDate) {
  if (!birthDate) return '年龄未知'
  const birth = new Date(`${birthDate}T00:00:00`)
  const now = new Date()
  let years = now.getFullYear() - birth.getFullYear()
  let months = now.getMonth() - birth.getMonth()
  if (now.getDate() < birth.getDate()) months -= 1
  if (months < 0) {
    years -= 1
    months += 12
  }
  if (years > 0) return `${years}岁${months ? ` ${months}个月` : ''}`
  return `${Math.max(months, 0)}个月`
}

export function formatDate(dateString, withYear = false) {
  if (!dateString) return '--'
  const date = new Date(`${dateString}T00:00:00`)
  return date.toLocaleDateString('zh-CN', withYear ? { year: 'numeric', month: 'long', day: 'numeric' } : { month: 'long', day: 'numeric' })
}

export function createDemoState() {
  return {
    pets: [
      { id: 'pet-momo', name: 'Momo', species: '猫', breed: '英国短毛猫', gender: '母', birthDate: '2021-05-18', weight: 4.8, color: '奶油灰', neutered: true, microchip: '9820004112', photo: '', notes: '对海鲜敏感' },
      { id: 'pet-nori', name: 'Nori', species: '狗', breed: '柴犬', gender: '公', birthDate: '2020-10-03', weight: 9.2, color: '赤色', neutered: true, microchip: '', photo: '', notes: '' },
    ],
    healthRecords: [
      { id: 'health-1', petId: 'pet-momo', type: 'weight', date: '2026-09-04', value: 4.6 },
      { id: 'health-2', petId: 'pet-momo', type: 'weight', date: '2026-09-10', value: 4.8 },
      { id: 'health-3', petId: 'pet-momo', type: 'temperature', date: '2026-09-12', value: 38.2 },
      { id: 'health-4', petId: 'pet-nori', type: 'weight', date: '2026-09-06', value: 9.1 },
      { id: 'health-5', petId: 'pet-nori', type: 'weight', date: '2026-09-14', value: 9.2 },
    ],
    vaccines: [
      { id: 'vaccine-1', petId: 'pet-momo', name: '猫三联', date: '2026-01-12', nextDate: '2026-09-22', hospital: '和煦动物医院', notes: '年度加强针' },
      { id: 'vaccine-2', petId: 'pet-nori', name: '狂犬疫苗', date: '2025-10-08', nextDate: '2026-10-08', hospital: '森屿宠物诊所', notes: '' },
    ],
    medications: [
      { id: 'med-1', petId: 'pet-momo', name: '益生菌', dose: '1包', frequency: '每日 1 次', startDate: '2026-09-15', endDate: '2026-09-21', notes: '随餐喂食' },
    ],
    feedings: [
      { id: 'feed-1', petId: 'pet-momo', food: '主粮', brand: '渴望六种鱼', times: 2, portion: '35g' },
      { id: 'feed-2', petId: 'pet-nori', food: '主粮', brand: '爱肯拿鸭肉梨', times: 2, portion: '80g' },
    ],
    activities: [
      { id: 'activity-1', petId: 'pet-nori', date: '2026-09-15', duration: 35, type: '散步', location: '江滨公园', notes: '' },
      { id: 'activity-2', petId: 'pet-nori', date: '2026-09-13', duration: 50, type: '奔跑', location: '社区草坪', notes: '' },
      { id: 'activity-3', petId: 'pet-momo', date: '2026-09-14', duration: 20, type: '玩耍', location: '家中', notes: '' },
    ],
  }
}
