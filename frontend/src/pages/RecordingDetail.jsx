import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import SessionView from '../components/SessionView.jsx'
import { downloadCsv, durationSeconds, findSession } from '../sensors/sessions.js'
import { ROOMS } from '../sensors/rooms.js'
import { formatCount, formatDate, formatDuration } from '../format.js'

export default function RecordingDetail() {
  const { id } = useParams()
  const [session] = useState(() => findSession(id))

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
      <section className="recorder-bar" aria-labelledby="recording-heading">
        <div className="recorder-intro">
          <p className="crumb"><Link to="/app/recordings">Recordings</Link></p>
          <h1 id="recording-heading">{formatDate(session.startedAt)}</h1>
        </div>
        <div className="recorder-controls">
          <dl className="recorder-clock">
            <div><dt>Length</dt><dd>{formatDuration(durationSeconds(session))}</dd></div>
            <div><dt>Readings</dt><dd>{formatCount(session.length * ROOMS.length)}</dd></div>
          </dl>
          <button type="button" className="secondary-button" onClick={() => downloadCsv(session)}>Download CSV</button>
        </div>
      </section>
      <SessionView session={session} span={durationSeconds(session)} live={false} />
    </>
  )
}
