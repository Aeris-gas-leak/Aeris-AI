import { METRICS, METRIC_BY_KEY, ROOMS, levelFor } from './rooms.js'

export const LEVEL_RANK = { normal: 0, warning: 1, danger: 2 }

// The worst level across a room's readings, and which readings are at it:
// { level: 'warning', text: 'Temperature and humidity warning' }.
export function roomStatus(reading) {
  if (!reading) return { level: 'normal', text: 'Waiting for sensor' }
  let level = 'normal'
  const over = []
  for (const m of METRICS) {
    const l = levelFor(m, reading[m.key])
    if (l === 'normal') continue
    over.push({ label: m.label, level: l })
    if (LEVEL_RANK[l] > LEVEL_RANK[level]) level = l
  }
  if (!over.length) return { level, text: 'Normal' }
  const names = over.filter(o => o.level === level).map(o => o.label)
  const joined = names.map((n, i) => (i ? n.toLowerCase() : n)).join(' and ')
  return { level, text: `${joined} ${level}` }
}

export function roomLabel(id) {
  return `Room ${id}`
}

export function worstRoom(readings, fallback = ROOMS[0].id) {
  let best = fallback, rank = 0
  for (const r of ROOMS) {
    const l = LEVEL_RANK[roomStatus(readings[r.id]).level]
    if (l > rank) { rank = l; best = r.id }
  }
  return best
}

export function eventText(e) {
  const m = METRIC_BY_KEY[e.metric]
  const value = `${e.value.toFixed(m.decimals)}\u00a0${m.unit}`
  if (e.t === 0 && e.from === 'normal') return `${m.label} already at ${e.to} level, ${value}`
  if (e.to === 'normal') return `${m.label} back to normal, ${value}`
  if (e.from === 'danger') return `${m.label} eased to warning level, ${value}`
  return `${m.label} reached ${e.to} level, ${value}`
}
