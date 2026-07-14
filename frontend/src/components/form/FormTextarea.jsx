export default function FormTextarea({ label, error, registration, className = '', ...props }) {
  return <label className="block space-y-1.5">
    {label && <span className="text-sm font-semibold text-slate-700">{label}</span>}
    <textarea
      className={`w-full rounded-3xl border border-slate-200 bg-white p-4 text-sm leading-7 outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 ${className}`}
      {...registration}
      {...props}
    />
    {error && <span className="text-sm text-rose-600">{error}</span>}
  </label>;
}
