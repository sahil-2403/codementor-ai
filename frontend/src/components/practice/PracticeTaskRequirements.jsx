import { CheckCircle2 } from 'lucide-react';
import Button from '../common/Button.jsx';
import Card from '../common/Card.jsx';
import SectionHeader from '../common/SectionHeader.jsx';

export default function PracticeTaskRequirements({ task, showSolution, onToggleSolution }) {
  return (
    <Card variant="compact">
      <SectionHeader title="Task requirements" />

      {task.requirements?.length ? (
        <ul className="mt-3 space-y-2 text-sm leading-6 text-muted-foreground">
          {task.requirements.map((item) => (
            <li key={item} className="flex gap-2.5">
              <CheckCircle2 className="mt-1 shrink-0 text-success" size={15} aria-hidden="true" />
              <span className="break-words">{item}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-2 text-sm text-muted-foreground">No requirements have been added for this task.</p>
      )}

      {task.starterHints?.length ? (
        <div className="mt-5">
          <h3 className="text-sm font-bold text-foreground">Starter hints</h3>
          <ul className="mt-2 space-y-2 text-sm leading-6 text-muted-foreground">
            {task.starterHints.map((item) => <li key={item} className="break-words">• {item}</li>)}
          </ul>
        </div>
      ) : null}

      {task.expectedOutput ? (
        <div className="mt-5">
          <h3 className="text-sm font-bold text-foreground">Expected output</h3>
          <p className="mt-2 whitespace-pre-line break-words text-sm leading-6 text-muted-foreground">{task.expectedOutput}</p>
        </div>
      ) : null}

      {task.solution ? (
        <div className="mt-5">
          <Button type="button" variant="secondary" onClick={onToggleSolution}>
            {showSolution ? 'Hide suggested solution' : 'View suggested solution'}
          </Button>
          {showSolution ? (
            <div className="mt-3 min-w-0 border-l-2 border-warning pl-4 text-sm leading-7 text-foreground">
              <p className="font-bold">Try the task first, then compare.</p>
              <pre className="mt-2 max-w-full overflow-auto whitespace-pre-wrap break-words font-mono text-xs leading-6">{task.solution}</pre>
            </div>
          ) : null}
        </div>
      ) : null}
    </Card>
  );
}
