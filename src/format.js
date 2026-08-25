export function formatTs(ts) {
  if (ts === null || ts === undefined || ts === '') return '—'
  const ms = ts > 1e12 ? ts : ts * 1000
  return new Date(ms).toLocaleString()
}

export function formatProb(p) {
  if (p === null || p === undefined) return '—'
  return Number(p).toFixed(4)
}

export function truncate(s, n = 60) {
  if (s === null || s === undefined) return ''
  const str = String(s)
  return str.length > n ? str.slice(0, n) + '…' : str
}
