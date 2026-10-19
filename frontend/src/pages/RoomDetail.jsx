import { useParams } from 'react-router-dom'
import PhoneShell from '../components/PhoneShell.jsx'
import BackHeader from '../components/BackHeader.jsx'
import ChartBlock from '../components/ChartBlock.jsx'
import { useRecorder } from '../sensors/recorder.js'
import { METRICS, ROOM_BY_ID } from '../sensors/rooms.js'
import { METRIC_STYLE, withUnit } from '../sensors/display.js'

const PILL = { idle: 'Live', recording: 'Recording', stopped: 'Saved' }

export default function RoomDetail() {
  const { roomName } = useParams()
  const { status, session, latest, preview } = useRecorder()
  const room = ROOM_BY_ID[roomName]

  if (!preview) return null

  const series = session ?? preview
  const reading = latest[roomName]
  const [temperature, humidity, pressure, ozone, co2] = METRICS

  return (
    <PhoneShell>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <BackHeader to="/rooms" />
          <div className="sensor-subtitle">{status === 'idle' ? 'Live Sensor Data' : 'Recorded Sensor Data'}</div>
          <div style={{ fontFamily: "'Syne',sans-serif", fontSize: '22px', fontWeight: 700, color: '#fff', marginTop: '2px' }}>
            {roomName}
          </div>
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
              series={[{ label: roomName, color: METRIC_STYLE[m.key].color, values: series.rooms[roomName][m.key] }]}
            />
          ))}
        </>
      )}
    </PhoneShell>
  )
}
