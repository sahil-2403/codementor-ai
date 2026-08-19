import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  BarChart3,
  BookOpenCheck,
  ClipboardCheck,
  Code2,
  MessageSquareText,
  RefreshCw,
  Target
} from 'lucide-react';
import EmptyState from '../../components/common/EmptyState.jsx';
import LevelBadge from '../../components/common/LevelBadge.jsx';
import Loader from '../../components/common/Loader.jsx';
import PageHeader from '../../components/common/PageHeader.jsx';
import PageShell from '../../components/common/PageShell.jsx';
import StatusPill from '../../components/common/StatusPill.jsx';
import CourseProgress from '../../components/progress/CourseProgress.jsx';
import { progressApi } from '../../api/progressApi.js';
import { useAuth } from '../../hooks/useAuth.js';

const planIcons = {
  revision: RefreshCw,
  quiz: ClipboardCheck,
  practice: Code2,
  interview: MessageSquareText,
  lesson: BookOpenCheck
};

const getPlanIcon = (label = '') => {
  const text = String(label).toLowerCase();
  if (text.includes('revision') || text.includes('review')) return planIcons.revision;
  if (text.includes('quiz')) return planIcons.quiz;
  if (text.includes('practice')) return planIcons.practice;
  if (text.includes('interview')) return planIcons.interview;
  return planIcons.lesson;
};

function OverviewStats({ stats }) {
  const items = [
    { label: 'Lessons', value: `${stats.completedLessons || 0}/${stats.totalLessons || 0}`, icon: BookOpenCheck },
    { label: 'Quiz average', value: `${stats.quizAccuracy || 0}%`, icon: ClipboardCheck },
    { label: 'Topics to improve', value: stats.weakTopicsCount || 0, icon: Target },
    { label: 'Revisions due', value: stats.revisionsDue || 0, icon: RefreshCw }
  ];

  return (
    <section className="grid overflow-hidden rounded-surface border border-border bg-surface sm:grid-cols-2 lg:grid-cols-4" aria-label="Learning overview">
      {items.map(({ label, value, icon: Icon }, index) => (
        <div
          key={label}
          className={`flex items-center justify-between gap-3 p-4 ${index ? 'border-t border-border sm:border-t-0 sm:border-l' : ''} ${index === 2 ? 'sm:border-l-0 lg:border-l' : ''}`}
        >
          <div>
            <p className="text-xs font-semibold text-muted-foreground">{label}</p>
            <p className="mt-1 text-2xl font-extrabold tracking-tight text-foreground">{value}</p>
          </div>
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-control bg-surface-secondary text-muted-foreground" aria-hidden="true">
            <Icon size={17} />
          </span>
        </div>
      ))}
    </section>
  );
}

function ContinueLearning({ lesson }) {
  const context = lesson?.moduleTitle || lesson?.module?.title || lesson?.topic || 'Your current roadmap';

  return (
    <section className="flex h-full flex-col rounded-surface border border-primary/20 bg-primary-soft/40 p-4 sm:p-5">
      <div className="flex items-start gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-control bg-primary text-white" aria-hidden="true">
          <BookOpenCheck size={19} />
        </span>
        <div className="min-w-0">
          <p className="text-xs font-semibold text-primary-strong">Continue learning</p>
          <h2 className="mt-1 text-lg font-bold text-foreground sm:text-xl">
            {lesson?.title || 'Open your roadmap to continue'}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">{context}</p>
        </div>
      </div>

      <div className="mt-auto pt-5">
        <Link
          to={lesson?._id ? `/lessons/${lesson._id}` : '/roadmap'}
          className="ui-button ui-button--primary min-h-9 px-3.5 text-sm"
        >
          {lesson?._id ? 'Open lesson' : 'Open roadmap'}
          <ArrowRight size={15} aria-hidden="true" />
        </Link>
      </div>
    </section>
  );
}

function TodayPlan({ items = [] }) {
  return (
    <section className="h-full rounded-surface border border-border bg-surface p-4 sm:p-5">
      <h2 className="text-lg font-bold text-foreground">Today&apos;s plan</h2>

      {items.length ? (
        <div className="mt-3 divide-y divide-border">
          {items.map((item, index) => {
            const Icon = getPlanIcon(item.label);
            return (
              <Link
                key={`${item.label}-${item.title}-${index}`}
                to={item.path || '/roadmap'}
                className="flex items-center gap-3 py-3 first:pt-1 last:pb-0 hover:text-primary-strong"
              >
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-control bg-surface-secondary text-muted-foreground" aria-hidden="true">
                  <Icon size={15} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-muted-foreground">{item.label || 'Learning'}</p>
                  <p className="truncate text-sm font-semibold text-foreground">{item.title}</p>
                </div>
                {Number(item.minutes) > 0 && <span className="text-xs font-semibold text-muted-foreground">{item.minutes} min</span>}
              </Link>
            );
          })}
        </div>
      ) : (
        <p className="mt-3 text-sm leading-6 text-muted-foreground">Nothing is scheduled yet. Open your roadmap for the next lesson.</p>
      )}
    </section>
  );
}

