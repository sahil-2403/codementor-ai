import { Link } from 'react-router-dom';
import { BookOpen, FileQuestion, Layers3, Tags } from 'lucide-react';
import PageShell from '../../components/common/PageShell.jsx';
import PageHeader from '../../components/common/PageHeader.jsx';

const sections = [
  { title: 'Topics', description: 'Organize the skills used across lessons and quiz questions.', href: '/admin/topics', icon: Tags },
  { title: 'Lessons', description: 'Create, edit, publish, and archive learning content.', href: '/admin/lessons', icon: BookOpen },
  { title: 'Questions', description: 'Manage assessment and quiz questions by topic and difficulty.', href: '/admin/questions', icon: FileQuestion },
  { title: 'Roadmap templates', description: 'Maintain the module structure used to create learner roadmaps.', href: '/admin/templates', icon: Layers3 }
];

export default function AdminDashboardPage() {
  return (
    <PageShell>
      <PageHeader
        eyebrow="Admin CMS"
        title="Content management"
        description="Manage the learning content that powers CodeMentor AI. Platform monitoring and user data are intentionally kept outside this admin area."
      />

      <div className="grid gap-4 md:grid-cols-2">
        {sections.map(({ title, description, href, icon: Icon }) => (
          <Link
            key={href}
            to={href}
            className="group rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md"
          >
            <div className="flex items-start gap-4">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-slate-950 text-white">
                <Icon size={20} />
              </span>
              <div>
                <h2 className="font-black text-slate-950">{title}</h2>
                <p className="mt-1 text-sm leading-6 text-slate-500">{description}</p>
                <span className="mt-4 inline-block text-sm font-bold text-slate-700 group-hover:text-slate-950">Open module →</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </PageShell>
  );
}
