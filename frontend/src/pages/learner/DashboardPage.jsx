import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Loader from '../../components/common/Loader.jsx';
import EmptyState from '../../components/common/EmptyState.jsx';
import Button from '../../components/common/Button.jsx';
import Card from '../../components/common/Card.jsx';
import Badge from '../../components/common/Badge.jsx';
import StatCard from '../../components/dashboard/StatCard.jsx';
import ContinueLearningCard from '../../components/dashboard/ContinueLearningCard.jsx';
import WeakTopicsCard from '../../components/dashboard/WeakTopicsCard.jsx';
import ProgressChart from '../../components/dashboard/ProgressChart.jsx';
import { useDashboard } from '../../queries/dashboardQueries.js';

const priorityStyle = {
  critical: 'border-rose-200 bg-rose-50 text-rose-800',
  high: 'border-orange-200 bg-orange-50 text-orange-800',
  medium: 'border-indigo-200 bg-indigo-50 text-indigo-800',
  low: 'border-slate-200 bg-slate-50 text-slate-700'
};

export default function DashboardPage() {
  const navigate = useNavigate();
  const { data, isLoading } = useDashboard();
  const courseForStorage = data?.course;

  useEffect(() => {
    if (courseForStorage?.learningGoal) localStorage.setItem('learningGoalId', courseForStorage.learningGoal);
    if (courseForStorage?.level) localStorage.setItem('learningLevel', courseForStorage.level);
  }, [courseForStorage?.learningGoal, courseForStorage?.level]);

  if (isLoading) return <Loader label="Loading dashboard..." />;
  if (!data?.course) return <EmptyState title="No active roadmap yet" description="Start onboarding to create your personalized MERN roadmap." actionLabel="Start onboarding" onAction={() => navigate('/onboarding/goal')} />;
  const { stats, progress, nextLesson, course, recommendations = [], studyPlan = [], dueRevisions = [], roadmapVersions = [] } = data;

  const canPersonalize = stats?.canPersonalizeLater || (['intermediate', 'advanced'].includes(course.level) && course.generatedReason !== 'assessment_personalized');

  return <div className="space-y-6">
    <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div>
        <p className="font-bold text-indigo-600">Learner dashboard · Roadmap v{stats.roadmapVersion}</p>
        <h1 className="text-4xl font-black text-slate-950">{course.title}</h1>
        <p className="mt-2 text-slate-600">{course.description}</p>
      </div>
    </div>

    {canPersonalize && <Card className="border border-indigo-100 bg-indigo-50/70">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div><h2 className="text-xl font-black text-indigo-950">Want a more accurate roadmap?</h2><p className="mt-1 text-indigo-900">Take a diagnostic anytime to create a new personalized roadmap version from your weak areas.</p></div>
        <Button onClick={() => navigate('/onboarding/assessment?personalize=true')}>Personalize my roadmap</Button>
      </div>
    </Card>}

    <div className="grid gap-5 md:grid-cols-4">
      <StatCard title="Lessons" value={`${stats.completedLessons}/${stats.totalLessons}`} />
      <StatCard title="Quiz accuracy" value={`${stats.quizAccuracy || 0}%`} />
      <StatCard title="Critical weak topics" value={stats.criticalWeakTopicsCount || 0} />
      <StatCard title="Revisions due" value={stats.revisionsDue || 0} />
    </div>

    <div className="grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
      <ContinueLearningCard lesson={nextLesson} />
      <Card>
        <h3 className="text-lg font-black text-slate-950">Today’s learning plan</h3>
        <div className="mt-4 space-y-3">
          {studyPlan.length ? studyPlan.map((item) => <Link key={`${item.label}-${item.title}`} to={item.path} className="block rounded-2xl border border-slate-100 bg-white/70 p-4 transition hover:-translate-y-0.5 hover:shadow-soft">
            <div className="flex items-center justify-between gap-3"><div><Badge>{item.label}</Badge><p className="mt-2 font-bold text-slate-900">{item.title}</p></div><span className="text-sm font-bold text-slate-500">{item.minutes} min</span></div>
          </Link>) : <p className="text-sm text-slate-500">Complete a lesson or quiz to generate a daily plan.</p>}
        </div>
      </Card>
    </div>

    <div className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
      <ProgressChart value={stats.overallCompletion || 0} completed={stats.completedLessons} total={stats.totalLessons} />
      <Card>
        <h3 className="text-lg font-black text-slate-950">Recommended next actions</h3>
        <div className="mt-4 space-y-3">
          {recommendations.map((item) => <Link key={item.title} to={item.actionPath} className={`block rounded-2xl border p-4 ${priorityStyle[item.priority] || priorityStyle.medium}`}>
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between"><div><p className="font-black">{item.title}</p><p className="mt-1 text-sm opacity-80">{item.description}</p></div><span className="text-sm font-bold">{item.actionLabel} →</span></div>
          </Link>)}
        </div>
      </Card>
    </div>



    <div className="grid gap-5 lg:grid-cols-2">
      <Card className="border border-cyan-100 bg-cyan-50/70">
        <Badge className="bg-cyan-100 text-cyan-700">Sprint 3</Badge>
        <h3 className="mt-3 text-xl font-black text-cyan-950">Practice with project tasks</h3>
        <p className="mt-2 text-sm leading-6 text-cyan-900">Move beyond reading lessons. Submit practical MERN tasks and get AI checklist-based feedback on your implementation approach.</p>
        <Link to="/projects"><Button className="mt-5">Open projects</Button></Link>
      </Card>
      <Card className="border border-violet-100 bg-violet-50/70">
        <Badge className="bg-violet-100 text-violet-700">Interview mode</Badge>
        <h3 className="mt-3 text-xl font-black text-violet-950">Practice interview answers</h3>
        <p className="mt-2 text-sm leading-6 text-violet-900">Answer MERN interview questions and receive AI feedback with expected answers, scoring, strengths, and improvement points.</p>
        <Link to="/interview"><Button className="mt-5">Start interview mode</Button></Link>
      </Card>
    </div>

    <div className="grid gap-5 lg:grid-cols-2">
      <WeakTopicsCard topics={progress?.weakTopics || []} />
      <Card>
        <h3 className="text-lg font-black text-slate-950">Roadmap versions</h3>
        <div className="mt-4 space-y-3">
          {roadmapVersions.slice(0, 4).map((item) => <div key={item._id} className="flex items-center justify-between rounded-2xl bg-white/70 p-4">
            <div><p className="font-bold">v{item.version} · {item.title}</p><p className="text-sm text-slate-500 capitalize">{String(item.generatedReason || '').replaceAll('_', ' ')} · {item.roadmapType}</p></div>
            {item.isActive && <Badge className="bg-emerald-50 text-emerald-700">Active</Badge>}
          </div>)}
        </div>
      </Card>
    </div>
  </div>;
}
