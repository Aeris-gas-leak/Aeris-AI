// Keep these in sync with THRESHOLDS in app.py so simulated and Pi data
// are judged the same way.
export let ROOMS = [
  {
    id: 'Processing Area C',
    temperature: 24.2,
    humidity: 48,
    pressureOffset: -0.12,
    co2: 620,
    heatPerHour: 3,
    moisturePerHour: 0.5,
    ozonePerHour: 1.5,
    co2PerHour: 2,
  },
  {
    id: 'Storage Area B',
    temperature: 26.2,
    humidity: 55,
    pressureOffset: 0.08,
    co2: 480,
    heatPerHour: 1.5,
    moisturePerHour: 5,
    ozonePerHour: 0.3,
    co2PerHour: 0.5,
  },
  {
    id: 'Floor #01',
    temperature: 23.8,
    humidity: 51,
    pressureOffset: 0,
    co2: 540,
    heatPerHour: 1,
    moisturePerHour: 0.5,
    ozonePerHour: 0.5,
    co2PerHour: 1,
  },
]

export let ROOM_BY_ID = Object.fromEntries(ROOMS.map(r => [r.id, r]))

function syncRoomIndex() {
  ROOM_BY_ID = Object.fromEntries(ROOMS.map(r => [r.id, r]))
}

export function addRoom(roomConfig = {}) {
  const baseId = roomConfig.id ?? `Room ${ROOMS.length + 1}`
  const existing = ROOM_BY_ID[baseId]
  if (existing) return existing

  const room = {
    id: baseId,
    temperature: roomConfig.temperature ?? 24.0,
    humidity: roomConfig.humidity ?? 50,
    pressureOffset: roomConfig.pressureOffset ?? 0,
    co2: roomConfig.co2 ?? 520,
    heatPerHour: roomConfig.heatPerHour ?? 1.0,
    moisturePerHour: roomConfig.moisturePerHour ?? 0.5,
    ozonePerHour: roomConfig.ozonePerHour ?? 0.5,
    co2PerHour: roomConfig.co2PerHour ?? 1.0,
    ...roomConfig,
  }

  ROOMS = [...ROOMS, room]
  syncRoomIndex()
  return room
}

export const METRICS = [
  {
    key: 'temperature',
    csv: 'temperature_C',
    label: 'Temperature',
    unit: '°C',
    decimals: 1,
    warning: 27.0,
    danger: 29.0,
    hysteresis: 0.2,
  },
  {
    key: 'humidity',
    csv: 'humidity_%',
    label: 'Humidity',
    unit: '%',
    decimals: 1,
    warning: 60.0,
    danger: 65.0,
    hysteresis: 1.0,
  },
  {
    key: 'pressure',
    csv: 'pressure_hPa',
    label: 'Pressure',
    unit: 'hPa',
    decimals: 1,
    warning: 1020.0,
    danger: 1023.0,
    hysteresis: 0.3,
  },
  {
    key: 'ozone',
    csv: 'ozone_ratio',
    label: 'Ozone (MQ-131)',
    unit: '',
    decimals: 2,
    warning: 1.5,
    danger: 2.0,
    hysteresis: 0.05,
  },
  {
    key: 'co2',
    csv: 'co2_ppm',
    label: 'CO2-equivalent (MQ-135)',
    unit: 'ppm',
    decimals: 0,
    warning: 1000.0,
    danger: 2000.0,
    hysteresis: 50,
  },
]

export const METRIC_BY_KEY = Object.fromEntries(METRICS.map(m => [m.key, m]))

export function levelFor(metric, value) {
  if (value == null) return 'normal'
  if (value >= metric.danger) return 'danger'
  if (value >= metric.warning) return 'warning'
  return 'normal'
}

export function formatValue(metric, value) {
  if (value == null) return '–'
  return value.toFixed(metric.decimals)
}
