import { Link } from 'react-router-dom';
import { LockKeyhole } from 'lucide-react';
import Card from '../common/Card.jsx';
import Badge from '../common/Badge.jsx';
import StatusPill from '../common/StatusPill.jsx';
import { cn } from '../../utils/cn.js';

export default function ModuleCard({ module, index = 0 }) {
  const lessons = module.lessons || [];
  const completed = lessons.filter((item) => item.status === 'completed').length;
  const total = lessons.length;
  const completion = total ? Math.round((completed / total) * 100) : 0;
  const locked = module.status === 'locked';
  const hasQuiz = Boolean(module._id && module.quizQuestions?.length);

  return <Card className={cn(locked && 'opacity-80')}>
    <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2"><Badge variant="neutral">Module {index + 1}</Badge><StatusPill status={module.status} /></div>
        <h2 className="mt-3 text-2xl font-bold text-foreground">{module.title}</h2>
        {module.description && <p className="mt-2 max-w-3xl leading-7 text-muted-foreground">{module.description}</p>}
        <p className="mt-3 text-sm font-semibold text-muted-foreground">{completed}/{total} lessons completed{Number(module.durationDays) > 0 ? ` · About ${module.durationDays} days` : ''}</p>
      </div>
      {locked ? <span className="ui-button ui-button--secondary cursor-not-allowed" aria-disabled="true"><LockKeyhole size={17} aria-hidden="true" /> Module locked</span> : hasQuiz ? <Link to={`/quizzes/${module._id}`} className="ui-button ui-button--secondary shrink-0">Take module quiz</Link> : <Badge variant="neutral">Quiz coming soon</Badge>}
    </div>

    <div className="mt-5 h-2 overflow-hidden rounded-full bg-surface-secondary" role="progressbar" aria-label={`${module.title} completion`} aria-valuemin="0" aria-valuemax="100" aria-valuenow={completion}>
      <div className="h-full rounded-full bg-primary" style={{ width: `${completion}%` }} />
    </div>

    <ol className="mt-5 space-y-2">
      {lessons.map((item, lessonIndex) => {
        const lesson = item.lesson;
        const lessonId = lesson?._id || (typeof lesson === 'string' ? lesson : null);
        const lessonTitle = lesson?.title || `Lesson ${lessonIndex + 1}`;
        const lessonLocked = item.status === 'locked' || !lessonId;
        const content = <>
          <span className="flex min-w-0 items-center gap-3">
            <span className={cn('grid h-8 w-8 shrink-0 place-items-center rounded-control text-xs font-bold', lessonLocked ? 'bg-surface-secondary text-muted-foreground' : item.status === 'completed' ? 'bg-success-soft text-success' : 'bg-primary-soft text-primary-strong')}>{lessonIndex + 1}</span>
            <span className="truncate font-semibold text-foreground">{lessonTitle}</span>
          </span>
          <StatusPill status={lessonLocked ? 'locked' : item.status} />
        </>;

        return <li key={lessonId || `${module._id || module.title}-${lessonIndex}`}>
          {lessonLocked ? <div className="flex items-center justify-between gap-4 rounded-surface border border-border bg-surface-secondary px-4 py-3" aria-disabled="true">{content}</div> : <Link to={`/lessons/${lessonId}`} className="flex items-center justify-between gap-4 rounded-surface border border-border bg-surface px-4 py-3 transition hover:border-primary/30 hover:bg-surface-secondary">{content}</Link>}
        </li>;
      })}
    </ol>
  </Card>;
}
