import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Map as MapIcon } from 'lucide-react';
import TemplateForm from '../../components/admin/TemplateForm.jsx';
import Card from '../../components/common/Card.jsx';
import EmptyState from '../../components/common/EmptyState.jsx';
import ErrorMessage from '../../components/common/ErrorMessage.jsx';
import Loader from '../../components/common/Loader.jsx';
import PageHeader from '../../components/common/PageHeader.jsx';
import PageShell from '../../components/common/PageShell.jsx';
import Select from '../../components/common/Select.jsx';
import StatusPill from '../../components/common/StatusPill.jsx';
import {
  useAdminCourses,
  useAdminLessons,
  useAdminQuestions,
  useAdminTemplate,
  useAdminTemplates,
  useCreateTemplate,
  useUpdateTemplate
} from '../../queries/adminQueries.js';

const buildQuizTagOptions = (questions = []) => {
  const tags = new Map();
  questions.filter((question) => question.status !== 'archived').forEach((question) => {
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
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const isEditing = Boolean(templateId);
  const templateQuery = useAdminTemplate(templateId);
  const coursesQuery = useAdminCourses({ limit: 100 });
  const [selectedCourseId, setSelectedCourseId] = useState(searchParams.get('course') || '');

  const template = templateQuery.data?.template || null;
  const templateCourseId = template?.course?._id || template?.course || '';

  useEffect(() => {
    if (templateCourseId) setSelectedCourseId(String(templateCourseId));
    else if (!selectedCourseId) {
      const first = (coursesQuery.data?.courses || []).find((course) => course.status !== 'archived');
      if (first) setSelectedCourseId(first._id);
    }
  }, [templateCourseId, coursesQuery.data?.courses, selectedCourseId]);

  const lessonsQuery = useAdminLessons({ limit: 100, course: selectedCourseId }, Boolean(selectedCourseId));
  const questionsQuery = useAdminQuestions({ limit: 100, bank: 'quiz', course: selectedCourseId });
  const templatesQuery = useAdminTemplates({ limit: 100, course: selectedCourseId });
  const createTemplate = useCreateTemplate();
  const updateTemplate = useUpdateTemplate();

  const loading = coursesQuery.isLoading || (isEditing && templateQuery.isLoading)
    || (selectedCourseId && (lessonsQuery.isLoading || questionsQuery.isLoading || templatesQuery.isLoading));
  if (loading) return <Loader label="Loading roadmap template editor..." />;

  if (isEditing && templateQuery.error) {
    return <EmptyState title="Roadmap template is unavailable" description={templateQuery.error.message} actionLabel="Back to templates" onAction={() => navigate('/admin/templates')} />;
  }

  const dependencyError = coursesQuery.error || lessonsQuery.error || questionsQuery.error || templatesQuery.error;
  if (dependencyError) {
    return <EmptyState title="Template editor data is unavailable" description={dependencyError.message} actionLabel="Back to templates" onAction={() => navigate('/admin/templates')} />;
  }

  const courses = (coursesQuery.data?.courses || []).filter((course) => course.status !== 'archived');
  const selectedCourse = courses.find((course) => course._id === selectedCourseId) || template?.course || null;
  const lessons = lessonsQuery.data?.lessons || [];
  const questions = questionsQuery.data?.questions || [];
  const templates = templatesQuery.data?.templates || [];
  const quizTags = useMemo(() => buildQuizTagOptions(questions), [questions]);
  const unavailableLevels = templates.filter((item) => item._id !== templateId).map((item) => item.level);
  const archived = template?.status === 'archived';
  const mutation = isEditing ? updateTemplate : createTemplate;

  const submit = (payload) => {
    const options = { onSuccess: () => navigate(`/admin/templates?course=${selectedCourseId}`) };
    if (isEditing) updateTemplate.mutate({ id: templateId, payload }, options);
    else createTemplate.mutate(payload, options);
  };

  return <PageShell className="space-y-5 pb-6">
    <PageHeader
      variant="compact"
      eyebrow="Course curriculum"
      eyebrowIcon={MapIcon}
      title={isEditing ? 'Edit roadmap template' : 'Create roadmap template draft'}
      description="Templates belong to one Course and one learner level. Modules can only reference lessons and Quiz-bank coverage from that same Course."
      actions={<Link to={selectedCourseId ? `/admin/templates?course=${selectedCourseId}` : '/admin/templates'} className="ui-button ui-button--secondary gap-2"><ArrowLeft size={16} /> Back to templates</Link>}
    />

    {!isEditing ? <Card className="shadow-sm"><Select label="Course" value={selectedCourseId} onChange={(event) => setSelectedCourseId(event.target.value)}><option value="">Select course</option>{courses.map((course) => <option key={course._id} value={course._id}>{course.title}</option>)}</Select><p className="mt-2 text-xs text-muted-foreground">Choose the course first so lessons, quiz tags, and supported levels remain correctly scoped.</p></Card> : null}

    {!selectedCourse ? <EmptyState title="Choose a course first" description="A roadmap template cannot exist outside a Course." actionLabel="Manage courses" onAction={() => navigate('/admin/courses')} /> : archived ? (
      <Card className="mx-auto w-full max-w-4xl border-warning/20 bg-warning-soft shadow-sm"><div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><div className="flex flex-wrap items-center gap-2"><h2 className="text-lg font-bold text-foreground">This template is archived</h2><StatusPill status="archived" /></div><p className="mt-2 text-sm leading-6 text-muted-foreground">Archived templates are read-only. Restore this template to Draft from Template Management to edit and review it again. Permanent deletion is only for freeing this Course + Level combination.</p></div><Link to={`/admin/templates?course=${selectedCourseId}`} className="ui-button ui-button--secondary shrink-0">Open template management</Link></div></Card>
    ) : (
      <>
        <ErrorMessage message={mutation.error?.message} />
        <TemplateForm
          initialData={template}
          course={selectedCourse}
          lessons={lessons}
          quizTags={quizTags}
          unavailableLevels={unavailableLevels}
          onSubmit={submit}
          onCancel={() => navigate(`/admin/templates?course=${selectedCourseId}`)}
          isLoading={mutation.isPending}
        />
      </>
    )}
  </PageShell>;
}
