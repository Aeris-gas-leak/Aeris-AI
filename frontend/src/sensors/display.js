import { METRICS, ROOMS, levelFor } from './rooms.js'

// How each sensor looks in the app.
export const METRIC_STYLE = {
  temperature: { emoji: '🌡', color: '#60a5fa' },
  humidity:    { emoji: '💧', color: '#818cf8' },
  pressure:    { emoji: '🔵', color: '#34d399' },
  ozone:       { emoji: '☁️', color: '#f472b6' },
  co2:         { emoji: '🌫', color: '#fbbf24' },
}

export const ROOM_COLORS = {
  'Processing Area C': '#60a5fa',
  'Storage Area B':    '#f472b6',
  'Floor #01':         '#34d399',
}

export const SENSOR_COUNT = ROOMS.length * METRICS.length

export const DOT_FOR_LEVEL = { normal: 'green', warning: 'yellow', danger: 'red' }

export function withUnit(metric, value) {
  if (value == null) return '–'
  const v = value.toFixed(metric.decimals)
  if (!metric.unit) return v
  return metric.unit === '%' ? `${v}%` : `${v} ${metric.unit}`
}

// Every sensor reading at or over its warning level right now.
export function activeAlerts(latest) {
  const out = []
  for (const r of ROOMS) {
    const reading = latest[r.id]
    if (!reading) continue
    for (const m of METRICS) {
      const level = levelFor(m, reading[m.key])
      if (level !== 'normal') out.push({ room: r.id, metric: m, level, value: reading[m.key] })
    }
  }
  return out
}
