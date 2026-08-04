import { Link, useNavigate } from 'react-router-dom';
import { BookOpenCheck, ClipboardCheck, RefreshCw, Target } from 'lucide-react';
import Loader from '../../components/common/Loader.jsx';
import EmptyState from '../../components/common/EmptyState.jsx';
import Card from '../../components/common/Card.jsx';
import Badge from '../../components/common/Badge.jsx';
import StatusPill from '../../components/common/StatusPill.jsx';
import PageShell from '../../components/common/PageShell.jsx';
import PageHeader from '../../components/common/PageHeader.jsx';
import MetricGrid from '../../components/common/MetricGrid.jsx';
import StatCard from '../../components/dashboard/StatCard.jsx';
import ContinueLearningCard from '../../components/dashboard/ContinueLearningCard.jsx';
import WeakTopicsCard from '../../components/dashboard/WeakTopicsCard.jsx';
import ProgressChart from '../../components/dashboard/ProgressChart.jsx';
import { useDashboard } from '../../queries/dashboardQueries.js';

export default function DashboardPage() {
  const navigate = useNavigate();
  const { data, isLoading, error, refetch } = useDashboard();

  if (isLoading) return <Loader label="Loading dashboard..." />;
  if (error) return <EmptyState title="Dashboard is unavailable" description={error.message} actionLabel="Try again" onAction={() => refetch()} />;
  if (!data?.course) return <EmptyState title="No active roadmap yet" description="Complete your setup to create a learning roadmap." actionLabel="Continue setup" onAction={() => navigate('/onboarding/goal')} />;

  const {
    stats = {},
    progress,
    nextLesson,
    course,
    recommendations = [],
    studyPlan = [],
    roadmapVersions = []
  } = data;
  const canPersonalize = Boolean(stats.canPersonalizeLater || (['intermediate', 'advanced'].includes(course.level) && course.generatedReason !== 'assessment_personalized'));

  return <PageShell>
    <PageHeader
      eyebrow={`Your roadmap · Version ${stats.roadmapVersion || course.version || 1}`}
      title={course.title}
      description={course.description}
      actions={<>
        <Link to="/progress" className="ui-button ui-button--secondary">View progress</Link>
        <Link to="/reports" className="ui-button ui-button--secondary">Weekly reports</Link>
      </>}
    />

    {canPersonalize && <Card className="border-primary/20 bg-primary-soft">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div><Badge>Optional skill check</Badge><h2 className="mt-3 text-xl font-bold text-foreground">Make your roadmap more focused</h2><p className="mt-1 text-sm leading-6 text-muted-foreground">Use a short skill check to update your roadmap around the topics that need more practice. Your current progress will stay available.</p></div>
        <Link to="/onboarding/assessment?personalize=true" className="ui-button ui-button--primary shrink-0">Take skill check</Link>
      </div>
    </Card>}

    <MetricGrid>
      <StatCard icon={BookOpenCheck} title="Lessons completed" value={`${stats.completedLessons || 0}/${stats.totalLessons || 0}`} subtitle="Your current roadmap" />
      <StatCard icon={ClipboardCheck} title="Quiz average" value={`${stats.quizAccuracy || 0}%`} subtitle="Completed quizzes" />
      <StatCard icon={Target} title="Priority topics" value={stats.criticalWeakTopicsCount || 0} subtitle="Topics to review soon" />
      <StatCard icon={RefreshCw} title="Revisions due" value={stats.revisionsDue || 0} subtitle="Ready to review" />
    </MetricGrid>

    <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
      <ContinueLearningCard lesson={nextLesson} />
      <Card>
        <h2 className="text-xl font-bold text-foreground">Today’s learning plan</h2>
        <p className="mt-1 text-sm leading-6 text-muted-foreground">Your next lesson, revision tasks, and recommended practice for today.</p>
        <div className="mt-5 space-y-3">
          {studyPlan.length ? studyPlan.map((item, index) => <Link key={`${item.label}-${item.title}-${index}`} to={item.path || '/roadmap'} className="block rounded-surface border border-border bg-surface p-4 transition hover:border-primary/30 hover:bg-surface-secondary">
            <div className="flex items-start justify-between gap-4"><div><Badge variant="neutral">{item.label}</Badge><p className="mt-2 font-semibold text-foreground">{item.title}</p></div>{Number(item.minutes) > 0 && <span className="shrink-0 text-sm font-semibold text-muted-foreground">{item.minutes} min</span>}</div>
          </Link>) : <p className="rounded-surface bg-surface-secondary p-4 text-sm leading-6 text-muted-foreground">Nothing is scheduled for today. Open your roadmap to continue with the next available lesson.</p>}
        </div>
      </Card>
    </div>

    <div className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
      <ProgressChart value={stats.overallCompletion || progress?.overallCompletion || 0} completed={stats.completedLessons} total={stats.totalLessons} />
      <Card>
        <h2 className="text-xl font-bold text-foreground">Recommended next actions</h2>
        <p className="mt-1 text-sm leading-6 text-muted-foreground">Suggestions based on your progress, due revisions, and topics that need more practice.</p>
        <div className="mt-5 space-y-3">
          {recommendations.length ? recommendations.map((item, index) => <Link key={`${item.title}-${index}`} to={item.actionPath || '/roadmap'} className="block rounded-surface border border-border bg-surface p-4 transition hover:border-primary/30 hover:bg-surface-secondary">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><div className="flex flex-wrap items-center gap-2"><p className="font-semibold text-foreground">{item.title}</p><StatusPill status={item.priority || 'medium'} /></div><p className="mt-1 text-sm leading-6 text-muted-foreground">{item.description}</p></div><span className="auth-link shrink-0 text-sm">{item.actionLabel || 'Open'} →</span></div>
          </Link>) : <p className="rounded-surface bg-surface-secondary p-4 text-sm leading-6 text-muted-foreground">Complete a lesson or quiz to receive your first recommendation.</p>}
        </div>
      </Card>
    </div>

    <div className="grid gap-5 lg:grid-cols-2">
      <Card>
        <Badge variant="neutral">Project practice</Badge>
        <h2 className="mt-3 text-xl font-bold text-foreground">Apply what you learn in practical tasks</h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">Submit your solution and review available feedback. Your work stays saved even when detailed feedback is temporarily unavailable.</p>
        <Link to="/projects" className="ui-button ui-button--secondary mt-5">Open projects</Link>
      </Card>
      <Card>
        <Badge variant="neutral">Interview practice</Badge>
        <h2 className="mt-3 text-xl font-bold text-foreground">Build clearer interview answers</h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">Write your answer before seeing the expected response, then compare and improve it.</p>
        <Link to="/interview" className="ui-button ui-button--secondary mt-5">Open interview practice</Link>
      </Card>
    </div>

    <div className="grid gap-5 lg:grid-cols-2">
      <WeakTopicsCard topics={progress?.weakTopics || []} />
      <Card>
        <h2 className="text-xl font-bold text-foreground">Previous roadmaps</h2>
        <p className="mt-1 text-sm leading-6 text-muted-foreground">Earlier roadmaps stay available when you create an updated one.</p>
        <div className="mt-5 space-y-3">
          {roadmapVersions.length ? roadmapVersions.slice(0, 5).map((item) => <div key={item._id} className="flex flex-col gap-3 rounded-surface bg-surface-secondary p-4 sm:flex-row sm:items-center sm:justify-between">
            <div><p className="font-semibold text-foreground">Version {item.version} · {item.title}</p><p className="mt-1 text-sm capitalize text-muted-foreground">{item.level || 'learner'} level · {item.isActive ? 'Current roadmap' : 'Previous roadmap'}</p></div>
            <StatusPill status={item.isActive ? 'active' : item.status || 'archived'} />
          </div>) : <p className="text-sm text-muted-foreground">No previous roadmaps yet.</p>}
        </div>
      </Card>
    </div>
  </PageShell>;
}
