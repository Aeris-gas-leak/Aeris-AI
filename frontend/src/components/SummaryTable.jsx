import { METRICS, ROOMS, formatValue } from '../sensors/rooms.js'
import { roomStats } from '../sensors/sessions.js'
import { roomLabel } from '../sensors/status.js'
import { formatSpan } from '../format.js'

export default function SummaryTable({ session }) {
  return (
    <section className="summary" aria-labelledby="summary-heading">
      <h2 id="summary-heading" className="panel-heading">
        Every room, this recording <span>Low to high, then average</span>
      </h2>
      <div className="table-scroll">
        <table className="summary-table">
          <thead>
            <tr>
              <th scope="col">Room</th>
              {METRICS.map(m => <th key={m.key} scope="col">{m.label} ({m.unit})</th>)}
            </tr>
          </thead>
          <tbody>
            {ROOMS.map(r => {
              const stats = roomStats(session, r.id)
              return (
                <tr key={r.id}>
                  <th scope="row">{roomLabel(r.id)} <span className="room-kind">{r.name}</span></th>
                  {METRICS.map(m => {
                    const s = stats[m.key]
                    if (!s) return <td key={m.key}>–</td>
                    return (
                      <td key={m.key}>
                        <span className="range">{formatValue(m, s.min)}–{formatValue(m, s.max)}</span>
                        <span className="sub">average {formatValue(m, s.mean)}</span>
                        {s.overWarningSeconds > 0 && (
                          <span className="sub level-warning">over warning for {formatSpan(s.overWarningSeconds)}</span>
                        )}
                      </td>
                    )
                  })}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </section>
  )
}
