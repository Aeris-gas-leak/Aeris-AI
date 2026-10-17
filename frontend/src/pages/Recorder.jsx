import { Link } from 'react-router-dom'
import SessionView from '../components/SessionView.jsx'
import { MAX_SECONDS, SPEEDS, setSpeed, start, stop, useRecorder } from '../sensors/recorder.js'
import { downloadCsv, durationSeconds } from '../sensors/sessions.js'
import { ROOMS } from '../sensors/rooms.js'
import { formatCount, formatDuration, formatSpan } from '../format.js'

const SPEED_LABELS = { 1: 'Real time', 10: '10×', 60: '60×' }

function RecordButton({ recording }) {
  return recording ? (
    <button type="button" className="record-button is-recording" onClick={() => stop()}>
      <i className="icon-stop" aria-hidden="true" /> Stop recording
    </button>
  ) : (
    <button type="button" className="record-button" onClick={start}>
      <i className="icon-record" aria-hidden="true" /> Record
    </button>
  )
}

function SavedNotice({ session, saved, stoppedAtLimit }) {
  const length = formatSpan(durationSeconds(session))
  return (
    <div className="notice" role="status">
      <p>
        {stoppedAtLimit && `Recordings stop at ${formatSpan(MAX_SECONDS)}. `}
        {saved
          ? <>Saved a {length} recording to <Link to={`/app/recordings/${session.id}`}>Recordings</Link>.</>
          : <>This {length} recording is too large to keep in this browser. Download the CSV to keep it.</>}
      </p>
      <button type="button" className="text-button" onClick={() => downloadCsv(session)}>Download CSV</button>
    </div>
  )
}

export default function Recorder() {
  const { status, session, speed, saved, stoppedAtLimit } = useRecorder()
  const recording = status === 'recording'
  const elapsed = session ? durationSeconds(session) : 0
  const span = recording ? Math.max(elapsed, 60 * speed) : elapsed

  return (
    <>
      <section className="recorder-bar" aria-labelledby="recorder-heading">
        <div className="recorder-intro">
          <h1 id="recorder-heading">Recorder</h1>
          <p>
            Readings come from a simulated sensor node in each of the four rooms, one reading a second.
            The Raspberry Pi will feed this same view once it is connected.
          </p>
        </div>

        <div className="recorder-controls">
          <fieldset className="speed">
            <legend>Speed</legend>
            {SPEEDS.map(s => (
              <label key={s} className={s === speed ? 'is-checked' : undefined}>
                <input type="radio" name="speed" value={s} checked={s === speed} onChange={() => setSpeed(s)} />
                {SPEED_LABELS[s]}
              </label>
            ))}
          </fieldset>

          <RecordButton recording={recording} />

          <dl className="recorder-clock" aria-live="off">
            <div>
              <dt>Length</dt>
              <dd>{recording && <i className="rec-dot" aria-hidden="true" />}{formatDuration(elapsed)}</dd>
            </div>
            <div>
              <dt>Readings</dt>
              <dd>{formatCount(session ? session.length * ROOMS.length : 0)}</dd>
            </div>
          </dl>
        </div>
      </section>

      {status === 'stopped' && <SavedNotice session={session} saved={saved} stoppedAtLimit={stoppedAtLimit} />}

      {session ? (
        <SessionView key={session.id} session={session} span={span} live={recording} />
      ) : (
        <section className="empty-state" aria-labelledby="empty-heading">
          <h2 id="empty-heading">Nothing recorded yet</h2>
          <p>
            Press Record to start taking readings. Charts for temperature, humidity and pressure
            build as the data arrives, and any reading that crosses a threshold is logged.
          </p>
          <p>
            Real time runs at the sensor's pace. 10× and 60× fast-forward the floor, so an
            hour of readings takes a minute.
          </p>
        </section>
      )}
    </>
  )
}
