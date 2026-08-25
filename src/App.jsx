import { Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider, useAuth } from './AuthContext'
import Layout from './components/Layout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import ApiKeys from './pages/ApiKeys'
import Blocklist from './pages/Blocklist'
import Alerts from './pages/Alerts'
import Requests from './pages/Requests'
import ModelScore from './pages/ModelScore'

function RequireAuth({ children }) {
  const { isAuthenticated } = useAuth()
  if (!isAuthenticated) return <Navigate to="/login" replace />
  return children
}

function AppRoutes() {
  const { isAuthenticated } = useAuth()

  return (
    <Routes>
      <Route path="/login" element={isAuthenticated ? <Navigate to="/" replace /> : <Login />} />
      <Route
        path="/"
        element={
          <RequireAuth>
            <Layout />
          </RequireAuth>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="api-keys" element={<ApiKeys />} />
        <Route path="blocklist" element={<Blocklist />} />
        <Route path="alerts" element={<Alerts />} />
        <Route path="requests" element={<Requests />} />
        <Route path="model-score" element={<ModelScore />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  )
}
