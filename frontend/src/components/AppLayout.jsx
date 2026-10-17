import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import { useRecorder } from '../sensors/recorder.js'
import { durationSeconds } from '../sensors/sessions.js'
import { formatDuration } from '../format.js'

export default function AppLayout() {
  const { status, session } = useRecorder()
  const { pathname } = useLocation()
  const showRecording = status === 'recording' && pathname !== '/app'

  return (
    <div className="app">
      <a className="skip-link" href="#app-main">Skip to content</a>
      <header className="app-header">
        <Link to="/" className="app-wordmark" aria-label="Aeris homepage">aeris<span>.</span></Link>
        <nav aria-label="App">
          <NavLink to="/app" end>Recorder</NavLink>
          <NavLink to="/app/recordings">Recordings</NavLink>
        </nav>
        {showRecording && (
          <Link to="/app" className="header-recording">
            <i aria-hidden="true" /> Recording {formatDuration(durationSeconds(session))}
          </Link>
        )}
      </header>
      <main id="app-main" className="app-main">
        <Outlet />
      </main>
    </div>
  )
}
