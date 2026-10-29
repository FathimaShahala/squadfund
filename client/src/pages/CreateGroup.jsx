import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createGroup, errorMessage } from '../api/groups'
import { Field } from '../components/AuthCard'

export default function CreateGroup() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [form, setForm] = useState({
    name: '',
    description: '',
    monthlyAmount: '',
    goalAmount: '',
    dueDay: '5',
    requireApproval: false,
  })

  const mutation = useMutation({
    mutationFn: () =>
      createGroup({
        name: form.name,
        description: form.description,
        monthlyAmount: Number(form.monthlyAmount),
        goalAmount: Number(form.goalAmount || 0),
        dueDay: Number(form.dueDay),
        requireApproval: form.requireApproval,
      }),
    onSuccess: (group) => {
      queryClient.invalidateQueries({ queryKey: ['groups'] })
      navigate(`/groups/${group.id}`, { replace: true })
    },
  })

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  return (
    <div className="max-w-lg mx-auto">
      <Link to="/dashboard" className="text-sm text-slate-500">← Back</Link>
      <div className="bg-white rounded-2xl shadow-sm p-6 mt-3">
        <h2 className="text-xl font-semibold mb-4">Create a group</h2>
        <form
          onSubmit={(e) => {
            e.preventDefault()
            mutation.mutate()
          }}
        >
          <Field label="Group name" name="name" value={form.name} onChange={onChange} required minLength={2} maxLength={60} />
          <Field label="Description (optional)" name="description" value={form.description} onChange={onChange} maxLength={200} />
          <Field label="Monthly amount per member (₹)" type="number" name="monthlyAmount" value={form.monthlyAmount} onChange={onChange} min="1" required />
          <Field label="Savings goal (₹, optional)" type="number" name="goalAmount" value={form.goalAmount} onChange={onChange} min="0" />
          <Field label="Due day of every month (1 to 28)" type="number" name="dueDay" value={form.dueDay} onChange={onChange} min="1" max="28" required />

          <label className="flex items-start gap-2 mb-5 text-sm">
            <input
              type="checkbox"
              className="mt-1"
              checked={form.requireApproval}
              onChange={(e) => setForm({ ...form, requireApproval: e.target.checked })}
            />
            <span>
              <span className="font-medium">I approve each new member</span>
              <span className="block text-slate-500">People who use your invite code wait until you accept them.</span>
            </span>
          </label>

          {mutation.isError && <p className="text-red-600 text-sm mb-3">{errorMessage(mutation.error, 'Could not create the group')}</p>}
          <button
            type="submit"
            disabled={mutation.isPending}
            className="w-full rounded-lg bg-emerald-600 text-white py-2.5 font-medium hover:bg-emerald-700 disabled:opacity-60"
          >
            {mutation.isPending ? 'Creating...' : 'Create group'}
          </button>
        </form>
      </div>
    </div>
  )
}
