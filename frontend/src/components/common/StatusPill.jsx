import Badge from './Badge.jsx';

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
  return <Badge variant={resolvedTone} className={`capitalize ${className}`}>{label}</Badge>;
}
