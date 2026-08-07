export default function QuizProgress({
  current = 0,
  total = 0,
  label = 'Quiz completion'
}) {
  const safeCurrent = Math.max(
    0,
    Math.min(Number(current) || 0, Number(total) || 0)
  );
  const percent = total ? Math.round((safeCurrent / total) * 100) : 0;

  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-4 text-xs font-semibold text-muted-foreground sm:text-sm">
        <span>
          {safeCurrent}/{total} answered
        </span>
        <span>{percent}%</span>
      </div>
      <div
        className="h-2 overflow-hidden rounded-full bg-surface-secondary"
        role="progressbar"
        aria-label={label}
        aria-valuemin="0"
        aria-valuemax="100"
        aria-valuenow={percent}
      >
        <div
          className="h-full rounded-full bg-gradient-to-r from-primary via-violet-500 to-blue-500 transition-all duration-300"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
