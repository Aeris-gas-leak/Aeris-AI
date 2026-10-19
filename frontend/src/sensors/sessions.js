import { METRICS, ROOMS, levelFor } from './rooms.js'

const STORAGE_KEY = 'aeris.sessions.v2'
const LEVEL_RANK = { normal: 0, warning: 1, danger: 2 }

export function newSession() {
  const rooms = {}
  for (const r of ROOMS) rooms[r.id] = Object.fromEntries(METRICS.map(m => [m.key, []]))
  return {
    id: crypto.randomUUID(),
    source: 'simulated',
    startedAt: Date.now(),
    endedAt: null,
    sampleSeconds: 1,
    length: 0,
    rooms,
    events: [],
  }
}

export function timeAt(session, index) {
  return session.startedAt + index * session.sampleSeconds * 1000
}

export function durationSeconds(session) {
  return session.length * session.sampleSeconds
}

// Tracks each room/metric's alert level with hysteresis, so a reading that
// hovers on a threshold produces one event rather than a burst of them.
export function createLevelTracker() {
  const current = {}
  for (const r of ROOMS) {
    current[r.id] = {}
    for (const m of METRICS) current[r.id][m.key] = 'normal'
  }

  return function track(roomId, metric, value, t) {
    if (value == null) return null
    const was = current[roomId][metric.key]
    let now = levelFor(metric, value)
    if (LEVEL_RANK[now] < LEVEL_RANK[was]) {
      now = levelFor(metric, value + metric.hysteresis)
    }
    if (now === was) return null
    current[roomId][metric.key] = now
    return { t, room: roomId, metric: metric.key, from: was, to: now, value }
  }
}

export function latestReading(session, roomId) {
  const room = session.rooms[roomId]
  for (let i = session.length - 1; i >= Math.max(0, session.length - 5); i--) {
    if (room.temperature[i] != null) {
      return Object.fromEntries(METRICS.map(m => [m.key, room[m.key][i]]))
    }
  }
  return null
}

// Thins a long series for drawing. Each bucket keeps its lowest and highest
// reading, so short spikes survive; a bucket with no readings becomes a gap.
export function chartPoints(session, values, maxPoints = 720) {
  const step = session.sampleSeconds
  if (values.length <= maxPoints) {
    return values.map((y, i) => ({ x: i * step, y }))
  }
  const size = Math.ceil(values.length / (maxPoints / 2))
  const points = []
  for (let start = 0; start < values.length; start += size) {
    let lo = null, hi = null
    const end = Math.min(start + size, values.length)
    for (let i = start; i < end; i++) {
      const v = values[i]
      if (v == null) continue
      if (lo == null || v < values[lo]) lo = i
      if (hi == null || v > values[hi]) hi = i
    }
    if (lo == null) {
      points.push({ x: start * step, y: null })
    } else {
      for (const i of lo <= hi ? [lo, hi] : [hi, lo]) {
        if (points.at(-1)?.x !== i * step) points.push({ x: i * step, y: values[i] })
      }
    }
  }
  return points
}

function pad(n) {
  return String(n).padStart(2, '0')
}

export function csvTimestamp(ms) {
  const d = new Date(ms)
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} `
    + `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

// Same columns as the Pi's CSV, with the room added.
export function sessionCsv(session) {
  const lines = [['timestamp', 'room', ...METRICS.map(m => m.csv)].join(',')]
  for (let i = 0; i < session.length; i++) {
    const ts = csvTimestamp(timeAt(session, i))
    for (const r of ROOMS) {
      const room = session.rooms[r.id]
      if (room.temperature[i] == null) continue
      lines.push([ts, r.id, ...METRICS.map(m => room[m.key][i])].join(','))
    }
  }
  return lines.join('\n') + '\n'
}

export function downloadCsv(session) {
  const blob = new Blob([sessionCsv(session)], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `aeris-${csvTimestamp(session.startedAt).replace(/[: ]/g, '-')}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

// ── Saved recordings (browser storage) ─────────────────────────────────────

export function loadSessions() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    const list = raw ? JSON.parse(raw) : []
    return Array.isArray(list) ? list : []
  } catch {
    return []
  }
}

function writeSessions(list) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list))
}

// Newest first. When storage is full, the oldest recordings make room.
// Returns false if even the new recording alone does not fit.
export function saveSession(session) {
  const list = [session, ...loadSessions().filter(s => s.id !== session.id)]
  while (list.length) {
    try {
      writeSessions(list)
      return true
    } catch {
      if (list.length === 1) return false
      list.pop()
    }
  }
  return false
}

export function deleteSession(id) {
  try {
    writeSessions(loadSessions().filter(s => s.id !== id))
  } catch {
    // Nothing to recover: the list stays as it was.
  }
}

export function findSession(id) {
  return loadSessions().find(s => s.id === id) ?? null
}
