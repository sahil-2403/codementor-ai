import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Button from '../common/Button.jsx';
import StepProgress from './StepProgress.jsx';
import { onboardingSteps } from '../../constants/onboardingSteps.js';

export default function OnboardingShell({ current, eyebrow, title, description, children, aside, backTo }) {
  const navigate = useNavigate();
  return <div className="mx-auto max-w-6xl space-y-6">
    <StepProgress steps={onboardingSteps} current={current} />
    <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
      <section className="space-y-6">
        <div className="rounded-[2rem] bg-gradient-to-br from-slate-950 via-indigo-950 to-sky-700 p-7 text-white shadow-soft">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              {eyebrow && <p className="text-sm font-black uppercase tracking-[0.18em] text-sky-200">{eyebrow}</p>}
              <h1 className="mt-3 text-4xl font-black tracking-tight md:text-5xl">{title}</h1>
              {description && <p className="mt-4 max-w-2xl leading-7 text-sky-100">{description}</p>}
            </div>
            {backTo && <Button type="button" variant="secondary" onClick={() => navigate(backTo)} className="bg-white/10 text-white hover:bg-white/20"><ArrowLeft size={16} className="mr-2" /> Back</Button>}
          </div>
        </div>
        {children}
      </section>
      <aside className="space-y-4">{aside}</aside>
    </div>
  </div>;
}
