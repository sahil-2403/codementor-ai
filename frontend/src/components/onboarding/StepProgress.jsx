import { Check } from 'lucide-react';
import { cn } from '../../utils/cn.js';

export default function StepProgress({ steps = [], current = '' }) {
  const currentIndex = Math.max(steps.findIndex((step) => step.key === current), 0);
  return <div className="rounded-[2rem] border border-white/60 bg-white/75 p-4 shadow-soft backdrop-blur">
    <div className="grid gap-3 sm:grid-cols-4">
      {steps.map((step, index) => {
        const complete = index < currentIndex;
        const active = index === currentIndex;
        return <div key={step.key} className={cn('rounded-3xl border p-4 transition', active ? 'border-indigo-300 bg-indigo-50' : complete ? 'border-emerald-200 bg-emerald-50' : 'border-slate-200 bg-white/70')}>
          <div className="flex items-center gap-3">
            <span className={cn('grid h-8 w-8 place-items-center rounded-2xl text-xs font-black', active ? 'bg-indigo-600 text-white' : complete ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-500')}>{complete ? <Check size={15} /> : index + 1}</span>
            <div>
              <p className="font-black text-slate-950">{step.label}</p>
              {step.helper && <p className="text-xs font-semibold text-slate-500">{step.helper}</p>}
            </div>
          </div>
        </div>;
      })}
    </div>
  </div>;
}
