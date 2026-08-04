import { cn } from '../../utils/cn.js';

export default function PageShell({ children, className = '', ...props }) {
  return <div className={cn('space-y-6', className)} {...props}>{children}</div>;
}
