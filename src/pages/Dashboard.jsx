import { api } from '../api'
import { usePoll } from '../usePoll'
import { formatTs, formatProb, truncate } from '../format'
import { ErrorBanner } from '../components/StatusBanner'
import { Link } from 'react-router-dom'

function severityBadge(sev) {
  const s = (sev || '').toLowerCase()
  const cls = s === 'critical' || s === 'high' ? 'red' : s === 'medium' || s === 'warning' ? 'yellow' : 'gray'
  return <span className={`badge ${cls}`}>{sev || 'info'}</span>
}

export default function Dashboard() {
  const { data: stats, error: statsError, loading: statsLoading } = usePoll(() => api.getStats(), [])
  const { data: alerts, error: alertsError } = usePoll(() => api.listAlerts(10), [])
  const { data: blocklist, error: blockError } = usePoll(() => api.listBlocklist(true), [])

  return (
    <div>
      <h1>Dashboard</h1>
      <div className="page-sub">
        Auto-refreshes every 15s.
        {stats && (
          <>
            {' '}
            &middot; Mode:{' '}
            <b style={{ color: stats.enforcement_mode === 'enforce' ? 'var(--green)' : 'var(--yellow)' }}>
              {stats.enforcement_mode?.toUpperCase()}
            </b>{' '}
            &middot; Threshold: {stats.attack_threshold}
          </>
        )}
      </div>

      <ErrorBanner message={statsError} />

      {statsLoading && !stats ? (
        <div className="spinner-text">Loading…</div>
      ) : stats ? (
        <div className="cards">
          <div className="card">
            <div className="v">{stats.active_api_keys}</div>
            <div className="l">Active API keys</div>
          </div>
          <div className="card">
            <div className="v">{stats.active_blocked_ips}</div>
            <div className="l">Blocked IPs (active)</div>
          </div>
          <div className="card">
            <div className="v">{stats.requests_allowed_last_hour}</div>
            <div className="l">Allowed / last hour</div>
          </div>
          <div className="card">
            <div className="v">{stats.requests_blocked_last_hour}</div>
            <div className="l">Blocked / last hour</div>
          </div>
          <div className="card">
            <div className="v">{stats.alerts_last_hour}</div>
            <div className="l">Alerts / last hour</div>
          </div>
        </div>
      ) : null}

      <div className="panel">
        <div className="section-header">
          <h2>Recent alerts</h2>
          <Link to="/alerts" className="btn secondary small">
            View all
          </Link>
        </div>
        <ErrorBanner message={alertsError} />
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Time</th>
                <th>Severity</th>
                <th>IP</th>
                <th>Attack prob.</th>
                <th>Message</th>
              </tr>
            </thead>
            <tbody>
              {alerts && alerts.length ? (
                alerts.map((a) => (
                  <tr key={a.id}>
                    <td>{formatTs(a.ts)}</td>
                    <td>{severityBadge(a.severity)}</td>
                    <td className="mono">{a.ip}</td>
                    <td className="mono">{formatProb(a.attack_probability)}</td>
                    <td>{truncate(a.message, 70)}</td>
                  </tr>
                ))
              ) : (
                <tr className="empty-row">
                  <td colSpan={5}>No alerts yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="panel">
        <div className="section-header">
          <h2>Active blocklist</h2>
          <Link to="/blocklist" className="btn secondary small">
            Manage
          </Link>
        </div>
        <ErrorBanner message={blockError} />
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>IP</th>
                <th>Reason</th>
                <th>Blocked at</th>
                <th>Expires</th>
              </tr>
            </thead>
            <tbody>
              {blocklist && blocklist.length ? (
                blocklist.slice(0, 10).map((b) => (
                  <tr key={b.id}>
                    <td className="mono">{b.ip}</td>
                    <td>{truncate(b.reason, 50)}</td>
                    <td>{formatTs(b.blocked_at)}</td>
                    <td>{b.permanent ? 'permanent' : formatTs(b.expires_at)}</td>
                  </tr>
                ))
              ) : (
                <tr className="empty-row">
                  <td colSpan={4}>No IPs currently blocked.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
