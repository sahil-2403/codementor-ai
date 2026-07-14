import { cn } from '../../utils/cn.js';
export default function Badge({ children, className = '' }) {
  return <span className={cn('inline-flex items-center rounded-full bg-indigo-50 px-3 py-1 text-xs font-bold text-indigo-700', className)}>{children}</span>;
}
