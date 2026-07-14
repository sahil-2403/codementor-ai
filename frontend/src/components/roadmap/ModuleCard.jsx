import { Link } from 'react-router-dom';
import Card from '../common/Card.jsx';
import Button from '../common/Button.jsx';
import StatusPill from '../common/StatusPill.jsx';
export default function ModuleCard({ module }) {
  const completed = module.lessons?.filter((item) => item.status === 'completed').length || 0;
  const total = module.lessons?.length || 0;
  const locked = module.status === 'locked';
  return <Card className={locked ? 'opacity-75' : ''}>
    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
      <div>
        <StatusPill status={module.status} />
        <h3 className="mt-3 text-xl font-black text-slate-950">{module.title}</h3>
        <p className="mt-2 text-slate-600">{module.description}</p>
        <p className="mt-3 text-sm font-semibold text-slate-500">{completed}/{total} lessons completed · {module.durationDays} days</p>
      </div>
      {module._id && (locked ? <Button variant="secondary" disabled title="Complete earlier modules to unlock this quiz">Locked</Button> : <Link to={`/quizzes/${module._id}`}><Button variant="secondary">Take quiz</Button></Link>)}
    </div>
    <div className="mt-5 space-y-2">
      {module.lessons?.map((item) => <Link key={item.lesson?._id} to={`/lessons/${item.lesson?._id}`} className={`flex items-center justify-between rounded-2xl px-4 py-3 transition ${item.status === 'locked' ? 'pointer-events-none bg-slate-50 text-slate-400' : 'bg-white/70 hover:bg-white'}`}>
        <span className="font-semibold text-slate-800">{item.lesson?.title}</span>
        <StatusPill status={item.status} />
      </Link>)}
    </div>
  </Card>;
}
