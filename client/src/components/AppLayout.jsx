import { Link, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function AppLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const onLogout = async () => {
    await logout()
    navigate('/login', { replace: true })
  }

  return (
    <div className="min-h-screen">
      <header className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/dashboard" className="text-xl font-bold text-emerald-600">SquadFund</Link>
          <div className="flex items-center gap-4 text-sm">
            <span className="text-slate-600 hidden sm:inline">{user.name}</span>
            <button onClick={onLogout} className="text-red-600 font-medium">Log out</button>
          </div>
        </div>
      </header>
      <main className="max-w-4xl mx-auto p-6">
        <Outlet />
      </main>
    </div>
  )
}
