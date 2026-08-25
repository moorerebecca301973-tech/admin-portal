import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../AuthContext'

const NAV_ITEMS = [
  { to: '/', label: 'Dashboard', end: true },
  { to: '/api-keys', label: 'API Keys' },
  { to: '/blocklist', label: 'Blocklist' },
  { to: '/alerts', label: 'Alerts' },
  { to: '/requests', label: 'Requests & Labeling' },
  { to: '/model-score', label: 'Model Calibration' },
]

export default function Layout() {
  const { baseUrl, logout } = useAuth()

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">Smart Cloud Security</div>
        <div className="brand-sub">Admin Portal</div>
        <nav>
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => (isActive ? 'active' : '')}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="footer">
          <div className="muted mono" style={{ fontSize: 11, marginBottom: 10, wordBreak: 'break-all' }}>
            {baseUrl}
          </div>
          <button className="btn secondary small" onClick={logout} style={{ width: '100%' }}>
            Sign out
          </button>
        </div>
      </aside>
      <main className="main">
        <Outlet />
      </main>
    </div>
  )
}
