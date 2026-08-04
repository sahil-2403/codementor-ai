import { cn } from '../../utils/cn.js';

export default function QuizQuestionCard({ question, value, onChange, index }) {
  const groupName = `question-${question._id || index}`;

  return <fieldset className="ui-card">
    <legend className="w-full">
      <span className="ui-eyebrow">Question {index + 1}</span>
      <span className="mt-2 block text-lg font-bold leading-7 text-foreground">{question.question}</span>
    </legend>
    <div className="mt-5 grid gap-2.5">
      {question.options?.map((option) => {
        const selected = value === option;
        return <label key={option} className={cn(
          'flex cursor-pointer items-start gap-3 rounded-surface border p-3.5 transition',
          selected ? 'border-primary/40 bg-primary-soft' : 'border-border bg-surface hover:bg-surface-secondary'
        )}>
          <input
            type="radio"
            name={groupName}
            value={option}
            checked={selected}
            onChange={() => onChange(option)}
            className="mt-0.5 h-4 w-4 accent-primary"
          />
          <span className="text-sm font-medium leading-6 text-foreground">{option}</span>
        </label>;
      })}
    </div>
  </fieldset>;
}
