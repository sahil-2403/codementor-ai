export default function CourseProgress({
  value,
  completed,
  total,
  title = "Course progress",
  completionLabel = "Overall completion",
  ariaLabel = "Course progress",
  icon: Icon = null,
  variant = "panel",
  className = "",
}) {
  const safeValue = Math.max(0, Math.min(100, Number(value || 0)));
  const lessonSummary = total
    ? `${completed || 0} / ${total} lessons completed`
    : "Progress is based on completed lessons in your active roadmap.";

  const progressBar = (
    <div>
      <div
        className="relative h-3 overflow-hidden rounded-full bg-surface-secondary"
        role="progressbar"
        aria-label={ariaLabel}
        aria-valuemin="0"
        aria-valuemax="100"
        aria-valuenow={safeValue}
      >
        <div
          className="h-full rounded-full bg-gradient-to-r from-primary via-violet-500 to-blue-500 transition-all duration-700 ease-calm"
          style={{ width: `${safeValue}%` }}
        />
      </div>
    </div>
  );

  if (variant === "embedded") {
    return (
      <div className={className}>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-3">
            {Icon && (
              <span
                className="grid h-12 w-12 shrink-0 place-items-center rounded-surface bg-primary-soft text-primary-strong ring-1 ring-primary/10"
                aria-hidden="true"
              >
                <Icon size={21} />
              </span>
            )}
            <div className="min-w-0">
              <p className="text-base font-bold text-foreground sm:text-lg">{title}</p>
              <div className="mt-1 flex flex-wrap items-baseline gap-x-2 gap-y-1">
                <span className="text-3xl font-extrabold tracking-tight text-primary-strong">{safeValue}%</span>
                <span className="text-sm font-medium text-muted-foreground">{completionLabel}</span>
              </div>
            </div>
          </div>

          <p className="shrink-0 text-xs font-semibold text-muted-foreground sm:text-sm">
            {lessonSummary}
          </p>
        </div>

        <div className="mt-5">{progressBar}</div>
      </div>
    );
  }

  return (
    <section className={`rounded-panel border border-border bg-surface shadow-sm overflow-hidden p-5 sm:p-6 ${className}`}>
      <div className="grid gap-5 lg:grid-cols-[140px_minmax(0,1fr)] lg:items-center">
        <div>
          <p className="text-sm font-semibold text-muted-foreground">{title}</p>
          <p className="mt-2 text-4xl font-extrabold tracking-tight text-primary-strong">{safeValue}%</p>
          <p className="mt-1 text-xs font-medium text-muted-foreground">{completionLabel}</p>
        </div>

        <div>
          {progressBar}
          <div className="mt-2 grid grid-cols-5 text-[10px] font-medium text-muted-foreground">
            <span>0%</span>
            <span className="text-center">25%</span>
            <span className="text-center">50%</span>
            <span className="text-center">75%</span>
            <span className="text-right">100%</span>
          </div>
          <p className="mt-4 text-center text-xs font-semibold text-primary-strong sm:text-sm">{lessonSummary}</p>
        </div>
      </div>
    </section>
  );
}
