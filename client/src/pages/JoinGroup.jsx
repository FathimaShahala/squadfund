import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { joinGroup, errorMessage } from '../api/groups'
import { Field } from '../components/AuthCard'

// Works for /join (type the code) and /join/ABCD2345 (invite link)
export default function JoinGroup() {
  const { code: codeFromLink } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [code, setCode] = useState((codeFromLink || '').toUpperCase())

  const mutation = useMutation({
    mutationFn: () => joinGroup(code.trim()),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['groups'] })
      // pending: go to the list where the "Awaiting approval" badge shows
      navigate(data.status === 'active' ? `/groups/${data.group.id}` : '/dashboard', { replace: true })
    },
  })

  return (
    <div className="max-w-md mx-auto">
      <Link to="/dashboard" className="text-sm text-slate-500">← Back</Link>
      <div className="bg-white rounded-2xl shadow-sm p-6 mt-3">
        <h2 className="text-xl font-semibold mb-1">Join a group</h2>
        <p className="text-slate-500 text-sm mb-4">Enter the invite code you got from the group admin.</p>
        <form
          onSubmit={(e) => {
            e.preventDefault()
            mutation.mutate()
          }}
        >
          <Field
            label="Invite code"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="e.g. K7M2QX9P"
            required
            autoFocus
          />
          {mutation.isError && <p className="text-red-600 text-sm mb-3">{errorMessage(mutation.error, 'Could not join')}</p>}
          <button
            type="submit"
            disabled={mutation.isPending}
            className="w-full rounded-lg bg-emerald-600 text-white py-2.5 font-medium hover:bg-emerald-700 disabled:opacity-60"
          >
            {mutation.isPending ? 'Joining...' : 'Join group'}
          </button>
        </form>
      </div>
    </div>
  )
}
