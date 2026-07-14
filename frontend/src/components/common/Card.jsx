import { cn } from '../../utils/cn.js';
export default function Card({ children, className = '' }) {
  return <div className={cn('glass rounded-[2rem] p-6 shadow-soft', className)}>{children}</div>;
}
