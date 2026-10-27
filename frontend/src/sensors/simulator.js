import { useSyncExternalStore } from 'react'
import { METRICS, ROOMS, addRoom as appendRoom } from './rooms.js'
import { createLevelTracker, newSession, saveSession, timeAt } from './recorder.js'

// One feed for the whole app. Readings arrive every second from the moment
// the app opens; the last few minutes are kept for the live charts, and
// Start recording also captures them into a session. Arrays are filled in
// place; `version` changes on every tick so React knows to redraw.

export const SPEEDS = [1, 10, 60]
export const MAX_SECONDS = 2 * 60 * 60
export const PREVIEW_SECONDS = 300
const TICK_MS = 250
const MAX_CATCH_UP = 3600

// ── Physics simulator ────────────────────────────────────────────────────────
// Produces per-second sensor readings for every room using the baselines and
// drift rates defined on each room object. Readings wander around their
// baseline with small random noise and slow sinusoidal drift.
function createSimulator() {
  // Per-room mutable state
  const roomState = {}
  for (const r of ROOMS) {
    roomState[r.id] = {
      temperature: r.temperature,
      humidity:    r.humidity,
      pressure:    1013.25 + (r.pressureOffset ?? 0),
      ozone:       1.0,
      co2:         r.co2,
      elapsed:     0,
    }
  }

  function addRoom(room) {
    if (!roomState[room.id]) {
      roomState[room.id] = {
        temperature: room.temperature ?? 24.0,
        humidity:    room.humidity ?? 50,
        pressure:    1013.25 + (room.pressureOffset ?? 0),
        ozone:       1.0,
        co2:         room.co2 ?? 520,
        elapsed:     0,
      }
    }
  }

  function rand(scale) {
    return (Math.random() - 0.5) * 2 * scale
  }

  function step(seconds) {
    const readings = {}
    for (const r of ROOMS) {
      const s = roomState[r.id]
      if (!s) continue
      s.elapsed += seconds

      // Slow drift + noise
      const hourFraction = seconds / 3600
      s.temperature += r.heatPerHour    * hourFraction + rand(0.03)
      s.humidity    += r.moisturePerHour * hourFraction + rand(0.15)
      s.ozone       += r.ozonePerHour    * hourFraction + rand(0.01)
      s.co2         += r.co2PerHour      * hourFraction + rand(2)
      s.pressure    += rand(0.05)

      // Gentle mean-reversion so values don't drift unboundedly
      s.temperature += (r.temperature - s.temperature) * 0.002
      s.humidity    += (r.humidity    - s.humidity)    * 0.002
      s.ozone       += (1.0           - s.ozone)       * 0.001
      s.co2         += (r.co2         - s.co2)         * 0.001
      s.pressure    += (1013.25 + (r.pressureOffset ?? 0) - s.pressure) * 0.002

      // Clamp to physically reasonable ranges
      s.temperature = Math.max(15, Math.min(40, s.temperature))
      s.humidity    = Math.max(10, Math.min(95, s.humidity))
      s.ozone       = Math.max(0.5, Math.min(3.5, s.ozone))
      s.co2         = Math.max(300, Math.min(5000, s.co2))
      s.pressure    = Math.max(970, Math.min(1050, s.pressure))

      readings[r.id] = {
        temperature: parseFloat(s.temperature.toFixed(2)),
        humidity:    parseFloat(s.humidity.toFixed(2)),
        pressure:    parseFloat(s.pressure.toFixed(2)),
        ozone:       parseFloat(s.ozone.toFixed(3)),
        co2:         parseFloat(s.co2.toFixed(1)),
      }
    }
    return readings
  }

  return { step, addRoom }
}

// ── Recorder state ───────────────────────────────────────────────────────────

let state = {
  status: 'idle',
  latest: {},
  preview: null,
  session: null,
  speed: 1,
  saved: null,
  stoppedAtLimit: false,
  version: 0,
}

