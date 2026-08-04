import { cn } from '../../utils/cn.js';

export default function FormSelect({ label, error, className = '', children, ...props }) {
  return <label className="block space-y-1.5">
    {label && <span className="ui-field-label">{label}</span>}
    <select className={cn('ui-field-control', className)} aria-invalid={Boolean(error)} {...props}>{children}</select>
    {error && <span className="ui-field-error">{error}</span>}
  </label>;
}
