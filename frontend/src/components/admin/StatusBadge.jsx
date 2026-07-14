import Badge from '../common/Badge.jsx';

export default function StatusBadge({ status }) {
  const styles = {
    published: 'bg-emerald-50 text-emerald-700',
    draft: 'bg-amber-50 text-amber-700',
    archived: 'bg-slate-100 text-slate-600'
  };
  return <Badge className={styles[status] || ''}>{status || 'unknown'}</Badge>;
}
