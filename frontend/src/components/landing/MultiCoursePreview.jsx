import { Check, Route } from 'lucide-react';

const courses = [
  ['JavaScript', 'Intermediate', 42, true],
  ['React', 'Beginner', 18, false],
  ['Node.js', 'Beginner', 12, false]
];

export default function MultiCoursePreview() {
  return <section className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr] lg:items-center" aria-labelledby="multi-course-title">
    <div>
      <p className="ui-eyebrow">Keep learning across courses</p>
      <h2 id="multi-course-title" className="ui-page-title">Learn more than one technology without losing progress</h2>
      <p className="ui-page-description">
        Enroll in multiple courses or learning paths, switch between them from your Dashboard, and keep each course's roadmap and progress separate.
      </p>
      <div className="mt-6 space-y-3 text-sm text-muted-foreground">
        {[
          'One current course at a time keeps the learning flow clear.',
          'Previous course progress stays saved when you switch.',
          'New enrollments use the same guided setup and roadmap flow.'
        ].map((item) => <div key={item} className="flex items-start gap-2.5">
          <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-success-soft text-success"><Check size={14} aria-hidden="true" /></span>
          <p className="leading-6">{item}</p>
        </div>)}
      </div>
    </div>

    <div className="rounded-panel border border-border bg-surface p-5 shadow-soft sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="ui-eyebrow">Your learning</p>
          <h3 className="mt-1 text-xl font-bold text-foreground">Course switcher</h3>
        </div>
        <span className="grid h-10 w-10 place-items-center rounded-surface bg-primary-soft text-primary" aria-hidden="true"><Route size={19} /></span>
      </div>

      <div className="mt-5 space-y-3">
        {courses.map(([title, level, progress, current]) => <div key={title} className={`rounded-surface border p-4 ${current ? 'border-primary/30 bg-primary-soft/50' : 'border-border bg-surface'}`}>
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <p className="truncate font-bold text-foreground">{title}</p>
                {current && <span className="ui-badge ui-badge--info">Current</span>}
              </div>
              <p className="mt-1 text-sm text-muted-foreground">{level}</p>
            </div>
            <p className="shrink-0 text-sm font-bold text-foreground">{progress}%</p>
          </div>
          <div
            className="mt-3 h-1.5 overflow-hidden rounded-full bg-surface-secondary"
            role="progressbar"
            aria-label={`${title} course progress`}
            aria-valuemin="0"
            aria-valuemax="100"
            aria-valuenow={progress}
          >
            <div className="h-full rounded-full bg-primary" style={{ width: `${progress}%` }} />
          </div>
        </div>)}
      </div>

      <div className="mt-4 rounded-control border border-dashed border-border bg-surface-secondary px-4 py-3 text-center text-sm font-semibold text-muted-foreground">
        + Enroll new course
      </div>
    </div>
  </section>;
}
