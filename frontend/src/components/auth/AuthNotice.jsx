import { cn } from '../../utils/cn.js';

const tones = {
  info: 'ui-alert--info',
  success: 'ui-alert--success',
  warning: 'ui-alert--warning',
  error: 'ui-alert--error'
};

export default function AuthNotice({ children, tone = 'info', className = '' }) {
  const isError = tone === 'error';
  return <div className={cn('ui-alert', tones[tone] || tones.info, className)} role={isError ? 'alert' : 'status'}>
    {children}
  </div>;
}
