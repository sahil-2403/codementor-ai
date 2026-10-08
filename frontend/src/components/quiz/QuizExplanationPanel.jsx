import { CheckCircle2, Sparkles } from 'lucide-react';
import Badge from '../common/Badge.jsx';
import Button from '../common/Button.jsx';
import Card from '../common/Card.jsx';

const sourceLabel = (source) =>
  source?.title ||
  source?.name ||
  (typeof source === 'string' ? source : 'Learning source');

const cleanMarkdownText = (value = '') =>
  String(value)
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/__(.*?)__/g, '$1')
    .replace(/(^|\s)\*\s+/g, '$1')
    .trim();

function InlineFormattedText({ text }) {
  const cleaned = cleanMarkdownText(text);
  const parts = cleaned.split(/(`[^`]+`)/g).filter(Boolean);

  return parts.map((part, index) => {
    if (part.startsWith('`') && part.endsWith('`')) {
      return (
        <code
          key={`${part}-${index}`}
          className="rounded bg-surface-secondary px-1.5 py-0.5 font-mono text-[0.92em] font-semibold text-foreground"
        >
          {part.slice(1, -1)}
        </code>
      );
    }

    return <span key={`${part}-${index}`}>{part}</span>;
  });
}

function FormattedExplanation({ text }) {
  const normalized = cleanMarkdownText(text)
    .replace(/\s+(?=\d+\.\s+[A-Z])/g, '\n')
    .replace(/\n{3,}/g, '\n\n');

  const lines = normalized
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean);

  return (
    <div className="space-y-3 text-sm leading-7 text-foreground sm:text-base">
      {lines.map((line, index) => (
        <p key={`${line.slice(0, 40)}-${index}`} className="break-words">
          <InlineFormattedText text={line} />
        </p>
      ))}
    </div>
  );
}

export default function QuizExplanationPanel({ attempt, isExplaining, onExplain }) {
  const hasMistakes = (attempt.answers || []).some((answer) => !answer.isCorrect);
  const hasExplanation = hasMistakes && Boolean(attempt.aiExplanation?.summary);
  const aiAvailable = hasExplanation && attempt.aiExplanation?.aiAvailable === true;

  return (
    <Card
      className={`shadow-sm ${
        hasMistakes
          ? 'border-primary/10 bg-gradient-to-br from-surface via-surface to-primary-soft/25'
          : 'border-success/15 bg-gradient-to-br from-surface via-surface to-success-soft/40'
      }`}
    >
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-3">
            <span
              className={`grid h-9 w-9 shrink-0 place-items-center rounded-control ${
                hasMistakes
                  ? 'bg-primary-soft text-primary-strong'
                  : 'bg-success-soft text-success'
              }`}
              aria-hidden="true"
            >
              {hasMistakes ? <Sparkles size={16} /> : <CheckCircle2 size={17} />}
            </span>
            <div className="min-w-0">
              <p
                className={`text-[11px] font-bold uppercase tracking-[0.16em] ${
                  hasMistakes ? 'text-primary-strong' : 'text-success'
                }`}
              >
                {hasMistakes
                  ? hasExplanation
                    ? aiAvailable
                      ? 'AI explanation'
                      : 'Standard explanation'
                    : 'Extra explanation'
                  : 'Perfect score'}
              </p>
              <h2 className="mt-1 break-words text-xl font-bold text-foreground">
                {hasMistakes ? 'Understand your mistakes' : 'No mistakes to explain'}
              </h2>
            </div>
          </div>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
            {!hasMistakes
              ? 'You answered every question correctly. You can still review the answers below whenever you want to revisit the concepts.'
              : hasExplanation
                ? 'Use this explanation to understand why the missed answers were incorrect and what to revise next.'
                : 'Request an extra explanation for the questions you answered incorrectly.'}
          </p>
        </div>

        {!hasMistakes ? (
          <span className="inline-flex w-fit shrink-0 items-center gap-1.5 rounded-full border border-success/20 bg-success-soft px-3 py-1.5 text-xs font-semibold text-success">
            <CheckCircle2 size={14} aria-hidden="true" />
            All answers correct
          </span>
        ) : hasExplanation ? (
          <span className="inline-flex w-fit shrink-0 items-center gap-1.5 rounded-full border border-success/20 bg-success-soft px-3 py-1.5 text-xs font-semibold text-success">
            <CheckCircle2 size={14} aria-hidden="true" />
            Explanation ready
          </span>
        ) : (
          <Button
            onClick={onExplain}
            isLoading={isExplaining}
            loadingLabel="Preparing explanation..."
            className="shrink-0 gap-2"
          >
            <Sparkles size={15} aria-hidden="true" />
            Explain mistakes
          </Button>
        )}
      </div>

      {hasMistakes ? (
        <>
          {hasExplanation ? (
            <div
              className={`mt-5 rounded-panel border p-5 sm:p-6 ${
                aiAvailable
                  ? 'border-primary/15 bg-surface/80'
                  : 'border-warning/20 bg-warning-soft/70'
              }`}
            >
              {!aiAvailable ? (
                <p className="mb-4 text-sm font-semibold leading-6 text-warning">
                  A personalised explanation is unavailable, so this explanation uses the lesson and quiz guidance.
                </p>
              ) : null}
              <FormattedExplanation text={attempt.aiExplanation.summary} />
            </div>
          ) : (
            <p className="mt-5 rounded-surface border border-dashed border-border bg-surface-secondary/60 p-4 text-sm leading-6 text-muted-foreground">
              Your score and answer-by-answer explanations are already available below. Use the extra explanation when you want more help connecting the mistakes to topics you should revise.
            </p>
          )}

          {attempt.aiExplanation?.sources?.length ? (
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold text-muted-foreground">Learning context</span>
              {attempt.aiExplanation.sources.map((source, index) => (
                <Badge key={`${sourceLabel(source)}-${index}`} variant="neutral">
                  {sourceLabel(source)}
                </Badge>
              ))}
            </div>
          ) : null}
        </>
      ) : null}
    </Card>
  );
}
