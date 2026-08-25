import { useState } from 'react'
import { api } from '../api'
import { usePoll } from '../usePoll'
import { formatTs, formatProb } from '../format'
import { ErrorBanner } from '../components/StatusBanner'

function severityBadge(sev) {
  const s = (sev || '').toLowerCase()
  const cls = s === 'critical' || s === 'high' ? 'red' : s === 'medium' || s === 'warning' ? 'yellow' : 'gray'
  return <span className={`badge ${cls}`}>{sev || 'info'}</span>
}

export default function Alerts() {
  const [limit, setLimit] = useState(100)
  const { data: alerts, error, loading, refresh } = usePoll(() => api.listAlerts(limit), [limit], 15000)

  return (
    <div>
      <div className="section-header">
        <div>
          <h1>Alerts</h1>
          <div className="page-sub" style={{ marginBottom: 0 }}>
            Flagged traffic — blocked outright in enforce mode, logged only in monitor mode.
          </div>
        </div>
        <div className="toolbar" style={{ marginBottom: 0 }}>
          <select value={limit} onChange={(e) => setLimit(Number(e.target.value))} style={{ width: 140 }}>
            <option value={50}>Last 50</option>
            <option value={100}>Last 100</option>
            <option value={250}>Last 250</option>
            <option value={1000}>Last 1000</option>
          </select>
          <button className="btn secondary small" onClick={refresh}>
            Refresh
          </button>
        </div>
      </div>

      <ErrorBanner message={error} />

      <div className="panel">
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Time</th>
                <th>Severity</th>
                <th>IP</th>
                <th>API key</th>
                <th>Method</th>
                <th>Path</th>
                <th>Attack prob.</th>
                <th>Message</th>
              </tr>
            </thead>
            <tbody>
              {loading && !alerts ? (
                <tr className="empty-row">
                  <td colSpan={8}>Loading…</td>
                </tr>
              ) : alerts && alerts.length ? (
                alerts.map((a) => (
                  <tr key={a.id}>
                    <td>{formatTs(a.ts)}</td>
                    <td>{severityBadge(a.severity)}</td>
                    <td className="mono">{a.ip}</td>
                    <td>{a.api_key_id ?? '—'}</td>
                    <td>{a.method}</td>
                    <td className="mono">{a.path}</td>
                    <td className="mono">{formatProb(a.attack_probability)}</td>
                    <td>{a.message}</td>
                  </tr>
                ))
              ) : (
                <tr className="empty-row">
                  <td colSpan={8}>No alerts yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
