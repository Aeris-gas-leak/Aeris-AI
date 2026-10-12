import { useParams } from 'react-router-dom'
import { useState, useEffect } from 'react'
import PhoneShell from '../components/PhoneShell.jsx'
import BackHeader from '../components/BackHeader.jsx'
import ChartBlock from '../components/ChartBlock.jsx'
import { api } from '../api/client.js'

export default function RoomDetail() {
  const { roomName } = useParams()
  const [data, setData] = useState(null)

  useEffect(() => {
    api.chartRoom(roomName).then(setData)
  }, [roomName])

  return (
    <PhoneShell>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <BackHeader to="/rooms" />
          <div className="sensor-subtitle">Live Sensor Data</div>
          <div style={{ fontFamily: "'Syne',sans-serif", fontSize: '22px', fontWeight: 700, color: '#fff', marginTop: '2px' }}>
            {roomName}
          </div>
        </div>
        <span className="active-pill">Live</span>
      </div>

      {data && (
        <>
          <div className="env-grid">
            <div className="env-row">
              <div className="env-card">Temperature <strong>{data.temperature.values.at(-1)}°C</strong></div>
              <div className="env-card">Humidity <strong>{data.humidity.values.at(-1)}%</strong></div>
            </div>
            <div className="env-card">Pressure <strong>{data.pressure.values.at(-1)} hPa</strong></div>
          </div>

          <ChartBlock
            title="Temperature" emoji="🌡"
            values={data.temperature.values} labels={data.labels}
            warningThresh={data.temperature.warning_thresh} dangerThresh={data.temperature.danger_thresh}
            unit="°C" color="#60a5fa"
          />
          <ChartBlock
            title="Humidity" emoji="💧"
            values={data.humidity.values} labels={data.labels}
            warningThresh={data.humidity.warning_thresh} dangerThresh={data.humidity.danger_thresh}
            unit="%" color="#818cf8"
          />
          <ChartBlock
            title="Pressure" emoji="🔵"
            values={data.pressure.values} labels={data.labels}
            warningThresh={data.pressure.warning_thresh} dangerThresh={data.pressure.danger_thresh}
            unit=" hPa" color="#34d399"
          />
          {data.ozone && (
            <ChartBlock
              title="Ozone (MQ-131)" emoji="☁️"
              values={data.ozone.values} labels={data.labels}
              warningThresh={data.ozone.warning_thresh} dangerThresh={data.ozone.danger_thresh}
              unit="" color="#f472b6"
            />
          )}
          {data.co2 && (
            <ChartBlock
              title="CO2-equivalent (MQ-135)" emoji="🌫"
              values={data.co2.values} labels={data.labels}
              warningThresh={data.co2.warning_thresh} dangerThresh={data.co2.danger_thresh}
              unit=" ppm" color="#fbbf24"
            />
          )}
        </>
      )}
    </PhoneShell>
  )
}