import Badge from './Badge.jsx';

const toneClass = {
  success: 'bg-emerald-50 text-emerald-700',
  warning: 'bg-amber-50 text-amber-700',
  danger: 'bg-rose-50 text-rose-700',
  info: 'bg-indigo-50 text-indigo-700',
  neutral: 'bg-slate-100 text-slate-700'
};

const statusTone = {
  published: 'success',
  active: 'success',
  completed: 'success',
  success: 'success',
  reviewed: 'success',
  draft: 'warning',
  queued: 'info',
  processing: 'warning',
  pending: 'warning',
  blocked: 'warning',
  failed: 'danger',
  archived: 'neutral',
  critical: 'danger',
  high: 'warning',
  medium: 'info',
  low: 'neutral'
};

export default function StatusPill({ status, tone, className = '' }) {
  const resolvedTone = tone || statusTone[String(status || '').toLowerCase()] || 'neutral';
  const label = String(status || 'unknown').replaceAll('_', ' ');
  return <Badge className={`${toneClass[resolvedTone]} capitalize ${className}`}>{label}</Badge>;
}
