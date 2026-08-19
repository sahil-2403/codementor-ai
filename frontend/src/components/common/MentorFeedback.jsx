import { Sparkles } from 'lucide-react';

function FeedbackList({ title, items = [], tone }) {
  if (!items.length) return null;

  return (
    <div>
      <h4 className={`text-sm font-bold ${tone}`}>{title}</h4>
      <ul className="mt-2 list-disc space-y-1.5 pl-5 text-sm leading-6 text-muted-foreground">
        {items.map((item, index) => <li key={`${item}-${index}`}>{item}</li>)}
      </ul>
    </div>
  );
}

export default function MentorFeedback({ summary = '', strengths = [], improvements = [], className = '' }) {
  if (!summary && !strengths.length && !improvements.length) return null;

  return (
    <div className={className}>
      {summary ? (
        <div className="border-l-2 border-primary pl-4">
          <div className="flex items-center gap-2 text-primary-strong">
            <Sparkles size={15} aria-hidden="true" />
            <h3 className="text-sm font-bold">Mentor feedback</h3>
          </div>
          <p className="mt-2 text-sm leading-7 text-muted-foreground">{summary}</p>
        </div>
      ) : null}

      {strengths.length || improvements.length ? (
        <div className="mt-5 grid gap-5 md:grid-cols-2">
          <FeedbackList title="What you did well" items={strengths} tone="text-success" />
          <FeedbackList title="What to improve" items={improvements} tone="text-error" />
        </div>
      ) : null}
    </div>
  );
}
