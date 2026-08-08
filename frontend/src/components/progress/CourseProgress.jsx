const toId = (value) => String(value?._id || value || '');

const clampPercent = (value) =>
  Math.max(0, Math.min(100, Number(value || 0)));

const moduleProgress = (module, completedLessonIds) => {
  const lessons = module?.lessons || [];
  const completedSet = new Set((completedLessonIds || []).map(toId));
  const completed = lessons.filter((item) => {
    const lessonId = toId(item?.lesson);
    return item?.status === 'completed' || completedSet.has(lessonId);
  }).length;
  const total = lessons.length;

  return {
    completed,
    total,
    value: total ? Math.round((completed / total) * 100) : 0
  };
};

function ProgressBar({ value, ariaLabel, className = 'h-3' }) {
  const safeValue = clampPercent(value);

  return (
    <div
      className={`${className} overflow-hidden rounded-full bg-surface-secondary`}
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
  );
}

export default function CourseProgress({
  variant = 'compact',
  value = 0,
  completedLessons = 0,
  totalLessons = 0,
  completedModules = 0,
  totalModules = 0,
  modules = [],
  completedLessonIds = [],
  action = null,
  className = ''
}) {
  const safeValue = clampPercent(value);

  if (variant === 'detailed') {
    return (
      <section
        className={`rounded-panel border border-border bg-surface p-5 shadow-sm sm:p-6 ${className}`}
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-primary-strong">
              Course progress
            </p>
            <h2 className="mt-1 text-xl font-bold text-foreground">
              Roadmap completion
            </h2>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              See your overall completion and how progress is distributed across each module.
            </p>
          </div>
          <div className="shrink-0 sm:text-right">
            <p className="text-4xl font-extrabold tracking-tight text-primary-strong">
              {safeValue}%
            </p>
            <p className="mt-1 text-xs font-semibold text-muted-foreground">
              Overall completion
            </p>
          </div>
        </div>

        <div className="mt-5">
          <ProgressBar value={safeValue} ariaLabel="Overall roadmap completion" />
        </div>

        <div className="mt-5 grid overflow-hidden rounded-panel border border-border bg-surface-secondary/45 sm:grid-cols-2">
          <div className="p-4 sm:p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              Modules completed
            </p>
            <p className="mt-2 text-2xl font-extrabold tracking-tight text-foreground">
              {completedModules} / {totalModules}
            </p>
          </div>
          <div className="border-t border-border p-4 sm:border-l sm:border-t-0 sm:p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              Lessons completed
            </p>
            <p className="mt-2 text-2xl font-extrabold tracking-tight text-foreground">
              {completedLessons} / {totalLessons}
            </p>
          </div>
        </div>

        {modules.length ? (
          <div className="mt-6 border-t border-border pt-5">
            <div>
              <p className="font-bold text-foreground">Progress by module</p>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                Lesson completion inside each part of your current roadmap.
              </p>
            </div>

            <div className="mt-4 space-y-4">
              {modules.map((module, index) => {
                const moduleStats = moduleProgress(module, completedLessonIds);

                return (
                  <div
                    key={module?._id || `${module?.title || 'module'}-${index}`}
                    className="rounded-surface border border-border bg-surface-secondary/35 p-4"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold text-foreground">
                          {module?.title || `Module ${index + 1}`}
                        </p>
                        <p className="mt-1 text-xs font-medium text-muted-foreground">
                          {moduleStats.completed} / {moduleStats.total} lessons completed
                        </p>
                      </div>
                      <span className="shrink-0 text-sm font-extrabold text-primary-strong">
                        {moduleStats.value}%
                      </span>
                    </div>
                    <div className="mt-3">
                      <ProgressBar
                        value={moduleStats.value}
                        ariaLabel={`${module?.title || `Module ${index + 1}`} completion`}
                        className="h-2"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : null}
      </section>
    );
  }

  return (
    <section
      className={`rounded-panel border border-border bg-surface p-4 shadow-sm sm:p-5 ${className}`}
    >
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
            Roadmap progress
          </p>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold tracking-tight text-primary-strong">
              {safeValue}%
            </span>
            <span className="text-xs font-semibold text-muted-foreground">
              complete
            </span>
          </div>
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>

      <div className="mt-3">
        <ProgressBar value={safeValue} ariaLabel="Roadmap progress" className="h-2" />
      </div>

      <p className="mt-3 text-xs font-semibold text-muted-foreground sm:text-sm">
        {completedLessons} of {totalLessons} lessons completed
      </p>
    </section>
  );
}
