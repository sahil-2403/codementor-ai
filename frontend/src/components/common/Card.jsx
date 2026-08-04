import { cn } from '../../utils/cn.js';

export default function Card({ children, className = '', ...props }) {
  return <div className={cn('ui-card', className)} {...props}>{children}</div>;
}
