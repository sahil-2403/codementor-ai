import { Link } from 'react-router-dom';
import Loader from '../../components/common/Loader.jsx';
import Card from '../../components/common/Card.jsx';
import Button from '../../components/common/Button.jsx';
import Badge from '../../components/common/Badge.jsx';
import PageShell from '../../components/common/PageShell.jsx';
import PageHeader from '../../components/common/PageHeader.jsx';
import EmptyState from '../../components/common/EmptyState.jsx';
import StatusPill from '../../components/common/StatusPill.jsx';
import { useProjectTasks } from '../../queries/projectQueries.js';

const difficultyStyle = {
  beginner: 'bg-emerald-50 text-emerald-700',
  intermediate: 'bg-indigo-50 text-indigo-700',
  advanced: 'bg-rose-50 text-rose-700'
};

export default function ProjectsPage() {
  const { data, isLoading } = useProjectTasks();
  if (isLoading) return <Loader label="Loading project tasks..." />;
  const tasks = data?.tasks || [];
  const grouped = tasks.reduce((acc, task) => {
    const key = task.moduleTitle || 'Practice projects';
    acc[key] = acc[key] || [];
    acc[key].push(task);
    return acc;
  }, {});

  return <PageShell>
    <PageHeader eyebrow="Project-based learning" title="Practice Projects" description="Apply coding concepts through practical tasks. Projects unlock based on your current level so you can focus on the right challenge at the right time." />
    {!tasks.length ? <EmptyState title="No project tasks yet" description="Practice tasks will appear here after course content is added." /> : <div className="space-y-8">
      {Object.entries(grouped).map(([topic, topicTasks]) => <section key={topic}>
        <div className="mb-4 flex items-center justify-between"><h2 className="text-xl font-black text-slate-950">{topic}</h2><span className="text-sm font-bold text-slate-500">{topicTasks.length} task(s)</span></div>
        <div className="grid gap-5 md:grid-cols-2">
          {topicTasks.map((task) => <Card key={task._id} className={`transition hover:-translate-y-1 hover:shadow-soft ${task.isLocked ? 'opacity-70' : ''}`}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex flex-wrap gap-2"><Badge className={difficultyStyle[task.difficulty] || difficultyStyle.beginner}>{task.difficulty}</Badge>{task.isLocked && <StatusPill status="locked" />}</div>
                <h3 className="mt-3 text-xl font-black text-slate-950">{task.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{task.description}</p>
              </div>
              {task.bestScore !== null && task.bestScore !== undefined ? <Badge className="bg-emerald-50 text-emerald-700">Best {task.bestScore}%</Badge> : task.latestSubmission ? <Badge className="bg-cyan-50 text-cyan-700">{task.latestSubmission.reviewMode === 'fallback' ? 'Checklist reviewed' : task.latestSubmission.status}</Badge> : null}
            </div>
            <div className="mt-4 flex flex-wrap gap-2">{(task.tags || []).slice(0, 4).map((tag) => <span key={tag} className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">#{tag}</span>)}</div>
            <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
              <span className="text-sm font-bold text-slate-500">{task.estimatedMinutes} min · Attempts {task.attemptsUsed || 0}/{task.maxAttempts || 2}</span>
              {task.isLocked ? <Button disabled variant="secondary">Locked</Button> : <Link to={`/projects/${task._id}`}><Button>Open task</Button></Link>}
            </div>
            {task.isLocked && <p className="mt-3 rounded-2xl bg-slate-50 p-3 text-sm font-semibold text-slate-600">{task.lockedReason}</p>}
          </Card>)}
        </div>
      </section>)}
    </div>}
  </PageShell>;
}
