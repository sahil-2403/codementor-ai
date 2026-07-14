import { AlertTriangle, CheckCircle2, Info } from 'lucide-react';
import { cn } from '../../utils/cn.js';

const tones = {
  info: ['border-indigo-100 bg-indigo-50 text-indigo-900', Info],
  success: ['border-emerald-100 bg-emerald-50 text-emerald-900', CheckCircle2],
  warning: ['border-amber-100 bg-amber-50 text-amber-900', AlertTriangle],
  danger: ['border-rose-100 bg-rose-50 text-rose-900', AlertTriangle]
};

export default function InlineAlert({ tone = 'info', title, children, className = '' }) {
  const [toneClass, Icon] = tones[tone] || tones.info;
  return <div className={cn('flex gap-3 rounded-3xl border p-4', toneClass, className)}>
    <Icon className="mt-0.5 shrink-0" size={18} />
    <div>{title && <p className="font-black">{title}</p>}<div className="text-sm leading-6 opacity-90">{children}</div></div>
  </div>;
}
