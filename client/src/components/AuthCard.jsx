export default function AuthCard({ title, subtitle, children }) {
  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="bg-white rounded-2xl shadow p-8 w-full max-w-md">
        <h1 className="text-3xl font-bold text-emerald-600 text-center">SquadFund</h1>
        <h2 className="text-xl font-semibold mt-6">{title}</h2>
        <p className="text-slate-500 text-sm mb-6">{subtitle}</p>
        {children}
      </div>
    </div>
  )
}

export function Field({ label, ...props }) {
  return (
    <label className="block mb-4">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      <input
        className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
        {...props}
      />
    </label>
  )
}

export function SubmitButton({ loading, children }) {
  return (
    <button
      type="submit"
      disabled={loading}
      className="w-full rounded-lg bg-emerald-600 text-white py-2.5 font-medium hover:bg-emerald-700 disabled:opacity-60"
    >
      {loading ? 'Please wait...' : children}
    </button>
  )
}
