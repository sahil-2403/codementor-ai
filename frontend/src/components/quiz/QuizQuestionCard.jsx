import { cn } from '../../utils/cn.js';

export default function QuizQuestionCard({ question, value, onChange, index }) {
  const groupName = `question-${question._id || index}`;
  const textAnswer = question.type === 'code_output' || question.type === 'short_answer';

  return (
    <fieldset className="rounded-panel border border-border bg-surface p-5 shadow-sm sm:p-6">
      <legend className="w-full px-0">
        <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-primary-strong">
          Question {index + 1}
        </span>
        <span className="mt-2 block text-lg font-bold leading-7 text-foreground">
          {question.question}
        </span>
      </legend>

      {question.codeSnippet ? (
        <pre className="mt-4 overflow-x-auto rounded-surface border border-border bg-surface-secondary/65 p-4 font-mono text-sm leading-6 text-foreground">
          <code>{question.codeSnippet}</code>
        </pre>
      ) : null}

      {textAnswer ? (
        <label className="mt-5 block space-y-1.5">
          <span className="ui-field-label">
            {question.type === 'code_output' ? 'Your expected output' : 'Your answer'}
          </span>
          <input
            type="text"
            value={value || ''}
            onChange={(event) => onChange(event.target.value)}
            className="ui-field-control font-mono"
            placeholder={question.type === 'code_output' ? 'Enter exactly what the code prints' : 'Enter your answer'}
          />
        </label>
      ) : (
        <div className="mt-5 grid gap-2.5">
          {question.options?.map((option) => {
            const selected = value === option;

            return (
              <label
                key={option}
                className={cn(
                  'flex cursor-pointer items-start gap-3 rounded-surface border p-3.5 transition duration-200 focus-within:ring-2 focus-within:ring-primary/20',
                  selected
                    ? 'border-primary/40 bg-primary-soft shadow-sm'
                    : 'border-border bg-surface hover:border-primary/25 hover:bg-surface-secondary/60'
                )}
              >
                <input
                  type="radio"
                  name={groupName}
                  value={option}
                  checked={selected}
                  onChange={() => onChange(option)}
                  className="mt-0.5 h-4 w-4 shrink-0 accent-primary"
                />
                <span className="text-sm font-medium leading-6 text-foreground">
                  {option}
                </span>
              </label>
            );
          })}
        </div>
      )}
    </fieldset>
  );
}
