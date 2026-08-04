import { CheckCircle2, Target } from 'lucide-react';
import Card from '../common/Card.jsx';
import Badge from '../common/Badge.jsx';

export default function QuizResultSummary({ attempt }) {
  const answers = attempt?.answers || [];
  const correct = answers.filter((answer) => answer.isCorrect).length;
  const score = Math.max(0, Math.min(100, Number(attempt?.score) || 0));

  return <Card>
    <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <Badge variant={score >= 70 ? 'success' : 'warning'}>Deterministic score</Badge>
        <h1 className="mt-3 text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl">{score}%</h1>
        <p className="mt-2 leading-7 text-muted-foreground">{attempt?.feedback || 'Your stored answers were checked against the published correct answers.'}</p>
      </div>
      <div className="grid min-w-40 gap-3 rounded-panel bg-surface-secondary p-4 text-sm">
        <div className="flex items-center justify-between gap-4"><span className="flex items-center gap-2 text-muted-foreground"><CheckCircle2 size={16} aria-hidden="true" /> Correct</span><strong className="text-foreground">{correct}/{answers.length}</strong></div>
        <div className="flex items-center justify-between gap-4"><span className="flex items-center gap-2 text-muted-foreground"><Target size={16} aria-hidden="true" /> Weak topics</span><strong className="text-foreground">{attempt?.weakTopicsDetected?.length || 0}</strong></div>
      </div>
    </div>
  </Card>;
}
