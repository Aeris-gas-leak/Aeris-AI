import { Link } from 'react-router-dom'

export default function BackHeader({ to, title }) {
  return (
    <div className="back-header">
      <Link className="back-btn" to={to}>←</Link>
      {title && <span className="page-title">{title}</span>}
    </div>
  )
}
