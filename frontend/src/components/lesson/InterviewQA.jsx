import { ChevronDown } from "lucide-react";

export default function InterviewQA({ items = [] }) {
  if (!items.length) return null;

  return (
    <div className="space-y-3">
      {items.map((item, index) => (
        <details
          key={`${item.question}-${index}`}
          className="group rounded-surface border border-border bg-surface-secondary/80 p-4 transition hover:border-primary/20 hover:bg-surface-secondary"
        >
          <summary className="cursor-pointer list-none font-semibold text-foreground focus-visible:outline-none">
            <span className="flex items-start justify-between gap-4">
              <span>Q. {item.question}</span>
              <ChevronDown
                size={17}
                className="mt-0.5 shrink-0 text-primary-strong transition-transform duration-200 group-open:rotate-180"
                aria-hidden="true"
              />
            </span>
          </summary>
          <p className="mt-3 border-t border-border pt-3 text-sm leading-7 text-muted-foreground">
            {item.answer}
          </p>
        </details>
      ))}
    </div>
  );
}
