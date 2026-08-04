import Card from '../common/Card.jsx';

export default function ProgressChart({ value = 0, completed = 0, total = 0, title = 'Course progress' }) {
  const safeValue = Math.max(0, Math.min(100, Number(value || 0)));
  return <Card className="overflow-hidden">
    <div className="flex items-start justify-between gap-4">
      <div>
        <h3 className="text-xl font-bold text-foreground">{title}</h3>
        <p className="mt-1 text-sm leading-6 text-muted-foreground">{total ? `${completed || 0}/${total} lessons completed in the active roadmap.` : 'Completion is calculated from lessons in the active roadmap.'}</p>
      </div>
      <div className="grid h-16 w-16 shrink-0 place-items-center rounded-surface bg-primary-soft text-xl font-extrabold text-primary-strong">{safeValue}%</div>
    </div>
    <div className="mt-6 h-3 overflow-hidden rounded-full bg-surface-secondary" role="progressbar" aria-label={title} aria-valuemin="0" aria-valuemax="100" aria-valuenow={safeValue}>
      <div className="h-full rounded-full bg-primary transition-all duration-700" style={{ width: `${safeValue}%` }} />
    </div>
    <p className="mt-4 rounded-surface bg-surface-secondary p-3 text-sm leading-6 text-muted-foreground">This percentage uses completed lesson IDs from your current course progress.</p>
  </Card>;
}
