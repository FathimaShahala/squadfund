import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import AuthCard, { Field, SubmitButton } from '../components/AuthCard'

export default function Register() {
  const { user, register } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '' })
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  if (user) return <Navigate to="/dashboard" replace />

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const onSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      const payload = { ...form }
      if (!payload.phone) delete payload.phone
      await register(payload)
      navigate('/dashboard', { replace: true })
    } catch (err) {
      setError(err.response?.data?.message || 'Could not create account')
    } finally {
      setBusy(false)
    }
  }

  return (
    <AuthCard title="Create your account" subtitle="Start saving together with your squad">
      <form onSubmit={onSubmit}>
        <Field label="Full name" name="name" value={form.name} onChange={onChange} required />
        <Field label="Email" type="email" name="email" value={form.email} onChange={onChange} required />
        <Field label="Phone (optional)" type="tel" name="phone" value={form.phone} onChange={onChange} />
        <Field
          label="Password (min 8 characters)"
          type="password"
          name="password"
          value={form.password}
          onChange={onChange}
          minLength={8}
          required
        />
        {error && <p className="text-red-600 text-sm mb-3">{error}</p>}
        <SubmitButton loading={busy}>Sign up</SubmitButton>
      </form>
      <p className="text-sm text-slate-500 mt-4 text-center">
        Already have an account? <Link to="/login" className="text-emerald-600 font-medium">Log in</Link>
      </p>
    </AuthCard>
  )
}
