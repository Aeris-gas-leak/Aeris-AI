import PhoneShell from '../components/PhoneShell.jsx'
import BackHeader from '../components/BackHeader.jsx'

export default function About() {
  return (
    <PhoneShell>
      <BackHeader to="/app" title="About Aeris.AI" />

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '8px' }}>
        <div className="env-card" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '8px', padding: '20px' }}>
          <div style={{ fontFamily: "'Syne',sans-serif", fontSize: '16px', fontWeight: 700, color: '#fff' }}>
            What is Aeris.AI?
          </div>
          <div style={{ fontSize: '14px', color: 'var(--muted)', lineHeight: 1.7 }}>
            Aeris.AI uses AI-powered gas detection to monitor factory environments and alert teams to leaks immediately.
          </div>
        </div>
        <div className="env-card" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '8px', padding: '20px' }}>
          <div style={{ fontFamily: "'Syne',sans-serif", fontSize: '16px', fontWeight: 700, color: '#fff' }}>
            Features
          </div>
          <div style={{ fontSize: '14px', color: 'var(--muted)', lineHeight: 1.7 }}>
            Track sensors, view alerts, and see environmental data for safer operations. Powered by real-time AI analysis.
          </div>
        </div>
      </div>
    </PhoneShell>
  )
}
