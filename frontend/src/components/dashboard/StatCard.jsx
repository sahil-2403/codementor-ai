import Card from '../common/Card.jsx';

export default function StatCard({ title, value, subtitle, icon: Icon }) {
  return <Card className="p-5">
    <div className="flex items-start justify-between gap-4">
      <div className="min-w-0">
        <p className="text-sm font-semibold text-muted-foreground">{title}</p>
        <p className="mt-2 text-3xl font-extrabold tracking-tight text-foreground">{value}</p>
        {subtitle && <p className="mt-1 text-sm leading-6 text-muted-foreground">{subtitle}</p>}
      </div>
      {Icon && <span className="grid h-10 w-10 shrink-0 place-items-center rounded-surface bg-primary-soft text-primary" aria-hidden="true"><Icon size={19} /></span>}
    </div>
  </Card>;
}
