import Card from '../common/Card.jsx';
import Badge from '../common/Badge.jsx';

export default function OnboardingInsightCard({ title, badge, items = [] }) {
  return <Card>
    <div className="flex items-start justify-between gap-3">
      <h3 className="text-lg font-bold text-foreground">{title}</h3>
      {badge && <Badge variant="info">{badge}</Badge>}
    </div>
    <div className="mt-4 space-y-3">
      {items.map((item) => <div key={item.title} className="rounded-surface bg-surface-secondary p-4">
        <p className="font-semibold text-foreground">{item.title}</p>
        <p className="mt-1 text-sm leading-6 text-muted-foreground">{item.description}</p>
      </div>)}
    </div>
  </Card>;
}
