import { cn } from '../../utils/cn.js';

const variants = {
  default: 'ui-card',
  compact: 'rounded-surface border border-border bg-surface p-4 sm:p-5'
};

export default function Card({ children, variant = 'default', className = '', ...props }) {
  return (
    <div className={cn(variants[variant] || variants.default, className)} {...props}>
      {children}
    </div>
  );
}
