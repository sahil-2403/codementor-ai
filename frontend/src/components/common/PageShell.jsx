import { cn } from '../../utils/cn.js';

export default function PageShell({ children, className = '' }) {
  return <div className={cn('space-y-6', className)}>{children}</div>;
}
