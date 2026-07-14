import { Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';

export default function PasswordInput({ label = 'Password', registration, error, placeholder = 'Password', autoComplete = 'current-password' }) {
  const [visible, setVisible] = useState(false);
  return <label className="block space-y-1.5">
    <span className="text-sm font-semibold text-slate-700">{label}</span>
    <div className={`flex items-center rounded-2xl border bg-white/80 transition focus-within:border-indigo-400 focus-within:ring-4 focus-within:ring-indigo-100 ${error ? 'border-rose-300' : 'border-slate-200'}`}>
      <input
        type={visible ? 'text' : 'password'}
        placeholder={placeholder}
        autoComplete={autoComplete}
        className="min-w-0 flex-1 rounded-2xl bg-transparent px-4 py-3 outline-none"
        {...registration}
      />
      <button type="button" onClick={() => setVisible((value) => !value)} className="px-4 text-slate-500 hover:text-slate-950" aria-label={visible ? 'Hide password' : 'Show password'}>
        {visible ? <EyeOff size={18} /> : <Eye size={18} />}
      </button>
    </div>
    {error ? <p className="text-sm font-medium text-rose-600">{error}</p> : null}
  </label>;
}
