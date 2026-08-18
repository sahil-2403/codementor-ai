import { Code2 } from "lucide-react";

export default function PracticeTask({ task }) {
  if (!task) return null;

  return (
    <section
      className="rounded-surface border border-border bg-surface-secondary/50 p-4 sm:p-5"
      aria-labelledby="practice-task-title"
    >
      <div className="flex items-center gap-3">
        <span
          className="grid h-9 w-9 place-items-center rounded-control bg-primary-soft text-primary-strong"
          aria-hidden="true"
        >
          <Code2 size={17} />
        </span>
        <h2 id="practice-task-title" className="text-lg font-bold text-foreground">
          Practice task
        </h2>
      </div>
      <p className="mt-3 whitespace-pre-line leading-7 text-muted-foreground">
        {task}
      </p>
    </section>
  );
}
