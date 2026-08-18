import { useId, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Atom,
  BookOpen,
  CheckCircle2,
  ChevronDown,
  Circle,
  CircleDot,
  Cloud,
  Code2,
  Database,
  FlaskConical,
  LockKeyhole,
  Network,
  Server,
  ShieldCheck,
  ClipboardCheck,
} from 'lucide-react';
import Badge from '../common/Badge.jsx';
import StatusPill from '../common/StatusPill.jsx';
import { cn } from '../../utils/cn.js';

const moduleVisuals = [
  { match: /react/i, icon: Atom, className: 'bg-cyan-50 text-cyan-700 ring-cyan-100' },
  { match: /mongo|database/i, icon: Database, className: 'bg-emerald-50 text-emerald-700 ring-emerald-100' },
  { match: /auth|security/i, icon: ShieldCheck, className: 'bg-violet-50 text-violet-700 ring-violet-100' },
  { match: /practice|exercise|challenge/i, icon: Code2, className: 'bg-blue-50 text-blue-700 ring-blue-100' },
  { match: /deploy|cloud/i, icon: Cloud, className: 'bg-sky-50 text-sky-700 ring-sky-100' },
  { match: /test/i, icon: FlaskConical, className: 'bg-rose-50 text-rose-700 ring-rose-100' },
  { match: /express|api|rest/i, icon: Network, className: 'bg-orange-50 text-orange-700 ring-orange-100' },
  { match: /node/i, icon: Server, className: 'bg-green-50 text-green-700 ring-green-100' },
  { match: /html|css|frontend/i, icon: Code2, className: 'bg-indigo-50 text-indigo-700 ring-indigo-100' },
];

const getModuleVisual = (title = '') => moduleVisuals.find((item) => item.match.test(title)) || {
  icon: BookOpen,
  className: 'bg-primary-soft text-primary-strong ring-primary/10',
};

const getLessonIcon = (status, locked) => {
  if (locked) return LockKeyhole;
  if (status === 'completed') return CheckCircle2;
  if (status === 'in_progress') return CircleDot;
  return Circle;
};

const cleanPriorityTitle = (title = '') => title.replace(/^priority review\s*[:–—-]?\s*/i, '').trim();

