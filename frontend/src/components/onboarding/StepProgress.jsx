import { cn } from '../../utils/cn.js';

export default function StepProgress({ steps = [], current = '' }) {
  const foundIndex = steps.findIndex((step) => step.key === current);
  const currentIndex = foundIndex >= 0 ? foundIndex : 0;
  const currentStep = steps[currentIndex];

  return (
    <nav aria-label="Onboarding progress">
      <div className="flex items-center justify-between gap-4 text-xs font-semibold">
        <span className="uppercase tracking-[0.14em] text-primary-strong">
          Step {currentIndex + 1} of {steps.length}
        </span>
        <span className="text-muted-foreground">{currentStep?.label}</span>
      </div>

      <ol className="mt-3 grid grid-cols-3 gap-2">
        {steps.map((step, index) => {
          const reached = index <= currentIndex;
          const active = index === currentIndex;

          return (
            <li key={step.key} aria-current={active ? 'step' : undefined}>
              <span
                className={cn(
                  'block h-1.5 rounded-full transition',
                  reached ? 'bg-primary' : 'bg-surface-secondary'
                )}
                aria-hidden="true"
              />
              <span
                className={cn(
                  'mt-2 hidden text-xs font-semibold sm:block',
                  active ? 'text-foreground' : reached ? 'text-primary-strong' : 'text-muted-foreground'
                )}
              >
                {step.label}
              </span>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
