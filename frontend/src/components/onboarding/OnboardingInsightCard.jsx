import Card from '../common/Card.jsx';
import Badge from '../common/Badge.jsx';

export default function OnboardingInsightCard({ title, badge, items = [] }) {
  return <Card className="bg-white/80">
    <div className="flex items-center justify-between gap-3"><h3 className="text-lg font-black text-slate-950">{title}</h3>{badge && <Badge>{badge}</Badge>}</div>
    <div className="mt-4 space-y-3">
      {items.map((item) => <div key={item.title} className="rounded-3xl bg-slate-50 p-4">
        <p className="font-black text-slate-900">{item.title}</p>
        <p className="mt-1 text-sm leading-6 text-slate-600">{item.description}</p>
      </div>)}
    </div>
  </Card>;
}
