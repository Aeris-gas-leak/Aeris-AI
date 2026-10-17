import MetricChart from './MetricChart.jsx'
import { METRICS, ROOM_BY_ID, formatValue, levelFor } from '../sensors/rooms.js'
import { latestReading, roomStats } from '../sensors/sessions.js'
import { roomLabel, roomStatus } from '../sensors/status.js'

// Temperature, humidity and pressure charts for one room, from any series
// shaped like a session (the live window or a recording).
export default function RoomCharts({ series, roomId, span }) {
  const room = ROOM_BY_ID[roomId]
  const reading = latestReading(series, roomId)
  const status = roomStatus(reading)
  const stats = roomStats(series, roomId)

  return (
    <section className="room-charts" aria-labelledby="room-charts-heading">
      <header className="room-header">
        <h2 id="room-charts-heading">{roomLabel(room.id)} <span className="room-kind">{room.name}</span></h2>
        <span className={`level-text level-${status.level}`}>{status.text}</span>
      </header>

      {METRICS.map(m => {
        const s = stats[m.key]
        return (
          <section key={m.key} className="metric" aria-label={m.label}>
            <div className="metric-head">
              <h3>{m.label}</h3>
              <p className="metric-value">
                <span className={`level-${levelFor(m, reading?.[m.key])}`}>{formatValue(m, reading?.[m.key])}</span>
                <small>{m.unit}</small>
              </p>
              {s && <p className="metric-range">Range {formatValue(m, s.min)}–{formatValue(m, s.max)}&nbsp;{m.unit}</p>}
            </div>
            <MetricChart session={series} roomId={roomId} roomLabel={roomLabel(room.id)} metric={m} span={span} />
          </section>
        )
      })}
    </section>
  )
}
