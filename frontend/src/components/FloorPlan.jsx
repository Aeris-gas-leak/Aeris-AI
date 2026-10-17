import { METRIC_BY_KEY, ROOMS, formatValue } from '../sensors/rooms.js'
import { roomLabel, roomStatus } from '../sensors/status.js'

const { temperature, humidity, pressure } = METRIC_BY_KEY

function RoomTile({ room, reading, selected, live, onSelect }) {
  const status = roomStatus(reading)
  return (
    <button
      type="button"
      className={`plan-room plan-room-${room.id.toLowerCase()} is-${status.level}${selected ? ' is-selected' : ''}`}
      aria-pressed={selected}
      onClick={() => onSelect(room.id)}
    >
      <span className="plan-room-top">
        <span className="plan-room-name">{roomLabel(room.id)} <span>{room.name}</span></span>
        <span className={`plan-sensor${live ? ' is-live' : ''}`} aria-hidden="true" />
      </span>
      <span className="plan-temp">
        {formatValue(temperature, reading?.temperature)}<small>°C</small>
      </span>
      <span className="plan-readings">
        <span>{formatValue(humidity, reading?.humidity)}<small>% RH</small></span>
        <span>{formatValue(pressure, reading?.pressure)}<small>hPa</small></span>
      </span>
      <span className="plan-status">{status.text}</span>
    </button>
  )
}

export default function FloorPlan({ readings, selected, onSelect, live }) {
  return (
    <div className="plan">
      <p className="plan-caption"><span>Floor 01</span><span>Select a room to see its charts</span></p>
      <div className="plan-grid" role="group" aria-label="Rooms on floor 01">
        {ROOMS.map(r => (
          <RoomTile
            key={r.id}
            room={r}
            reading={readings[r.id]}
            selected={r.id === selected}
            live={live}
            onSelect={onSelect}
          />
        ))}
        <div className="plan-corridor" aria-hidden="true">Corridor</div>
      </div>
    </div>
  )
}
