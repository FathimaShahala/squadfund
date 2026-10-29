import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

// Wrap private pages: <Route element={<ProtectedRoute />}> ... </Route>
export default function ProtectedRoute() {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-slate-400">Loading...</div>
  }
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />
  return <Outlet />
}
