export default function InterviewQA({ items = [] }) {
  if (!items.length) return null;
  return <div className="space-y-3">
    {items.map((item, index) => <details key={`${item.question}-${index}`} className="group rounded-surface border border-border bg-surface-secondary p-4">
      <summary className="cursor-pointer list-none font-semibold text-foreground focus-visible:outline-none">
        <span className="flex items-start justify-between gap-4"><span>Q. {item.question}</span><span className="text-primary transition group-open:rotate-45" aria-hidden="true">+</span></span>
      </summary>
      <p className="mt-3 border-t border-border pt-3 text-sm leading-7 text-muted-foreground">{item.answer}</p>
    </details>)}
  </div>;
}
