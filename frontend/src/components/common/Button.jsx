import { forwardRef } from 'react';
import { cn } from '../../utils/cn.js';

const variants = {
  primary: 'ui-button--primary',
  secondary: 'ui-button--secondary',
  ghost: 'ui-button--ghost',
  danger: 'ui-button--danger'
};

const Button = forwardRef(function Button({ children, className = '', variant = 'primary', isLoading = false, loadingLabel = 'Loading...', disabled = false, ...props }, ref) {
  return <button
    ref={ref}
    className={cn('ui-button', variants[variant] || variants.primary, className)}
    disabled={disabled || isLoading}
    aria-busy={isLoading || undefined}
    {...props}
  >
    {isLoading ? <><span className="ui-spinner ui-spinner--sm" aria-hidden="true" /> {loadingLabel}</> : children}
  </button>;
});

export default Button;
