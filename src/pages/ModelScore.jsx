import { useEffect, useState } from 'react'
import { api } from '../api'
import { ErrorBanner } from '../components/StatusBanner'

export default function ModelScore() {
  const [featureNames, setFeatureNames] = useState(null)
  const [values, setValues] = useState({})
  const [loadError, setLoadError] = useState('')
  const [submitError, setSubmitError] = useState('')
  const [result, setResult] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    // The score endpoint itself reports which feature names the loaded
    // model expects, so we bootstrap the form by scoring an empty vector.
    api
      .scoreFeatures({})
      .then((res) => {
        setFeatureNames(res.feature_names_expected || [])
        const initial = {}
        for (const name of res.feature_names_expected || []) initial[name] = 0
        setValues(initial)
      })
      .catch((err) => setLoadError(err.message || 'Failed to load model feature schema.'))
  }, [])

  function updateValue(name, v) {
    setValues((prev) => ({ ...prev, [name]: v }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSubmitError('')
    setSubmitting(true)
    try {
      const numeric = {}
      for (const [k, v] of Object.entries(values)) numeric[k] = Number(v) || 0
      const res = await api.scoreFeatures(numeric)
      setResult(res)
    } catch (err) {
      setSubmitError(err.message || 'Failed to score features.')
    } finally {
      setSubmitting(false)
    }
  }

  function resetAll() {
    const cleared = {}
    for (const name of featureNames || []) cleared[name] = 0
    setValues(cleared)
    setResult(null)
  }

  return (
    <div>
      <h1>Model Calibration</h1>
      <div className="page-sub">
        Score an arbitrary feature vector directly against the loaded model, bypassing the live flow
        tracker. Useful for testing known benign/attack samples before trusting <span className="mono">ENFORCEMENT_MODE=enforce</span>.
      </div>

      <ErrorBanner message={loadError || submitError} />

      {!featureNames ? (
        !loadError && <div className="spinner-text">Loading model feature schema…</div>
      ) : (
        <form onSubmit={handleSubmit}>
          <div className="panel">
            <div className="section-header">
              <h2>Feature values ({featureNames.length})</h2>
              <button type="button" className="btn secondary small" onClick={resetAll}>
                Reset all to 0
              </button>
            </div>
            <div className="feature-grid">
              {featureNames.map((name) => (
                <div key={name}>
                  <div className="fname mono">{name}</div>
                  <input
                    type="number"
                    step="any"
                    value={values[name] ?? 0}
                    onChange={(e) => updateValue(name, e.target.value)}
                  />
                </div>
              ))}
            </div>
            <div style={{ marginTop: 16 }}>
              <button type="submit" className="btn" disabled={submitting}>
                {submitting ? 'Scoring…' : 'Score this vector'}
              </button>
            </div>
          </div>
        </form>
      )}

      {result && (
        <div className="panel score-result">
          <h2 style={{ marginBottom: 10 }}>Result</h2>
          <div className="prob" style={{ color: result.would_block_at_current_threshold ? 'var(--red)' : 'var(--green)' }}>
            {(result.attack_probability * 100).toFixed(2)}%
          </div>
          <div className="muted" style={{ marginBottom: 10 }}>attack probability</div>
          <div>
            {result.would_block_at_current_threshold ? (
              <span className="badge red">would block</span>
            ) : (
              <span className="badge green">would allow</span>
            )}{' '}
            <span className="muted">at current threshold {result.current_threshold}</span>
          </div>
        </div>
      )}
    </div>
  )
}
