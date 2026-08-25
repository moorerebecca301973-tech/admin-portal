import { useState } from 'react'
import { useAuth } from '../AuthContext'
import { getBaseUrl } from '../api'
import { ErrorBanner } from '../components/StatusBanner'

export default function Login() {
  const { login } = useAuth()
  const [baseUrl, setBaseUrlInput] = useState(getBaseUrl())
  const [token, setTokenInput] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      await login(token.trim(), baseUrl.trim())
    } catch (err) {
      setError(err.message || 'Could not sign in.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="login-page">
      <div className="login-box">
        <h1>Smart Cloud Security</h1>
        <div className="page-sub">Sign in with your admin token to manage the gateway.</div>
        <ErrorBanner message={error} />
        <form onSubmit={handleSubmit}>
          <label htmlFor="baseUrl">Gateway URL</label>
          <input
            id="baseUrl"
            type="text"
            value={baseUrl}
            onChange={(e) => setBaseUrlInput(e.target.value)}
            placeholder="http://localhost:8080"
            required
          />

          <label htmlFor="token">Admin token</label>
          <input
            id="token"
            type="password"
            value={token}
            onChange={(e) => setTokenInput(e.target.value)}
            placeholder="ADMIN_BOOTSTRAP_TOKEN"
            required
            autoFocus
          />

          <button className="btn" type="submit" disabled={submitting} style={{ width: '100%', marginTop: 20 }}>
            {submitting ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
        <div className="muted" style={{ fontSize: 12, marginTop: 16, lineHeight: 1.5 }}>
          This is the same token as <span className="mono">ADMIN_BOOTSTRAP_TOKEN</span> in the
          gateway's <span className="mono">.env</span>. It's stored only in this browser's local
          storage and sent as <span className="mono">X-Admin-Token</span> on every request — never
          shared with anyone else.
        </div>
      </div>
    </div>
  )
}
