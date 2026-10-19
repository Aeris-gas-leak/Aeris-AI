import { Link } from 'react-router-dom'
import { stop, useRecorder } from '../sensors/recorder.js'
import { durationSeconds } from '../sensors/sessions.js'
import { formatDuration } from '../format.js'

function RecordingBar() {
  const { status, session } = useRecorder()
  if (status !== 'recording') return null
  return (
    <div className="rec-bar" role="status">
      <Link to="/rooms" className="rec-bar-time">
        <span className="rec-dot"></span>Recording {formatDuration(durationSeconds(session))}
      </Link>
      <button type="button" className="rec-bar-stop" onClick={() => stop()}>Stop</button>
    </div>
  )
}

export default function PhoneShell({ children, recordingBar = true }) {
  return (
    <div className="phone-shell">
      <div className="app-frame">
        <div className="app-screen">
          {recordingBar && <RecordingBar />}
          {children}
        </div>
      </div>
    </div>
  )
}
