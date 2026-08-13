import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  BarChart3,
  BookOpenCheck,
  ClipboardCheck,
  Code2,
  FolderCode,
  MessageSquareText,
  RefreshCw,
  Route,
  Target
} from 'lucide-react';
import Loader from '../../components/common/Loader.jsx';
import EmptyState from '../../components/common/EmptyState.jsx';
import StatusPill from '../../components/common/StatusPill.jsx';
import PageHeader from '../../components/common/PageHeader.jsx';
import PageShell from '../../components/common/PageShell.jsx';
import CourseProgress from '../../components/progress/CourseProgress.jsx';
import { useAuth } from '../../hooks/useAuth.js';
import { progressApi } from '../../api/progressApi.js';

const metricTones = {
  blue: {
    accent: 'bg-blue-500',
    icon: 'bg-blue-50 text-blue-600'
  },
  green: {
    accent: 'bg-emerald-500',
    icon: 'bg-emerald-50 text-emerald-600'
  },
  rose: {
    accent: 'bg-rose-500',
    icon: 'bg-rose-50 text-rose-600'
  },
  amber: {
    accent: 'bg-amber-500',
    icon: 'bg-amber-50 text-amber-600'
  }
};

const planTones = {
  lesson: {
    icon: BookOpenCheck,
    iconClass: 'bg-blue-50 text-blue-600 ring-blue-100',
    dotClass: 'bg-blue-500'
  },
  revision: {
    icon: RefreshCw,
    iconClass: 'bg-amber-50 text-amber-600 ring-amber-100',
    dotClass: 'bg-amber-500'
  },
  quiz: {
    icon: ClipboardCheck,
    iconClass: 'bg-violet-50 text-violet-600 ring-violet-100',
    dotClass: 'bg-violet-500'
  },
  practice: {
    icon: Code2,
    iconClass: 'bg-emerald-50 text-emerald-600 ring-emerald-100',
    dotClass: 'bg-emerald-500'
  }
};

const getPlanTone = (label = '') => {
  const normalized = String(label).toLowerCase();
  if (normalized.includes('revision') || normalized.includes('review')) {
    return planTones.revision;
  }
  if (normalized.includes('quiz')) return planTones.quiz;
  if (
    normalized.includes('project') ||
    normalized.includes('practice') ||
    normalized.includes('interview')
  ) {
    return planTones.practice;
  }
  return planTones.lesson;
};

const getRecommendationMeta = (item = {}) => {
  const path = String(item.actionPath || '').toLowerCase();
  const text = `${item.title || ''} ${item.description || ''}`.toLowerCase();

  if (path.includes('/projects') || text.includes('project')) {
    return {
      icon: FolderCode,
      iconClass: 'bg-emerald-50 text-emerald-600',
      linkClass: 'text-emerald-700'
    };
  }

  if (path.includes('/interview') || text.includes('interview')) {
    return {
      icon: MessageSquareText,
      iconClass: 'bg-violet-50 text-violet-600',
      linkClass: 'text-violet-700'
    };
  }

  if (text.includes('revision') || text.includes('review')) {
    return {
      icon: RefreshCw,
      iconClass: 'bg-blue-50 text-blue-600',
      linkClass: 'text-blue-700'
    };
  }

  return {
    icon: Target,
    iconClass: 'bg-primary-soft text-primary-strong',
    linkClass: 'text-primary-strong'
  };
};

function DashboardPanel({ children, className = '' }) {
  return (
    <section
      className={`rounded-panel border border-border bg-surface shadow-sm ${className}`}
    >
      {children}
    </section>
  );
}

function MetricCard({ icon: Icon, title, value, subtitle, tone }) {
  const styles = metricTones[tone] || metricTones.blue;

  return (
    <div className="group relative overflow-hidden rounded-panel border border-border bg-surface p-4 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-primary/20 hover:shadow-soft sm:p-5">
      <span
        className={`absolute inset-x-0 top-0 h-0.5 ${styles.accent}`}
        aria-hidden="true"
      />
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold text-muted-foreground sm:text-sm">
            {title}
          </p>
          <p className="mt-2 text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
            {value}
          </p>
          <p className="mt-1 text-xs leading-5 text-muted-foreground sm:text-sm">
            {subtitle}
          </p>
        </div>
        <span
          className={`grid h-10 w-10 shrink-0 place-items-center rounded-control transition duration-200 group-hover:scale-105 ${styles.icon}`}
          aria-hidden="true"
        >
          <Icon size={18} />
        </span>
      </div>
    </div>
  );
}

