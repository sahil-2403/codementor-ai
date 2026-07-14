import Card from '../common/Card.jsx';

export default function ProgressChart({ value = 0, completed = 0, total = 0, title = 'Course progress' }) {
  const safeValue = Math.max(0, Math.min(100, Number(value || 0)));
  return <Card className="overflow-hidden">
    <div className="flex items-center justify-between gap-4">
      <div>
        <h3 className="text-lg font-black text-slate-950">{title}</h3>
        <p className="mt-1 text-sm text-slate-500">{total ? `${completed}/${total} lessons completed` : 'Your completion across the active roadmap.'}</p>
      </div>
      <div className="grid h-20 w-20 place-items-center rounded-3xl bg-indigo-50 text-2xl font-black text-indigo-700">{safeValue}%</div>
    </div>
    <div className="mt-6 h-4 overflow-hidden rounded-full bg-slate-100">
      <div className="h-full rounded-full bg-gradient-to-r from-indigo-600 via-violet-600 to-sky-500 transition-all duration-700" style={{ width: `${safeValue}%` }} />
    </div>
    <p className="mt-4 rounded-2xl bg-slate-50 p-3 text-sm font-semibold text-slate-600">Keep moving in small steps. One focused lesson today is still real progress.</p>
  </Card>;
}
