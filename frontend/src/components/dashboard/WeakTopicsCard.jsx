import { Link } from 'react-router-dom';
import Card from '../common/Card.jsx';
import StatusPill from '../common/StatusPill.jsx';

const relatedLessonPath = (item) => {
  const related = item.relatedLesson || item.relatedLessons?.[0];
  const lessonId = related?._id || related;
  return lessonId ? `/lessons/${lessonId}` : '/roadmap';
};

export default function WeakTopicsCard({ topics = [] }) {
  return <Card>
    <div>
      <h3 className="text-xl font-bold text-foreground">Weak topics</h3>
      <p className="mt-1 text-sm leading-6 text-muted-foreground">Prioritized from recorded scores, repeated detections, source, and recency.</p>
    </div>
    <div className="mt-5 space-y-3">
      {topics.length ? topics.slice(0, 8).map((item) => <div key={item.topic} className="rounded-surface border border-border bg-surface-secondary p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2"><p className="font-semibold text-foreground">{item.topic}</p><StatusPill status={item.severity || 'medium'} /></div>
            <p className="mt-1 text-sm text-muted-foreground">Detected {item.attempts || item.count || 1} time(s){item.source ? ` from ${String(item.source).replaceAll('_', ' ')}` : ''}{item.score !== undefined && item.score !== null && Number.isFinite(Number(item.score)) ? ` · latest score ${item.score}%` : ''}.</p>
          </div>
          <Link to={relatedLessonPath(item)} className="auth-link shrink-0 text-sm">Review topic →</Link>
        </div>
      </div>) : <p className="rounded-surface bg-surface-secondary p-4 text-sm leading-6 text-muted-foreground">No weak topics are recorded yet. They appear only after supported learner attempts produce real evidence.</p>}
    </div>
  </Card>;
}
