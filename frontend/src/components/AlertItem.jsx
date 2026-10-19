import { withUnit } from '../sensors/display.js'

export default function AlertItem({ room, metric, level, value, time, note }) {
  return (
    <div className="alert-item">
      <div className="alert-row-top">
        <div className="alert-area">
          <span className={`dot ${level === 'danger' ? 'red' : level === 'warning' ? 'yellow' : 'green'}`}></span>
          {metric.label} {level.toUpperCase()}
        </div>
        <span className="alert-time">{time}</span>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2px' }}>
        <span className="alert-sensor">{room}{note && ` · ${note}`}</span>
        <span className="alert-reading">Value: {withUnit(metric, value)}</span>
      </div>
    </div>
  )
}