function ContinueLearning({ lesson }) {
  const lessonContext =
    lesson?.moduleTitle ||
    lesson?.module?.title ||
    lesson?.topic ||
    'Next available lesson in your active roadmap';

  return (
    <section className="group relative min-h-[310px] overflow-hidden rounded-panel border border-primary/20 bg-gradient-to-br from-primary-soft via-violet-50 to-blue-50 p-5 shadow-sm transition duration-300 hover:-translate-y-0.5 hover:shadow-soft sm:p-6">
      <div
        className="absolute -right-12 -top-16 h-44 w-44 rounded-full bg-white/65 blur-2xl"
        aria-hidden="true"
      />
      <div
        className="absolute bottom-5 right-6 hidden select-none font-mono text-7xl font-bold tracking-tighter text-primary/5 sm:block"
        aria-hidden="true"
      >
        {'</>'}
      </div>
      <div className="relative flex h-full flex-col">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-primary-strong">
              Continue learning
            </p>
            <div className="mt-4 flex items-center gap-3">
              <span
                className="grid h-12 w-12 shrink-0 place-items-center rounded-surface bg-gradient-to-br from-primary to-blue-500 text-white shadow-sm"
                aria-hidden="true"
              >
                <BookOpenCheck size={22} />
              </span>
              <div className="min-w-0">
                <h2 className="text-xl font-bold text-foreground sm:text-2xl">
                  {lesson?.title || 'Your next lesson will appear here'}
                </h2>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                  {lessonContext}
                </p>
              </div>
            </div>
          </div>

          {lesson?._id ? (
            <span className="hidden rounded-full border border-primary/15 bg-white/70 px-2.5 py-1 text-[11px] font-semibold text-primary-strong sm:inline-flex">
              Available
            </span>
          ) : null}
        </div>

        <p className="mt-6 max-w-xl text-sm leading-6 text-muted-foreground">
          {lesson?._id
            ? 'Pick up from the next available lesson and keep your current roadmap moving forward.'
            : 'No available lesson was returned for the active roadmap.'}
        </p>

        <div className="mt-auto pt-6">
          {lesson?._id ? (
            <Link
              to={`/lessons/${lesson._id}`}
              className="inline-flex min-h-11 items-center gap-2 rounded-control bg-primary px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition duration-200 hover:bg-primary-strong focus-visible:ring-4 focus-visible:ring-primary-soft"
            >
              Open lesson
              <ArrowRight
                size={16}
                className="transition-transform duration-200 group-hover:translate-x-0.5"
                aria-hidden="true"
              />
            </Link>
          ) : (
            <Link to="/roadmap" className="ui-button ui-button--secondary">
              Open roadmap <ArrowRight size={16} aria-hidden="true" />
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}

function TodayPlan({ items }) {
  return (
    <DashboardPanel className="h-full p-5 sm:p-6">
      <div>
        <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
          Today
        </p>
        <h2 className="mt-1 text-xl font-bold text-foreground">
          Your learning plan
        </h2>
        <p className="mt-1 text-sm leading-6 text-muted-foreground">
          The next useful steps from your current roadmap.
        </p>
      </div>

      {items.length ? (
        <div className="mt-5">
          {items.map((item, index) => {
            const tone = getPlanTone(item.label);
            const Icon = tone.icon;
            const isLast = index === items.length - 1;

            return (
              <Link
                key={`${item.label}-${item.title}-${index}`}
                to={item.path || '/roadmap'}
                className="group relative grid grid-cols-[36px_minmax(0,1fr)_auto] gap-3 rounded-control px-1 py-3 transition hover:bg-surface-secondary/70"
              >
                {!isLast ? (
                  <span
                    className="absolute left-[18px] top-[43px] h-[calc(100%-26px)] w-px bg-border"
                    aria-hidden="true"
                  />
                ) : null}
                <span
                  className={`relative z-10 grid h-9 w-9 place-items-center rounded-control ring-1 ${tone.iconClass}`}
                  aria-hidden="true"
                >
                  <Icon size={16} />
                </span>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${tone.dotClass}`}
                      aria-hidden="true"
                    />
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                      {item.label || 'Learning'}
                    </p>
                  </div>
                  <p className="mt-1 truncate text-sm font-semibold text-foreground group-hover:text-primary-strong">
                    {item.title}
                  </p>
                </div>
                {Number(item.minutes) > 0 ? (
                  <span className="self-center text-xs font-semibold text-muted-foreground">
                    {item.minutes} min
                  </span>
                ) : null}
              </Link>
            );
          })}
        </div>
      ) : (
        <div className="mt-5 rounded-surface border border-dashed border-border bg-surface-secondary/60 p-5 text-sm leading-6 text-muted-foreground">
          Nothing is scheduled for today. Open your roadmap to continue with the
          next available lesson.
        </div>
      )}
    </DashboardPanel>
  );
}

function RecommendedActions({ items }) {
  return (
    <section>
      <div className="mb-3">
        <h2 className="text-lg font-bold text-foreground">
          Recommended next actions
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Ordered from your progress, revisions, and topics needing practice.
        </p>
      </div>

      {items.length ? (
        <div className="grid gap-3 md:grid-cols-3">
          {items.slice(0, 3).map((item, index) => {
            const meta = getRecommendationMeta(item);
            const Icon = meta.icon;

            return (
              <Link
                key={`${item.title}-${index}`}
                to={item.actionPath || '/roadmap'}
                className="group rounded-panel border border-border bg-surface p-4 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-soft"
              >
                <div className="flex items-start justify-between gap-3">
                  <span
                    className={`grid h-9 w-9 shrink-0 place-items-center rounded-control ${meta.iconClass}`}
                    aria-hidden="true"
                  >
                    <Icon size={16} />
                  </span>
                  <StatusPill status={item.priority || 'medium'} />
                </div>
                <h3 className="mt-4 text-sm font-bold text-foreground">
                  {item.title}
                </h3>
                <p className="mt-1 line-clamp-2 text-xs leading-5 text-muted-foreground">
                  {item.description}
                </p>
                <span
                  className={`mt-4 inline-flex items-center gap-1 text-xs font-bold ${meta.linkClass}`}
                >
                  {item.actionLabel || 'Open'}
                  <ArrowRight
                    size={13}
                    className="transition-transform duration-200 group-hover:translate-x-1"
                    aria-hidden="true"
                  />
                </span>
              </Link>
            );
          })}
        </div>
      ) : (
        <div className="rounded-panel border border-dashed border-border bg-surface p-5 text-sm text-muted-foreground">
          Complete a lesson or quiz to receive your first recommendation.
        </div>
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
        onAction={() => navigate('/onboarding/goal')}
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
  const overallCompletion =
    stats.overallCompletion || progress?.overallCompletion || 0;

  return (
    <PageShell className="space-y-5 pb-6">
      <PageHeader
        variant="compact"
        eyebrow={`Learning dashboard · ${course.level || 'learner'} level · Version ${stats.roadmapVersion || course.version || 1}`}
        eyebrowIcon={Route}
        title={`Welcome back, ${firstName}`}
        description={
          course.description ||
          'Continue learning and focus on the most useful next steps from your current roadmap.'
        }
        actions={
          <Link
            to="/progress"
            className="ui-button ui-button--secondary min-h-9 gap-2 px-3.5 text-xs sm:text-sm"
          >
            <BarChart3 size={15} aria-hidden="true" />
            View progress
          </Link>
        }
      />

      {canPersonalize ? (
        <section className="relative overflow-hidden rounded-panel border border-primary/20 bg-gradient-to-r from-primary-soft via-violet-50 to-blue-50 px-5 py-4 shadow-sm sm:px-6">
          <div
            className="absolute -right-8 -top-12 h-32 w-32 rounded-full bg-white/65 blur-2xl"
            aria-hidden="true"
          />
          <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <span
                className="grid h-10 w-10 shrink-0 place-items-center rounded-control bg-white/80 text-primary-strong shadow-sm"
                aria-hidden="true"
              >
                <Target size={18} />
              </span>
              <div>
                <p className="text-sm font-bold text-primary-strong">
                  Improve your roadmap accuracy
                </p>
                <p className="mt-1 max-w-2xl text-xs leading-5 text-muted-foreground sm:text-sm">
                  A short skill check can focus future lessons around the topics
                  that need more practice while keeping your current progress
                  available.
                </p>
              </div>
            </div>
            <Link
              to="/onboarding/assessment?personalize=true"
              className="ui-button ui-button--primary min-h-9 shrink-0 px-4 text-sm"
            >
              Take skill check
            </Link>
          </div>
        </section>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          icon={BookOpenCheck}
          title="Lessons completed"
          value={`${stats.completedLessons || 0}/${stats.totalLessons || 0}`}
          subtitle="Your current roadmap"
          tone="blue"
        />
        <MetricCard
          icon={ClipboardCheck}
          title="Quiz average"
          value={`${stats.quizAccuracy || 0}%`}
          subtitle="Completed quizzes"
          tone="green"
        />
        <MetricCard
          icon={Target}
          title="Priority topics"
          value={stats.criticalWeakTopicsCount || 0}
          subtitle="Topics to review soon"
          tone="rose"
        />
        <MetricCard
          icon={RefreshCw}
          title="Revisions due"
          value={stats.revisionsDue || 0}
          subtitle="Ready to review"
          tone="amber"
        />
      </div>

      <CourseProgress
        variant="compact"
        value={overallCompletion}
        completedLessons={stats.completedLessons || 0}
        totalLessons={stats.totalLessons || 0}
      />

      <div className="grid gap-4 lg:grid-cols-[1.55fr_1fr] lg:items-stretch">
        <ContinueLearning lesson={nextLesson} />
        <TodayPlan items={studyPlan} />
      </div>

      <RecommendedActions items={recommendations} />
    </PageShell>
  );
}