function RecommendedActions({ items = [] }) {
  return (
    <section className="rounded-surface border border-border bg-surface">
      <div className="border-b border-border px-4 py-3 sm:px-5">
        <h2 className="text-lg font-bold text-foreground">Recommended next steps</h2>
      </div>

      {items.length ? (
        <div className="divide-y divide-border">
          {items.slice(0, 3).map((item, index) => {
            const Icon = getPlanIcon(`${item.title || ''} ${item.description || ''} ${item.actionPath || ''}`);
            return (
              <Link
                key={`${item.title}-${index}`}
                to={item.actionPath || '/roadmap'}
                className="flex items-start gap-3 px-4 py-4 transition hover:bg-surface-secondary/50 sm:px-5"
              >
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-control bg-surface-secondary text-muted-foreground" aria-hidden="true">
                  <Icon size={16} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-sm font-bold text-foreground">{item.title}</h3>
                    <StatusPill status={item.priority || 'medium'} />
                  </div>
                  {item.description && <p className="mt-1 text-sm leading-6 text-muted-foreground">{item.description}</p>}
                  <span className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-primary-strong">
                    {item.actionLabel || 'Open'} <ArrowRight size={13} aria-hidden="true" />
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      ) : (
        <p className="px-4 py-5 text-sm text-muted-foreground sm:px-5">Complete a lesson or quiz to receive recommendations.</p>
      )}
    </section>
  );
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadAttempt, setLoadAttempt] = useState(0);

  useEffect(() => {
    let active = true;
    setIsLoading(true);
    setError(null);

    progressApi.dashboard()
      .then((result) => {
        if (active) setData(result);
      })
      .catch((requestError) => {
        if (active) setError(requestError);
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [loadAttempt]);

  if (isLoading) return <Loader label="Loading dashboard..." />;
  if (error) {
    return (
      <EmptyState
        title="Dashboard is unavailable"
        description={error.message}
        actionLabel="Try again"
        onAction={() => setLoadAttempt((value) => value + 1)}
      />
    );
  }
  if (!data?.course) {
    return (
      <EmptyState
        title="No active roadmap yet"
        description="Complete your setup to create a learning roadmap."
        actionLabel="Continue setup"
        onAction={() => navigate('/onboarding/catalog')}
      />
    );
  }

  const {
    stats = {},
    progress,
    nextLesson,
    course,
    recommendations = [],
    studyPlan = []
  } = data;

  const canPersonalize = Boolean(stats.canPersonalizeLater);
  const firstName = user?.name?.trim()?.split(/\s+/)[0] || 'Learner';
  const overallCompletion = stats.overallCompletion || progress?.overallCompletion || 0;

  return (
    <PageShell className="space-y-5 pb-6">
      <PageHeader
        variant="compact"
        eyebrow={`Roadmap version ${stats.roadmapVersion || course.version || 1}`}
        title={`Welcome back, ${firstName}`}
        description={course.description || 'Continue from your current roadmap and focus on the next useful step.'}
        actions={
          <div className="flex items-center gap-2">
            <LevelBadge level={course.level} />
            <Link to="/progress" className="ui-button ui-button--secondary min-h-9 gap-2 px-3.5 text-xs sm:text-sm">
              <BarChart3 size={15} aria-hidden="true" />
              Progress
            </Link>
          </div>
        }
      />

      {canPersonalize && (
        <section className="flex flex-col gap-4 rounded-surface border border-primary/20 bg-primary-soft/45 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
          <div className="flex items-start gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-control bg-primary text-white" aria-hidden="true">
              <Target size={18} />
            </span>
            <div>
              <h2 className="text-base font-bold text-foreground">Personalize your roadmap with a skill check</h2>
              <p className="mt-1 max-w-2xl text-sm leading-6 text-muted-foreground">
                Take a short skill check so CodeMentor can highlight the topics that need more attention and connect them to your roadmap lessons.
              </p>
            </div>
          </div>
          <Link to="/onboarding/assessment?personalize=true" className="ui-button ui-button--primary min-h-9 shrink-0 px-4 text-sm">
            <Target size={15} aria-hidden="true" /> Take skill check
          </Link>
        </section>
      )}

      <OverviewStats stats={stats} />

      <CourseProgress
        variant="compact"
        value={overallCompletion}
        completedLessons={stats.completedLessons || 0}
        totalLessons={stats.totalLessons || 0}
      />

      <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <ContinueLearning lesson={nextLesson} />
        <TodayPlan items={studyPlan} />
      </div>

      <RecommendedActions items={recommendations} />
    </PageShell>
  );
}
