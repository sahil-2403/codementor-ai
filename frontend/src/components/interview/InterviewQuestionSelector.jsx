import { useEffect, useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';

function CompactDropdown({
  label,
  value,
  options,
  onChange,
  disabled = false,
  placeholder = 'Select an option'
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);
  const selectedOption = options.find((option) => option.value === value);

  useEffect(() => {
    if (!open) return undefined;

    const closeOnOutsideClick = (event) => {
      if (!rootRef.current?.contains(event.target)) setOpen(false);
    };
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') setOpen(false);
    };

    document.addEventListener('mousedown', closeOnOutsideClick);
    document.addEventListener('keydown', closeOnEscape);

    return () => {
      document.removeEventListener('mousedown', closeOnOutsideClick);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [open]);

  const selectOption = (nextValue) => {
    onChange(nextValue);
    setOpen(false);
  };

  return (
    <div ref={rootRef} className="relative min-w-0">
      <p className="mb-2 text-sm font-semibold text-foreground">{label}</p>
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`${label}: ${selectedOption?.label || placeholder}`}
        disabled={disabled}
        onClick={() => setOpen((current) => !current)}
        className="flex min-h-11 w-full min-w-0 items-center gap-3 rounded-control border border-border bg-surface px-3 text-left text-sm font-medium text-foreground outline-none transition hover:border-primary/30 focus-visible:border-primary focus-visible:ring-4 focus-visible:ring-primary-soft disabled:cursor-not-allowed disabled:bg-surface-secondary disabled:text-muted-foreground"
      >
        <span className="min-w-0 flex-1 truncate">
          {selectedOption?.label || placeholder}
        </span>
        <ChevronDown
          size={17}
          className={`shrink-0 text-muted-foreground transition-transform duration-200 ${open ? 'rotate-180 text-primary-strong' : ''}`}
          aria-hidden="true"
        />
      </button>

      {open ? (
        <div
          role="listbox"
          aria-label={label}
          className="absolute inset-x-0 z-40 mt-2 max-h-64 overflow-y-auto rounded-surface border border-border bg-surface p-1.5 shadow-lg"
        >
          {options.map((option) => {
            const active = option.value === value;

            return (
              <button
                key={option.value}
                type="button"
                role="option"
                aria-selected={active}
                onClick={() => selectOption(option.value)}
                className={`flex w-full min-w-0 items-start gap-3 rounded-control px-3 py-2.5 text-left text-sm transition ${
                  active
                    ? 'bg-primary-soft text-primary-strong'
                    : 'text-foreground hover:bg-surface-secondary'
                }`}
              >
                <span className="min-w-0 flex-1 break-words leading-5">
                  {option.label}
                </span>
                {option.meta ? (
                  <span className="shrink-0 whitespace-nowrap text-xs font-semibold text-muted-foreground">
                    {option.meta}
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

export default function InterviewQuestionSelector({
  topics,
  currentTopic,
  topicQuestions,
  selectedQuestionId,
  onTopicChange,
  onQuestionChange
}) {
  const topicOptions = topics.map(([topic, list]) => ({
    value: topic,
    label: topic,
    meta: `${list.length} question${list.length === 1 ? '' : 's'}`
  }));

  const questionOptions = topicQuestions.map((question) => ({
    value: question._id,
    label: question.question
  }));

  return (
    <div className="mt-5 grid min-w-0 gap-4 md:grid-cols-2">
      <CompactDropdown
        label="Topic"
        value={currentTopic}
        options={topicOptions}
        onChange={onTopicChange}
      />
      <CompactDropdown
        label="Question"
        value={selectedQuestionId}
        options={questionOptions}
        onChange={onQuestionChange}
        disabled={!topicQuestions.length}
        placeholder="No questions available"
      />
    </div>
  );
}
