import { useState } from 'react'
import { api } from '../api'
import { usePoll } from '../usePoll'
import { formatTs } from '../format'
import { ErrorBanner, NoticeBanner } from '../components/StatusBanner'

function CreateKeyModal({ onClose, onCreated }) {
  const [owner, setOwner] = useState('')
  const [isAdmin, setIsAdmin] = useState(false)
  const [exempt, setExempt] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState(null)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      const res = await api.createApiKey({ owner: owner.trim(), is_admin: isAdmin, exempt_from_ml: exempt })
      setResult(res)
      onCreated()
    } catch (err) {
      setError(err.message || 'Failed to create key.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        {result ? (
          <>
            <h2>Key created for "{result.owner}"</h2>
            <NoticeBanner message={result.warning} />
            <div className="key-reveal">{result.api_key}</div>
            <div className="muted" style={{ fontSize: 12 }}>
              Copy this now and share it securely with the client — it will not be shown again.
            </div>
            <div className="modal-actions">
              <button className="btn" onClick={onClose}>
                Done
              </button>
            </div>
          </>
        ) : (
          <>
            <h2>Create API key</h2>
            <ErrorBanner message={error} />
            <form onSubmit={handleSubmit}>
              <label htmlFor="owner">Owner / label</label>
              <input
                id="owner"
                value={owner}
                onChange={(e) => setOwner(e.target.value)}
                placeholder="e.g. mobile-app, partner-integration-x"
                required
                autoFocus
              />

              <div className="checkbox-row">
                <input
                  id="isAdmin"
                  type="checkbox"
                  checked={isAdmin}
                  onChange={(e) => setIsAdmin(e.target.checked)}
                />
                <label htmlFor="isAdmin">Admin key (can call /admin/* endpoints too)</label>
              </div>

              <div className="checkbox-row">
                <input
                  id="exempt"
                  type="checkbox"
                  checked={exempt}
                  onChange={(e) => setExempt(e.target.checked)}
                />
                <label htmlFor="exempt">
                  Exempt from ML scoring (still rate-limited) — for known trusted high-throughput clients
                </label>
              </div>

              <div className="modal-actions">
                <button type="button" className="btn secondary" onClick={onClose}>
                  Cancel
                </button>
                <button type="submit" className="btn" disabled={submitting}>
                  {submitting ? 'Creating…' : 'Create key'}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  )
}

export default function ApiKeys() {
  const { data: keys, error, loading, refresh } = usePoll(() => api.listApiKeys(), [], 20000)
  const [showCreate, setShowCreate] = useState(false)
  const [busyId, setBusyId] = useState(null)
  const [actionError, setActionError] = useState('')

  async function toggleExempt(key) {
    setActionError('')
    setBusyId(key.id)
    try {
      await api.setKeyMlExempt(key.id, !key.exempt_from_ml)
      await refresh()
    } catch (err) {
      setActionError(err.message || 'Failed to update key.')
    } finally {
      setBusyId(null)
    }
  }

  async function revoke(key) {
    if (!window.confirm(`Revoke API key for "${key.owner}"? This cannot be undone.`)) return
    setActionError('')
    setBusyId(key.id)
    try {
      await api.revokeApiKey(key.id)
      await refresh()
    } catch (err) {
      setActionError(err.message || 'Failed to revoke key.')
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div>
      <div className="section-header">
        <div>
          <h1>API Keys</h1>
          <div className="page-sub" style={{ marginBottom: 0 }}>
            Issue and manage credentials end users pass through the gateway.
          </div>
        </div>
        <button className="btn" onClick={() => setShowCreate(true)}>
          + Create key
        </button>
      </div>

      <ErrorBanner message={error || actionError} />

      <div className="panel">
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Owner</th>
                <th>Prefix</th>
                <th>Admin</th>
                <th>Status</th>
                <th>ML exempt</th>
                <th>Requests</th>
                <th>Flags</th>
                <th>Created</th>
                <th>Last used</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {loading && !keys ? (
                <tr className="empty-row">
                  <td colSpan={11}>Loading…</td>
                </tr>
              ) : keys && keys.length ? (
                keys.map((k) => (
                  <tr key={k.id}>
                    <td>{k.id}</td>
                    <td>{k.owner}</td>
                    <td className="mono">{k.key_prefix}…</td>
                    <td>{k.is_admin ? <span className="badge yellow">admin</span> : '—'}</td>
                    <td>
                      {k.is_active ? (
                        <span className="badge green">active</span>
                      ) : (
                        <span className="badge red">revoked{k.revoked_reason ? `: ${k.revoked_reason}` : ''}</span>
                      )}
                    </td>
                    <td>
                      <button
                        className="btn secondary small"
                        disabled={!k.is_active || busyId === k.id}
                        onClick={() => toggleExempt(k)}
                      >
                        {k.exempt_from_ml ? 'Yes — turn off' : 'No — exempt'}
                      </button>
                    </td>
                    <td>{k.request_count}</td>
                    <td>{k.flag_count}</td>
                    <td>{formatTs(k.created_at)}</td>
                    <td>{formatTs(k.last_used_at)}</td>
                    <td>
                      {k.is_active && (
                        <button className="btn danger small" disabled={busyId === k.id} onClick={() => revoke(k)}>
                          Revoke
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr className="empty-row">
                  <td colSpan={11}>No API keys issued yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showCreate && (
        <CreateKeyModal
          onClose={() => {
            setShowCreate(false)
            refresh()
          }}
          onCreated={refresh}
        />
      )}
    </div>
  )
}
