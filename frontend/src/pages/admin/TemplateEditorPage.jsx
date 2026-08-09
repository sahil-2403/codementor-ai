import { useMemo } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Map } from 'lucide-react';
import TemplateForm from '../../components/admin/TemplateForm.jsx';
import Card from '../../components/common/Card.jsx';
import EmptyState from '../../components/common/EmptyState.jsx';
import ErrorMessage from '../../components/common/ErrorMessage.jsx';
import Loader from '../../components/common/Loader.jsx';
import PageHeader from '../../components/common/PageHeader.jsx';
import PageShell from '../../components/common/PageShell.jsx';
import StatusPill from '../../components/common/StatusPill.jsx';
import {
  useAdminLessons,
  useAdminQuestions,
  useAdminTemplate,
  useAdminTemplates,
  useCreateTemplate,
  useUpdateTemplate
} from '../../queries/adminQueries.js';

const buildQuizTagOptions = (questions = []) => {
  const tags = new Map();

  questions
    .filter((question) => question.status !== 'archived')
    .forEach((question) => {
      (question.tags || []).forEach((tagValue) => {
        const tag = String(tagValue || '').trim();
        if (!tag) return;
        const current = tags.get(tag) || { tag, totalCount: 0, publishedCount: 0 };
        current.totalCount += 1;
        if (question.status === 'published') current.publishedCount += 1;
        tags.set(tag, current);
      });
    });

  return [...tags.values()].sort((a, b) => a.tag.localeCompare(b.tag));
};

export default function TemplateEditorPage() {
  const { templateId } = useParams();
  const navigate = useNavigate();
  const isEditing = Boolean(templateId);

  const templateQuery = useAdminTemplate(templateId);
  const lessonsQuery = useAdminLessons({ limit: 100 });
  const questionsQuery = useAdminQuestions({ limit: 100, bank: 'quiz' });
  const templatesQuery = useAdminTemplates({ limit: 100 });
  const createTemplate = useCreateTemplate();
  const updateTemplate = useUpdateTemplate();

  const loadingDependencies = lessonsQuery.isLoading || questionsQuery.isLoading || templatesQuery.isLoading;
  if ((isEditing && templateQuery.isLoading) || loadingDependencies) {
    return <Loader label="Loading roadmap template editor..." />;
  }

  if (isEditing && templateQuery.error) {
    return (
      <EmptyState
        title="Roadmap template is unavailable"
        description={templateQuery.error.message}
        actionLabel="Back to templates"
        onAction={() => navigate('/admin/templates')}
      />
    );
  }

  const dependencyError = lessonsQuery.error || questionsQuery.error || templatesQuery.error;
  if (dependencyError) {
    return (
      <EmptyState
        title="Template editor data is unavailable"
        description={dependencyError.message}
        actionLabel="Back to templates"
        onAction={() => navigate('/admin/templates')}
      />
    );
  }

  const template = templateQuery.data?.template || null;
  const lessons = lessonsQuery.data?.lessons || [];
  const questions = questionsQuery.data?.questions || [];
  const templates = templatesQuery.data?.templates || [];
  const archived = template?.status === 'archived';
  const mutation = isEditing ? updateTemplate : createTemplate;

  const quizTags = useMemo(() => buildQuizTagOptions(questions), [questions]);
  const unavailableLevels = useMemo(
    () => templates
      .filter((item) => item._id !== templateId && item.goalKey === (template?.goalKey || 'junior-mern-stack'))
      .map((item) => item.level),
    [template?.goalKey, templateId, templates]
  );

  const submit = (payload) => {
    const options = { onSuccess: () => navigate('/admin/templates') };
    if (isEditing) updateTemplate.mutate({ id: templateId, payload }, options);
    else createTemplate.mutate(payload, options);
  };

  return (
    <PageShell className="space-y-5 pb-6">
      <PageHeader
        variant="compact"
        eyebrow="Content administration"
        eyebrowIcon={Map}
        title={isEditing ? 'Edit roadmap template' : 'Create roadmap template draft'}
        description={isEditing
          ? 'Update the learner sequence using modules, lesson titles, and quiz coverage without editing internal JSON or slugs.'
          : 'Build the learner sequence visually, save it as a draft, then publish it from Template Management when every dependency is ready.'}
        actions={
          <Link to="/admin/templates" className="ui-button ui-button--secondary gap-2">
            <ArrowLeft size={16} aria-hidden="true" />
            Back to templates
          </Link>
        }
      />

      {archived ? (
        <Card className="mx-auto w-full max-w-4xl border-amber-200 bg-amber-50/55 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-lg font-bold text-foreground">This template is archived</h2>
                <StatusPill status="archived" />
              </div>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Archived templates are read-only. Delete this template from Template Management if this goal and level should be configured again.
              </p>
            </div>
            <Link to="/admin/templates" className="ui-button ui-button--secondary shrink-0">Open template management</Link>
          </div>
        </Card>
      ) : (
        <>
          <ErrorMessage message={mutation.error?.message} />
          <TemplateForm
            initialData={template}
            lessons={lessons}
            quizTags={quizTags}
            unavailableLevels={unavailableLevels}
            onSubmit={submit}
            onCancel={() => navigate('/admin/templates')}
            isLoading={mutation.isPending}
          />
        </>
      )}
    </PageShell>
  );
}
