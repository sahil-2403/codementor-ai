import { Link } from 'react-router-dom';
import {
  ArrowRight,
  ClipboardCheck,
  GraduationCap,
  LibraryBig,
  MessageSquareQuote
} from 'lucide-react';
import Card from '../../components/common/Card.jsx';
import PageHeader from '../../components/common/PageHeader.jsx';
import PageShell from '../../components/common/PageShell.jsx';

const banks = [
  {
    title: 'Quiz questions',
    description: 'Questions used in roadmap module assessments. Quiz questions belong to a Topic and connect back to a related Lesson.',
    path: '/admin/questions/quiz',
    action: 'Manage quiz questions',
    icon: ClipboardCheck,
    note: 'Roadmap assessments'
  },
  {
    title: 'Skill checks',
    description: 'Diagnostic questions used before roadmap personalization for intermediate and advanced learners.',
    path: '/admin/questions/skill-checks',
    action: 'Manage skill checks',
    icon: GraduationCap,
    note: 'Onboarding diagnostics'
  },
  {
    title: 'Interview practice',
    description: 'Open-answer interview prompts with expected answers and review points used by AI feedback.',
    path: '/admin/questions/interview',
    action: 'Manage interview questions',
    icon: MessageSquareQuote,
    note: 'Interview feedback'
  }
];

export default function QuestionsPage() {
  return (
    <PageShell className="space-y-5 pb-6">
      <PageHeader
        variant="compact"
        eyebrow="Content administration"
        eyebrowIcon={LibraryBig}
        title="Question banks"
        description="Manage course quizzes, diagnostic skill checks, and interview practice as separate reviewed collections."
      />

      <div className="grid gap-4 lg:grid-cols-3">
        {banks.map(({ title, description, path, action, icon: Icon, note }) => (
          <Card key={path} className="flex h-full flex-col shadow-sm transition duration-200 hover:border-primary/25 hover:shadow-soft">
            <div className="flex items-start justify-between gap-4">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-control bg-primary-soft text-primary-strong" aria-hidden="true">
                <Icon size={20} />
              </span>
              <span className="rounded-full bg-surface-secondary px-2.5 py-1 text-[11px] font-bold text-muted-foreground">{note}</span>
            </div>
            <div className="mt-5 flex-1">
              <h2 className="text-xl font-bold text-foreground">{title}</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p>
            </div>
            <Link to={path} className="ui-button ui-button--secondary mt-5 w-full justify-between gap-2">
              {action}
              <ArrowRight size={16} aria-hidden="true" />
            </Link>
          </Card>
        ))}
      </div>

      <Card className="border-primary/15 bg-primary-soft/35 shadow-sm">
        <div className="flex items-start gap-3">
          <LibraryBig size={18} className="mt-0.5 shrink-0 text-primary-strong" aria-hidden="true" />
          <div>
            <h2 className="text-sm font-bold text-foreground">Each bank has one job</h2>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">Quiz questions are lesson-linked course assessment content. Skill checks are Topic-level onboarding diagnostics. Interview questions use their own open-answer review model. Keeping those purposes separate prevents content from appearing in the wrong learner flow.</p>
          </div>
        </div>
      </Card>
    </PageShell>
  );
}
