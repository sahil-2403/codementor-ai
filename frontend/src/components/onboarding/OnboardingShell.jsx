import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import StepProgress from './StepProgress.jsx';
import { onboardingSteps } from '../../constants/onboardingSteps.js';

export default function OnboardingShell({ current, eyebrow, title, description, children, aside = null, backTo = null }) {
  return <div className="space-y-6">
    <StepProgress steps={onboardingSteps} current={current} />

    <header className="rounded-panel border border-border bg-surface p-6 shadow-soft sm:p-8">
      {backTo && <Link to={backTo} className="auth-link inline-flex items-center gap-2 text-sm">
        <ArrowLeft size={16} /> Back
      </Link>}
      <p className="ui-eyebrow mt-4">{eyebrow}</p>
      <h1 className="mt-1 max-w-4xl text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">{title}</h1>
      <p className="mt-3 max-w-3xl leading-7 text-muted-foreground">{description}</p>
    </header>

    <div className={aside ? 'grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]' : ''}>
      <section className="min-w-0 space-y-6" aria-label="Onboarding step">{children}</section>
      {aside && <aside className="space-y-5 lg:sticky lg:top-24 lg:self-start" aria-label="Onboarding guidance">{aside}</aside>}
    </div>
  </div>;
}
