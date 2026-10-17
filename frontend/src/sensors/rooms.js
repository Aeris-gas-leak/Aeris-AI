// Keep these in sync with THRESHOLDS in app.py so simulated and Pi data
// are judged the same way.
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
]

export const METRIC_BY_KEY = Object.fromEntries(METRICS.map(m => [m.key, m]))

// One sensor node per room. The baselines and event rates describe how each
// room behaves; they are what make the simulated readings differ by room.
export const ROOMS = [
  {
    id: 'A',
    name: 'Processing',
    temperature: 24.2,
    humidity: 48,
    pressureOffset: -0.12,
    heatPerHour: 3,
    moisturePerHour: 0.5,
  },
  {
    id: 'B',
    name: 'Storage',
    temperature: 26.2,
    humidity: 55,
    pressureOffset: 0.08,
    heatPerHour: 1.5,
    moisturePerHour: 5,
  },
  {
    id: 'C',
    name: 'Assembly',
    temperature: 23.8,
    humidity: 51,
    pressureOffset: 0,
    heatPerHour: 1,
    moisturePerHour: 0.5,
  },
  {
    id: 'D',
    name: 'Compressor room',
    temperature: 25.1,
    humidity: 46,
    pressureOffset: -0.2,
    heatPerHour: 2.5,
    moisturePerHour: 0.3,
  },
]

export const ROOM_BY_ID = Object.fromEntries(ROOMS.map(r => [r.id, r]))

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
