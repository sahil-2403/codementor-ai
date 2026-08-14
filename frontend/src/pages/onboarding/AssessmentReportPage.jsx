import { useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { AlertTriangle, ArrowLeft, ArrowRight, BarChart3, CheckCircle2 } from 'lucide-react';
import { assessmentApi } from '../../api/assessmentApi.js';
import { roadmapApi } from '../../api/roadmapApi.js';
import Button from '../../components/common/Button.jsx';
import Loader from '../../components/common/Loader.jsx';
import ErrorMessage from '../../components/common/ErrorMessage.jsx';
import EmptyState from '../../components/common/EmptyState.jsx';
import OnboardingShell from '../../components/onboarding/OnboardingShell.jsx';

const roadmapRecommendationLabel = (value) => ({
  assessment_ai_personalized: 'Personalized roadmap',
  template_ai_adjusted: 'Adjusted roadmap',
  template: 'Recommended roadmap',
  foundation_repair: 'Foundation-focused roadmap',
  gap_focused: 'Gap-focused roadmap',
  accelerated: 'Accelerated roadmap',
  balanced_personalized: 'Balanced personalized roadmap'
}[value] || 'Personalized roadmap');

function TopicList({ title, icon: Icon, items = [], emptyText, tone }) {
  const toneClass = tone === 'success' ? 'text-success bg-success-soft' : 'text-warning bg-warning-soft';

  return (
    <section className="rounded-panel border border-border bg-surface p-5 sm:p-6">
      <div className="flex items-center gap-3">
        <span className={`grid h-10 w-10 place-items-center rounded-surface ${toneClass}`} aria-hidden="true">
          <Icon size={18} />
        </span>
        <h2 className="text-lg font-bold text-foreground">{title}</h2>
      </div>

      {items.length ? (
        <div className="mt-5 space-y-3">
          {items.map((item) => (
            <div key={item.topic} className="flex items-center justify-between gap-4 text-sm">
              <span className="font-semibold text-foreground">{item.topic}</span>
              <span className="text-muted-foreground">{item.score}%</span>
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-4 text-sm text-muted-foreground">{emptyText}</p>
      )}
    </section>
  );
}

export default function AssessmentReportPage() {
  const { assessmentId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isPersonalizeFlow = searchParams.get('personalize') === 'true';
  const personalizeQuery = isPersonalizeFlow ? '?personalize=true' : '';
  const [report, setReport] = useState(null);
  const [reportError, setReportError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (!assessmentId) {
      setIsLoading(false);
      return undefined;
    }

    let active = true;
    setIsLoading(true);
    setReportError(null);

    assessmentApi.report(assessmentId)
      .then((result) => {
        if (active) setReport(result?.report || null);
      })
      .catch((requestError) => {
        if (active) setReportError(requestError);
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [assessmentId]);

  const generateRoadmap = async () => {
    if (creating) return;

    try {
      setCreating(true);
      setError('');
      const enrollmentId = report?.enrollmentId;

      if (!enrollmentId) {
        setError('Course enrollment was not found. Please choose the course again.');
        return;
      }

      const result = await roadmapApi.fromAssessment({
        enrollmentId,
        assessmentId,
        forceNewVersion: isPersonalizeFlow
      });

      if (!result?.course) {
        setError('The roadmap request finished, but no course roadmap was returned. Please try again.');
        return;
      }

      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(err?.message || 'Could not create your roadmap. Please try again.');
    } finally {
      setCreating(false);
    }
  };

  if (isLoading) return <Loader label="Preparing your results..." />;
  if (!assessmentId || reportError || !report) {
    return (
      <EmptyState
        title="Skill-check results unavailable"
        description={reportError?.message || 'Your results could not be found. Take the skill check again or return to your dashboard.'}
        actionLabel={isPersonalizeFlow ? 'Back to dashboard' : 'Back to skill check'}
        onAction={() => navigate(isPersonalizeFlow ? '/dashboard' : `/onboarding/assessment${personalizeQuery}`)}
      />
    );
  }

  const score = Math.max(0, Math.min(100, Number(report.score) || 0));

  return (
    <OnboardingShell
      current="roadmap"
      eyebrow="Skill check results"
      title="Your skill check results"
      description={report.summary || 'Review your strongest topics and the areas that need more practice.'}
      footer={
        <div className="flex items-center justify-between gap-3">
          <Button
            type="button"
            variant="secondary"
            onClick={() => navigate(`/onboarding/assessment${personalizeQuery}`)}
            disabled={creating}
            className="gap-2"
          >
            <ArrowLeft size={16} aria-hidden="true" /> Previous
          </Button>
          <Button
            type="button"
            onClick={generateRoadmap}
            isLoading={creating}
            loadingLabel="Creating roadmap..."
            className="gap-2 px-6"
          >
            {isPersonalizeFlow ? 'Update roadmap' : 'Create my roadmap'}
            <ArrowRight size={16} aria-hidden="true" />
          </Button>
        </div>
      }
    >
      <ErrorMessage message={error} />

      <div className="grid gap-5 lg:grid-cols-[260px_minmax(0,1fr)]">
        <section className="rounded-panel border border-border bg-surface p-6 text-center">
          <p className="text-sm font-semibold text-muted-foreground">Overall score</p>
          <p className="mt-3 text-5xl font-extrabold tracking-tight text-primary-strong">{score}%</p>
          <p className="mt-5 text-sm font-semibold text-foreground">Recommended level</p>
          <p className="mt-1 text-xl font-bold capitalize text-foreground">{report.recommendedLevel || 'Review'}</p>
          <p className="mt-3 text-xs font-semibold text-muted-foreground">
            {roadmapRecommendationLabel(report.suggestedRoadmapType)}
          </p>
        </section>

        <section className="rounded-panel border border-border bg-surface p-5 sm:p-6">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-surface bg-primary-soft text-primary-strong" aria-hidden="true">
              <BarChart3 size={18} />
            </span>
            <h2 className="text-lg font-bold text-foreground">Topic performance</h2>
          </div>

          <div className="mt-5 space-y-4">
            {(report.categoryScores || []).length ? report.categoryScores.map((item) => {
              const topicScore = Math.max(0, Math.min(100, Number(item.score) || 0));
              return (
                <div key={item.topic}>
                  <div className="mb-2 flex items-center justify-between gap-4 text-sm">
                    <span className="font-semibold text-foreground">{item.topic}</span>
                    <span className="text-muted-foreground">{topicScore}%</span>
                  </div>
                  <div
                    className="h-2 overflow-hidden rounded-full bg-surface-secondary"
                    role="progressbar"
                    aria-label={`${item.topic} score`}
                    aria-valuemin="0"
                    aria-valuemax="100"
                    aria-valuenow={topicScore}
                  >
                    <div className="h-full rounded-full bg-primary" style={{ width: `${topicScore}%` }} />
                  </div>
                </div>
              );
            }) : (
              <p className="text-sm text-muted-foreground">No topic breakdown is available for this result.</p>
            )}
          </div>
        </section>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <TopicList
          title="Strong topics"
          icon={CheckCircle2}
          items={report.strongTopics || []}
          emptyText="No strong topic has been identified yet."
          tone="success"
        />
        <TopicList
          title="Topics to improve"
          icon={AlertTriangle}
          items={report.weakTopics || []}
          emptyText="No topic needs urgent attention."
          tone="warning"
        />
      </div>
    </OnboardingShell>
  );
}
