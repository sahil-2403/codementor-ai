import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, ArrowRight, BookOpen, CheckCircle2, Clock3, FileQuestion, GraduationCap, Layers3, Route, Tags, Boxes } from 'lucide-react';
import Card from '../../components/common/Card.jsx';
import EmptyState from '../../components/common/EmptyState.jsx';
import ErrorMessage from '../../components/common/ErrorMessage.jsx';
import Loader from '../../components/common/Loader.jsx';
import PageHeader from '../../components/common/PageHeader.jsx';
import PageShell from '../../components/common/PageShell.jsx';
import StatusPill from '../../components/common/StatusPill.jsx';
import { adminApi } from '../../api/adminApi.js';
import { formatDate } from '../../utils/formatDate.js';

const catalogCards = [
  ['technologies', 'Technologies', Boxes, '/admin/technologies'],
  ['courses', 'Courses', GraduationCap, '/admin/courses'],
  ['learningPaths', 'Learning paths', Route, '/admin/learning-paths']
];

const contentCards = [
  ['topics', 'Topics', Tags, '/admin/topics'],
  ['lessons', 'Lessons', BookOpen, '/admin/lessons'],
  ['questions', 'Questions', FileQuestion, '/admin/questions'],
  ['templates', 'Templates', Layers3, '/admin/templates']
];

const recentLabels = {
  technology: 'Technology', course: 'Course', learning_path: 'Learning path', topic: 'Topic', lesson: 'Lesson',
  quiz_question: 'Quiz question', skill_check: 'Skill check', interview_question: 'Interview question', template: 'Template'
};

const recentHref = (item) => {
  if (item.type === 'technology') return item.status === 'archived' ? '/admin/technologies' : `/admin/technologies/${item.id}/edit`;
  if (item.type === 'course') return item.status === 'archived' ? '/admin/courses' : `/admin/courses/${item.id}/edit`;
  if (item.type === 'learning_path') return item.status === 'archived' ? '/admin/learning-paths' : `/admin/learning-paths/${item.id}/edit`;
  if (item.type === 'topic') return item.status === 'archived' ? '/admin/topics' : `/admin/topics/${item.id}/edit`;
  if (item.type === 'lesson') return item.status === 'archived' ? '/admin/lessons' : `/admin/lessons/${item.id}/edit`;
  if (item.type === 'quiz_question') return item.status === 'archived' ? '/admin/questions/quiz' : `/admin/questions/quiz/${item.id}/edit`;
  if (item.type === 'skill_check') return item.status === 'archived' ? '/admin/questions/skill-checks' : `/admin/questions/skill-checks/${item.id}/edit`;
  if (item.type === 'interview_question') return item.status === 'archived' ? '/admin/questions/interview' : `/admin/questions/interview/${item.id}/edit`;
  if (item.type === 'template') return item.status === 'archived' ? '/admin/templates' : `/admin/templates/${item.id}/edit`;
  return '/admin';
};

function MetricCard({ title, total, icon: Icon, href, detail }) {
  return <Link to={href} className="group min-w-0 rounded-panel border border-border bg-surface p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-panel"><div className="flex items-start justify-between gap-4"><span className="grid h-11 w-11 place-items-center rounded-surface bg-primary-soft text-primary-strong"><Icon size={20} /></span><ArrowRight size={17} className="text-muted-foreground group-hover:text-primary" /></div><p className="mt-5 text-sm font-semibold text-muted-foreground">{title}</p><p className="mt-1 text-3xl font-extrabold text-foreground">{total || 0}</p><p className="mt-2 text-xs leading-5 text-muted-foreground">{detail}</p></Link>;
}

function Attention({ count, label, href }) {
  if (!count) return null;
  return <Link to={href} className="flex min-w-0 items-center gap-3 rounded-surface border border-border bg-surface-secondary/35 p-3.5 hover:border-primary/25"><span className="grid h-9 min-w-9 place-items-center rounded-full bg-warning-soft px-2 text-sm font-extrabold text-warning">{count}</span><span className="min-w-0 flex-1 break-words text-sm font-bold text-foreground">{label}</span><ArrowRight size={15} className="shrink-0 text-muted-foreground" /></Link>;
}

