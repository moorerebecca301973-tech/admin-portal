// Central API client for the gateway's /admin/* surface.
//
// Base URL and the admin token are both resolved at call time (not baked
// in at build time) so the same static build can point at any gateway -
// see AuthContext for how the token is captured via the login screen and
// VITE_GATEWAY_URL / the runtime override for the base URL.

const DEFAULT_BASE_URL = import.meta.env.VITE_GATEWAY_URL || 'http://localhost:8080'

const BASE_URL_STORAGE_KEY = 'gateway_base_url'
const TOKEN_STORAGE_KEY = 'gateway_admin_token'

export function getBaseUrl() {
  return localStorage.getItem(BASE_URL_STORAGE_KEY) || DEFAULT_BASE_URL
}

export function setBaseUrl(url) {
  localStorage.setItem(BASE_URL_STORAGE_KEY, url.replace(/\/+$/, ''))
}

export function getToken() {
  return localStorage.getItem(TOKEN_STORAGE_KEY) || ''
}

export function setToken(token) {
  localStorage.setItem(TOKEN_STORAGE_KEY, token)
}

export function clearToken() {
  localStorage.removeItem(TOKEN_STORAGE_KEY)
}

export class ApiError extends Error {
  constructor(message, status) {
    super(message)
    this.status = status
  }
}

async function request(path, { method = 'GET', body, token, baseUrl } = {}) {
  const url = `${(baseUrl || getBaseUrl()).replace(/\/+$/, '')}${path}`
  const headers = { 'X-Admin-Token': token !== undefined ? token : getToken() }
  if (body !== undefined) headers['Content-Type'] = 'application/json'

  let res
  try {
    res = await fetch(url, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    })
  } catch {
    throw new ApiError(
      `Could not reach the gateway at ${baseUrl || getBaseUrl()}. Is it running and is the URL correct?`,
      0
    )
  }

  if (res.status === 401) {
    throw new ApiError('Invalid or expired admin token.', 401)
  }

  let data = null
  const text = await res.text()
  if (text) {
    try {
      data = JSON.parse(text)
    } catch {
      data = text
    }
  }

  if (!res.ok) {
    const detail = (data && data.detail) || res.statusText || 'Request failed'
    throw new ApiError(typeof detail === 'string' ? detail : JSON.stringify(detail), res.status)
  }

  return data
}

export const api = {
  // Auth check - any cheap authenticated GET works; stats is small.
  verifyToken: (token, baseUrl) => request('/admin/stats', { token, baseUrl }),

  getStats: () => request('/admin/stats'),

  listApiKeys: () => request('/admin/api-keys'),
  createApiKey: (body) => request('/admin/api-keys', { method: 'POST', body }),
  setKeyMlExempt: (keyId, exempt) =>
    request(`/admin/api-keys/${keyId}/ml-exempt?exempt=${exempt}`, { method: 'POST' }),
  revokeApiKey: (keyId) => request(`/admin/api-keys/${keyId}`, { method: 'DELETE' }),

  listBlocklist: (activeOnly = true) => request(`/admin/blocklist?active_only=${activeOnly}`),
  blockIp: (body) => request('/admin/blocklist', { method: 'POST', body }),
  unblockIp: (ip) => request(`/admin/blocklist/${encodeURIComponent(ip)}`, { method: 'DELETE' }),

  listAlerts: (limit = 100) => request(`/admin/alerts?limit=${limit}`),

  listRequests: (limit = 100) => request(`/admin/requests?limit=${limit}`),
  labelRequest: (requestLogId, label) =>
    request('/admin/requests/label', { method: 'POST', body: { request_log_id: requestLogId, label } }),
  listLabeledRequests: () => request('/admin/requests/labeled'),

  scoreFeatures: (features) => request('/admin/model/score', { method: 'POST', body: { features } }),
}
