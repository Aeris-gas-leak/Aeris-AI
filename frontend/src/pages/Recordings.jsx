import { useState } from 'react'
import { Link } from 'react-router-dom'
import PhoneShell from '../components/PhoneShell.jsx'
import BackHeader from '../components/BackHeader.jsx'
import { deleteSession, downloadCsv, durationSeconds, loadSessions } from '../sensors/sessions.js'
import { SENSOR_COUNT } from '../sensors/display.js'
import { formatCount, formatDate, formatDuration, plural } from '../format.js'

export default function Recordings() {
  const [sessions, setSessions] = useState(loadSessions)
  const [confirming, setConfirming] = useState(null)

  function remove(id) {
    deleteSession(id)
    setSessions(loadSessions())
    setConfirming(null)
  }

  return (
    <PhoneShell>
      <BackHeader to="/rooms" title="Recordings" />

      {sessions.length === 0 ? (
        <div style={{ textAlign: 'center', color: 'var(--muted)', padding: '40px 20px', fontSize: '14px', lineHeight: 1.6 }}>
          No recordings yet. Press Record on the <Link className="view-all" to="/rooms">dashboard</Link> to start one.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {sessions.map(s => (
            <div className="alert-item" key={s.id}>
              <div className="alert-row-top">
                <Link className="alert-area recording-link" to={`/recordings/${s.id}`}>{formatDate(s.startedAt)}</Link>
                <span className="alert-time">{formatDuration(durationSeconds(s))}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2px' }}>
                <span className="alert-sensor">{formatCount(s.length * SENSOR_COUNT)} readings</span>
                <span className="alert-reading">{plural(s.events.length, 'threshold event')}</span>
              </div>
              <div className="recording-actions">
                {confirming === s.id ? (
                  <>
                    <span>Delete this recording?</span>
                    <button type="button" className="is-danger" onClick={() => remove(s.id)}>Delete</button>
                    <button type="button" onClick={() => setConfirming(null)}>Keep</button>
                  </>
                ) : (
                  <>
                    <Link to={`/recordings/${s.id}`}>Open</Link>
                    <button type="button" onClick={() => downloadCsv(s)}>Download CSV</button>
                    <button type="button" onClick={() => setConfirming(s.id)}>Delete</button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
      <p className="know-more" style={{ fontSize: '12px' }}>Recordings are kept in this browser.</p>
    </PhoneShell>
  )
}
