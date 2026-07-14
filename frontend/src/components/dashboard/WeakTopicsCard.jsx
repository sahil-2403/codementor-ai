import { Link } from 'react-router-dom';
import Card from '../common/Card.jsx';
import StatusPill from '../common/StatusPill.jsx';

export default function WeakTopicsCard({ topics = [] }) {
  return <Card>
    <div><h3 className="text-lg font-black text-slate-950">Weak topics</h3><p className="text-sm text-slate-500">Prioritized by severity, repeated mistakes, and recent activity.</p></div>
    <div className="mt-4 space-y-3">
      {topics.length ? topics.slice(0, 8).map((item) => <div key={item.topic} className="rounded-2xl border border-slate-100 bg-white/75 p-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2"><p className="font-black text-slate-950">{item.topic}</p><StatusPill status={item.severity || 'medium'} /></div>
            <p className="mt-1 text-sm text-slate-500">Detected {item.attempts || item.count || 1} time(s){item.source ? ` from ${String(item.source).replaceAll('_', ' ')}` : ''}.</p>
          </div>
          <Link to={item.relatedLesson ? `/lessons/${item.relatedLesson}` : '/mentor'} className="text-sm font-black text-indigo-700">Review →</Link>
        </div>
      </div>) : <p className="text-sm text-slate-500">No weak topics yet. Take a quiz or submit practice answers to generate insights.</p>}
    </div>
  </Card>;
}
