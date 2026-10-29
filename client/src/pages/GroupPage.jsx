import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  fetchGroup,
  fetchMembers,
  approveMember,
  removeMember,
  leaveGroup,
  regenerateInvite,
  errorMessage,
  rupees,
} from '../api/groups'

const TABS = [
  { key: 'overview', label: 'Overview' },
  { key: 'members', label: 'Members' },
  { key: 'contributions', label: 'Contributions', soon: true },
  { key: 'withdrawals', label: 'Withdrawals', soon: true },
]

export default function GroupPage() {
  const { groupId } = useParams()
  const [tab, setTab] = useState('overview')
  const { data: group, isLoading, isError } = useQuery({
    queryKey: ['group', groupId],
    queryFn: () => fetchGroup(groupId),
    retry: false,
  })

  if (isLoading) return <p className="text-slate-400">Loading...</p>
  if (isError) {
    return (
      <div className="bg-white rounded-2xl p-8 text-center shadow-sm">
        <p className="font-medium">Group not found</p>
        <p className="text-slate-500 text-sm mt-1">It may not exist, or you are not a member of it.</p>
        <Link to="/dashboard" className="inline-block mt-4 text-emerald-600 font-medium">Back to my groups</Link>
      </div>
    )
  }

  return (
    <>
      <Link to="/dashboard" className="text-sm text-slate-500">← My groups</Link>
      <h2 className="text-2xl font-semibold mt-2">{group.name}</h2>
      {group.description && <p className="text-slate-500">{group.description}</p>}

      <div className="flex gap-1 border-b border-slate-200 mt-5 overflow-x-auto">
        {TABS.map((t) => (
          <button
            key={t.key}
            disabled={t.soon}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2 text-sm whitespace-nowrap border-b-2 -mb-px ${
              tab === t.key ? 'border-emerald-600 text-emerald-700 font-medium' : 'border-transparent text-slate-500'
            } ${t.soon ? 'opacity-40 cursor-not-allowed' : ''}`}
          >
            {t.label}
            {t.soon && <span className="ml-1 text-[10px] uppercase">soon</span>}
          </button>
        ))}
      </div>

      <div className="mt-6">
        {tab === 'overview' && <Overview group={group} />}
        {tab === 'members' && <Members group={group} />}
      </div>
    </>
  )
}

function Stat({ label, value }) {
  return (
    <div className="bg-white rounded-xl p-4 shadow-sm">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="font-semibold text-lg mt-0.5">{value}</p>
    </div>
  )
}

function Overview({ group }) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const isAdmin = group.myRole === 'admin'
  const [copied, setCopied] = useState('')

  const copy = async (text, what) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(what)
      setTimeout(() => setCopied(''), 1500)
    } catch {
      window.prompt('Copy this:', text)
    }
  }

  const regen = useMutation({
    mutationFn: () => regenerateInvite(group.id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['group', group.id] }),
  })

  const leave = useMutation({
    mutationFn: () => leaveGroup(group.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groups'] })
      navigate('/dashboard', { replace: true })
    },
  })

  const link = `${window.location.origin}/join/${group.inviteCode}`

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Stat label="Monthly per member" value={rupees(group.monthlyAmount)} />
        <Stat label="Due day" value={`${group.dueDay} of every month`} />
        <Stat label="Goal" value={group.goalAmount ? rupees(group.goalAmount) : 'No goal'} />
        <Stat label="Members" value={group.memberCount} />
      </div>

      <div className="bg-white rounded-2xl p-5 shadow-sm">
        <h3 className="font-semibold">Invite people</h3>
        <p className="text-slate-500 text-sm">
          Share this code or link.
          {group.requireApproval && ' New people wait for admin approval.'}
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <code className="bg-slate-100 rounded-lg px-3 py-2 text-lg tracking-widest font-mono">{group.inviteCode}</code>
          <button onClick={() => copy(group.inviteCode, 'code')} className="text-sm text-emerald-700 font-medium px-2">
            {copied === 'code' ? 'Copied' : 'Copy code'}
          </button>
          <button onClick={() => copy(link, 'link')} className="text-sm text-emerald-700 font-medium px-2">
            {copied === 'link' ? 'Copied' : 'Copy link'}
          </button>
          {isAdmin && (
            <button
              onClick={() => window.confirm('The old code will stop working. Continue?') && regen.mutate()}
              disabled={regen.isPending}
              className="text-sm text-slate-500 px-2"
            >
              New code
            </button>
          )}
        </div>
        {regen.isError && <p className="text-red-600 text-sm mt-2">{errorMessage(regen.error)}</p>}
      </div>

      {!isAdmin && (
        <div>
          <button
            onClick={() => window.confirm(`Leave ${group.name}?`) && leave.mutate()}
            disabled={leave.isPending}
            className="text-sm text-red-600 font-medium"
          >
            Leave group
          </button>
          {leave.isError && <p className="text-red-600 text-sm mt-1">{errorMessage(leave.error)}</p>}
        </div>
      )}
    </div>
  )
}

function Members({ group }) {
  const queryClient = useQueryClient()
  const isAdmin = group.myRole === 'admin'
  const { data, isLoading, isError } = useQuery({
    queryKey: ['members', group.id],
    queryFn: () => fetchMembers(group.id),
  })

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ['members', group.id] })
    queryClient.invalidateQueries({ queryKey: ['group', group.id] })
  }
  const approve = useMutation({ mutationFn: (userId) => approveMember(group.id, userId), onSuccess: refresh })
  const remove = useMutation({ mutationFn: (userId) => removeMember(group.id, userId), onSuccess: refresh })

  if (isLoading) return <p className="text-slate-400">Loading members...</p>
  if (isError) return <p className="text-red-600">Could not load members.</p>

  const error = approve.error || remove.error

  return (
    <div className="space-y-6">
      {error && <p className="text-red-600 text-sm">{errorMessage(error)}</p>}

      {isAdmin && data.pending.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
          <h3 className="font-semibold text-amber-800">Waiting for your approval</h3>
          <ul className="mt-2 divide-y divide-amber-100">
            {data.pending.map((m) => (
              <li key={m.userId} className="py-2 flex items-center justify-between gap-2">
                <div>
                  <p className="font-medium">{m.name}</p>
                  <p className="text-xs text-slate-500">{m.email}</p>
                </div>
                <div className="flex gap-3 text-sm font-medium">
                  <button onClick={() => approve.mutate(m.userId)} className="text-emerald-700">Approve</button>
                  <button onClick={() => remove.mutate(m.userId)} className="text-red-600">Reject</button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      <ul className="bg-white rounded-2xl shadow-sm divide-y divide-slate-100">
        {data.members.map((m) => (
          <li key={m.userId} className="p-4 flex items-center justify-between gap-2">
            <div>
              <p className="font-medium">
                {m.name} {m.isMe && <span className="text-xs text-slate-400">(you)</span>}
              </p>
              <p className="text-xs text-slate-500">
                {m.email}
                {m.phone ? ` · ${m.phone}` : ''}
              </p>
            </div>
            <div className="flex items-center gap-3">
              {m.role === 'admin' && (
                <span className="text-xs bg-emerald-100 text-emerald-700 rounded-full px-2 py-0.5">Admin</span>
              )}
              {isAdmin && m.role !== 'admin' && (
                <button
                  onClick={() => window.confirm(`Remove ${m.name} from the group?`) && remove.mutate(m.userId)}
                  className="text-sm text-red-600"
                >
                  Remove
                </button>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
