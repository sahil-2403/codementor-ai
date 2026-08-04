import { Check } from 'lucide-react';
import { cn } from '../../utils/cn.js';

export default function StepProgress({ steps = [], current = '' }) {
  const foundIndex = steps.findIndex((step) => step.key === current);
  const currentIndex = foundIndex >= 0 ? foundIndex : 0;

  return <nav className="rounded-panel border border-border bg-surface p-3 shadow-sm sm:p-4" aria-label="Onboarding progress">
    <ol className="grid gap-2 sm:grid-cols-4">
      {steps.map((step, index) => {
        const complete = index < currentIndex;
        const active = index === currentIndex;
        return <li
          key={step.key}
          aria-current={active ? 'step' : undefined}
          className={cn(
            'rounded-surface border p-3 transition sm:p-4',
            active ? 'border-primary/30 bg-primary-soft' : complete ? 'border-success/20 bg-success-soft' : 'border-border bg-surface'
          )}
        >
          <div className="flex items-center gap-3">
            <span className={cn(
              'grid h-8 w-8 shrink-0 place-items-center rounded-control text-xs font-bold',
              active ? 'bg-primary text-white' : complete ? 'bg-success text-white' : 'bg-surface-secondary text-muted-foreground'
            )} aria-hidden="true">
              {complete ? <Check size={15} /> : index + 1}
            </span>
            <div className="min-w-0">
              <p className="font-semibold text-foreground">{step.label}</p>
              {step.helper && <p className="mt-0.5 text-xs leading-5 text-muted-foreground">{step.helper}</p>}
            </div>
          </div>
        </li>;
      })}
    </ol>
  </nav>;
}
