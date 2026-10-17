import { useState } from 'react'
import MetricChart from './MetricChart.jsx'
import { METRICS, METRIC_BY_KEY, ROOMS, ROOM_BY_ID, formatValue, levelFor } from '../sensors/rooms.js'
import { latestReading, roomStats, timeAt } from '../sensors/sessions.js'
import { formatClock, formatSpan } from '../format.js'

const LEVEL_RANK = { normal: 0, warning: 1, danger: 2 }

function roomStatus(reading) {
  if (!reading) return { level: 'normal', text: 'No reading' }
  let level = 'normal'
  const over = []
  for (const m of METRICS) {
    const l = levelFor(m, reading[m.key])
    if (l === 'normal') continue
    over.push({ label: m.label, level: l })
    if (LEVEL_RANK[l] > LEVEL_RANK[level]) level = l
  }
  if (!over.length) return { level, text: 'Within range' }
  const names = over.filter(o => o.level === level).map(o => o.label)
  const joined = names.map((n, i) => (i ? n.toLowerCase() : n)).join(' and ')
  return { level, text: `${joined} ${level}` }
}

function roomLabel(id) {
  return `Room ${id}`
}

function RoomsTable({ session, selected, onSelect, live }) {
  return (
    <section className="panel" aria-labelledby="rooms-heading">
      <h2 id="rooms-heading" className="panel-heading">
        Rooms <span>{live ? 'Latest reading' : 'Final reading'}</span>
      </h2>
      <table className="rooms-table">
        <thead>
          <tr>
            <th scope="col">Room</th>
            <th scope="col" className="num">°C</th>
            <th scope="col" className="num">% RH</th>
            <th scope="col" className="num">hPa</th>
          </tr>
        </thead>
        <tbody>
          {ROOMS.map(r => {
            const reading = latestReading(session, r.id)
            const status = roomStatus(reading)
            const isSelected = r.id === selected
            return (
              <tr key={r.id} className={isSelected ? 'is-selected' : undefined} onClick={() => onSelect(r.id)}>
                <th scope="row">
                  <button type="button" aria-pressed={isSelected} onClick={e => { e.stopPropagation(); onSelect(r.id) }}>
                    {roomLabel(r.id)} <span className="room-kind">{r.name}</span>
                  </button>
                  <span className={`level-text level-${status.level}`}>{status.text}</span>
                </th>
                {METRICS.map(m => (
                  <td key={m.key} className={`num level-${levelFor(m, reading?.[m.key])}`}>
                    {formatValue(m, reading?.[m.key])}
                  </td>
                ))}
              </tr>
            )
          })}
        </tbody>
      </table>
    </section>
  )
}

function eventText(e) {
  const m = METRIC_BY_KEY[e.metric]
  const value = `${e.value.toFixed(m.decimals)}\u00a0${m.unit}`
  if (e.t === 0 && e.from === 'normal') return `${m.label} already at ${e.to} level, ${value}`
  if (e.to === 'normal') return `${m.label} back within range, ${value}`
  if (e.from === 'danger') return `${m.label} eased to warning level, ${value}`
  return `${m.label} reached ${e.to} level, ${value}`
}

const EVENTS_SHOWN = 40

function EventLog({ session }) {
  const events = session.events.slice(-EVENTS_SHOWN).reverse()
  const hidden = session.events.length - events.length
  return (
    <section className="panel" aria-labelledby="events-heading">
      <h2 id="events-heading" className="panel-heading">
        Threshold events <span>{session.events.length || 'None'}</span>
      </h2>
      {events.length ? (
        <ol className="event-log">
          {events.map(e => (
            <li key={`${e.t}-${e.room}-${e.metric}`} className={`level-${e.to}`}>
              <time>{formatClock(timeAt(session, e.t))}</time>
              <span><strong>{roomLabel(e.room)}</strong> {eventText(e)}</span>
            </li>
          ))}
          {hidden > 0 && <li className="event-more">{hidden} earlier events are in the CSV.</li>}
        </ol>
      ) : (
        <p className="panel-empty">No reading has crossed a warning or danger threshold.</p>
      )}
    </section>
  )
}

function SummaryTable({ session }) {
  return (
    <section className="summary" aria-labelledby="summary-heading">
      <h2 id="summary-heading" className="panel-heading">
        Every room, this recording <span>Low to high, then average</span>
      </h2>
      <div className="table-scroll">
        <table className="summary-table">
          <thead>
            <tr>
              <th scope="col">Room</th>
              {METRICS.map(m => <th key={m.key} scope="col">{m.label} ({m.unit})</th>)}
            </tr>
          </thead>
          <tbody>
            {ROOMS.map(r => {
              const stats = roomStats(session, r.id)
              return (
                <tr key={r.id}>
                  <th scope="row">{roomLabel(r.id)} <span className="room-kind">{r.name}</span></th>
                  {METRICS.map(m => {
                    const s = stats[m.key]
                    if (!s) return <td key={m.key}>–</td>
                    return (
                      <td key={m.key}>
                        <span className="range">{formatValue(m, s.min)}–{formatValue(m, s.max)}</span>
                        <span className="sub">average {formatValue(m, s.mean)}</span>
                        {s.overWarningSeconds > 0 && (
                          <span className="sub level-warning">over warning for {formatSpan(s.overWarningSeconds)}</span>
                        )}
                      </td>
                    )
                  })}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </section>
  )
}

function worstRoom(session) {
  let best = ROOMS[0].id, rank = 0
  for (const r of ROOMS) {
    const l = LEVEL_RANK[roomStatus(latestReading(session, r.id)).level]
    if (l > rank) { rank = l; best = r.id }
  }
  return best
}

export default function SessionView({ session, span, live }) {
  const [selected, setSelected] = useState(() => worstRoom(session))
  const room = ROOM_BY_ID[selected]
  const reading = latestReading(session, selected)
  const status = roomStatus(reading)
  const stats = roomStats(session, selected)

  return (
    <div className="session-view">
      <div className="session-side">
        <RoomsTable session={session} selected={selected} onSelect={setSelected} live={live} />
        <EventLog session={session} />
      </div>

      <div className="session-main">
        <header className="room-header">
          <h2>{roomLabel(room.id)} <span className="room-kind">{room.name}</span></h2>
          <span className={`level-text level-${status.level}`}>{status.text}</span>
        </header>

        {METRICS.map(m => {
          const s = stats[m.key]
          return (
            <section key={m.key} className="metric" aria-label={m.label}>
              <div className="metric-head">
                <h3>{m.label}</h3>
                <p className="metric-value">
                  <span className={`level-${levelFor(m, reading?.[m.key])}`}>{formatValue(m, reading?.[m.key])}</span>
                  <small>{m.unit}</small>
                </p>
                {s && <p className="metric-range">Range {formatValue(m, s.min)}–{formatValue(m, s.max)}&nbsp;{m.unit}</p>}
              </div>
              <MetricChart session={session} roomId={selected} roomLabel={roomLabel(room.id)} metric={m} span={span} />
            </section>
          )
        })}

        <SummaryTable session={session} />
      </div>
    </div>
  )
}
