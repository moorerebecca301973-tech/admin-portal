import { useState } from 'react'
import { api } from '../api'
import { usePoll } from '../usePoll'
import { formatTs, formatProb, truncate } from '../format'
import { ErrorBanner, NoticeBanner } from '../components/StatusBanner'

function actionBadge(action) {
  if (action === 'allowed') return <span className="badge green">allowed</span>
  return <span className="badge red">{action}</span>
}

function RecentRequests() {
  const [limit, setLimit] = useState(100)
  const { data: requests, error, loading, refresh } = usePoll(() => api.listRequests(limit), [limit], 15000)
  const [labelingId, setLabelingId] = useState(null)
  const [actionError, setActionError] = useState('')
  const [notice, setNotice] = useState('')

  async function doLabel(id, label) {
    setActionError('')
    setNotice('')
    setLabelingId(id)
    try {
      await api.labelRequest(id, label)
      setNotice(`Request #${id} labeled "${label}".`)
      await refresh()
    } catch (err) {
      setActionError(err.message || 'Failed to label request.')
    } finally {
      setLabelingId(null)
    }
  }

  return (
    <>
      <div className="toolbar">
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
      <ErrorBanner message={error || actionError} />
      <NoticeBanner message={notice} />
      <div className="panel">
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Time</th>
                <th>IP</th>
                <th>Key</th>
                <th>Method</th>
                <th>Path</th>
                <th>Action</th>
                <th>Attack prob.</th>
                <th>Status</th>
                <th>Label as ground truth</th>
              </tr>
            </thead>
            <tbody>
              {loading && !requests ? (
                <tr className="empty-row">
                  <td colSpan={9}>Loading…</td>
                </tr>
              ) : requests && requests.length ? (
                requests.map((r) => (
                  <tr key={r.id}>
                    <td>{formatTs(r.ts)}</td>
                    <td className="mono">{r.ip}</td>
                    <td>{r.api_key_id ?? '—'}</td>
                    <td>{r.method}</td>
                    <td className="mono">{truncate(r.path, 40)}</td>
                    <td>{actionBadge(r.action)}</td>
                    <td className="mono">{formatProb(r.attack_probability)}</td>
                    <td>{r.status_code ?? '—'}</td>
                    <td>
                      {r.features_json ? (
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button
                            className="btn secondary small"
                            disabled={labelingId === r.id}
                            onClick={() => doLabel(r.id, 'benign')}
                          >
                            Benign
                          </button>
                          <button
                            className="btn danger small"
                            disabled={labelingId === r.id}
                            onClick={() => doLabel(r.id, 'attack')}
                          >
                            Attack
                          </button>
                        </div>
                      ) : (
                        <span className="muted">not ML-scored</span>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr className="empty-row">
                  <td colSpan={9}>No requests logged yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}

function LabeledRequests() {
  const { data: labeled, error, loading, refresh } = usePoll(() => api.listLabeledRequests(), [], 20000)

  return (
    <>
      <div className="toolbar">
        <button className="btn secondary small" onClick={refresh}>
          Refresh
        </button>
      </div>
      <ErrorBanner message={error} />
      <div className="panel">
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Request ID</th>
                <th>Time</th>
                <th>IP</th>
                <th>Method</th>
                <th>Path</th>
                <th>Label</th>
                <th>Labeled at</th>
                <th>Labeled by</th>
              </tr>
            </thead>
            <tbody>
              {loading && !labeled ? (
                <tr className="empty-row">
                  <td colSpan={8}>Loading…</td>
                </tr>
              ) : labeled && labeled.length ? (
                labeled.map((r) => (
                  <tr key={r.id}>
                    <td>{r.id}</td>
                    <td>{formatTs(r.ts)}</td>
                    <td className="mono">{r.ip}</td>
                    <td>{r.method}</td>
                    <td className="mono">{truncate(r.path, 40)}</td>
                    <td>
                      {r.label === 1 ? <span className="badge red">attack</span> : <span className="badge green">benign</span>}
                    </td>
                    <td>{formatTs(r.labeled_at)}</td>
                    <td>{r.labeled_by}</td>
                  </tr>
                ))
              ) : (
                <tr className="empty-row">
                  <td colSpan={8}>No labeled requests yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}

export default function Requests() {
  const [tab, setTab] = useState('recent')

  return (
    <div>
      <h1>Requests & Labeling</h1>
      <div className="page-sub">
        Review traffic the gateway has scored, and label ground truth to feed the retraining pipeline.
      </div>

      <div className="toolbar">
        <button className={`btn ${tab === 'recent' ? '' : 'secondary'} small`} onClick={() => setTab('recent')}>
          Recent requests
        </button>
        <button className={`btn ${tab === 'labeled' ? '' : 'secondary'} small`} onClick={() => setTab('labeled')}>
          Labeled requests
        </button>
      </div>

      {tab === 'recent' ? <RecentRequests /> : <LabeledRequests />}
    </div>
  )
}
