import { Link } from 'react-router-dom';
import {
  AlertCircle,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  ClipboardList,
  Clock3,
  FileQuestion,
  Layers3,
  MessageSquareText,
  Plus,
  Tags
} from 'lucide-react';
import Card from '../../components/common/Card.jsx';
import EmptyState from '../../components/common/EmptyState.jsx';
import ErrorMessage from '../../components/common/ErrorMessage.jsx';
import Loader from '../../components/common/Loader.jsx';
import PageHeader from '../../components/common/PageHeader.jsx';
import PageShell from '../../components/common/PageShell.jsx';
import StatusPill from '../../components/common/StatusPill.jsx';
import { getRoadmapTemplateGoalLabel } from '../../constants/roadmapTemplateGoals.js';
import { useAdminContentOverview } from '../../queries/adminQueries.js';
import { formatDate } from '../../utils/formatDate.js';

const summaryDefinitions = [
  {
    key: 'topics',
    title: 'Topics',
    icon: Tags,
    href: '/admin/topics',
    lines: (overview) => [
      `${overview.topics.active} active`,
      `${overview.topics.archived} archived`
    ]
  },
  {
    key: 'lessons',
    title: 'Lessons',
    icon: BookOpen,
    href: '/admin/lessons',
    lines: (overview) => [
      `${overview.lessons.published} published`,
      `${overview.lessons.draft} draft · ${overview.lessons.archived} archived`
    ]
  },
  {
    key: 'questions',
    title: 'Questions',
    icon: FileQuestion,
    href: '/admin/questions',
    lines: (overview) => [
      `${overview.questions.quiz.total} quiz · ${overview.questions.skillCheck.total} skill check`,
      `${overview.questions.interview.total} interview`
    ]
  },
  {
    key: 'templates',
    title: 'Templates',
    icon: Layers3,
    href: '/admin/templates',
    lines: (overview) => [
      `${overview.templates.published} published`,
      `${overview.templates.draft} draft · ${overview.templates.archived} archived`
    ]
  }
];

const quickActions = [
  { label: 'Create topic', href: '/admin/topics/new', icon: Tags },
  { label: 'Create lesson', href: '/admin/lessons/new', icon: BookOpen },
  { label: 'Quiz question', href: '/admin/questions/quiz/new', icon: FileQuestion },
  { label: 'Skill check', href: '/admin/questions/skill-checks/new', icon: ClipboardList },
  { label: 'Interview question', href: '/admin/questions/interview/new', icon: MessageSquareText },
  { label: 'Roadmap template', href: '/admin/templates/new', icon: Layers3 }
];

const levelLabels = {
  beginner: 'Beginner',
  intermediate: 'Intermediate',
  advanced: 'Advanced'
};

const recentTypeLabels = {
  topic: 'Topic',
  lesson: 'Lesson',
  quiz_question: 'Quiz question',
  skill_check: 'Skill check',
  interview_question: 'Interview question',
  template: 'Template'
};

const recentHref = (item) => {
  if (item.type === 'topic') return item.status === 'archived' ? '/admin/topics' : `/admin/topics/${item.id}/edit`;
  if (item.type === 'lesson') return item.status === 'archived' ? '/admin/lessons' : `/admin/lessons/${item.id}/edit`;
  if (item.type === 'quiz_question') return item.status === 'archived' ? '/admin/questions/quiz' : `/admin/questions/quiz/${item.id}/edit`;
  if (item.type === 'skill_check') return item.status === 'archived' ? '/admin/questions/skill-checks' : `/admin/questions/skill-checks/${item.id}/edit`;
  if (item.type === 'interview_question') return item.status === 'archived' ? '/admin/questions/interview' : `/admin/questions/interview/${item.id}/edit`;
  if (item.type === 'template') return item.status === 'archived' ? '/admin/templates' : `/admin/templates/${item.id}/edit`;
  return '/admin';
};

