import { useState } from 'react'
import { useParams } from 'react-router-dom'
import PhoneShell from '../components/PhoneShell.jsx'
import BackHeader from '../components/BackHeader.jsx'
import ChartBlock from '../components/ChartBlock.jsx'
import AlertItem from '../components/AlertItem.jsx'
import { downloadCsv, durationSeconds, findSession, timeAt } from '../sensors/sessions.js'
import { METRICS, METRIC_BY_KEY, ROOMS } from '../sensors/rooms.js'
import { METRIC_STYLE, SENSOR_COUNT } from '../sensors/display.js'
import { formatClock, formatCount, formatDate, formatDuration } from '../format.js'

export default function RecordingDetail() {
  const { id } = useParams()
  const [session] = useState(() => findSession(id))
  const [room, setRoom] = useState(ROOMS[0].id)

  if (!session) {
    return (
      <PhoneShell>
        <BackHeader to="/recordings" title="Recording" />
        <div style={{ textAlign: 'center', color: 'var(--muted)', padding: '40px 20px', fontSize: '14px' }}>
          This recording was deleted or saved in another browser.
        </div>
      </PhoneShell>
    )
  }

  const events = session.events.filter(e => e.room === room).slice().reverse()

  return (
    <PhoneShell>
      <BackHeader to="/recordings" title={formatDate(session.startedAt)} />

      <div className="env-grid">
        <div className="env-row">
          <div className="env-card">Length <strong>{formatDuration(durationSeconds(session))}</strong></div>
          <div className="env-card">Events <strong>{session.events.length}</strong></div>
        </div>
        <div className="env-card">Readings <strong>{formatCount(session.length * SENSOR_COUNT)}</strong></div>
      </div>

      <button type="button" className="home-generate-btn" onClick={() => downloadCsv(session)}>
        Download CSV
        <span>↓</span>
      </button>

      <div className="room-tabs" role="tablist" aria-label="Room">
        {ROOMS.map(r => (
          <button
            key={r.id}
            type="button"
            role="tab"
            aria-selected={r.id === room}
            className={r.id === room ? 'is-active' : undefined}
            onClick={() => setRoom(r.id)}
          >
            {r.id}
          </button>
        ))}
      </div>

      {METRICS.map(m => (
        <ChartBlock
          key={`${room}-${m.key}`}
          title={m.label}
          emoji={METRIC_STYLE[m.key].emoji}
          metric={m}
          session={session}
          series={[{ label: room, color: METRIC_STYLE[m.key].color, values: session.rooms[room][m.key] }]}
        />
      ))}

      <div style={{ fontFamily: "'Syne',sans-serif", fontSize: '13px', fontWeight: 700, color: 'var(--muted)' }}>
        Threshold events in {room}
      </div>
      {events.length > 0
        ? <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {events.map((e, i) => (
              <AlertItem
                key={i}
                room={e.room}
                metric={METRIC_BY_KEY[e.metric]}
                level={e.to}
                value={e.value}
                time={formatClock(timeAt(session, e.t))}
                note={e.to === 'normal' ? 'back to normal' : null}
              />
            ))}
          </div>
        : <div style={{ textAlign: 'center', color: 'var(--muted)', padding: '24px 20px', fontSize: '14px' }}>
            ✅ Nothing crossed a threshold in this room.
          </div>
      }
    </PhoneShell>
  )
}
