import { MessagesSquare } from 'lucide-react';
import Card from '../common/Card.jsx';

export default function MentorPrompts({ aiAvailable, items = [], lessonScoped = false, disabled = false, onSelect }) {
  return <Card>
    <div className="flex items-center gap-3">
      <span className="grid h-10 w-10 place-items-center rounded-surface bg-primary-soft text-primary" aria-hidden="true"><MessagesSquare size={19} /></span>
      <div><h2 className="font-bold text-foreground">{aiAvailable ? 'Suggested prompts' : 'Saved answers'}</h2><p className="text-xs text-muted-foreground">{lessonScoped ? 'Scoped to the current lesson' : 'Scoped to your learning path'}</p></div>
    </div>
    <div className="mt-4 grid gap-2">
      {items.length ? items.map((item, index) => <button key={`${item.promptType || item.label}-${index}`} type="button" onClick={() => onSelect(item)} className="rounded-surface border border-border bg-surface px-3.5 py-3 text-left text-sm font-semibold text-foreground transition hover:border-primary/30 hover:bg-surface-secondary" disabled={disabled}>{item.label}</button>) : <p className="rounded-surface bg-surface-secondary p-3 text-sm leading-6 text-muted-foreground">No prompt or saved explanation is available for this context.</p>}
    </div>
  </Card>;
}
