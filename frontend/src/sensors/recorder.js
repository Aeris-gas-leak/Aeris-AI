import { useSyncExternalStore } from 'react'
import { METRICS, ROOMS } from './rooms.js'
import { createSimulator } from './simulator.js'
import { createLevelTracker, newSession, saveSession, timeAt } from './sessions.js'

// One feed for the whole app. Readings arrive every second from the moment
// the app opens; the last few minutes are kept for the live charts, and
// Start recording also captures them into a session. Arrays are filled in
// place; `version` changes on every tick so React knows to redraw.

export const SPEEDS = [1, 10, 60]
export const MAX_SECONDS = 2 * 60 * 60
export const PREVIEW_SECONDS = 300
const TICK_MS = 250
const MAX_CATCH_UP = 3600

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

function pushPreview(preview, readings) {
  const full = preview.length >= PREVIEW_SECONDS
  for (const r of ROOMS) {
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
