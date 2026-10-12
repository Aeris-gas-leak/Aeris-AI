import { useState, useEffect } from 'react'
import PhoneShell from '../components/PhoneShell.jsx'
import BackHeader from '../components/BackHeader.jsx'
import AlertItem from '../components/AlertItem.jsx'
import { api } from '../api/client.js'

const THRESHOLDS = {
  temperature_C: { warning: 27.0, danger: 29.0 },
  'humidity_%':  { warning: 60.0, danger: 65.0 },
  pressure_hPa:  { warning: 1020.0, danger: 1023.0 },
  ozone_ratio:   { warning: 1.5,    danger: 2.0 },
  co2_ppm:       { warning: 1000.0, danger: 2000.0 },
}

export default function Alerts() {
  const [triggered, setTriggered] = useState([])

  useEffect(() => {
    api.chartAll().then(data => {
      const alerts = []
      const rows = data.temperature.values.map((_, i) => ({
        temperature_C: data.temperature.values[i],
        'humidity_%':  data.humidity.values[i],
        pressure_hPa:  data.pressure.values[i],
        ozone_ratio:   data.ozone ? data.ozone.values[i] : 0,
        co2_ppm:       data.co2 ? data.co2.values[i] : 0,
        timestamp:     data.labels[i],
      }))

      rows.forEach(row => {
        Object.entries(THRESHOLDS).forEach(([field, limits]) => {
          const val = row[field]
          if (val >= limits.danger)       alerts.push({ field, value: val, level: 'danger',  timestamp: row.timestamp })
          else if (val >= limits.warning) alerts.push({ field, value: val, level: 'warning', timestamp: row.timestamp })
        })
      })

      setTriggered(alerts.slice(-20).reverse())
    })
  }, [])

  return (
    <PhoneShell>
      <BackHeader to="/rooms" title="Recent Alerts" />

      {triggered.length > 0
        ? <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {triggered.map((a, i) => <AlertItem key={i} {...a} />)}
          </div>
        : <div style={{ textAlign: 'center', color: 'var(--muted)', padding: '40px 20px', fontSize: '14px' }}>
            ✅ No threshold alerts right now.
          </div>
      }

      <div style={{ fontFamily: "'Syne',sans-serif", fontSize: '13px', fontWeight: 700, color: 'var(--muted)', marginTop: '8px' }}>
        Predictive
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <div className="alert-card-v2">
          <div className="alert-icon">⏱</div>
          <div className="alert-content">
            <div className="alert-title">Potential Leak Risk in Area B</div>
            <div className="alert-desc">Based on pressure patterns, a leak may develop in the next 24–48 hours</div>
          </div>
        </div>
        <div className="alert-card-v2">
          <div className="alert-icon yellow">🔧</div>
          <div className="alert-content">
            <div className="alert-title">Sensor Maintenance Required</div>
            <div className="alert-desc">4 sensors in Room A due for calibration within 7 days</div>
          </div>
        </div>
      </div>
    </PhoneShell>
  )
}