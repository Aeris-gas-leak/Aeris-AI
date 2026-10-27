import { useState } from 'react'
import { Link } from 'react-router-dom'
import PhoneShell from '../components/PhoneShell.jsx'
import {
  SPEEDS, setSpeed, showLive, start, stop, useRecorder,
} from '../sensors/recorder.js'
import { downloadCsv, durationSeconds, loadSessions } from '../sensors/sessions.js'
import { METRICS, METRIC_BY_KEY, ROOMS, levelFor, useRoomNames, setRoomName } from '../sensors/rooms.js'
import { DOT_FOR_LEVEL, SENSOR_COUNT, activeAlerts, withUnit } from '../sensors/display.js'
import { formatCount, formatDate, formatDuration, plural } from '../format.js'

// Draws the last few minutes of a per-second count, scaled to its own range.
function Sparkline({ values, color }) {
  const w = 44, h = 22
  if (values.length < 2) return null
  const step = Math.max(1, Math.floor(values.length / 12))
  const pts = []
  for (let i = 0; i < values.length; i += step) pts.push(values[i])
  pts.push(values.at(-1))
  const lo = Math.min(...pts), hi = Math.max(...pts)
  const y = v => (hi === lo ? h / 2 : h - 4 - ((v - lo) / (hi - lo)) * (h - 8))
  const points = pts.map((v, i) => `${(i / (pts.length - 1)) * w},${y(v).toFixed(1)}`).join(' ')
  return (
    <svg className="sparkline" width={w} height={h} viewBox={`0 0 ${w} ${h}`} fill="none" aria-hidden="true">
      <polyline points={points} stroke={color} strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

// Per-second history from the live buffer: sensors reporting and readings
// at or over a warning level.
function history(preview) {
  const reporting = [], alerts = []
  for (let i = 0; i < preview.length; i++) {
    let up = 0, over = 0
    for (const r of ROOMS) {
      const room = preview.rooms[r.id]
      if (room.temperature[i] == null) continue
      up += METRICS.length
      for (const m of METRICS) if (levelFor(m, room[m.key][i]) !== 'normal') over++
    }
    reporting.push(up)
    alerts.push(over)
  }
  return { reporting, alerts }
}

function RecordButton({ status, session }) {
  const recording = status === 'recording'
  return (
    <button
      type="button"
      className={`rec-btn${recording ? ' is-recording' : ''}`}
      onClick={() => (recording ? stop() : start())}
    >
      {recording ? <span className="rec-square"></span> : <span className="rec-dot"></span>}
      <span>{recording ? `Stop ${formatDuration(durationSeconds(session))}` : 'Record'}</span>
    </button>
  )
}

function RecordingStatus({ status, session, speed, saved }) {
  if (status === 'stopped') {
    return (
      <div className="rec-status">
        <p>
          {saved ? 'Recording saved' : 'Recording too large to keep in this browser'} ({formatDuration(durationSeconds(session))}).
        </p>
        <div className="rec-status-actions">
          {saved && <Link to={`/recordings/${session.id}`}>View recording</Link>}
          <button type="button" onClick={() => downloadCsv(session)}>Download CSV</button>
          <button type="button" onClick={showLive}>Back to live</button>
        </div>
      </div>
    )
  }
  return (
    <div className="rec-status">
      <p>
        {status === 'recording'
          ? `${formatCount(session.length * SENSOR_COUNT)} readings · ${plural(session.events.length, 'threshold event')}`
          : 'Live readings. Press Record to keep them.'}
      </p>
      <div className="speed-row" role="radiogroup" aria-label="Speed">
        {SPEEDS.map(s => (
          <button
            key={s}
            type="button"
            role="radio"
            aria-checked={s === speed}
            className={s === speed ? 'is-active' : undefined}
            onClick={() => setSpeed(s)}
          >
            {s}×
          </button>
        ))}
      </div>
    </div>
  )
}

/** Inline rename modal overlay */
function RenameModal({ roomId, initial, onCommit, onCancel }) {
  const [value, setValue] = useState(initial)
  const submit = (e) => {
    e.preventDefault()
    onCommit(value)
  }
  return (
    <div className="rename-overlay" onClick={onCancel}>
      <div className="rename-modal" onClick={e => e.stopPropagation()}>
        <div className="rename-modal-title">Rename Room</div>
        <div className="rename-modal-subtitle">{roomId}</div>
        <form onSubmit={submit}>
          <input
            className="rename-input"
            autoFocus
            value={value}
            onChange={e => setValue(e.target.value)}
            placeholder={roomId}
            maxLength={40}
          />
          <div className="rename-modal-actions">
            <button type="button" className="rename-cancel-btn" onClick={onCancel}>Cancel</button>
            <button type="submit" className="rename-save-btn">Save</button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function Dashboard() {
  const recorder = useRecorder()
  const { status, session, latest, preview } = recorder
  const [recent] = useState(() => loadSessions().slice(0, 3))
  const roomNames = useRoomNames()
  const [renaming, setRenaming] = useState(null) // room.id being renamed

  const openRename = (e, roomId) => {
    e.preventDefault()
    e.stopPropagation()
    setRenaming(roomId)
  }
  const commitRename = (name) => {
    if (renaming) setRoomName(renaming, name)
    setRenaming(null)
  }
  const cancelRename = () => setRenaming(null)

  if (!preview) return null

  const { reporting, alerts } = history(preview)
  const now = activeAlerts(latest)
  const dangerNow = now.filter(a => a.level === 'danger').length
  const received = reporting.reduce((a, b) => a + b, 0)
  const health = reporting.length ? (received / (reporting.length * SENSOR_COUNT)) * 100 : 100
  const recordings = status === 'stopped' && recorder.saved
    ? [session, ...recent.filter(s => s.id !== session.id)].slice(0, 3)
    : recent

  return (
    <PhoneShell recordingBar={false}>
      {renaming && (
        <RenameModal
          roomId={renaming}
          initial={roomNames[renaming] ?? renaming}
          onCommit={commitRename}
          onCancel={cancelRename}
        />
      )}

      <div className="top-row">
        <div className="brand-row">
          <div className="brand-avatar">M</div>
          <span className="brand-name">AERIS.AI</span>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <RecordButton status={status} session={session} />
          <Link className="bell-btn" to="/alerts" aria-label={`Alerts, ${now.length} active`}>
            🔔
            {now.length > 0 && <span className="bell-count">{now.length}</span>}
          </Link>
        </div>
      </div>

      <RecordingStatus {...recorder} />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span className="section-label">Statistics</span>
        <span className="section-label">{status === 'recording' ? 'This recording' : 'Last 5 min'}</span>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <span className="stat-label">Active Sensors</span>
          <div className="stat-row">
            <span className="stat-value">{reporting.at(-1) ?? 0}</span>
            <span className="stat-trend up">of {SENSOR_COUNT}
              <Sparkline values={reporting} color="#3ddc84" />
            </span>
          </div>
        </div>
        <div className="stat-card">
          <span className="stat-label">System Health</span>
          <div className="stat-row">
            <span className="stat-value">{health >= 99.95 ? '100' : health.toFixed(1)}%</span>
            <span className={`stat-trend ${health >= 99 ? 'up' : 'down'}`}>
              <Sparkline values={reporting} color={health >= 99 ? '#3ddc84' : '#ff5c2e'} />
            </span>
          </div>
        </div>
        <div className="stat-card">
          <span className="stat-label">Active Alerts</span>
          <div className="stat-row">
            <span className="stat-value">{now.length}</span>
            <span className={`stat-trend ${now.length ? 'down' : 'up'}`}>{dangerNow > 0 && `${dangerNow} danger`}
              <Sparkline values={alerts} color={now.length ? '#ff5c2e' : '#3ddc84'} />
            </span>
          </div>
        </div>
        <div className="stat-card">
          <span className="stat-label">Threshold Events</span>
          <div className="stat-row">
            <span className="stat-value">{session ? session.events.length : 0}</span>
            <span className="stat-trend up">{session ? formatDuration(durationSeconds(session)) : 'Not recording'}</span>
          </div>
        </div>
      </div>

      <div className="section-header">
        <span className="section-title">Factory Map View</span>
        <Link className="view-all" to="/immediate">View all</Link>
      </div>

      <div className="map-panel">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span className="floor-label">Floor #01</span>
          <div className="map-legend">
            <div className="legend-item"><span className="dot green"></span>Normal</div>
            <div className="legend-item"><span className="dot yellow"></span>Warning</div>
            <div className="legend-item"><span className="dot red"></span>Active Leak</div>
          </div>
        </div>
        <div className="rooms-grid">
          {ROOMS.map(room => {
            const reading = latest[room.id]
            const displayName = roomNames[room.id] ?? room.id
            return (
              <Link
                to={`/room/${encodeURIComponent(room.id)}`}
                className="room-mini"
                key={room.id}
                style={{ textDecoration: 'none', color: 'inherit', transition: 'all 0.2s ease', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                  <span style={{ fontWeight: 600, color: 'var(--text)', fontSize: '13px', flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {displayName}
                  </span>
                  <button
                    type="button"
                    className="room-rename-btn"
                    title="Rename room"
                    onClick={e => openRename(e, room.id)}
                    aria-label={`Rename ${displayName}`}
                  >✎</button>
                </div>
                <span className="room-mini-reading">
                  {reading ? `${withUnit(METRIC_BY_KEY.temperature, reading.temperature)} · ${withUnit(METRIC_BY_KEY.co2, reading.co2)}` : 'Waiting for sensor'}
                </span>
                <div className="room-dots-field" style={{ marginTop: 'auto' }}>
                  {METRICS.map(m => {
                    const level = reading ? levelFor(m, reading[m.key]) : 'normal'
                    return <span key={m.key} className={`dot ${DOT_FOR_LEVEL[level]}`} title={`${m.label}: ${withUnit(m, reading?.[m.key])}`}></span>
                  })}
                </div>
              </Link>
            )
          })}
        </div>
      </div>

      <div className="floor-row">Floor #02</div>
      <div className="floor-row">Floor #03</div>

      <div className="section-header">
        <span className="section-title">Recordings</span>
        <Link className="view-all" to="/recordings">View all</Link>
      </div>
      {recordings.length ? (
        <div className="room-link-row">
          {recordings.map(s => (
            <Link key={s.id} className="room-link-btn" to={`/recordings/${s.id}`}>
              {formatDate(s.startedAt)} · {formatDuration(durationSeconds(s))} <span>→</span>
            </Link>
          ))}
        </div>
      ) : (
        <div className="floor-row">No recordings yet. Press Record to start one.</div>
      )}
    </PhoneShell>
  )
}
