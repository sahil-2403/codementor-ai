import { Sparkles } from 'lucide-react';

export default function MentorPrompts({ items = [], disabled = false, onSelect }) {
  if (!items.length) return null;

  return (
    <div className="mb-2 flex gap-2 overflow-x-auto pb-1 sm:flex-wrap">
      {items.map((item) => (
        <button
          key={item.promptType || item.label}
          type="button"
          disabled={disabled}
          onClick={() => onSelect(item)}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-border bg-surface px-3 py-1.5 text-xs font-semibold text-muted-foreground transition hover:border-primary/35 hover:text-foreground disabled:opacity-45"
        >
          <Sparkles size={12} className="text-primary" aria-hidden="true" />
          {item.label}
        </button>
      ))}
    </div>
  );
}
