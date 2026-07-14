export default function Input({ label, error, ...props }) {
  return <label className="block space-y-1.5">
    {label && <span className="text-sm font-semibold text-slate-700">{label}</span>}
    <input className="w-full rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100" {...props} />
    {error && <span className="text-sm text-rose-600">{error}</span>}
  </label>;
}
