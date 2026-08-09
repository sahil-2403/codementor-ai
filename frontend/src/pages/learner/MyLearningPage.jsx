import { Link, useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { BookOpenCheck, CheckCircle2, GraduationCap, Plus, Route } from 'lucide-react';
import { myLearningApi } from '../../api/myLearningApi.js';
import Button from '../../components/common/Button.jsx';
import Card from '../../components/common/Card.jsx';
import EmptyState from '../../components/common/EmptyState.jsx';
import ErrorMessage from '../../components/common/ErrorMessage.jsx';
import Loader from '../../components/common/Loader.jsx';
import PageHeader from '../../components/common/PageHeader.jsx';
import PageShell from '../../components/common/PageShell.jsx';
import StatusPill from '../../components/common/StatusPill.jsx';
import { queryKeys } from '../../constants/queryKeys.js';

const sameId = (left, right) => Boolean(left && right && String(left) === String(right));

export default function MyLearningPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const learningQuery = useQuery({ queryKey: ['my-learning'], queryFn: myLearningApi.list });
  const selectMutation = useMutation({
    mutationFn: myLearningApi.select,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['my-learning'] }),
        queryClient.invalidateQueries({ queryKey: queryKeys.dashboard }),
        queryClient.invalidateQueries({ queryKey: queryKeys.roadmap }),
        queryClient.invalidateQueries({ queryKey: queryKeys.reports }),
        queryClient.invalidateQueries({ queryKey: ['project-tasks'] }),
        queryClient.invalidateQueries({ queryKey: ['interview-questions'] }),
        queryClient.invalidateQueries({ queryKey: queryKeys.onboardingStatus })
      ]);
      navigate('/dashboard');
    }
  });

  if (learningQuery.isLoading) return <Loader label="Loading your courses..." />;
  if (learningQuery.error) return <PageShell><ErrorMessage message={learningQuery.error.message} /></PageShell>;

  const items = learningQuery.data?.items || [];
  const currentEnrollmentId = learningQuery.data?.currentEnrollmentId;

  return (
    <PageShell className="space-y-6 pb-8">
      <PageHeader
        eyebrow="Your learning"
        eyebrowIcon={GraduationCap}
        title="My courses"
        description="Each course or learning path keeps its own enrollment, roadmap versions, progress, projects, and practice. Choose which one you want to work on now."
        actions={<Link to="/onboarding/catalog" className="ui-button ui-button--primary gap-2"><Plus size={16} /> Add course or path</Link>}
      />

      <ErrorMessage message={selectMutation.error?.message} />

      {items.length ? (
        <div className="grid gap-4 lg:grid-cols-2">
          {items.map((item) => {
            const enrollment = item.enrollment;
            const plan = item.coursePlan;
            const current = sameId(enrollment._id, currentEnrollmentId);
            const isPath = enrollment.type === 'learning_path';
            const Icon = isPath ? Route : BookOpenCheck;
            return (
              <Card key={enrollment._id} className={`min-w-0 shadow-sm ${current ? 'border-primary/35 bg-primary-soft/20' : ''}`}>
                <div className="flex items-start justify-between gap-3">
                  <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-control ${current ? 'bg-primary text-white' : 'bg-surface-secondary text-primary-strong'}`} aria-hidden="true"><Icon size={19} /></span>
                  <div className="flex flex-wrap justify-end gap-2">
                    <StatusPill status={enrollment.status} />
                    {current ? <span className="inline-flex items-center gap-1 rounded-full bg-success-soft px-2.5 py-1 text-xs font-bold text-success"><CheckCircle2 size={13} /> Current</span> : null}
                  </div>
                </div>

                <h2 className="mt-4 break-words text-xl font-bold text-foreground">{item.title}</h2>
                <p className="mt-1 text-xs font-bold uppercase tracking-wide text-primary-strong">{isPath ? 'Learning path' : 'Course'} · {enrollment.level || plan?.level || 'Level not set'}</p>
                {isPath && item.currentCourse ? <p className="mt-3 text-sm text-muted-foreground">Current path course: <strong className="text-foreground">{item.currentCourse.title}</strong></p> : null}
                <p className="mt-3 text-sm leading-6 text-muted-foreground">{plan?.description || item.currentCourse?.description || 'Your generated learning roadmap.'}</p>

                <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold text-muted-foreground">
                  <span className="rounded-full bg-surface-secondary px-2.5 py-1">Roadmap v{plan?.version || 1}</span>
                  <span className="rounded-full bg-surface-secondary px-2.5 py-1">{String(plan?.roadmapType || 'template').replaceAll('_', ' ')}</span>
                  {plan?.aiGenerated ? <span className="rounded-full bg-primary-soft px-2.5 py-1 text-primary-strong">Personalized</span> : null}
                </div>

                <div className="mt-5 flex flex-wrap gap-2 border-t border-border pt-4">
                  {current ? (
                    <Link to="/dashboard" className="ui-button ui-button--primary min-h-9 px-3 text-xs">Continue learning</Link>
                  ) : (
                    <Button type="button" className="min-h-9 px-3 text-xs" isLoading={selectMutation.isPending && selectMutation.variables === enrollment._id} loadingLabel="Switching..." onClick={() => selectMutation.mutate(enrollment._id)}>Switch to this course</Button>
                  )}
                  <Link to="/roadmap" onClick={(event) => { if (!current) event.preventDefault(); }} className={`ui-button ui-button--secondary min-h-9 px-3 text-xs ${!current ? 'pointer-events-none opacity-50' : ''}`}>View roadmap</Link>
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        <EmptyState title="You have not started a course yet" description="Browse the catalog and start any published course directly, or choose a complete learning path." actionLabel="Browse learning catalog" onAction={() => navigate('/onboarding/catalog')} />
      )}
    </PageShell>
  );
}
