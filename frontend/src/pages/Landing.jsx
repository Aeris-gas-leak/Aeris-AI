import { useState } from 'react'
import { Link } from 'react-router-dom'
import '../styles/landing.css'

// This preview is intentionally local sample data, not a live sensor feed.
const rooms = [
  { id: 'A', temperature: '24.2', humidity: '48', pressure: '1012', warning: false },
  { id: 'B', temperature: '28.4', humidity: '56', pressure: '1014', warning: true },
  { id: 'C', temperature: '23.8', humidity: '51', pressure: '1011', warning: false },
  { id: 'D', temperature: '25.1', humidity: '49', pressure: '1013', warning: false },
]

function Arrow() {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M4 12h15m-6-6 6 6-6 6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
}

function Wordmark() {
  return <span className="aeris-wordmark">aeris<span className="aeris-wordmark-dot">.</span></span>
}

function FloorPreview() {
  const [selectedId, setSelectedId] = useState('B')
  const selected = rooms.find(room => room.id === selectedId)

  return (
    <section className="aeris-preview" aria-label="Interactive floor preview with sample readings">
      <div className="aeris-preview-heading">
        <span>Floor overview</span>
        <span className="aeris-sample-label">Sample readings</span>
      </div>
      <div className="aeris-plan-heading"><span>Floor 01</span><span>Select a room to explore</span></div>
      <div className="aeris-floor-plan" role="group" aria-label="Select a sample room">
        {rooms.map(room => (
          <button
            key={room.id}
            type="button"
            className={`aeris-room aeris-room-${room.id.toLowerCase()}${selectedId === room.id ? ' is-selected' : ''}${room.warning ? ' has-warning' : ''}`}
            aria-pressed={selectedId === room.id}
            aria-label={`Room ${room.id}, ${room.warning ? 'temperature warning' : 'within range'}`}
            aria-controls="aeris-room-readings"
            onClick={() => setSelectedId(room.id)}
          >
            <span className="aeris-room-name">Room {room.id}</span>
            <span className="aeris-sensor" aria-hidden="true"><span /></span>
            <span className="aeris-room-condition">{room.warning ? 'Temperature warning' : 'Within range'}</span>
          </button>
        ))}
        <div className="aeris-corridor" aria-hidden="true"><span>Corridor</span><Arrow /></div>
      </div>
      <div id="aeris-room-readings" className="aeris-readings" aria-live="polite" aria-atomic="true">
        <div className="aeris-reading-heading">
          <span>Room {selected.id}</span>
          <span className={selected.warning ? 'aeris-status warning' : 'aeris-status'}><i aria-hidden="true" />{selected.warning ? 'Check temperature' : 'Within range'}</span>
        </div>
        <dl className="aeris-measurements">
          <div><dt>Temperature</dt><dd>{selected.temperature}<span>°C</span></dd></div>
          <div><dt>Humidity</dt><dd>{selected.humidity}<span>%</span></dd></div>
          <div><dt>Pressure</dt><dd>{selected.pressure}<span>hPa</span></dd></div>
        </dl>
      </div>
      <p className="aeris-preview-note">An interactive illustration. The app uses simulated data.</p>
    </section>
  )
}

export default function Landing() {
  return (
    <div className="aeris-landing" id="top">
      <a className="aeris-skip-link" href="#main">Skip to content</a>
      <header className="aeris-header aeris-container">
        <a href="#top" aria-label="Aeris home"><Wordmark /></a>
        <nav aria-label="Main navigation">
          <a className="aeris-nav-link" href="#how-it-works">How it works</a>
          <Link className="aeris-button aeris-button-small" to="/app">Try it <Arrow /></Link>
        </nav>
      </header>

      <main id="main">
        <section className="aeris-hero aeris-container" aria-labelledby="aeris-headline">
          <div className="aeris-hero-copy">
            <h1 id="aeris-headline">A clearer view<br />of every room.</h1>
            <p className="aeris-intro">Temperature, humidity, and pressure, room by room. Aeris brings the readings and alerts together, so you can see where to look next.</p>
            <Link className="aeris-button" to="/app">Try it <Arrow /></Link>
            <p className="aeris-cta-note">Explore the prototype. No account needed.</p>
            <div className="aeris-hero-footnote"><span>Built around your environment.</span><span>From one room to the whole floor.</span></div>
          </div>
          <FloorPreview />
        </section>

        <div className="aeris-capabilities">
          <div className="aeris-container aeris-capabilities-inner">
            <p>A little context.<br /><strong>A much clearer picture.</strong></p>
            <ul aria-label="What you can explore">
              <li>Room-by-room readings</li>
              <li>Environmental trends</li>
              <li>Threshold alerts</li>
            </ul>
          </div>
        </div>

        <section className="aeris-how aeris-container" id="how-it-works" aria-labelledby="aeris-how-heading">
          <div className="aeris-how-intro">
            <p className="aeris-eyebrow">Inside Aeris</p>
            <h2 id="aeris-how-heading">Start with a room.<br />Follow the change.</h2>
            <p>Move from an overview to the details behind a reading. The current prototype gives you a place to explore the workflow with sample data.</p>
            <Link className="aeris-text-link" to="/app">Take a look inside <Arrow /></Link>
          </div>
          <ol className="aeris-steps">
            <li><span className="aeris-step-number" aria-hidden="true">01</span><div><h3>Find your room</h3><p>Start at the factory overview, then open a room to see its environmental readings.</p></div></li>
            <li><span className="aeris-step-number" aria-hidden="true">02</span><div><h3>See what’s changing</h3><p>Follow temperature, humidity, and pressure over time with charts for each room.</p></div></li>
            <li><span className="aeris-step-number" aria-hidden="true">03</span><div><h3>Put alerts in context</h3><p>Review readings that cross a threshold, with the measured value and the time it was recorded.</p></div></li>
          </ol>
        </section>

        <section className="aeris-invitation aeris-container" aria-labelledby="aeris-invitation-heading">
          <div><h2 id="aeris-invitation-heading">Get a feel for the floor.</h2><p>Open Aeris and explore the monitoring experience.</p></div>
          <Link className="aeris-button" to="/app">Try it <Arrow /></Link>
        </section>
      </main>

      <footer className="aeris-footer aeris-container">
        <a href="#top" aria-label="Aeris home"><Wordmark /></a>
        <p>Factory environmental monitoring.<span>A prototype in progress.</span></p>
        <a className="aeris-top-link" href="#top">Back to top ↑</a>
      </footer>
    </div>
  )
}
