import { Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';

export default function PasswordInput({ label = 'Password', registration, error, placeholder = 'Password', autoComplete = 'current-password', compact = false }) {
  const [visible, setVisible] = useState(false);
  return <label className="block space-y-1.5">
    <span className="ui-field-label">{label}</span>
    <div className={`ui-input-shell ${error ? 'ui-input-shell--error' : ''}`}>
      <input
        type={visible ? 'text' : 'password'}
        placeholder={placeholder}
        autoComplete={autoComplete}
        className={`min-w-0 flex-1 rounded-control bg-transparent px-3.5 ${compact ? 'py-2.5' : 'py-3'} text-sm text-foreground outline-none placeholder:text-muted-foreground/70`}
        aria-invalid={Boolean(error)}
        {...registration}
      />
      <button
        type="button"
        onClick={() => setVisible((value) => !value)}
        className={`ui-input-action ${compact ? '!py-2.5' : ''}`}
        aria-label={visible ? 'Hide password' : 'Show password'}
        aria-pressed={visible}
      >
        {visible ? <EyeOff size={18} /> : <Eye size={18} />}
      </button>
    </div>
    {error ? <p className="ui-field-error">{error}</p> : null}
  </label>;
}
