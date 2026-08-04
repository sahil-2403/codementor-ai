const checks = [
  ['8+ characters', (value) => value.length >= 8],
  ['Uppercase', (value) => /[A-Z]/.test(value)],
  ['Lowercase', (value) => /[a-z]/.test(value)],
  ['Number', (value) => /[0-9]/.test(value)],
  ['Special character', (value) => /[^A-Za-z0-9]/.test(value)]
];

const strength = {
  weak: { label: 'Weak', barClass: 'bg-error', textClass: 'text-error' },
  medium: { label: 'Medium', barClass: 'bg-warning', textClass: 'text-warning' },
  strong: { label: 'Strong', barClass: 'bg-success', textClass: 'text-success' }
};

export default function PasswordStrengthMeter({ value = '' }) {
  const score = checks.filter(([, test]) => test(value)).length;
  const level = score <= 2 ? 'weak' : score <= 4 ? 'medium' : 'strong';
  const current = strength[level];
  const percentage = (score / checks.length) * 100;

  return <div className="space-y-2" aria-live="polite">
    <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground">
      <span>Password strength</span>
      <span className={current.textClass}>{current.label}</span>
    </div>
    <div
      className="h-2 overflow-hidden rounded-full bg-surface-secondary"
      role="progressbar"
      aria-label="Password strength"
      aria-valuemin="0"
      aria-valuemax={checks.length}
      aria-valuenow={score}
      aria-valuetext={`${current.label}: ${score} of ${checks.length} requirements met`}
    >
      <div className={`${current.barClass} h-full rounded-full transition-all`} style={{ width: `${percentage}%` }} />
    </div>
    <div className="flex flex-wrap gap-2">
      {checks.map(([label, test]) => {
        const passed = test(value);
        return <span key={label} className={`rounded-full px-2.5 py-1 text-xs font-semibold ${passed ? 'bg-success-soft text-success' : 'bg-surface-secondary text-muted-foreground'}`}>
          {label}
        </span>;
      })}
    </div>
  </div>;
}
