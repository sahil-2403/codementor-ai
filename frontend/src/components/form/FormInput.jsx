import { cn } from '../../utils/cn.js';

export default function FormInput({ label, error, registration, className = '', ...props }) {
  return <label className="block space-y-1.5">
    {label && <span className="ui-field-label">{label}</span>}
    <input
      className={cn('ui-field-control', className)}
      aria-invalid={Boolean(error)}
      {...registration}
      {...props}
    />
    {error && <span className="ui-field-error">{error}</span>}
  </label>;
}
