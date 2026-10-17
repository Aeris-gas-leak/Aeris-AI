import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import FloorPlan from '../components/FloorPlan.jsx'
import RoomCharts from '../components/RoomCharts.jsx'
import EventLog from '../components/EventLog.jsx'
import SummaryTable from '../components/SummaryTable.jsx'
import { downloadCsv, durationSeconds, findSession, latestReading } from '../sensors/sessions.js'
import { ROOMS } from '../sensors/rooms.js'
import { worstRoom } from '../sensors/status.js'
import { formatCount, formatDate, formatDuration } from '../format.js'

export default function RecordingDetail() {
  const { id } = useParams()
  const [session] = useState(() => findSession(id))
  const [readings] = useState(() => (
    session ? Object.fromEntries(ROOMS.map(r => [r.id, latestReading(session, r.id)])) : {}
  ))
  const [selected, setSelected] = useState(() => worstRoom(readings))

  if (!session) {
    return (
      <div className="empty-state">
        <h1>Recording not found</h1>
        <p>It may have been deleted, or saved in a different browser. <Link to="/app/recordings">See all recordings</Link>.</p>
      </div>
    )
  }

  return (
    <>
      <header className="page-head">
        <p className="crumb"><Link to="/app/recordings">Recordings</Link></p>
        <h1>{formatDate(session.startedAt)}</h1>
      </header>

      <section className="console is-stopped" aria-label="Rooms at the end of the recording">
        <FloorPlan readings={readings} selected={selected} onSelect={setSelected} live={false} />
        <div className="console-status">
          <p className="console-state is-stopped"><i aria-hidden="true" />Final readings</p>
          <p className="console-timer">{formatDuration(durationSeconds(session))}</p>
          <dl className="console-stats">
            <div><dt>Readings</dt><dd>{formatCount(session.length * ROOMS.length)}</dd></div>
            <div><dt>Threshold events</dt><dd>{session.events.length}</dd></div>
          </dl>
          <div className="console-actions">
            <button type="button" className="console-button" onClick={() => downloadCsv(session)}>Download CSV</button>
          </div>
        </div>
      </section>

      <div className="room-section">
        <RoomCharts series={session} roomId={selected} span={durationSeconds(session)} />
        <aside className="room-aside">
          <EventLog session={session} />
        </aside>
      </div>

      <SummaryTable session={session} />
    </>
  )
}
