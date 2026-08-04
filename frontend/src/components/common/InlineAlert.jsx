import { AlertTriangle, CheckCircle2, Info } from 'lucide-react';
import { cn } from '../../utils/cn.js';

const tones = {
  info: ['ui-alert--info', Info],
  success: ['ui-alert--success', CheckCircle2],
  warning: ['ui-alert--warning', AlertTriangle],
  danger: ['ui-alert--error', AlertTriangle]
};

export default function InlineAlert({ tone = 'info', title, children, className = '' }) {
  const [toneClass, Icon] = tones[tone] || tones.info;
  return <div className={cn('ui-alert flex gap-3', toneClass, className)} role={tone === 'danger' ? 'alert' : 'status'}>
    <Icon className="mt-0.5 shrink-0" size={18} aria-hidden="true" />
    <div>{title && <p className="font-semibold">{title}</p>}<div className="mt-0.5 text-sm leading-6 opacity-90">{children}</div></div>
  </div>;
}
