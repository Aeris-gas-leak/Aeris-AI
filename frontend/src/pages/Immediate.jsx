import { Link } from 'react-router-dom'
import PhoneShell from '../components/PhoneShell.jsx'
import BackHeader from '../components/BackHeader.jsx'
import ChartBlock from '../components/ChartBlock.jsx'
import { useRecorder } from '../sensors/recorder.js'
import { METRICS, ROOMS, useRoomNames } from '../sensors/rooms.js'
import { METRIC_STYLE, ROOM_COLORS } from '../sensors/display.js'

export default function Immediate() {
  const { session, preview } = useRecorder()
  const roomNames = useRoomNames()
  if (!preview) return null
  const series = session ?? preview

  return (
    <PhoneShell>
      <BackHeader to="/rooms" title="All Sensors Overview" />

      {METRICS.map(m => (
        <ChartBlock
          key={m.key}
          title={`${m.label} — All Rooms`}
          emoji={METRIC_STYLE[m.key].emoji}
          metric={m}
          session={series}
          series={ROOMS.map(r => ({ label: roomNames[r.id] ?? r.id, color: ROOM_COLORS[r.id], values: series.rooms[r.id][m.key] }))}
        />
      ))}

      <div style={{ fontFamily: "'Syne',sans-serif", fontSize: '14px', fontWeight: 700, color: 'var(--text)' }}>
        View by Room
      </div>
      <div className="room-link-row">
        {ROOMS.map(r => (
          <Link key={r.id} className="room-link-btn" to={`/room/${encodeURIComponent(r.id)}`}>
            {roomNames[r.id] ?? r.id} <span>→</span>
          </Link>
        ))}
      </div>
    </PhoneShell>
  )
}