export default function AdminDashboardPage() {
  const [overview, setOverview] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadAttempt, setLoadAttempt] = useState(0);

  useEffect(() => {
    let active = true;
    setIsLoading(true);
    setError(null);

    adminApi.contentOverview()
      .then((result) => {
        if (active) setOverview(result);
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

  if (isLoading) return <Loader label="Loading content overview..." />;
  if (error) return <PageShell><ErrorMessage message={error.message} /><button type="button" className="ui-button ui-button--secondary mt-4" onClick={() => setLoadAttempt((value) => value + 1)}>Try again</button></PageShell>;
  if (!overview) return <EmptyState title="Content overview is unavailable" description="No overview data was returned." />;

  const catalog = overview.catalog || {};
  const attention = overview.attention || {};
  const attentionItems = [
    [attention.draftTechnologies, 'Technology drafts need review', '/admin/technologies'],
    [attention.draftCourses, 'Course drafts need review', '/admin/courses'],
    [attention.draftLearningPaths, 'Learning-path drafts need review', '/admin/learning-paths'],
    [attention.draftLessons, 'Lesson drafts need review', '/admin/lessons'],
    [attention.draftQuizQuestions, 'Quiz-question drafts need review', '/admin/questions/quiz'],
    [attention.draftSkillChecks, 'Skill-check drafts need review', '/admin/questions/skill-checks'],
    [attention.draftInterviewQuestions, 'Interview-question drafts need review', '/admin/questions/interview'],
    [attention.topicsWithoutLessons, 'Active topics have no lessons', '/admin/topics'],
    [attention.publishedLessonsWithoutQuizCoverage, 'Published lessons have no linked Quiz-bank question', '/admin/questions/quiz'],
    [attention.missingPublishedTemplateLevels, 'Published Course levels are missing a published template', '/admin/templates']
  ].filter(([count]) => count > 0);

  return <PageShell className="space-y-6 pb-8">
    <PageHeader eyebrow="Content administration" title="Content overview" description="Review the learning catalog first, then the Course-owned curriculum that powers learner roadmaps." actions={<Link to="/admin/catalog" className="ui-button ui-button--primary">Open catalog</Link>} />

    <section className="space-y-3"><div><p className="text-[11px] font-bold uppercase tracking-[0.16em] text-primary-strong">Catalog</p><h2 className="mt-1 text-xl font-bold text-foreground">What learners can choose</h2><p className="mt-1 text-sm text-muted-foreground">Technologies classify Courses; Learning Paths connect Courses without restricting direct enrollment.</p></div><div className="grid gap-4 md:grid-cols-3">{catalogCards.map(([key, title, Icon, href]) => { const item = catalog[key] || {}; return <MetricCard key={key} title={title} total={item.total} icon={Icon} href={href} detail={`${item.published || 0} published · ${item.draft || 0} draft · ${item.archived || 0} archived`} />; })}</div></section>

    <section className="space-y-3"><div><p className="text-[11px] font-bold uppercase tracking-[0.16em] text-primary-strong">Curriculum</p><h2 className="mt-1 text-xl font-bold text-foreground">Course-owned learning content</h2></div><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{contentCards.map(([key, title, Icon, href]) => { const item = overview[key] || {}; const detail = key === 'questions' ? `${item.quiz?.total || 0} quiz · ${item.skillCheck?.total || 0} skill checks · ${item.interview?.total || 0} interview` : key === 'topics' ? `${item.active || 0} active · ${item.archived || 0} archived` : `${item.published || 0} published · ${item.draft || 0} draft · ${item.archived || 0} archived`; return <MetricCard key={key} title={title} total={item.total} icon={Icon} href={href} detail={detail} />; })}</div></section>

    <div className="grid min-w-0 gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(320px,0.7fr)]">
      <Card className="min-w-0 shadow-sm"><div className="flex items-start gap-3"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-control bg-warning-soft text-warning"><AlertCircle size={18} /></span><div><p className="text-[11px] font-bold uppercase tracking-[0.16em] text-warning">Needs attention</p><h2 className="mt-1 text-lg font-bold text-foreground">Catalog and curriculum work queue</h2></div></div>{attentionItems.length ? <div className="mt-5 grid gap-3 md:grid-cols-2">{attentionItems.map(([count, label, href]) => <Attention key={label} count={count} label={label} href={href} />)}</div> : <div className="mt-5 flex items-start gap-3 rounded-panel border border-success/20 bg-success-soft p-4"><CheckCircle2 size={19} className="mt-0.5 shrink-0 text-success" /><div><p className="text-sm font-bold text-foreground">No immediate catalog gaps</p><p className="mt-1 text-sm text-muted-foreground">No drafts or structural coverage gaps were detected.</p></div></div>}</Card>
      <Card className="min-w-0 shadow-sm"><p className="text-[11px] font-bold uppercase tracking-[0.16em] text-primary-strong">Quick structure</p><h2 className="mt-1 text-lg font-bold text-foreground">Build top to bottom</h2><div className="mt-4 space-y-2">{[['Technology', '/admin/technologies/new'], ['Course', '/admin/courses/new'], ['Learning path', '/admin/learning-paths/new'], ['Topic', '/admin/topics/new'], ['Lesson', '/admin/lessons/new'], ['Roadmap template', '/admin/templates/new']].map(([label, href], index) => <Link key={href} to={href} className="flex items-center gap-3 rounded-surface border border-border p-3 text-sm font-semibold text-foreground hover:bg-primary-soft/35"><span className="grid h-7 w-7 place-items-center rounded-full bg-primary-soft text-xs font-bold text-primary-strong">{index + 1}</span><span className="flex-1">{label}</span><ArrowRight size={14} /></Link>)}</div></Card>
    </div>

    <Card className="min-w-0 shadow-sm"><div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-[11px] font-bold uppercase tracking-[0.16em] text-primary-strong">Roadmap coverage</p><h2 className="mt-1 text-lg font-bold text-foreground">Template availability by Course and level</h2><p className="mt-1 text-sm text-muted-foreground">Every enabled level of a published Course should have a published template.</p></div><Link to="/admin/templates" className="text-sm font-semibold text-primary-strong">Manage templates →</Link></div><div className="mt-5 space-y-4">{(overview.templates?.coverage || []).length ? overview.templates.coverage.map((course) => <div key={course.courseId} className="rounded-panel border border-border bg-surface-secondary/30 p-4"><div className="flex flex-wrap items-center justify-between gap-2"><p className="font-bold text-foreground">{course.courseTitle}</p><StatusPill status={course.courseStatus} /></div><div className="mt-3 grid gap-3 md:grid-cols-3">{Object.entries(course.levels || {}).map(([level, item]) => <div key={level} className="flex min-w-0 items-center justify-between gap-3 rounded-surface border border-border bg-surface px-3.5 py-3"><div className="min-w-0"><p className="text-sm font-bold capitalize text-foreground">{level}</p><p className="mt-0.5 break-words text-xs text-muted-foreground">{item.status === 'published' ? 'Ready for roadmap generation' : item.status === 'missing' ? 'No template configured' : `Template is ${item.status}`}</p></div>{item.status === 'missing' ? <Link to={`/admin/templates/new?course=${course.courseId}`} className="shrink-0 text-xs font-bold text-primary-strong">Create</Link> : <StatusPill status={item.status} />}</div>)}</div></div>) : <EmptyState title="No course template coverage yet" description="Create and publish Courses first, then add their level templates." />}</div></Card>

    <div className="grid min-w-0 gap-5 xl:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
      <Card className="min-w-0 overflow-hidden shadow-sm"><p className="text-[11px] font-bold uppercase tracking-[0.16em] text-primary-strong">Question banks</p><h2 className="mt-1 text-lg font-bold text-foreground">Assessment content</h2><div className="mt-5 space-y-3">{[['Quiz questions', overview.questions.quiz, '/admin/questions/quiz'], ['Skill checks', overview.questions.skillCheck, '/admin/questions/skill-checks'], ['Interview practice', overview.questions.interview, '/admin/questions/interview']].map(([label, bank, href]) => <Link key={label} to={href} className="group flex min-w-0 flex-col items-start gap-2 rounded-surface border border-border p-3.5 sm:flex-row sm:items-center sm:justify-between"><div className="min-w-0 w-full flex-1"><p className="break-words text-sm font-bold text-foreground">{label}</p><p className="mt-1 break-words text-xs leading-5 text-muted-foreground">{bank.published} published · {bank.draft} draft · {bank.archived} archived</p></div><span className="shrink-0 text-xl font-extrabold text-foreground">{bank.total}</span></Link>)}</div></Card>
      <Card className="min-w-0 overflow-hidden shadow-sm"><div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-end sm:justify-between"><div className="min-w-0"><p className="text-[11px] font-bold uppercase tracking-[0.16em] text-primary-strong">Recently updated</p><h2 className="mt-1 text-lg font-bold text-foreground">Latest catalog and content changes</h2></div><span className="flex shrink-0 items-center gap-1.5 text-xs font-semibold text-muted-foreground"><Clock3 size={14} /> Most recent first</span></div>{overview.recentContent?.length ? <div className="mt-4 min-w-0 overflow-hidden divide-y divide-border rounded-panel border border-border">{overview.recentContent.map((item) => <Link key={`${item.type}-${item.id}`} to={recentHref(item)} className="group flex min-w-0 items-start gap-3 overflow-hidden px-4 py-3.5 hover:bg-surface-secondary/55"><div className="min-w-0 flex-1 overflow-hidden"><div className="flex min-w-0 flex-col items-start gap-1.5 sm:flex-row sm:items-center"><p className="w-full min-w-0 break-words text-sm font-bold leading-5 text-foreground sm:flex-1">{item.title}</p><StatusPill status={item.status} className="shrink-0" /></div><p className="mt-1 break-words text-xs font-medium leading-5 text-muted-foreground">{recentLabels[item.type] || 'Content'}{item.courseTitle ? ` · ${item.courseTitle}` : ''} · {formatDate(item.updatedAt)}</p></div><ArrowRight size={15} className="mt-2 shrink-0 text-muted-foreground" /></Link>)}</div> : <p className="mt-4 text-sm text-muted-foreground">No recent content yet.</p>}</Card>
    </div>
  </PageShell>;
}
