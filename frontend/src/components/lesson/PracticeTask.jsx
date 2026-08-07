import { Wrench } from "lucide-react";

export default function PracticeTask({ task }) {
  if (!task) return null;

  return (
    <section
      className="rounded-panel border border-blue-100 bg-gradient-to-br from-blue-50 to-cyan-50/70 p-5 shadow-sm"
      aria-labelledby="practice-task-title"
    >
      <div className="flex items-center gap-3">
        <span
          className="grid h-10 w-10 place-items-center rounded-surface bg-white/80 text-blue-600 ring-1 ring-blue-100"
          aria-hidden="true"
        >
          <Wrench size={18} />
        </span>
        <h2 id="practice-task-title" className="text-xl font-bold text-foreground">
          Practice task
        </h2>
      </div>
      <p className="mt-3 whitespace-pre-line leading-7 text-muted-foreground">
        {task}
      </p>
    </section>
  );
}
