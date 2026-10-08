import { forwardRef } from 'react';
import { cn } from '../../utils/cn.js';

const Textarea = forwardRef(function Textarea({ label, error, className = '', ...props }, ref) {
  return (
    <label className="block space-y-1.5">
      {label && <span className="ui-field-label">{label}</span>}
      <textarea
        ref={ref}
        className={cn('ui-field-control min-h-32 resize-y leading-7', className)}
        aria-invalid={Boolean(error)}
        {...props}
      />
      {error && <span className="ui-field-error">{error}</span>}
    </label>
  );
});

export default Textarea;
