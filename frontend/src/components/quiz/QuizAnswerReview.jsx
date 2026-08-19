import { Link } from 'react-router-dom';
import { ArrowLeft, BarChart3, CheckCircle2, XCircle } from 'lucide-react';
import Badge from '../common/Badge.jsx';
import Card from '../common/Card.jsx';

function QuizAnswerReviewItem({ answer, index }) {
  const AnswerIcon = answer.isCorrect ? CheckCircle2 : XCircle;

  return (
    <li
      className={`rounded-surface border border-border border-l-4 bg-surface p-4 shadow-sm ${
        answer.isCorrect ? 'border-l-success' : 'border-l-error'
      }`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <span
            className={`mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full ${
              answer.isCorrect ? 'bg-success-soft text-success' : 'bg-error-soft text-error'
            }`}
            aria-hidden="true"
          >
            <AnswerIcon size={16} />
          </span>
          <p className="min-w-0 break-words font-semibold leading-6 text-foreground">
            {index + 1}. {answer.question?.question || 'Quiz question'}
          </p>
        </div>
        <Badge variant={answer.isCorrect ? 'success' : 'danger'}>
          {answer.isCorrect ? 'Correct' : 'Incorrect'}
        </Badge>
      </div>

      <dl className="mt-4 grid gap-4 border-t border-border pt-4 text-sm md:grid-cols-2">
        <div className="min-w-0">
          <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Your answer</dt>
          <dd className="mt-1.5 break-words leading-6 text-foreground">{answer.selectedAnswer || 'No answer'}</dd>
        </div>
        <div className="min-w-0">
          <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Correct answer</dt>
          <dd className="mt-1.5 break-words leading-6 text-foreground">{answer.correctAnswer}</dd>
        </div>
        {answer.explanation ? (
          <div className="min-w-0 md:col-span-2">
            <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Explanation</dt>
            <dd className="mt-1.5 break-words leading-6 text-muted-foreground">{answer.explanation}</dd>
          </div>
        ) : null}
      </dl>
    </li>
  );
}

export default function QuizAnswerReview({ answers = [] }) {
  return (
    <Card className="shadow-sm">
      <div>
        <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-muted-foreground">Question review</p>
        <h2 className="mt-1 text-xl font-bold text-foreground">Answer review</h2>
        <p className="mt-1 text-sm leading-6 text-muted-foreground">
          Compare your answer with the correct answer and read the explanation for each question.
        </p>
      </div>

      <ol className="mt-5 space-y-3">
        {answers.map((answer, index) => (
          <QuizAnswerReviewItem
            key={answer._id || `${answer.question?._id || index}-${index}`}
            answer={answer}
            index={index}
          />
        ))}
      </ol>

      <div className="mt-5 flex flex-wrap gap-3 border-t border-border pt-5">
        <Link to="/roadmap" className="ui-button ui-button--primary inline-flex items-center gap-2">
          <ArrowLeft size={15} aria-hidden="true" />
          Back to roadmap
        </Link>
        <Link to="/progress" className="ui-button ui-button--secondary inline-flex items-center gap-2">
          <BarChart3 size={15} aria-hidden="true" />
          View progress
        </Link>
      </div>
    </Card>
  );
}
