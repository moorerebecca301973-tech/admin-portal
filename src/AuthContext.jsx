import { createContext, useContext, useState, useCallback } from 'react'
import { api, getToken, setToken, clearToken, getBaseUrl, setBaseUrl } from './api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [token, setTokenState] = useState(getToken())
  const [baseUrl, setBaseUrlState] = useState(getBaseUrl())

  const login = useCallback(async (candidateToken, candidateBaseUrl) => {
    // Verify the token actually works against this gateway before storing
    // it, so a typo doesn't silently land the user on a broken dashboard.
    await api.verifyToken(candidateToken, candidateBaseUrl)
    setToken(candidateToken)
    setBaseUrl(candidateBaseUrl)
    setTokenState(candidateToken)
    setBaseUrlState(candidateBaseUrl)
  }, [])

  const logout = useCallback(() => {
    clearToken()
    setTokenState('')
  }, [])

  return (
    <AuthContext.Provider value={{ token, baseUrl, isAuthenticated: !!token, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
