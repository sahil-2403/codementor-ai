import { Link } from 'react-router-dom';
import { BookOpen, FileQuestion, Layers3, Tags } from 'lucide-react';
import AdminLifecycleGuide from '../../components/admin/AdminLifecycleGuide.jsx';
import InlineAlert from '../../components/common/InlineAlert.jsx';
import PageHeader from '../../components/common/PageHeader.jsx';
import PageShell from '../../components/common/PageShell.jsx';

const sections = [
  { title: 'Topics', description: 'Organize skills and metadata used by lessons and quiz questions.', href: '/admin/topics', icon: Tags },
  { title: 'Lessons', description: 'Create, validate, publish, and archive learner-facing content.', href: '/admin/lessons', icon: BookOpen },
  { title: 'Question banks', description: 'Manage quiz, assessment, and interview-practice questions.', href: '/admin/questions', icon: FileQuestion },
  { title: 'Roadmap templates', description: 'Maintain validated module structures for each goal and level.', href: '/admin/templates', icon: Layers3 }
];

export default function AdminDashboardPage() {
  return <PageShell>
    <PageHeader
      eyebrow="Admin CMS"
      title="Content management"
      description="Manage only the reviewed learning content that powers learner roadmaps, lessons, quizzes, projects, and interview practice."
    />

    <InlineAlert title="Deliberately limited admin scope">
      User management, billing, email operations, AI usage dashboards, job monitoring, and fake platform analytics are outside this CMS.
    </InlineAlert>

    <AdminLifecycleGuide />

    <div className="grid gap-4 md:grid-cols-2">
      {sections.map(({ title, description, href, icon: Icon }) => <Link
        key={href}
        to={href}
        className="group rounded-panel border border-border bg-surface p-6 shadow-soft transition hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-panel"
      >
        <div className="flex items-start gap-4">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-surface bg-primary-soft text-primary"><Icon size={20} /></span>
          <div>
            <h2 className="font-bold text-foreground">{title}</h2>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">{description}</p>
            <span className="mt-4 inline-block text-sm font-semibold text-primary-strong group-hover:text-primary">Open section →</span>
          </div>
        </div>
      </Link>)}
    </div>
  </PageShell>;
}
