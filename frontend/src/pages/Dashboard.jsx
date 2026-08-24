import { Link, useNavigate } from 'react-router-dom'
import PhoneShell from '../components/PhoneShell.jsx'
import usePiTrigger from '../components/usePiTrigger.js'

export default function Dashboard() {
  const navigate = useNavigate()
  const { trigger, loading, status, statusColor } = usePiTrigger(() => {
    setTimeout(() => navigate(0), 1200)
  })

  return (
    <PhoneShell>
      <div className="top-row">
        <div className="brand-row">
          <div className="brand-avatar">M</div>
          <span className="brand-name">AERIS.AI</span>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button
            onClick={trigger}
            disabled={loading}
            style={{
              height: '40px', padding: '0 14px', borderRadius: '12px',
              background: 'var(--bg-card)', border: '1px solid var(--border)',
              color: 'var(--text)', fontSize: '13px', fontWeight: 600,
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '7px',
              fontFamily: "'DM Sans',sans-serif", opacity: loading ? 0.6 : 1,
            }}
          >
            <span style={{ fontSize: '16px', display: 'inline-block', animation: loading ? 'spin 1s linear infinite' : '' }}>⟳</span>
            <span>{loading ? 'Waiting' : 'Generate'}</span>
          </button>
          <div className="bell-btn">🔔</div>
        </div>
      </div>

      {status && (
        <div style={{
          fontSize: '12px', color: statusColor, background: 'var(--bg-card)',
          border: '1px solid var(--border)', borderRadius: '10px',
          padding: '10px 14px', textAlign: 'center',
        }}>
          {status}
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span className="section-label">Statistics</span>
        <span className="section-label">Today</span>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <span className="stat-label">Active Sensors</span>
          <div className="stat-row">
            <span className="stat-value">128</span>
            <span className="stat-trend up">+3
              <svg className="sparkline" width="44" height="22" viewBox="0 0 44 22" fill="none">
                <polyline points="0,18 8,14 16,16 24,10 32,12 44,6" stroke="#3ddc84" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </span>
          </div>
        </div>
        <div className="stat-card">
          <span className="stat-label">System Health</span>
          <div className="stat-row">
            <span className="stat-value">98%</span>
            <span className="stat-trend down">-2%
              <svg className="sparkline" width="44" height="22" viewBox="0 0 44 22" fill="none">
                <polyline points="0,6 8,8 16,7 24,10 32,12 44,17" stroke="#ff5c2e" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </span>
          </div>
        </div>
        <div className="stat-card">
          <span className="stat-label">Active Alerts</span>
          <div className="stat-row">
            <span className="stat-value">5</span>
            <span className="stat-trend down">+2
              <svg className="sparkline" width="44" height="22" viewBox="0 0 44 22" fill="none">
                <polyline points="0,16 8,12 16,14 24,9 32,13 44,7" stroke="#ff5c2e" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </span>
          </div>
        </div>
        <div className="stat-card">
          <span className="stat-label">Monthly Leaks</span>
          <div className="stat-row">
            <span className="stat-value">12</span>
            <span className="stat-trend up">-3
              <svg className="sparkline" width="44" height="22" viewBox="0 0 44 22" fill="none">
                <polyline points="0,6 8,10 16,8 24,13 32,11 44,16" stroke="#3ddc84" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </span>
          </div>
        </div>
      </div>

      <div className="section-header">
        <span className="section-title">Factory Map View</span>
        <Link className="view-all" to="/immediate">View all</Link>
      </div>

      <div className="map-panel">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span className="floor-label">Floor #01</span>
          <div className="map-legend">
            <div className="legend-item"><span className="dot green"></span>Normal</div>
            <div className="legend-item"><span className="dot yellow"></span>Warning</div>
            <div className="legend-item"><span className="dot red"></span>Active Leak</div>
          </div>
        </div>
        <div className="rooms-grid">
          {[
            { name: 'Processing Area C', dots: ['yellow', 'green'] },
            { name: 'Storage Area B', dots: ['green', 'yellow'] },
            { name: 'Floor #01', dots: ['green', 'green', 'green'] },
          ].map(room => (
            <Link
              to={`/room/${encodeURIComponent(room.name)}`}
              className="room-mini"
              key={room.name}
              style={{ textDecoration: 'none', color: 'inherit', transition: 'all 0.2s ease', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                <span style={{ fontWeight: 600, color: 'var(--text)', fontSize: '13px' }}>{room.name}</span>
                <span style={{ fontSize: '14px', color: 'var(--muted)' }}>→</span>
              </div>
              <div className="room-dots-field" style={{ marginTop: 'auto' }}>
                {room.dots.map((c, i) => <span key={i} className={`dot ${c}`}></span>)}
              </div>
            </Link>
          ))}
        </div>
      </div>

      <div className="floor-row">Floor #02</div>
      <div className="floor-row">Floor #03</div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </PhoneShell>
  )
}
