import { cn } from '../../utils/cn.js';

export default function QuizQuestionCard({ question, value, onChange, index }) {
  const groupName = `question-${question._id || index}`;

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
    </fieldset>
  );
}
