const checks = [
  ['8+ chars', (value) => value.length >= 8],
  ['Uppercase', (value) => /[A-Z]/.test(value)],
  ['Lowercase', (value) => /[a-z]/.test(value)],
  ['Number', (value) => /[0-9]/.test(value)],
  ['Special', (value) => /[^A-Za-z0-9]/.test(value)]
];

export default function PasswordStrengthMeter({ value = '' }) {
  const score = checks.filter(([, test]) => test(value)).length;
  const label = score <= 2 ? 'Weak' : score <= 4 ? 'Medium' : 'Strong';
  const bar = score <= 2 ? 'bg-rose-500' : score <= 4 ? 'bg-amber-500' : 'bg-emerald-500';
  return <div className="space-y-2">
    <div className="flex items-center justify-between text-xs font-bold text-slate-500"><span>Password strength</span><span>{label}</span></div>
    <div className="h-2 overflow-hidden rounded-full bg-slate-100"><div className={`${bar} h-full rounded-full transition-all`} style={{ width: `${(score / checks.length) * 100}%` }} /></div>
    <div className="flex flex-wrap gap-2">
      {checks.map(([labelText, test]) => <span key={labelText} className={`rounded-full px-2 py-1 text-xs font-bold ${test(value) ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>{labelText}</span>)}
    </div>
  </div>;
}
