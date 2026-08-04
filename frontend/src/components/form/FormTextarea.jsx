import { cn } from '../../utils/cn.js';

export default function FormTextarea({ label, error, registration, className = '', ...props }) {
  return <label className="block space-y-1.5">
    {label && <span className="ui-field-label">{label}</span>}
    <textarea className={cn('ui-field-control min-h-32 resize-y leading-7', className)} aria-invalid={Boolean(error)} {...registration} {...props} />
    {error && <span className="ui-field-error">{error}</span>}
  </label>;
}
