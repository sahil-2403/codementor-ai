import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Boxes, GraduationCap, Layers3, Plus, Route } from 'lucide-react';
import Card from '../../components/common/Card.jsx';
import ErrorMessage from '../../components/common/ErrorMessage.jsx';
import Loader from '../../components/common/Loader.jsx';
import PageHeader from '../../components/common/PageHeader.jsx';
import PageShell from '../../components/common/PageShell.jsx';
import { adminApi } from '../../api/adminApi.js';

const sections = [
  { key: 'technologies', title: 'Technologies', description: 'Languages, frameworks, runtimes, databases, libraries, platforms, and tools used to classify courses.', href: '/admin/technologies', newHref: '/admin/technologies/new', icon: Boxes },
  { key: 'courses', title: 'Courses', description: 'Learning units learners can start directly.', href: '/admin/courses', newHref: '/admin/courses/new', icon: GraduationCap },
  { key: 'learningPaths', title: 'Learning paths', description: 'Ordered groups of courses for larger learning goals.', href: '/admin/learning-paths', newHref: '/admin/learning-paths/new', icon: Route }
];

export default function AdminCatalogPage() {
  const [overview, setOverview] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;
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
    return () => { active = false; };
  }, []);

  if (isLoading) return <Loader label="Loading learning catalog..." />;
  const catalog = overview?.catalog || {};

  return (
    <PageShell className="space-y-6 pb-8">
      <PageHeader
        eyebrow="Learning catalog"
        eyebrowIcon={Layers3}
        title="Catalog structure"
        description="Manage technologies, courses, and learning paths."
      />
      <ErrorMessage message={error?.message} />

      <div className="grid gap-5 lg:grid-cols-3">
        {sections.map(({ key, title, description, href, newHref, icon: Icon }) => {
          const counts = catalog[key] || { total: 0, published: 0, draft: 0, archived: 0 };
          return (
            <Card key={key} className="flex min-w-0 flex-col shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <span className="grid h-11 w-11 place-items-center rounded-control bg-primary-soft text-primary-strong"><Icon size={20} /></span>
                <span className="text-3xl font-extrabold text-foreground">{counts.total}</span>
              </div>
              <h2 className="mt-5 text-xl font-bold text-foreground">{title}</h2>
              <p className="mt-2 flex-1 text-sm leading-6 text-muted-foreground">{description}</p>
              <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold text-muted-foreground">
                <span className="rounded-full bg-success-soft px-2.5 py-1 text-success">{counts.published || 0} published</span>
                <span className="rounded-full bg-warning-soft px-2.5 py-1 text-warning">{counts.draft || 0} draft</span>
                <span className="rounded-full bg-surface-secondary px-2.5 py-1">{counts.archived || 0} archived</span>
              </div>
              <div className="mt-5 grid gap-2 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                <Link to={href} className="ui-button ui-button--secondary">Manage</Link>
                <Link to={newHref} className="ui-button ui-button--primary gap-2"><Plus size={15} /> Create</Link>
              </div>
            </Card>
          );
        })}
      </div>
    </PageShell>
  );
}
