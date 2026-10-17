import { useSyncExternalStore } from 'react'
import { METRICS, ROOMS } from './rooms.js'
import { createSimulator } from './simulator.js'
import { createLevelTracker, newSession, saveSession, timeAt } from './sessions.js'

// One recorder for the whole app, so a recording keeps going while you look
// at other pages. Readings land in the session arrays in place; `version`
// changes on every tick so React knows to redraw.

export const SPEEDS = [1, 10, 60]
export const MAX_SECONDS = 2 * 60 * 60
const TICK_MS = 250

let state = {
  status: 'idle',
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
let anchor = { wall: 0, sim: 0 }

function set(patch) {
  state = { ...state, ...patch, version: state.version + 1 }
  for (const l of listeners) l()
}

function simTarget() {
  return anchor.sim + (performance.now() - anchor.wall) / 1000 * state.speed
}

function sample(session) {
  const i = session.length
  const readings = sim.step(session.sampleSeconds)
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

function tick() {
  const { session } = state
  const target = Math.min(simTarget(), MAX_SECONDS)
  while (session.length * session.sampleSeconds < target) sample(session)
  if (session.length * session.sampleSeconds >= MAX_SECONDS) {
    stop(true)
  } else {
    set({})
  }
}

export function start() {
  if (state.status === 'recording') return
  sim = createSimulator()
  track = createLevelTracker()
  anchor = { wall: performance.now(), sim: 0 }
  const session = newSession()
  set({ status: 'recording', session, saved: null, stoppedAtLimit: false })
  sample(session)
  timer = setInterval(tick, TICK_MS)
}

export function stop(atLimit = false) {
  if (state.status !== 'recording') return
  clearInterval(timer)
  timer = null
  const { session } = state
  session.endedAt = timeAt(session, session.length)
  set({ status: 'stopped', saved: saveSession(session), stoppedAtLimit: atLimit })
}

export function setSpeed(speed) {
  if (state.status === 'recording') anchor = { wall: performance.now(), sim: simTarget() }
  set({ speed })
}

if (typeof window !== 'undefined') {
  window.addEventListener('pagehide', () => stop())
}

function subscribe(listener) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function useRecorder() {
  return useSyncExternalStore(subscribe, () => state)
}
