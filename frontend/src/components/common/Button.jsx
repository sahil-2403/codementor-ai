import { cn } from '../../utils/cn.js';

const variants = {
  primary: 'ui-button--primary',
  secondary: 'ui-button--secondary',
  ghost: 'ui-button--ghost',
  danger: 'ui-button--danger'
};

export default function Button({ children, className = '', variant = 'primary', isLoading = false, disabled = false, ...props }) {
  return <button
    className={cn('ui-button', variants[variant] || variants.primary, className)}
    disabled={disabled || isLoading}
    aria-busy={isLoading || undefined}
    {...props}
  >
    {isLoading ? <><span className="ui-spinner ui-spinner--sm" aria-hidden="true" /> Loading...</> : children}
  </button>;
}
