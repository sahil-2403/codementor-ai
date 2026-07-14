import Card from '../common/Card.jsx';
export default function StatCard({ title, value, subtitle }) {
  return <Card className="p-5">
    <p className="text-sm font-semibold text-slate-500">{title}</p>
    <p className="mt-2 text-3xl font-black text-slate-950">{value}</p>
    {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
  </Card>;
}
