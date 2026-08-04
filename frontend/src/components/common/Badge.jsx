import { cn } from '../../utils/cn.js';

const variants = {
  info: 'ui-badge--info',
  success: 'ui-badge--success',
  warning: 'ui-badge--warning',
  danger: 'ui-badge--danger',
  neutral: 'ui-badge--neutral'
};

export default function Badge({ children, className = '', variant = 'info', ...props }) {
  return <span className={cn('ui-badge', variants[variant] || variants.info, className)} {...props}>{children}</span>;
}
