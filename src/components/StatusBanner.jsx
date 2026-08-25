export function ErrorBanner({ message }) {
  if (!message) return null
  return <div className="error-banner">{message}</div>
}

export function NoticeBanner({ message }) {
  if (!message) return null
  return <div className="notice-banner">{message}</div>
}
