import { timeAt } from '../sensors/sessions.js'
import { eventText, roomLabel } from '../sensors/status.js'
import { formatClock } from '../format.js'

const EVENTS_SHOWN = 40

export default function EventLog({ session }) {
  const events = session ? session.events.slice(-EVENTS_SHOWN).reverse() : []
  const hidden = session ? session.events.length - events.length : 0
  return (
    <section className="events" aria-labelledby="events-heading">
      <h2 id="events-heading" className="panel-heading">
        Threshold events {session && <span>{session.events.length || 'None'}</span>}
      </h2>
      {!session ? (
        <p className="panel-empty">Readings that cross a warning or danger level are logged here while you record.</p>
      ) : events.length ? (
        <ol className="event-log">
          {events.map(e => (
            <li key={`${e.t}-${e.room}-${e.metric}`} className={`level-${e.to}`}>
              <time>{formatClock(timeAt(session, e.t))}</time>
              <span><strong>{roomLabel(e.room)}</strong> {eventText(e)}</span>
            </li>
          ))}
          {hidden > 0 && <li className="event-more">{hidden} earlier events are in the CSV.</li>}
        </ol>
      ) : (
        <p className="panel-empty">No reading has crossed a warning or danger level.</p>
      )}
    </section>
  )
}
