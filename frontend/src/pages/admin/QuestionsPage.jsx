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
    description: 'Questions used in roadmap module assessments and linked to course lessons.',
    path: '/admin/questions/quiz',
    action: 'Manage quiz questions',
    icon: ClipboardCheck,
    note: 'Roadmap assessments'
  },
  {
    title: 'Skill checks',
    description: 'Diagnostic questions used before roadmap personalization for Intermediate and Advanced learners.',
    path: '/admin/questions/skill-checks',
    action: 'Manage skill checks',
    icon: GraduationCap,
    note: 'Onboarding diagnostics'
  },
  {
    title: 'Interview practice',
    description: 'Open-answer interview questions with expected answers and mentor review points.',
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
        description="Manage quizzes, skill checks, and interview practice."
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
    </PageShell>
  );
}
