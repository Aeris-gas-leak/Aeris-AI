import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import PhoneShell from '../components/PhoneShell.jsx'
import BackHeader from '../components/BackHeader.jsx'
import ChartBlock from '../components/ChartBlock.jsx'
import { api } from '../api/client.js'

const ROOMS = ['Processing Area C', 'Storage Area B', 'Floor #01']

export default function Immediate() {
  const [data, setData] = useState(null)

  useEffect(() => {
    api.chartAll().then(setData)
  }, [])

  return (
    <PhoneShell>
      <BackHeader to="/rooms" title="All Sensors Overview" />

      {data && (
        <>
          <ChartBlock
            title="Temperature — All Rooms" emoji="🌡"
            values={data.temperature.values} labels={data.labels}
            warningThresh={data.temperature.warning_thresh} dangerThresh={data.temperature.danger_thresh}
            unit="°C" color="#60a5fa"
          />
          <ChartBlock
            title="Humidity — All Rooms" emoji="💧"
            values={data.humidity.values} labels={data.labels}
            warningThresh={data.humidity.warning_thresh} dangerThresh={data.humidity.danger_thresh}
            unit="%" color="#818cf8"
          />
          <ChartBlock
            title="Pressure — All Rooms" emoji="🔵"
            values={data.pressure.values} labels={data.labels}
            warningThresh={data.pressure.warning_thresh} dangerThresh={data.pressure.danger_thresh}
            unit=" hPa" color="#34d399"
          />
          {data.ozone && (
            <ChartBlock
              title="Ozone (MQ-131) — All Rooms" emoji="☁️"
              values={data.ozone.values} labels={data.labels}
              warningThresh={data.ozone.warning_thresh} dangerThresh={data.ozone.danger_thresh}
              unit="" color="#f472b6"
            />
          )}
          {data.co2 && (
            <ChartBlock
              title="CO2-equivalent (MQ-135) — All Rooms" emoji="🌫"
              values={data.co2.values} labels={data.labels}
              warningThresh={data.co2.warning_thresh} dangerThresh={data.co2.danger_thresh}
              unit=" ppm" color="#fbbf24"
            />
          )}
        </>
      )}

      <div style={{ fontFamily: "'Syne',sans-serif", fontSize: '14px', fontWeight: 700, color: 'var(--text)' }}>
        View by Room
      </div>
      <div className="room-link-row">
        {ROOMS.map(room => (
          <Link key={room} className="room-link-btn" to={`/room/${encodeURIComponent(room)}`}>
            {room} <span>→</span>
          </Link>
        ))}
      </div>
    </PhoneShell>
  )
}