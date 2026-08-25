import { useState } from 'react'
import { api } from '../api'
import { usePoll } from '../usePoll'
import { formatTs } from '../format'
import { ErrorBanner } from '../components/StatusBanner'

function BlockIpModal({ onClose, onDone }) {
  const [ip, setIp] = useState('')
  const [reason, setReason] = useState('manually blocked by admin')
  const [permanent, setPermanent] = useState(false)
  const [duration, setDuration] = useState(3600)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      await api.blockIp({
        ip: ip.trim(),
        reason: reason.trim() || 'manually blocked by admin',
        permanent,
        duration_seconds: permanent ? null : Number(duration) || null,
      })
      onDone()
      onClose()
    } catch (err) {
      setError(err.message || 'Failed to block IP.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <h2>Block an IP</h2>
        <ErrorBanner message={error} />
        <form onSubmit={handleSubmit}>
          <label htmlFor="ip">IP address</label>
          <input
            id="ip"
            value={ip}
            onChange={(e) => setIp(e.target.value)}
            placeholder="203.0.113.42"
            required
            autoFocus
          />

          <label htmlFor="reason">Reason</label>
          <input id="reason" value={reason} onChange={(e) => setReason(e.target.value)} />

          <div className="checkbox-row">
            <input
              id="permanent"
              type="checkbox"
              checked={permanent}
              onChange={(e) => setPermanent(e.target.checked)}
            />
            <label htmlFor="permanent">Permanent (never auto-expires)</label>
          </div>

          {!permanent && (
            <>
              <label htmlFor="duration">Duration (seconds)</label>
              <input
                id="duration"
                type="number"
                min="1"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
              />
            </>
          )}

          <div className="modal-actions">
            <button type="button" className="btn secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn" disabled={submitting}>
              {submitting ? 'Blocking…' : 'Block IP'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function Blocklist() {
  const [activeOnly, setActiveOnly] = useState(true)
  const { data: blocklist, error, loading, refresh } = usePoll(() => api.listBlocklist(activeOnly), [activeOnly], 20000)
  const [showBlock, setShowBlock] = useState(false)
  const [busyIp, setBusyIp] = useState(null)
  const [actionError, setActionError] = useState('')

  async function unblock(ip) {
    setActionError('')
    setBusyIp(ip)
    try {
      await api.unblockIp(ip)
      await refresh()
    } catch (err) {
      setActionError(err.message || 'Failed to unblock IP.')
    } finally {
      setBusyIp(null)
    }
  }

  return (
    <div>
      <div className="section-header">
        <div>
          <h1>Blocklist</h1>
          <div className="page-sub" style={{ marginBottom: 0 }}>
            IPs blocked by the ML model, the rate limiter, or manually.
          </div>
        </div>
        <button className="btn" onClick={() => setShowBlock(true)}>
          + Block IP
        </button>
      </div>

      <ErrorBanner message={error || actionError} />

      <div className="toolbar">
        <label style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
          <input
            type="checkbox"
            style={{ width: 'auto' }}
            checked={activeOnly}
            onChange={(e) => setActiveOnly(e.target.checked)}
          />
          <span className="muted">Show active blocks only</span>
        </label>
      </div>

      <div className="panel">
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>IP</th>
                <th>Reason</th>
                <th>Blocked at</th>
                <th>Expires</th>
                <th>Unblocked at</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {loading && !blocklist ? (
                <tr className="empty-row">
                  <td colSpan={6}>Loading…</td>
                </tr>
              ) : blocklist && blocklist.length ? (
                blocklist.map((b) => {
                  const isActive = !b.unblocked_at && (b.permanent || !b.expires_at || b.expires_at > Date.now() / 1000)
                  return (
                    <tr key={b.id}>
                      <td className="mono">{b.ip}</td>
                      <td>{b.reason}</td>
                      <td>{formatTs(b.blocked_at)}</td>
                      <td>{b.permanent ? 'permanent' : formatTs(b.expires_at)}</td>
                      <td>{formatTs(b.unblocked_at)}</td>
                      <td>
                        {isActive && (
                          <button className="btn secondary small" disabled={busyIp === b.ip} onClick={() => unblock(b.ip)}>
                            Unblock
                          </button>
                        )}
                      </td>
                    </tr>
                  )
                })
              ) : (
                <tr className="empty-row">
                  <td colSpan={6}>No IPs currently blocked.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showBlock && <BlockIpModal onClose={() => setShowBlock(false)} onDone={refresh} />}
    </div>
  )
}
