import { cn } from '../../utils/cn.js';

export default function Skeleton({ className = '' }) {
  return <div className={cn('ui-skeleton', className)} aria-hidden="true" />;
}
