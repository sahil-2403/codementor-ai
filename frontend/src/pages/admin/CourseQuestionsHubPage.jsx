import { Link } from 'react-router-dom';
import { ClipboardCheck, FileQuestion, MessageSquareText } from 'lucide-react';
import Card from '../../components/common/Card.jsx';
import ErrorMessage from '../../components/common/ErrorMessage.jsx';
import Loader from '../../components/common/Loader.jsx';
import PageHeader from '../../components/common/PageHeader.jsx';
import PageShell from '../../components/common/PageShell.jsx';
import { useAdminContentOverview } from '../../queries/adminQueries.js';

const banks = [
  {
    key: 'quiz',
    title: 'Quiz questions',
    description: 'Lesson-linked questions used by roadmap module quizzes. Template coverage uses only published Quiz-bank tags from the same Course.',
    href: '/admin/questions/quiz',
    icon: FileQuestion
  },
  {
    key: 'skillCheck',
    title: 'Skill checks',
    description: 'Course-specific diagnostic questions for Intermediate and Advanced learner onboarding.',
    href: '/admin/questions/skill-checks',
    icon: ClipboardCheck
  },
  {
    key: 'interview',
    title: 'Interview practice',
    description: 'Course and Topic scoped interview questions used in learner interview practice.',
    href: '/admin/questions/interview',
    icon: MessageSquareText
  }
];

export default function CourseQuestionsHubPage() {
  const overviewQuery = useAdminContentOverview();
  if (overviewQuery.isLoading) return <Loader label="Loading question banks..." />;
  const questions = overviewQuery.data?.questions || {};

  return (
    <PageShell className="space-y-6 pb-8">
      <PageHeader
        eyebrow="Course assessments"
        eyebrowIcon={FileQuestion}
        title="Question banks"
        description="Choose a question bank, then filter or create questions inside a Course. Course ownership keeps diagnostics, quizzes, and interview practice isolated from unrelated technologies."
      />
      <ErrorMessage message={overviewQuery.error?.message} />

      <div className="grid gap-5 lg:grid-cols-3">
        {banks.map(({ key, title, description, href, icon: Icon }) => {
          const counts = questions[key] || { total: 0, published: 0, draft: 0, archived: 0 };
          return (
            <Link key={key} to={href} className="group min-w-0 rounded-panel border border-border bg-surface p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-panel">
              <div className="flex items-start justify-between gap-4">
                <span className="grid h-11 w-11 place-items-center rounded-control bg-primary-soft text-primary-strong" aria-hidden="true"><Icon size={20} /></span>
                <span className="text-3xl font-extrabold text-foreground">{counts.total || 0}</span>
              </div>
              <h2 className="mt-5 text-xl font-bold text-foreground">{title}</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p>
              <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold text-muted-foreground">
                <span className="rounded-full bg-success-soft px-2.5 py-1 text-success">{counts.published || 0} published</span>
                <span className="rounded-full bg-warning-soft px-2.5 py-1 text-warning">{counts.draft || 0} draft</span>
                <span className="rounded-full bg-surface-secondary px-2.5 py-1">{counts.archived || 0} archived</span>
              </div>
              <p className="mt-5 text-sm font-semibold text-primary-strong">Open bank →</p>
            </Link>
          );
        })}
      </div>
    </PageShell>
  );
}
