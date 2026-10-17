import { useState } from 'react'
import { Link } from 'react-router-dom'
import FloorPlan from '../components/FloorPlan.jsx'
import RoomCharts from '../components/RoomCharts.jsx'
import EventLog from '../components/EventLog.jsx'
import SummaryTable from '../components/SummaryTable.jsx'
import {
  MAX_SECONDS, SPEEDS, setSpeed, showLive, start, stop, useRecorder,
} from '../sensors/recorder.js'
import { downloadCsv, durationSeconds, latestReading, timeAt } from '../sensors/sessions.js'
import { ROOMS } from '../sensors/rooms.js'
import { eventText, roomLabel } from '../sensors/status.js'
import { formatClock, formatCount, formatDuration, formatSpan } from '../format.js'

// The live chart window grows in steps, so new readings always have room
// to land and the line fills between half and all of the chart.
const WINDOWS = [60, 120, 300, 600, 900, 1800, 3600, 7200]

function chartWindow(seconds) {
  return WINDOWS.find(w => w >= seconds) ?? seconds
}

const SPEED_LABELS = { 1: '1×', 10: '10×', 60: '60×' }
const STATE_LABELS = { idle: 'Live', recording: 'Recording', stopped: 'Recording saved' }

function finalReadings(session) {
  return Object.fromEntries(ROOMS.map(r => [r.id, latestReading(session, r.id)]))
}

function LatestEvent({ session, latest }) {
  if (!session) {
    const reporting = ROOMS.filter(r => latest[r.id]).length
    return (
      <div className="console-latest">
        <p className="console-latest-label">Sensors</p>
        <p>{reporting === ROOMS.length ? `All ${reporting} reporting` : `${reporting} of ${ROOMS.length} reporting`}</p>
      </div>
    )
  }
  const e = session.events.at(-1)
  return (
    <div className="console-latest">
      <p className="console-latest-label">Latest event</p>
      {e ? (
        <p className={`is-${e.to}`}>
          <time>{formatClock(timeAt(session, e.t))}</time> <strong>{roomLabel(e.room)}</strong> {eventText(e)}
        </p>
      ) : (
        <p>Nothing has crossed a threshold yet.</p>
      )}
    </div>
  )
}

function StatusPanel({ status, session, latest, speed, saved, stoppedAtLimit }) {
  const recording = status === 'recording'
  const elapsed = session ? durationSeconds(session) : 0

  return (
    <div className="console-status">
      <p className={`console-state is-${status}`}>
        <i aria-hidden="true" />{status === 'stopped' && !saved ? 'Recording not saved' : STATE_LABELS[status]}
      </p>
      <p className="console-timer" aria-label={`Recording length ${formatDuration(elapsed)}`}>
        {formatDuration(elapsed)}
      </p>
      <dl className="console-stats">
        <div><dt>Readings</dt><dd>{formatCount(session ? session.length * ROOMS.length : 0)}</dd></div>
        <div><dt>Threshold events</dt><dd>{session ? session.events.length : 0}</dd></div>
      </dl>

      <LatestEvent session={session} latest={latest} />

      <div className="console-actions">
        {recording ? (
          <button type="button" className="console-button is-stop" onClick={() => stop()}>
            <i aria-hidden="true" /> Stop recording
          </button>
        ) : (
          <button type="button" className="console-button" onClick={start}>
            <i aria-hidden="true" /> {status === 'stopped' ? 'Start a new recording' : 'Start recording'}
          </button>
        )}

        {status === 'stopped' ? (
          <p className="console-note" role="status">
            {stoppedAtLimit && `Recordings stop at ${formatSpan(MAX_SECONDS)}. `}
            {saved
              ? <>Saved to <Link to={`/app/recordings/${session.id}`}>Recordings</Link>. </>
              : 'Too large to keep in this browser. '}
            <button type="button" className="console-link" onClick={() => downloadCsv(session)}>Download CSV</button>
            {' or '}
            <button type="button" className="console-link" onClick={showLive}>back to live</button>
          </p>
        ) : (
          <fieldset className="speed">
            <legend>Speed</legend>
            {SPEEDS.map(s => (
              <label key={s} className={s === speed ? 'is-checked' : undefined}>
                <input type="radio" name="speed" value={s} checked={s === speed} onChange={() => setSpeed(s)} />
                {SPEED_LABELS[s]}
              </label>
            ))}
          </fieldset>
        )}
      </div>
    </div>
  )
}

export default function Recorder() {
  const recorder = useRecorder()
  const { status, session, latest, preview } = recorder
  const [selected, setSelected] = useState('B')

  if (!preview) return null

  const recording = status === 'recording'
  const showing = session ?? preview
  const elapsed = session ? durationSeconds(session) : 0
  const span = recording ? chartWindow(elapsed) : session ? elapsed : chartWindow(preview.length)
  const readings = status === 'stopped' ? finalReadings(session) : latest

  return (
    <>
      <header className="page-head">
        <h1>Recorder</h1>
        <p>Every room, updated each second. Start recording to keep the readings, chart them and log anything that crosses a threshold.</p>
      </header>

      <section className={`console is-${status}`} aria-label="Rooms and recording">
        <FloorPlan readings={readings} selected={selected} onSelect={setSelected} live={status !== 'stopped'} />
        <StatusPanel {...recorder} />
      </section>

      <div className="room-section">
        <RoomCharts series={showing} roomId={selected} span={span} />
        <aside className="room-aside">
          <EventLog session={session} />
        </aside>
      </div>

      {session && <SummaryTable session={session} />}
    </>
  )
}
