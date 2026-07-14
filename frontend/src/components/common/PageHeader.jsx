import { cn } from '../../utils/cn.js';

export default function PageHeader({ eyebrow, title, description, actions = null, className = '' }) {
  return <div className={cn('flex flex-col gap-4 md:flex-row md:items-end md:justify-between', className)}>
    <div>
      {eyebrow && <p className="font-bold text-indigo-600">{eyebrow}</p>}
      <h1 className="text-4xl font-black tracking-tight text-slate-950">{title}</h1>
      {description && <p className="mt-2 max-w-3xl text-slate-600">{description}</p>}
    </div>
    {actions && <div className="flex flex-wrap gap-3">{actions}</div>}
  </div>;
}
