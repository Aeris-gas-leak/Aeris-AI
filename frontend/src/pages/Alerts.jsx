import PhoneShell from '../components/PhoneShell.jsx'
import BackHeader from '../components/BackHeader.jsx'
import AlertItem from '../components/AlertItem.jsx'
import { useRecorder } from '../sensors/recorder.js'
import { METRIC_BY_KEY } from '../sensors/rooms.js'
import { timeAt } from '../sensors/sessions.js'
import { activeAlerts } from '../sensors/display.js'
import { formatClock } from '../format.js'

function eventNote(e) {
  if (e.to === 'normal') return 'back to normal'
  if (e.from === 'danger') return 'eased from danger'
  return null
}

export default function Alerts() {
  const { status, session, latest } = useRecorder()
  const now = activeAlerts(latest)
  const events = session ? session.events.slice(-40).reverse() : []

  return (
    <PhoneShell>
      <BackHeader to="/rooms" title="Recent Alerts" />

      <div style={{ fontFamily: "'Syne',sans-serif", fontSize: '13px', fontWeight: 700, color: 'var(--muted)' }}>
        Right now
      </div>
      {now.length > 0
        ? <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {now.map(a => <AlertItem key={`${a.room}-${a.metric.key}`} {...a} time="Now" />)}
          </div>
        : <div style={{ textAlign: 'center', color: 'var(--muted)', padding: '24px 20px', fontSize: '14px' }}>
            ✅ No threshold alerts right now.
          </div>
      }

      {session && (
        <>
          <div style={{ fontFamily: "'Syne',sans-serif", fontSize: '13px', fontWeight: 700, color: 'var(--muted)', marginTop: '8px' }}>
            {status === 'recording' ? 'This recording' : 'Last recording'}
          </div>
          {events.length > 0
            ? <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {events.map((e, i) => (
                  <AlertItem
                    key={`${e.t}-${e.room}-${e.metric}-${i}`}
                    room={e.room}
                    metric={METRIC_BY_KEY[e.metric]}
                    level={e.to}
                    value={e.value}
                    time={formatClock(timeAt(session, e.t))}
                    note={eventNote(e)}
                  />
                ))}
              </div>
            : <div style={{ textAlign: 'center', color: 'var(--muted)', padding: '24px 20px', fontSize: '14px' }}>
                Nothing has crossed a threshold in this recording yet.
              </div>
          }
        </>
      )}

      <div style={{ fontFamily: "'Syne',sans-serif", fontSize: '13px', fontWeight: 700, color: 'var(--muted)', marginTop: '8px' }}>
        Predictive
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <div className="alert-card-v2">
          <div className="alert-icon">⏱</div>
          <div className="alert-content">
            <div className="alert-title">Potential Leak Risk in Area B</div>
            <div className="alert-desc">Based on pressure patterns, a leak may develop in the next 24–48 hours</div>
          </div>
        </div>
        <div className="alert-card-v2">
          <div className="alert-icon yellow">🔧</div>
          <div className="alert-content">
            <div className="alert-title">Sensor Maintenance Required</div>
            <div className="alert-desc">4 sensors in Room A due for calibration within 7 days</div>
          </div>
        </div>
      </div>
    </PhoneShell>
  )
}
