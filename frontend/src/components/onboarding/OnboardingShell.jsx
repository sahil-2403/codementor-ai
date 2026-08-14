import StepProgress from './StepProgress.jsx';
import { onboardingSteps } from '../../constants/onboardingSteps.js';

export default function OnboardingShell({ current, eyebrow, title, description, children, footer = null }) {
  return (
    <div className="mx-auto w-full max-w-6xl space-y-8 pb-6">
      <StepProgress steps={onboardingSteps} current={current} />

      <header className="max-w-3xl">
        {eyebrow ? (
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary-strong">{eyebrow}</p>
        ) : null}
        <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">{title}</h1>
        {description ? (
          <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">{description}</p>
        ) : null}
      </header>

      <section className="min-w-0 space-y-8" aria-label="Onboarding step">
        {children}
      </section>

      {footer ? (
        <footer className="border-t border-border pt-5">
          {footer}
        </footer>
      ) : null}
    </div>
  );
}
