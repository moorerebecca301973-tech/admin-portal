import { useCallback, useEffect, useRef, useState } from 'react'
import { ApiError } from './api'
import { useAuth } from './AuthContext'

// Fetches `fn()` immediately, then again every `intervalMs` (default 15s,
// matching the old HTML dashboard's auto-refresh). Refresh errors after the
// first successful load are shown but don't clear stale-but-good data off
// the screen. A 401 during a background refresh logs the user out, since
// it means the token was revoked/rotated server-side.
export function usePoll(fn, deps = [], intervalMs = 15000) {
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const { logout } = useAuth()
  const fnRef = useRef(fn)
  fnRef.current = fn

  const refresh = useCallback(async () => {
    try {
      const result = await fnRef.current()
      setData(result)
      setError('')
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        logout()
        return
      }
      setError(err.message || 'Failed to load data.')
    } finally {
      setLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [logout])

  useEffect(() => {
    setLoading(true)
    refresh()
    if (!intervalMs) return undefined
    const id = setInterval(refresh, intervalMs)
    return () => clearInterval(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  return { data, error, loading, refresh }
}
