import { Link, useNavigate } from 'react-router-dom'
import PhoneShell from '../components/PhoneShell.jsx'
import { start, useRecorder } from '../sensors/recorder.js'
import { durationSeconds } from '../sensors/sessions.js'
import { formatDuration } from '../format.js'

export default function Home() {
  const navigate = useNavigate()
  const { status, session } = useRecorder()
  const recording = status === 'recording'

  function record() {
    start()
    navigate('/rooms')
  }

  return (
    <PhoneShell>
      <div className="home-hero">
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%' }}>
          <div className="hero-ring"></div>
          <div className="hero-ring"></div>
          <div className="hero-ring"></div>
          <div className="hero-orb"></div>
        </div>
      </div>

      <div className="powered-badge">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
        </svg>
        Powered by AI
      </div>

      <h1 className="home-title">AI-Driven Methane Detection<br />for a Safer Tomorrow.</h1>

      <Link className="home-cta" to="/rooms">
        GET STARTED FOR FREE
        <span className="cta-arrow">→</span>
      </Link>

      {recording ? (
        <Link className="home-generate-btn" to="/rooms">
          Recording {formatDuration(durationSeconds(session))}
          <span className="is-recording"><i className="rec-dot"></i></span>
        </Link>
      ) : (
        <button className="home-generate-btn" onClick={record}>
          Start recording
          <span><i className="rec-dot"></i></span>
        </button>
      )}

      <div className="home-generate-status" style={{ display: 'block' }}>
        {recording
          ? 'Readings from every sensor are being recorded.'
          : 'Records every sensor in every room, once a second.'}
      </div>

      <Link className="know-more" to="/about">I want to know more</Link>
    </PhoneShell>
  )
}
