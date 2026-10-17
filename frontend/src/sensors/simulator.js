import { ROOMS } from './rooms.js'

// Stands in for the Raspberry Pi until it is connected. Each call to step()
// returns one reading per room, rounded like the Pi's CSV rows
// (timestamp, temperature_C, humidity_%, pressure_hPa).
//
// The model, per room:
//   temperature = baseline + thermostat cycle + slow drift + heat event + noise
//   humidity    = baseline + slow drift - (temperature rise × 2.8) + moisture event + noise
//   pressure    = building pressure (weather) + room offset + air-handling jitter + noise
// Heat events stand for a machine run or a cooling fault; moisture events for a
// loading-dock door or a wash-down. Both arrive at random and ease in and out.

const HUMIDITY_PER_DEGREE = 2.8
const DROPOUT_CHANCE = 0.002

function gaussian() {
  let u = 0
  while (u === 0) u = Math.random()
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * Math.random())
}

function uniform(min, max) {
  return min + Math.random() * (max - min)
}

// Mean-reverting random walk (Ornstein–Uhlenbeck), exact update for step dt.
function drift(x, dt, tau, sd) {
  const a = Math.exp(-dt / tau)
  return x * a + sd * Math.sqrt(1 - a * a) * gaussian()
}

function round2(x) {
  return Math.round(x * 100) / 100
}

const EVENT_SHAPES = {
  heat:     { amp: [2.2, 5.0], rise: [120, 300], hold: [180, 600], fall: [300, 600] },
  moisture: { amp: [6, 14],    rise: [30, 90],   hold: [120, 420], fall: [240, 480] },
}

function newEvent(kind) {
  const s = EVENT_SHAPES[kind]
  const rise = uniform(...s.rise)
  return {
    amp: uniform(...s.amp),
    rise,
    holdLeft: rise * 2 + uniform(...s.hold),
    fall: uniform(...s.fall),
  }
}

function advanceEvent(state, kind, dt) {
  const ev = state.events[kind]
  if (!ev) return
  const target = ev.holdLeft > 0 ? ev.amp : 0
  const tau = ev.holdLeft > 0 ? ev.rise : ev.fall
  state.offsets[kind] += (target - state.offsets[kind]) * (1 - Math.exp(-dt / tau))
  ev.holdLeft -= dt
  if (ev.holdLeft <= 0 && Math.abs(state.offsets[kind]) < 0.02) {
    state.events[kind] = null
    state.offsets[kind] = 0
  }
}

function newRoomState(room) {
  return {
    room,
    cyclePeriod: uniform(900, 1320),
    cyclePhase: uniform(0, 2 * Math.PI),
    tempDrift: gaussian() * 0.25,
    humDrift: gaussian() * 1.0,
    airJitter: 0,
    offsets: { heat: 0, moisture: 0 },
    events: { heat: null, moisture: null },
  }
}

export function createSimulator() {
  let clock = 0
  const weather = {
    pressure: 1013.2 + gaussian() * 1.2,
    trendPerHour: uniform(-0.4, 0.4),
  }
  const rooms = ROOMS.map(newRoomState)

  function advance(dt) {
    clock += dt
    weather.pressure = 1013.2 + drift(weather.pressure - 1013.2, dt, 6 * 3600, 1.5)
      + weather.trendPerHour * dt / 3600

    for (const s of rooms) {
      s.tempDrift = drift(s.tempDrift, dt, 600, 0.25)
      s.humDrift = drift(s.humDrift, dt, 480, 1.0)
      s.airJitter = drift(s.airJitter, dt, 30, 0.04)

      for (const kind of ['heat', 'moisture']) {
        const perHour = kind === 'heat' ? s.room.heatPerHour : s.room.moisturePerHour
        if (!s.events[kind] && Math.random() < perHour * dt / 3600) {
          s.events[kind] = newEvent(kind)
        }
        advanceEvent(s, kind, dt)
      }
    }
  }

  function read(s) {
    if (Math.random() < DROPOUT_CHANCE) return null
    const r = s.room
    const cycle = 0.25 * Math.sin(2 * Math.PI * clock / s.cyclePeriod + s.cyclePhase)
    const tempRise = cycle + s.tempDrift + s.offsets.heat
    const temperature = r.temperature + tempRise + gaussian() * 0.02
    const humidity = r.humidity + s.humDrift - tempRise * HUMIDITY_PER_DEGREE
      + s.offsets.moisture + gaussian() * 0.12
    const pressure = weather.pressure + r.pressureOffset + s.airJitter + gaussian() * 0.02
    return {
      temperature: round2(temperature),
      humidity: round2(Math.min(98, Math.max(5, humidity))),
      pressure: round2(pressure),
    }
  }

  // The floor has been running before anyone presses Record: settle the
  // drifts, and sometimes join while an event is already under way.
  const warmup = uniform(600, 2400)
  for (let t = 0; t < warmup; t += 5) advance(5)
  if (Math.random() < 0.6) {
    const s = rooms[Math.floor(Math.random() * rooms.length)]
    const kind = s.room.moisturePerHour > s.room.heatPerHour ? 'moisture' : 'heat'
    if (!s.events[kind]) s.events[kind] = newEvent(kind)
  }

  return {
    step(dt = 1) {
      advance(dt)
      const out = {}
      for (const s of rooms) out[s.room.id] = read(s)
      return out
    },
  }
}
