import { CheckCircle2, ClipboardCheck, Target } from 'lucide-react';
import Card from '../common/Card.jsx';

const getResultState = (score) => {
  if (score >= 80) {
    return {
      label: 'Strong result',
      className: 'border-success/20 bg-success-soft text-success'
    };
  }

  if (score >= 60) {
    return {
      label: 'Good progress',
      className: 'border-primary/20 bg-primary-soft text-primary-strong'
    };
  }

  return {
    label: 'Needs review',
    className: 'border-warning/20 bg-warning-soft text-warning'
  };
};

export default function QuizResultSummary({ attempt }) {
  const answers = attempt?.answers || [];
  const correct = answers.filter((answer) => answer.isCorrect).length;
  const score = Math.max(0, Math.min(100, Number(attempt?.score) || 0));
  const weakTopicsCount = attempt?.weakTopicsDetected?.length || 0;
  const resultState = getResultState(score);

  return (
    <Card className="overflow-hidden border-primary/10 bg-gradient-to-br from-surface via-surface to-primary-soft/30 shadow-sm">
      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <span
              className="grid h-10 w-10 shrink-0 place-items-center rounded-control bg-primary-soft text-primary-strong"
              aria-hidden="true"
            >
              <ClipboardCheck size={18} />
            </span>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-primary-strong">
                Module assessment
              </p>
              <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
                Quiz result
              </h1>
            </div>
          </div>

          <span
            className={`inline-flex w-fit items-center rounded-full border px-3 py-1 text-xs font-semibold ${resultState.className}`}
          >
            {resultState.label}
          </span>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-surface border border-primary/10 bg-white/70 p-4">
            <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
              <Target size={15} className="text-primary-strong" aria-hidden="true" />
              Quiz score
            </div>
            <p className="mt-2 text-3xl font-extrabold tracking-tight text-foreground">
              {score}%
            </p>
          </div>

          <div className="rounded-surface border border-border bg-white/70 p-4">
            <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
              <CheckCircle2 size={15} className="text-success" aria-hidden="true" />
              Correct answers
            </div>
            <p className="mt-2 text-2xl font-extrabold tracking-tight text-foreground">
              {correct}/{answers.length}
            </p>
          </div>

          <div className="rounded-surface border border-border bg-white/70 p-4">
            <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
              <Target size={15} className="text-warning" aria-hidden="true" />
              Weak topics
            </div>
            <p className="mt-2 text-2xl font-extrabold tracking-tight text-foreground">
              {weakTopicsCount}
            </p>
          </div>
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between text-xs font-semibold text-muted-foreground">
            <span>Overall score</span>
            <span>{score}%</span>
          </div>
          <div
            className="h-2 overflow-hidden rounded-full bg-surface-secondary"
            role="progressbar"
            aria-label="Quiz score"
            aria-valuemin="0"
            aria-valuemax="100"
            aria-valuenow={score}
          >
            <div
              className="h-full rounded-full bg-gradient-to-r from-primary via-violet-500 to-blue-500 transition-all duration-500"
              style={{ width: `${score}%` }}
            />
          </div>
        </div>
      </div>
    </Card>
  );
}