const listeners = new Set()
let timer = null
let sim = null
let track = null
let clock = 0
let bootedAt = 0
let anchor = { wall: 0, sim: 0 }

function set(patch) {
  state = { ...state, ...patch, version: state.version + 1 }
  for (const l of listeners) l()
}

function simTarget() {
  return anchor.sim + (performance.now() - anchor.wall) / 1000 * state.speed
}

function nowMs() {
  return bootedAt + clock * 1000
}

function ensureRoomInPreview(roomId) {
  if (!state.preview) return
  if (!state.preview.rooms[roomId]) {
    state.preview.rooms[roomId] = Object.fromEntries(METRICS.map(m => [m.key, Array(state.preview.length).fill(null)]))
  }
}

function ensureRoomInSession(roomId) {
  if (!state.session) return
  if (!state.session.rooms[roomId]) {
    state.session.rooms[roomId] = Object.fromEntries(METRICS.map(m => [m.key, Array(state.session.length).fill(null)]))
  }
}

export function addRoom(roomConfig) {
  const room = appendRoom(roomConfig)
  if (sim && typeof sim.addRoom === 'function') sim.addRoom(room)
  ensureRoomInPreview(room.id)
  ensureRoomInSession(room.id)
  if (!state.latest[room.id]) state.latest[room.id] = null
  set({})
  return room
}

function pushPreview(preview, readings) {
  const full = preview.length >= PREVIEW_SECONDS
  for (const r of ROOMS) {
    ensureRoomInPreview(r.id)
    for (const m of METRICS) {
      const values = preview.rooms[r.id][m.key]
      values.push(readings[r.id] ? readings[r.id][m.key] : null)
      if (full) values.shift()
    }
  }
  if (full) preview.startedAt += 1000
  else preview.length++
}

function pushSession(session, readings) {
  const i = session.length
  for (const r of ROOMS) {
    ensureRoomInSession(r.id)
    const reading = readings[r.id]
    for (const m of METRICS) {
      const value = reading ? reading[m.key] : null
      session.rooms[r.id][m.key].push(value)
      const event = track(r.id, m, value, i)
      if (event) session.events.push(event)
    }
  }
  session.length = i + 1
}

function sample() {
  const readings = sim.step(1)
  clock++
  for (const r of ROOMS) if (readings[r.id]) state.latest[r.id] = readings[r.id]
  pushPreview(state.preview, readings)
  if (state.status === 'recording') pushSession(state.session, readings)
}

function tick() {
  const target = Math.min(simTarget(), clock + MAX_CATCH_UP)
  while (clock < target) {
    sample()
    if (state.status === 'recording' && state.session.length >= MAX_SECONDS) {
      stop(true)
      return
    }
  }
  set({})
}

function boot() {
  sim = createSimulator()
  clock = 0
  bootedAt = Date.now()
  anchor = { wall: performance.now(), sim: 0 }
  const preview = newSession()
  preview.startedAt = bootedAt
  state = { ...state, preview }
  sample()
  timer = setInterval(tick, TICK_MS)
}

export function start() {
  if (state.status === 'recording') return
  track = createLevelTracker()
  const session = newSession()
  session.startedAt = nowMs()
  set({ status: 'recording', session, saved: null, stoppedAtLimit: false })
  sample()
}

export function stop(atLimit = false) {
  if (state.status !== 'recording') return
  const { session } = state
  session.endedAt = timeAt(session, session.length)
  set({ status: 'stopped', saved: saveSession(session), stoppedAtLimit: atLimit })
}

// Leave a finished recording and go back to the live view.
export function showLive() {
  if (state.status === 'stopped') set({ status: 'idle', session: null, saved: null })
}

export function setSpeed(speed) {
  anchor = { wall: performance.now(), sim: simTarget() }
  set({ speed })
}

if (typeof window !== 'undefined') {
  window.addEventListener('pagehide', () => stop())
}

function subscribe(listener) {
  if (!timer) boot()
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function useRecorder() {
  return useSyncExternalStore(subscribe, () => state)
}