function SummaryCard({ title, total, icon: Icon, href, lines }) {
  return (
    <Link
      to={href}
      className="group rounded-panel border border-border bg-surface p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-panel"
    >
      <div className="flex items-start justify-between gap-4">
        <span className="grid h-11 w-11 place-items-center rounded-surface bg-primary-soft text-primary-strong" aria-hidden="true">
          <Icon size={20} />
        </span>
        <ArrowRight size={17} className="text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-primary" aria-hidden="true" />
      </div>
      <p className="mt-5 text-sm font-semibold text-muted-foreground">{title}</p>
      <p className="mt-1 text-3xl font-extrabold tracking-tight text-foreground">{total}</p>
      <div className="mt-3 space-y-1 text-xs font-medium text-muted-foreground">
        {lines.map((line) => <p key={line}>{line}</p>)}
      </div>
    </Link>
  );
}

function AttentionItem({ count, label, description, href }) {
  return (
    <Link to={href} className="group flex items-start gap-3 rounded-surface border border-border bg-surface-secondary/35 p-3.5 transition hover:border-primary/25 hover:bg-primary-soft/40">
      <span className="grid h-9 min-w-9 place-items-center rounded-full bg-warning-soft px-2 text-sm font-extrabold text-warning">{count}</span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-bold text-foreground">{label}</span>
        <span className="mt-0.5 block text-xs leading-5 text-muted-foreground">{description}</span>
      </span>
      <ArrowRight size={15} className="mt-2 shrink-0 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-primary" aria-hidden="true" />
    </Link>
  );
}

