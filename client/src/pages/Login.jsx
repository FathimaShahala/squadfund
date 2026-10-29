import { useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import AuthCard, { Field, SubmitButton } from '../components/AuthCard'

export default function Login() {
  const { user, login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const redirectTo = location.state?.from?.pathname || '/dashboard'
  if (user) return <Navigate to={redirectTo} replace />

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const onSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      await login(form.email, form.password)
      navigate(redirectTo, { replace: true })
    } catch (err) {
      setError(err.response?.data?.message || 'Could not log in')
    } finally {
      setBusy(false)
    }
  }

  return (
    <AuthCard title="Welcome back" subtitle="Log in to see your groups">
      <form onSubmit={onSubmit}>
        <Field label="Email" type="email" name="email" value={form.email} onChange={onChange} required />
        <Field label="Password" type="password" name="password" value={form.password} onChange={onChange} required />
        {error && <p className="text-red-600 text-sm mb-3">{error}</p>}
        <SubmitButton loading={busy}>Log in</SubmitButton>
      </form>
      <p className="text-sm text-slate-500 mt-4 text-center">
        New here? <Link to="/register" className="text-emerald-600 font-medium">Create an account</Link>
      </p>
    </AuthCard>
  )
}