export default function ModuleCard({
  module,
  index = 0,
  lessonNumberStart = 1,
  isLast = false,
  defaultExpanded = false,
  isCurrent = false,
  isRevisionLevel = false
}) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const contentId = useId();
  const lessons = module.lessons || [];
  const completed = lessons.filter((item) => item.status === 'completed').length;
  const total = lessons.length;
  const completion = total ? Math.round((completed / total) * 100) : 0;
  const locked = module.status === 'locked';
  const completedModule = module.status === 'completed';
  const inProgress = module.status === 'in_progress' || lessons.some((item) => item.status === 'in_progress');
  const hasQuiz = Boolean(module._id && module.quizQuestions?.length);
  const hadPriorityTitle = /^priority review\b/i.test(module.title || '');
  const displayTitle = cleanPriorityTitle(module.title) || module.title || `Module ${index + 1}`;
  const highPriority = Boolean(module.highPriority || hadPriorityTitle);
  const visual = getModuleVisual(displayTitle);
  const ModuleIcon = visual.icon;

  const timelineNode = completedModule
    ? <CheckCircle2 size={17} aria-hidden="true" />
    : locked
      ? <LockKeyhole size={14} aria-hidden="true" />
      : index + 1;

  return (
    <article className="relative grid grid-cols-[36px_minmax(0,1fr)] gap-3 sm:grid-cols-[44px_minmax(0,1fr)] sm:gap-4">
      {!isLast && (
        <span
          className={cn(
            'absolute left-[17px] top-9 -bottom-4 w-px sm:left-[21px]',
            completedModule ? 'bg-success/30' : inProgress ? 'bg-primary/25' : 'bg-border',
          )}
          aria-hidden="true"
        />
      )}

      <div className="relative z-10 flex justify-center pt-3">
        <span
          className={cn(
            'grid h-9 w-9 place-items-center rounded-full border text-xs font-bold shadow-sm transition duration-200 sm:h-10 sm:w-10',
            completedModule && 'border-success bg-success text-white',
            inProgress && !completedModule && 'border-primary bg-primary text-white',
            !completedModule && !inProgress && !locked && 'border-primary/30 bg-surface text-primary-strong',
            locked && 'border-border bg-surface-secondary text-muted-foreground',
          )}
          aria-label={`Module ${index + 1}: ${module.status || 'available'}`}
        >
          {timelineNode}
        </span>
      </div>

      <section
        className={cn(
          'overflow-hidden rounded-surface border bg-surface transition duration-200',
          completedModule && 'border-success/20',
          inProgress && !completedModule && 'border-primary/30',
          locked && 'border-border bg-surface/80',
          !completedModule && !inProgress && !locked && 'border-border hover:border-primary/20',
        )}
      >
        <button
          type="button"
          className="w-full p-4 text-left sm:p-5"
          onClick={() => setExpanded((value) => !value)}
          aria-expanded={expanded}
          aria-controls={contentId}
        >
          <div className="flex items-start gap-3 sm:gap-4">
            <span className={cn('grid h-10 w-10 shrink-0 place-items-center rounded-control ring-1 sm:h-11 sm:w-11', visual.className)} aria-hidden="true">
              <ModuleIcon size={19} />
            </span>

            <div className="min-w-0 flex-1">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground">Module {index + 1}</p>
                  <h3 className="mt-1 text-base font-bold text-foreground sm:text-lg">{displayTitle}</h3>
                  {module.description && <p className="mt-1 line-clamp-2 max-w-3xl text-xs leading-5 text-muted-foreground sm:text-sm">{module.description}</p>}
                </div>

                <div className="flex shrink-0 flex-wrap items-center gap-2">
                  {isCurrent && <Badge variant="info">Current</Badge>}
                  {highPriority && <Badge variant="warning">{isRevisionLevel ? 'Revision needed' : 'High priority'}</Badge>}
                  <StatusPill status={module.status || 'available'} />
                  <ChevronDown
                    size={17}
                    className={cn('text-muted-foreground transition-transform duration-200', expanded && 'rotate-180')}
                    aria-hidden="true"
                  />
                </div>
              </div>

              {highPriority && module.focusReason && (
                <p className="mt-3 rounded-control bg-warning-soft px-3 py-2 text-xs font-medium leading-5 text-foreground sm:text-sm">
                  {module.focusReason}
                </p>
              )}

              <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-secondary" role="progressbar" aria-label={`${displayTitle} completion`} aria-valuemin="0" aria-valuemax="100" aria-valuenow={completion}>
                  <div
                    className={cn('h-full rounded-full transition-all duration-500', completedModule ? 'bg-success' : locked ? 'bg-muted-foreground' : 'bg-primary')}
                    style={{ width: `${completion}%` }}
                  />
                </div>
                <p className="shrink-0 text-xs font-semibold text-muted-foreground">
                  {completed}/{total} lessons{Number(module.durationDays) > 0 ? ` · About ${module.durationDays} days` : ''}
                </p>
              </div>
            </div>
          </div>
        </button>

        {expanded && (
          <div id={contentId} className="border-t border-border/80 bg-surface">
            {lessons.length ? (
              <ol className="divide-y divide-border/80 px-4 sm:px-5">
                {lessons.map((item, lessonIndex) => {
                  const lesson = item.lesson;
                  const lessonId = lesson?._id || (typeof lesson === 'string' ? lesson : null);
                  const lessonNumber = lessonNumberStart + lessonIndex;
                  const lessonTitle = lesson?.title || `Lesson ${lessonNumber}`;
                  const lessonLocked = item.status === 'locked' || !lessonId;
                  const activeLesson = item.status === 'available' || item.status === 'in_progress';
                  const LessonIcon = getLessonIcon(item.status, lessonLocked);

                  const rowContent = (
                    <>
                      <div className="flex min-w-0 items-center gap-3">
                        <span
                          className={cn(
                            'grid h-8 w-8 shrink-0 place-items-center rounded-full',
                            lessonLocked && 'bg-surface-secondary text-muted-foreground',
                            item.status === 'completed' && !lessonLocked && 'bg-success-soft text-success',
                            activeLesson && !lessonLocked && 'bg-primary-soft text-primary-strong',
                            !lessonLocked && !activeLesson && item.status !== 'completed' && 'bg-surface-secondary text-muted-foreground',
                          )}
                          aria-hidden="true"
                        >
                          <LessonIcon size={15} />
                        </span>
                        <div className="min-w-0">
                          <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Lesson {lessonNumber}</p>
                          <p className={cn('mt-0.5 truncate text-sm font-semibold', lessonLocked ? 'text-muted-foreground' : 'text-foreground')}>{lessonTitle}</p>
                        </div>
                      </div>
                      <StatusPill status={lessonLocked ? 'locked' : item.status} />
                    </>
                  );

                  return (
                    <li key={lessonId || `${module._id || module.title}-${lessonIndex}`}>
                      {lessonLocked ? (
                        <div className="flex items-center justify-between gap-4 px-1 py-3.5" aria-disabled="true">{rowContent}</div>
                      ) : (
                        <Link
                          to={`/lessons/${lessonId}`}
                          className={cn(
                            'group flex items-center justify-between gap-4 rounded-control px-1 py-3.5 transition hover:px-2 hover:bg-surface-secondary/70',
                            activeLesson && 'bg-primary-soft/40 px-2',
                          )}
                        >
                          {rowContent}
                        </Link>
                      )}
                    </li>
                  );
                })}
              </ol>
            ) : (
              <p className="px-5 py-5 text-sm text-muted-foreground">No lessons are available in this module yet.</p>
            )}

            <div className="flex flex-col gap-3 border-t border-border/80 bg-surface-secondary/35 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
              <div className="flex items-start gap-2">
                <ClipboardCheck size={17} className="mt-0.5 shrink-0 text-primary-strong" aria-hidden="true" />
                <div>
                  <p className="text-sm font-semibold text-foreground">Module quiz</p>
                  <p className="mt-0.5 text-xs leading-5 text-muted-foreground">Check your understanding when a quiz is available.</p>
                </div>
              </div>

              {locked ? (
                <span className="inline-flex min-h-9 items-center gap-2 self-start rounded-control border border-border bg-surface px-3 text-xs font-semibold text-muted-foreground sm:self-auto" aria-disabled="true">
                  <LockKeyhole size={14} aria-hidden="true" /> Module locked
                </span>
              ) : hasQuiz ? (
                <Link to={`/quizzes/${module._id}`} className="ui-button ui-button--secondary min-h-9 shrink-0 px-3.5 text-xs">
                  <ClipboardCheck size={15} aria-hidden="true" /> Take quiz
                </Link>
              ) : (
                <span className="inline-flex min-h-9 items-center rounded-control border border-border bg-surface px-3 text-xs font-semibold text-muted-foreground">Quiz coming soon</span>
              )}
            </div>
          </div>
        )}
      </section>
    </article>
  );
}
