import { forwardRef } from 'react';
import { cn } from '../../utils/cn.js';

const Input = forwardRef(function Input({ label, error, className = '', ...props }, ref) {
  return <label className="block space-y-1.5">
    {label && <span className="ui-field-label">{label}</span>}
    <input ref={ref} className={cn('ui-field-control', className)} aria-invalid={Boolean(error)} {...props} />
    {error && <span className="ui-field-error">{error}</span>}
  </label>;
});

export default Input;
