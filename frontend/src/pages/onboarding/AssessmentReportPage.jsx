import { useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
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

const roadmapRecommendationLabel = (value) => ({
  assessment_ai_personalized: 'Personalized roadmap',
  template_ai_adjusted: 'Adjusted roadmap',
  template: 'Recommended roadmap',
  foundation_repair: 'Foundation-focused roadmap',
  gap_focused: 'Gap-focused roadmap',
  accelerated: 'Accelerated roadmap',
  balanced_personalized: 'Balanced personalized roadmap'
}[value] || 'Personalized roadmap');

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
    return <EmptyState
      title="Skill-check results unavailable"
      description={reportError?.message || 'Your results could not be found. Take the skill check again or return to your dashboard.'}
      actionLabel={isPersonalizeFlow ? 'Back to dashboard' : 'Back to skill check'}
      onAction={() => navigate(isPersonalizeFlow ? '/dashboard' : `/onboarding/assessment${personalizeQuery}`)}
    />;
  }

  return <OnboardingShell
    current="roadmap"
    eyebrow="Step 4 · Your results"
    title={`You scored ${report.score || 0}%`}
    description={report.summary || 'Review your stronger areas and the topics that need more practice before creating your course roadmap.'}
    backTo={`/onboarding/assessment${personalizeQuery}`}
    aside={<>
      <OnboardingInsightCard title="Recommended next step" badge={report.recommendedLevel || 'Review'} items={[
        {
          title: roadmapRecommendationLabel(report.suggestedRoadmapType),
          description: 'This recommendation uses only your selected course diagnostic results and the areas that need more practice.'
        },
        {
          title: isPersonalizeFlow ? 'Update this course roadmap' : 'Create this course roadmap',
          description: isPersonalizeFlow
            ? 'The updated version replaces the active roadmap for this enrollment while preserving its earlier version.'
            : 'Your roadmap will open as soon as it is ready.'
        }
      ]} />
      <Card className="bg-primary-soft">
        <BarChart3 className="text-primary" aria-hidden="true" />
        <p className="mt-3 font-bold text-foreground">Diagnostic emphasis, not a different course</p>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">Your scores can change emphasis and pacing, while the selected course remains the source of lessons and questions.</p>
      </Card>
    </>}
  >
    <ErrorMessage message={error} />

    <div className="grid gap-5 lg:grid-cols-2">
      <Card>
        <h2 className="flex items-center gap-2 text-xl font-bold text-foreground"><BarChart3 size={20} aria-hidden="true" /> Topic scores</h2>
        <div className="mt-5 space-y-4">
          {(report.categoryScores || []).length ? report.categoryScores.map((item) => {
            const score = Math.max(0, Math.min(100, Number(item.score) || 0));
            return <div key={item.topic} className="rounded-surface bg-surface-secondary p-4">
              <div className="mb-2 flex justify-between gap-4 text-sm font-semibold text-foreground"><span>{item.topic}</span><span>{score}%</span></div>
              <div className="h-3 overflow-hidden rounded-full bg-surface" role="progressbar" aria-label={`${item.topic} score`} aria-valuemin="0" aria-valuemax="100" aria-valuenow={score}>
                <div className="h-full rounded-full bg-primary" style={{ width: `${score}%` }} />
              </div>
            </div>;
          }) : <p className="text-sm text-muted-foreground">No topic breakdown is available for this result.</p>}
        </div>
      </Card>

      <div className="space-y-5">
        <Card>
          <h2 className="flex items-center gap-2 text-xl font-bold text-foreground"><AlertTriangle size={20} aria-hidden="true" /> Topics to practise first</h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {report.weakTopics?.length ? report.weakTopics.map((item) => <Badge key={item.topic} variant="danger">{item.topic} · {item.score}%</Badge>) : <p className="text-sm text-muted-foreground">No topic needs urgent attention.</p>}
          </div>
        </Card>

        <Card>
          <h2 className="flex items-center gap-2 text-xl font-bold text-foreground"><CheckCircle2 size={20} aria-hidden="true" /> Stronger topics</h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {report.strongTopics?.length ? report.strongTopics.map((item) => <Badge key={item.topic} variant="success">{item.topic} · {item.score}%</Badge>) : <p className="text-sm text-muted-foreground">Complete more questions to identify your strongest topics.</p>}
          </div>
        </Card>
      </div>
    </div>

    <Card className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <div>
        <h2 className="text-2xl font-bold text-foreground">{isPersonalizeFlow ? 'Create the updated course roadmap' : 'Create your course roadmap'}</h2>
        <p className="mt-2 max-w-2xl text-muted-foreground">Your results will help prioritize course topics that need more practice without mixing content from another course.</p>
      </div>
      <Button onClick={generateRoadmap} isLoading={creating} loadingLabel="Creating roadmap..." className="shrink-0 px-6">
        Create roadmap <ArrowRight size={18} aria-hidden="true" />
      </Button>
    </Card>
  </OnboardingShell>;
}
