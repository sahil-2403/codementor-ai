import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, BookOpen, ClipboardCheck, FileQuestion, Layers3, MessageSquareText, Pencil, Tags, Wrench } from 'lucide-react';
import { adminCourseWorkspaceApi } from '../../api/adminCourseWorkspaceApi.js';
import Card from '../../components/common/Card.jsx';
import EmptyState from '../../components/common/EmptyState.jsx';
import ErrorMessage from '../../components/common/ErrorMessage.jsx';
import Loader from '../../components/common/Loader.jsx';
import PageHeader from '../../components/common/PageHeader.jsx';
import PageShell from '../../components/common/PageShell.jsx';
import StatusPill from '../../components/common/StatusPill.jsx';

const sections = [
  { key: 'topics', title: 'Topics', icon: Tags, path: '/admin/topics', detail: (item) => `${item.active || 0} active · ${item.archived || 0} archived` },
  { key: 'lessons', title: 'Lessons', icon: BookOpen, path: '/admin/lessons', detail: (item) => `${item.published || 0} published · ${item.draft || 0} draft` },
  { key: 'quizQuestions', title: 'Quiz questions', icon: FileQuestion, path: '/admin/questions/quiz', detail: (item) => `${item.published || 0} published · ${item.draft || 0} draft` },
  { key: 'skillChecks', title: 'Skill checks', icon: ClipboardCheck, path: '/admin/questions/skill-checks', detail: (item) => `${item.published || 0} published · ${item.draft || 0} draft` },
  { key: 'interviewQuestions', title: 'Interview practice', icon: MessageSquareText, path: '/admin/questions/interview', detail: (item) => `${item.published || 0} published · ${item.draft || 0} draft` },
  { key: 'templates', title: 'Roadmap templates', icon: Layers3, path: '/admin/templates', detail: (item) => `${item.published || 0} published · ${item.draft || 0} draft` }
];

export default function CourseWorkspacePage() {
  const { courseId } = useParams();
  const query = useQuery({ queryKey: ['admin-course-workspace', courseId], queryFn: () => adminCourseWorkspaceApi.get(courseId), enabled: Boolean(courseId) });
  if (query.isLoading) return <Loader label="Loading course workspace..." />;
  if (query.error) return <PageShell><ErrorMessage message={query.error.message} /></PageShell>;

  const course = query.data?.course;
  if (!course) return <EmptyState title="Course workspace is unavailable" description="This Course could not be found." />;
  const counts = query.data?.counts || {};
  const coverage = query.data?.templateCoverage || {};

  return (
    <PageShell className="space-y-6 pb-8">
      <PageHeader
        eyebrow="Course workspace"
        title={course.title}
        description={course.description || 'Manage this Course from catalog metadata through its learner-facing curriculum.'}
        actions={<div className="flex flex-wrap gap-2"><Link to="/admin/courses" className="ui-button ui-button--secondary gap-2"><ArrowLeft size={16} /> Courses</Link>{course.status !== 'archived' ? <Link to={`/admin/courses/${course._id}/edit`} className="ui-button ui-button--primary gap-2"><Pencil size={15} /> Edit course</Link> : null}</div>}
      />

      <div className="flex flex-wrap items-center gap-2">
        <StatusPill status={course.status} />
        <span className="rounded-full bg-surface-secondary px-3 py-1.5 text-xs font-semibold capitalize text-muted-foreground">{String(course.category || '').replaceAll('-', ' ')}</span>
        {(course.technologies || []).map((technology) => <span key={technology._id} className="rounded-full bg-primary-soft px-3 py-1.5 text-xs font-semibold text-primary-strong">{technology.name}</span>)}
      </div>

      <section className="space-y-3">
        <div><p className="text-[11px] font-bold uppercase tracking-[0.16em] text-primary-strong">Curriculum</p><h2 className="mt-1 text-xl font-bold text-foreground">Course-owned content</h2><p className="mt-1 text-sm leading-6 text-muted-foreground">Every link below automatically filters to {course.title}, keeping dependencies easy to follow.</p></div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {sections.map(({ key, title, icon: Icon, path, detail }) => {
            const item = counts[key] || { total: 0 };
            return <Link key={key} to={`${path}?course=${course._id}`} className="group min-w-0 rounded-panel border border-border bg-surface p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-panel"><div className="flex items-start justify-between gap-3"><span className="grid h-10 w-10 place-items-center rounded-control bg-primary-soft text-primary-strong"><Icon size={18} /></span><span className="text-2xl font-extrabold text-foreground">{item.total || 0}</span></div><h3 className="mt-4 text-lg font-bold text-foreground">{title}</h3><p className="mt-1 text-xs leading-5 text-muted-foreground">{detail(item)}</p><p className="mt-4 text-sm font-semibold text-primary-strong">Manage {title.toLowerCase()} →</p></Link>;
          })}
        </div>
      </section>

      <Card className="shadow-sm">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-[11px] font-bold uppercase tracking-[0.16em] text-primary-strong">Learner levels</p><h2 className="mt-1 text-lg font-bold text-foreground">Roadmap template coverage</h2><p className="mt-1 text-sm text-muted-foreground">Only levels enabled on this Course appear here.</p></div><Link to={`/admin/templates/new?course=${course._id}`} className="text-sm font-semibold text-primary-strong">Create template →</Link></div>
        <div className="mt-5 grid gap-3 md:grid-cols-3">
          {Object.entries(coverage).map(([level, template]) => <div key={level} className="rounded-panel border border-border bg-surface-secondary/30 p-4"><div className="flex items-center justify-between gap-3"><p className="font-bold capitalize text-foreground">{level}</p><StatusPill status={template.status} /></div><p className="mt-2 text-xs leading-5 text-muted-foreground">{template.status === 'missing' ? 'No template configured for this Course level.' : `${template.modules || 0} modules · ${template.estimatedDurationDays || 0} days`}</p><div className="mt-4">{template.templateId ? <Link to={`/admin/templates/${template.templateId}/edit`} className="text-sm font-semibold text-primary-strong">Open template →</Link> : <Link to={`/admin/templates/new?course=${course._id}`} className="text-sm font-semibold text-primary-strong">Create template →</Link>}</div></div>)}
        </div>
      </Card>

      <Card className="border-border bg-surface-secondary/35 shadow-none">
        <div className="flex items-start gap-3"><Wrench size={18} className="mt-0.5 shrink-0 text-muted-foreground" /><div><p className="font-bold text-foreground">Project tasks</p><p className="mt-1 text-sm leading-6 text-muted-foreground">This Course currently has {counts.projects?.total || 0} project task(s). Project-task authoring will use this same Course workspace and dependency model; learner project data is already Course-owned.</p></div></div>
      </Card>
    </PageShell>
  );
}
