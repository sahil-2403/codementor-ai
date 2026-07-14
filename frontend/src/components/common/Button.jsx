import { cn } from '../../utils/cn.js';
export default function Button({ children, className = '', variant = 'primary', isLoading = false, disabled = false, ...props }) {
  const variants = {
    primary: 'bg-slate-950 text-white hover:bg-slate-800',
    secondary: 'bg-white text-slate-900 border border-slate-200 hover:bg-slate-50',
    ghost: 'text-slate-700 hover:bg-slate-100'
  };
  return <button className={cn('inline-flex items-center justify-center rounded-2xl px-4 py-2.5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60', variants[variant], className)} disabled={disabled || isLoading} {...props}>{isLoading ? 'Loading...' : children}</button>;
}
