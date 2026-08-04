import { useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, ArrowRight, BarChart3, CheckCircle2 } from 'lucide-react';
import { assessmentApi } from '../../api/assessmentApi.js';
import { roadmapApi } from '../../api/roadmapApi.js';
import Card from '../../components/common/Card.jsx';
import Button from '../../components/common/Button.jsx';
import Badge from '../../components/common/Badge.jsx';
import Loader from '../../components/common/Loader.jsx';
import ErrorMessage from '../../components/common/ErrorMessage.jsx';
import EmptyState from '../../components/common/EmptyState.jsx';
import OnboardingShell from '../../components/onboarding/OnboardingShell.jsx';
import OnboardingInsightCard from '../../components/onboarding/OnboardingInsightCard.jsx';
import { queryKeys } from '../../constants/queryKeys.js';

export default function AssessmentReportPage() {
  const { assessmentId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const isPersonalizeFlow = searchParams.get('personalize') === 'true';
  const personalizeQuery = isPersonalizeFlow ? '?personalize=true' : '';
  const [error, setError] = useState('');
  const [creating, setCreating] = useState(false);

  const { data, isLoading, error: reportError } = useQuery({
    queryKey: ['assessment-report', assessmentId],
    queryFn: () => assessmentApi.report(assessmentId),
    enabled: Boolean(assessmentId),
    retry: false
  });

  const report = data?.report;

  const refreshLearningState = async (course = null) => {
    if (course) {
      queryClient.setQueryData(queryKeys.onboardingStatus, (current = {}) => ({
        ...current,
        hasActiveCourse: true,
        activeCourse: course
      }));
      queryClient.setQueryData(queryKeys.roadmap, { course });
    }

    await Promise.all([
      queryClient.invalidateQueries({ queryKey: queryKeys.onboardingStatus }),
      queryClient.invalidateQueries({ queryKey: queryKeys.roadmap }),
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard })
    ]);
  };

  const generateRoadmap = async () => {
    if (creating) return;

    try {
      setCreating(true);
      setError('');
      const learningGoalId = report?.learningGoalId;

      if (!learningGoalId) {
        setError('Learning goal was not found. Please restart onboarding.');
        return;
      }

      const result = await roadmapApi.fromAssessment({
        learningGoalId,
        assessmentId,
        forceNewVersion: isPersonalizeFlow
      });

      if (result?.mode === 'queued' && result?.job?._id) {
        await queryClient.invalidateQueries({ queryKey: queryKeys.onboardingStatus });
        navigate(`/onboarding/generating?jobId=${result.job._id}${isPersonalizeFlow ? '&personalize=true' : ''}`, { replace: true });
        return;
      }

      if (result?.course || result?.mode === 'existing' || result?.mode === 'sync') {
        await refreshLearningState(result?.course || null);
        navigate('/dashboard', { replace: true });
        return;
      }

      await refreshLearningState();
      navigate('/onboarding/generating', { replace: true });
    } catch (err) {
      setError(err?.message || 'Could not generate your roadmap. Please try again.');
    } finally {
      setCreating(false);
    }
  };

  if (isLoading) return <Loader label="Preparing diagnostic report..." />;
  if (!assessmentId || reportError || !report) {
    return <EmptyState
      title="Diagnostic report is unavailable"
      description={reportError?.message || 'The assessment report could not be found. Complete the diagnostic again or return to your dashboard.'}
      actionLabel={isPersonalizeFlow ? 'Back to dashboard' : 'Back to diagnostic'}
      onAction={() => navigate(isPersonalizeFlow ? '/dashboard' : `/onboarding/assessment${personalizeQuery}`)}
    />;
  }

  return <OnboardingShell
    current="roadmap"
    eyebrow="Step 4 · Diagnostic report"
    title={`Your assessment score is ${report.score || 0}%`}
    description={report.summary || 'Review your stored strengths and weak topics before generating the personalized roadmap.'}
    backTo={`/onboarding/assessment${personalizeQuery}`}
    aside={<>
      <OnboardingInsightCard title="Roadmap recommendation" badge={report.recommendedLevel || 'Review'} items={[
        {
          title: String(report.suggestedRoadmapType || 'personalized roadmap').replaceAll('_', ' '),
          description: 'This recommendation comes from the saved assessment score and weak-topic distribution.'
        },
        {
          title: 'Roadmap version',
          description: isPersonalizeFlow
            ? 'A newer personalized version will become active while your earlier roadmap stays in version history.'
            : 'This will create your active roadmap and then open the learner dashboard.'
        }
      ]} />
      <Card className="bg-primary-soft">
        <BarChart3 className="text-primary" aria-hidden="true" />
        <p className="mt-3 font-bold text-foreground">Explainable personalization</p>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">The category results below explain why specific topics may appear earlier in your roadmap.</p>
      </Card>
    </>}
  >
    <ErrorMessage message={error} />

    <div className="grid gap-5 lg:grid-cols-2">
      <Card>
        <h2 className="flex items-center gap-2 text-xl font-bold text-foreground"><BarChart3 size={20} aria-hidden="true" /> Category scores</h2>
        <div className="mt-5 space-y-4">
          {(report.categoryScores || []).length ? report.categoryScores.map((item) => {
            const score = Math.max(0, Math.min(100, Number(item.score) || 0));
            return <div key={item.topic} className="rounded-surface bg-surface-secondary p-4">
              <div className="mb-2 flex justify-between gap-4 text-sm font-semibold text-foreground"><span>{item.topic}</span><span>{score}%</span></div>
              <div className="h-3 overflow-hidden rounded-full bg-surface" role="progressbar" aria-label={`${item.topic} score`} aria-valuemin="0" aria-valuemax="100" aria-valuenow={score}>
                <div className="h-full rounded-full bg-primary" style={{ width: `${score}%` }} />
              </div>
            </div>;
          }) : <p className="text-sm text-muted-foreground">No category breakdown was returned for this assessment.</p>}
        </div>
      </Card>

      <div className="space-y-5">
        <Card>
          <h2 className="flex items-center gap-2 text-xl font-bold text-foreground"><AlertTriangle size={20} aria-hidden="true" /> Weak topics to prioritize</h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {report.weakTopics?.length ? report.weakTopics.map((item) => <Badge key={item.topic} variant="danger">{item.topic} · {item.score}%</Badge>) : <p className="text-sm text-muted-foreground">No major weak topic was detected.</p>}
          </div>
        </Card>

        <Card>
          <h2 className="flex items-center gap-2 text-xl font-bold text-foreground"><CheckCircle2 size={20} aria-hidden="true" /> Strong topics</h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {report.strongTopics?.length ? report.strongTopics.map((item) => <Badge key={item.topic} variant="success">{item.topic} · {item.score}%</Badge>) : <p className="text-sm text-muted-foreground">No strong-topic signal was recorded.</p>}
          </div>
        </Card>
      </div>
    </div>

    <Card className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Generate personalized roadmap</h2>
        <p className="mt-2 max-w-2xl text-muted-foreground">The saved diagnostic report will be used as the trusted source for roadmap generation. Existing or already-running work will be reused by the backend.</p>
      </div>
      <Button onClick={generateRoadmap} isLoading={creating} loadingLabel="Generating roadmap..." className="shrink-0 px-6">
        Generate roadmap <ArrowRight size={18} aria-hidden="true" />
      </Button>
    </Card>
  </OnboardingShell>;
}
