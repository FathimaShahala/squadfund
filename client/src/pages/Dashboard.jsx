import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '../context/AuthContext'
import { fetchGroups, rupees } from '../api/groups'

export default function Dashboard() {
  const { user } = useAuth()
  const { data: groups, isLoading, isError } = useQuery({ queryKey: ['groups'], queryFn: fetchGroups })

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold">Hi {user.name.split(' ')[0]} 👋</h2>
          <p className="text-slate-500">Your savings groups</p>
        </div>
        <div className="flex gap-2">
          <Link to="/join" className="rounded-lg border border-emerald-600 text-emerald-700 px-4 py-2 text-sm font-medium">
            Join with code
          </Link>
          <Link to="/groups/new" className="rounded-lg bg-emerald-600 text-white px-4 py-2 text-sm font-medium hover:bg-emerald-700">
            + New group
          </Link>
        </div>
      </div>

      {isLoading && <p className="mt-8 text-slate-400">Loading groups...</p>}
      {isError && <p className="mt-8 text-red-600">Could not load your groups. Please refresh.</p>}

      {groups?.length === 0 && (
        <div className="mt-8 bg-white rounded-2xl p-8 text-center shadow-sm">
          <p className="font-medium">You are not in any group yet</p>
          <p className="text-slate-500 text-sm mt-1">Create one for your friends or family, or join with an invite code.</p>
        </div>
      )}

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {groups?.map((g) => {
          const pending = g.membershipStatus === 'pending'
          const card = (
            <div className={`bg-white rounded-2xl p-5 shadow-sm h-full ${pending ? 'opacity-70' : 'hover:shadow-md transition'}`}>
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-semibold text-lg">{g.name}</h3>
                {pending ? (
                  <span className="text-xs bg-amber-100 text-amber-700 rounded-full px-2 py-0.5">Awaiting approval</span>
                ) : (
                  g.myRole === 'admin' && (
                    <span className="text-xs bg-emerald-100 text-emerald-700 rounded-full px-2 py-0.5">Admin</span>
                  )
                )}
              </div>
              <p className="text-slate-500 text-sm mt-1">
                {rupees(g.monthlyAmount)} / month · {g.memberCount} member{g.memberCount === 1 ? '' : 's'}
              </p>
            </div>
          )
          return pending ? <div key={g.id}>{card}</div> : <Link key={g.id} to={`/groups/${g.id}`}>{card}</Link>
        })}
      </div>
    </>
  )
}