export default function AdminDashboardPage() {
  const overviewQuery = useAdminContentOverview();

  if (overviewQuery.isLoading) return <Loader label="Loading content overview..." />;

  if (overviewQuery.error) {
    return (
      <PageShell className="space-y-5 pb-6">
        <PageHeader
          eyebrow="Content administration"
          title="Content overview"
          description="Review the learning content available across CodeMentor AI."
        />
        <ErrorMessage message={overviewQuery.error.message} />
      </PageShell>
    );
  }

  const overview = overviewQuery.data;
  if (!overview) {
    return <EmptyState title="Content overview is unavailable" description="No overview data was returned by the server." />;
  }

  const attentionItems = [
    overview.attention.draftLessons > 0 && {
      count: overview.attention.draftLessons,
      label: 'Draft lessons',
      description: 'Review lesson drafts and publish the ones that are ready for learners.',
      href: '/admin/lessons'
    },
    overview.attention.draftQuizQuestions > 0 && {
      count: overview.attention.draftQuizQuestions,
      label: 'Draft quiz questions',
      description: 'Quiz-bank drafts are not available in learner module assessments yet.',
      href: '/admin/questions/quiz'
    },
    overview.attention.draftSkillChecks > 0 && {
      count: overview.attention.draftSkillChecks,
      label: 'Draft skill checks',
      description: 'Review skill-check questions that are waiting to be published.',
      href: '/admin/questions/skill-checks'
    },
    overview.attention.draftInterviewQuestions > 0 && {
      count: overview.attention.draftInterviewQuestions,
      label: 'Draft interview questions',
      description: 'Interview-practice drafts are not visible to learners yet.',
      href: '/admin/questions/interview'
    },
    overview.attention.topicsWithoutLessons > 0 && {
      count: overview.attention.topicsWithoutLessons,
      label: 'Active topics without lessons',
      description: 'These topics currently organize no available lesson content.',
      href: '/admin/topics'
    },
    overview.attention.publishedLessonsWithoutQuizCoverage > 0 && {
      count: overview.attention.publishedLessonsWithoutQuizCoverage,
      label: 'Published lessons without linked quiz coverage',
      description: 'No published Quiz-bank question currently points to these lessons.',
      href: '/admin/questions/quiz'
    },
    overview.attention.archivedTopics > 0 && {
      count: overview.attention.archivedTopics,
      label: 'Archived topics',
      description: 'Archived topics and their dependent content remain unavailable to learners.',
      href: '/admin/topics'
    }
  ].filter(Boolean);

  const coverage = overview.templates.coverage?.length
    ? overview.templates.coverage
    : [{
      goalKey: 'junior-mern-stack',
      levels: {
        beginner: { status: 'missing', templateId: null, title: '' },
        intermediate: { status: 'missing', templateId: null, title: '' },
        advanced: { status: 'missing', templateId: null, title: '' }
      }
    }];

  return (
    <PageShell className="space-y-6 pb-8">
      <PageHeader
        eyebrow="Content administration"
        title="Content overview"
        description="See what learning content exists, what needs attention, and the roadmap coverage available for new learners."
      />

      <section aria-labelledby="content-summary-title">
        <div className="mb-3">
          <h2 id="content-summary-title" className="text-xl font-bold text-foreground">Available content</h2>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">Live counts from the content currently stored in the platform.</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {summaryDefinitions.map((definition) => (
            <SummaryCard
              key={definition.key}
              title={definition.title}
              total={overview[definition.key].total}
              icon={definition.icon}
              href={definition.href}
              lines={definition.lines(overview)}
            />
          ))}
        </div>
      </section>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.65fr)]">
        <Card className="shadow-sm">
          <div className="flex items-start gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-control bg-warning-soft text-warning" aria-hidden="true">
              <AlertCircle size={18} />
            </span>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-warning">Needs attention</p>
              <h2 className="mt-1 text-lg font-bold text-foreground">Content work queue</h2>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">Only real content states and missing relationships are shown here.</p>
            </div>
          </div>

          {attentionItems.length ? (
            <div className="mt-5 grid gap-3 md:grid-cols-2">
              {attentionItems.map((item) => <AttentionItem key={item.label} {...item} />)}
            </div>
          ) : (
            <div className="mt-5 flex items-start gap-3 rounded-panel border border-success/20 bg-success-soft p-4">
              <CheckCircle2 size={19} className="mt-0.5 shrink-0 text-success" aria-hidden="true" />
              <div>
                <p className="text-sm font-bold text-foreground">No immediate content gaps found</p>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">There are no drafts, uncovered active topics, uncovered published lessons, or archived topics in the current overview.</p>
              </div>
            </div>
          )}
        </Card>

        <Card className="shadow-sm">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-primary-strong">Quick actions</p>
            <h2 className="mt-1 text-lg font-bold text-foreground">Create content</h2>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">Jump directly into a structured content editor.</p>
          </div>
          <div className="mt-5 grid gap-2 sm:grid-cols-2 xl:grid-cols-1">
            {quickActions.map(({ label, href, icon: Icon }) => (
              <Link key={href} to={href} className="group flex items-center gap-3 rounded-surface border border-border px-3.5 py-3 text-sm font-semibold text-foreground transition hover:border-primary/25 hover:bg-primary-soft/45">
                <span className="grid h-8 w-8 place-items-center rounded-control bg-surface-secondary text-primary-strong" aria-hidden="true"><Icon size={15} /></span>
                <span className="flex-1">{label}</span>
                <Plus size={15} className="text-muted-foreground group-hover:text-primary" aria-hidden="true" />
              </Link>
            ))}
          </div>
        </Card>
      </div>

      <Card className="shadow-sm">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-primary-strong">Roadmap coverage</p>
            <h2 className="mt-1 text-lg font-bold text-foreground">Template availability by learner level</h2>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">A published template is required before that learning path and level can generate a template-based roadmap.</p>
          </div>
          <Link to="/admin/templates" className="text-sm font-semibold text-primary-strong hover:text-primary">Manage templates →</Link>
        </div>

        <div className="mt-5 space-y-4">
          {coverage.map((goal) => (
            <div key={goal.goalKey} className="rounded-panel border border-border bg-surface-secondary/30 p-4">
              <p className="font-bold text-foreground">{getRoadmapTemplateGoalLabel(goal.goalKey)}</p>
              <div className="mt-3 grid gap-3 md:grid-cols-3">
                {Object.entries(levelLabels).map(([level, label]) => {
                  const item = goal.levels?.[level] || { status: 'missing', templateId: null };
                  return (
                    <div key={level} className="flex items-center justify-between gap-3 rounded-surface border border-border bg-surface px-3.5 py-3">
                      <div>
                        <p className="text-sm font-bold text-foreground">{label}</p>
                        <p className="mt-0.5 text-xs text-muted-foreground">{item.status === 'published' ? 'Ready for future roadmap generation' : item.status === 'missing' ? 'No template configured' : `Template is ${item.status}`}</p>
                      </div>
                      {item.status === 'missing' ? (
                        <Link to="/admin/templates/new" className="shrink-0 text-xs font-bold text-primary-strong hover:text-primary">Create</Link>
                      ) : <StatusPill status={item.status} />}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </Card>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
        <Card className="shadow-sm">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-primary-strong">Question banks</p>
            <h2 className="mt-1 text-lg font-bold text-foreground">Assessment content</h2>
          </div>
          <div className="mt-5 space-y-3">
            {[
              ['Quiz questions', overview.questions.quiz, '/admin/questions/quiz'],
              ['Skill checks', overview.questions.skillCheck, '/admin/questions/skill-checks'],
              ['Interview practice', overview.questions.interview, '/admin/questions/interview']
            ].map(([label, bank, href]) => (
              <Link key={label} to={href} className="group flex items-center justify-between gap-4 rounded-surface border border-border p-3.5 transition hover:border-primary/25 hover:bg-primary-soft/35">
                <div>
                  <p className="text-sm font-bold text-foreground">{label}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{bank.published} published · {bank.draft} draft · {bank.archived} archived</p>
                </div>
                <span className="text-xl font-extrabold text-foreground">{bank.total}</span>
              </Link>
            ))}
          </div>
        </Card>

        <Card className="shadow-sm">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-primary-strong">Recently updated</p>
              <h2 className="mt-1 text-lg font-bold text-foreground">Latest content changes</h2>
            </div>
            <span className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground"><Clock3 size={14} aria-hidden="true" /> Most recent first</span>
          </div>

          {overview.recentContent?.length ? (
            <div className="mt-4 divide-y divide-border rounded-panel border border-border">
              {overview.recentContent.map((item) => (
                <Link key={`${item.type}-${item.id}`} to={recentHref(item)} className="group flex items-start gap-3 px-4 py-3.5 transition first:rounded-t-panel last:rounded-b-panel hover:bg-surface-secondary/55">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate text-sm font-bold text-foreground">{item.title}</p>
                      <StatusPill status={item.status} />
                    </div>
                    <p className="mt-1 text-xs font-medium text-muted-foreground">{recentTypeLabels[item.type] || 'Content'} · {formatDate(item.updatedAt)}</p>
                  </div>
                  <ArrowRight size={15} className="mt-2 shrink-0 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-primary" aria-hidden="true" />
                </Link>
              ))}
            </div>
          ) : (
            <div className="mt-4 rounded-panel border border-dashed border-border p-5 text-sm text-muted-foreground">No recently updated content is available yet.</div>
          )}
        </Card>
      </div>

      <div className="flex flex-col gap-3 rounded-panel border border-border bg-surface px-5 py-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-bold text-foreground">Content lifecycle</p>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">Create content as a draft, publish it when dependencies are ready, and archive it when it should no longer be available.</p>
        </div>
        <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground">
          <span className="rounded-full bg-surface-secondary px-3 py-1.5">Draft</span>
          <ArrowRight size={14} aria-hidden="true" />
          <span className="rounded-full bg-success-soft px-3 py-1.5 text-success">Published</span>
          <ArrowRight size={14} aria-hidden="true" />
          <span className="rounded-full bg-warning-soft px-3 py-1.5 text-warning">Archived</span>
        </div>
      </div>
    </PageShell>
  );
}
