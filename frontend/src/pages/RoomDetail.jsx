import { useState } from 'react'
import { useParams } from 'react-router-dom'
import PhoneShell from '../components/PhoneShell.jsx'
import BackHeader from '../components/BackHeader.jsx'
import ChartBlock from '../components/ChartBlock.jsx'
import { useRecorder } from '../sensors/recorder.js'
import { METRICS, ROOM_BY_ID, useRoomNames, setRoomName } from '../sensors/rooms.js'
import { METRIC_STYLE, withUnit } from '../sensors/display.js'

const PILL = { idle: 'Live', recording: 'Recording', stopped: 'Saved' }

/** Inline rename form shown in the room header */
function RenameForm({ roomId, currentName, onDone }) {
  const [value, setValue] = useState(currentName)
  const submit = (e) => {
    e.preventDefault()
    setRoomName(roomId, value)
    onDone()
  }
  return (
    <form className="room-rename-form" onSubmit={submit}>
      <input
        className="rename-input"
        autoFocus
        value={value}
        onChange={e => setValue(e.target.value)}
        placeholder={roomId}
        maxLength={40}
        aria-label="Room name"
      />
      <div className="rename-form-actions">
        <button type="button" className="rename-cancel-btn" onClick={onDone}>Cancel</button>
        <button type="submit" className="rename-save-btn">Save</button>
      </div>
    </form>
  )
}

export default function RoomDetail() {
  const { roomName } = useParams()
  const { status, session, latest, preview } = useRecorder()
  const room = ROOM_BY_ID[roomName]
  const roomNames = useRoomNames()
  const [editing, setEditing] = useState(false)

  if (!preview) return null

  const series = session ?? preview
  const reading = latest[roomName]
  const [temperature, humidity, pressure, ozone, co2] = METRICS
  const displayName = roomNames[roomName] ?? roomName

  return (
    <PhoneShell>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <BackHeader to="/rooms" />
          <div className="sensor-subtitle">{status === 'idle' ? 'Live Sensor Data' : 'Recorded Sensor Data'}</div>
          {editing ? (
            <RenameForm
              roomId={roomName}
              currentName={displayName}
              onDone={() => setEditing(false)}
            />
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px' }}>
              <div style={{ fontFamily: "'Syne',sans-serif", fontSize: '22px', fontWeight: 700, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {displayName}
              </div>
              <button
                type="button"
                className="room-rename-btn"
                title="Rename room"
                onClick={() => setEditing(true)}
                aria-label="Rename room"
              >✎</button>
            </div>
          )}
        </div>
        <span className={`active-pill is-${status}`}>{PILL[status]}</span>
      </div>

      {!room ? (
        <div className="floor-row">There is no sensor in this room.</div>
      ) : (
        <>
          <div className="env-grid">
            <div className="env-row">
              <div className="env-card">Temperature <strong>{withUnit(temperature, reading?.temperature)}</strong></div>
              <div className="env-card">Humidity <strong>{withUnit(humidity, reading?.humidity)}</strong></div>
            </div>
            <div className="env-card">Pressure <strong>{withUnit(pressure, reading?.pressure)}</strong></div>
            <div className="env-row">
              <div className="env-card">Ozone <strong>{withUnit(ozone, reading?.ozone)}</strong></div>
              <div className="env-card">CO2 <strong>{withUnit(co2, reading?.co2)}</strong></div>
            </div>
          </div>

          {METRICS.map(m => (
            <ChartBlock
              key={m.key}
              title={m.label}
              emoji={METRIC_STYLE[m.key].emoji}
              metric={m}
              session={series}
              series={[{ label: displayName, color: METRIC_STYLE[m.key].color, values: series.rooms[roomName][m.key] }]}
            />
          ))}
        </>
      )}
    </PhoneShell>
  )
}
