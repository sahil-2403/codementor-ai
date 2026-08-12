import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, BookOpen, Layers3, Route, Search, Sparkles } from 'lucide-react';
import Badge from '../../components/common/Badge.jsx';
import Button from '../../components/common/Button.jsx';
import Card from '../../components/common/Card.jsx';
import EmptyState from '../../components/common/EmptyState.jsx';
import ErrorMessage from '../../components/common/ErrorMessage.jsx';
import Input from '../../components/common/Input.jsx';
import Loader from '../../components/common/Loader.jsx';
import OnboardingInsightCard from '../../components/onboarding/OnboardingInsightCard.jsx';
import OnboardingShell from '../../components/onboarding/OnboardingShell.jsx';
import { onboardingApi } from '../../api/onboardingApi.js';
import { cn } from '../../utils/cn.js';

const categoryLabels = {
  fundamentals: 'Programming languages & fundamentals',
  frontend: 'Frontend',
  backend: 'Backend',
  fullstack: 'Full stack',
  database: 'Databases',
  mobile: 'Mobile',
  devops: 'DevOps',
  'data-ai': 'Data & AI',
  interview: 'Interview preparation',
  other: 'More courses'
};

const categoryOrder = ['fundamentals', 'frontend', 'backend', 'fullstack', 'database', 'mobile', 'devops', 'data-ai', 'interview', 'other'];

function TechnologyPills({ technologies = [], compact = false }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {technologies.slice(0, compact ? 4 : 6).map((technology) => (
        <span key={technology._id || technology.slug} className="rounded-full bg-surface-secondary px-2.5 py-1 text-xs font-semibold text-muted-foreground">
          {technology.name}
        </span>
      ))}
      {technologies.length > (compact ? 4 : 6) ? (
        <span className="px-1 py-1 text-xs font-semibold text-muted-foreground">+{technologies.length - (compact ? 4 : 6)} more</span>
      ) : null}
    </div>
  );
}

function CourseCard({ course, busyId, onSelect }) {
  const busy = busyId === course._id;
  return (
    <article className="flex h-full min-w-0 flex-col rounded-panel border border-border bg-surface p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-soft">
      <div className="flex items-start justify-between gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-control bg-primary-soft text-primary-strong" aria-hidden="true"><BookOpen size={18} /></span>
        {course.featured ? <Badge variant="info">Featured</Badge> : null}
      </div>
      <h3 className="mt-4 text-lg font-bold text-foreground">{course.title}</h3>
      <p className="mt-2 flex-1 text-sm leading-6 text-muted-foreground">{course.description}</p>
      <div className="mt-4"><TechnologyPills technologies={course.technologies} compact /></div>
      <div className="mt-5 flex items-center justify-between gap-3 border-t border-border pt-4">
        <p className="text-xs font-semibold text-muted-foreground">{course.availableLevels?.length || 0} levels available</p>
        <Button type="button" className="min-h-9 gap-1.5 px-3 text-xs" isLoading={busy} loadingLabel="Starting..." onClick={() => onSelect('course', course._id)}>
          Start course <ArrowRight size={14} aria-hidden="true" />
        </Button>
      </div>
    </article>
  );
}

function PathCard({ path, busyId, onSelect }) {
  const busy = busyId === path._id;
  return (
    <article className="rounded-panel border border-primary/20 bg-primary-soft/35 p-5 shadow-sm sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="grid h-10 w-10 place-items-center rounded-control bg-primary text-white" aria-hidden="true"><Route size={18} /></span>
            <Badge variant="info">Learning path</Badge>
          </div>
          <h3 className="mt-4 text-xl font-bold text-foreground">{path.title}</h3>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">{path.description}</p>
          <div className="mt-4"><TechnologyPills technologies={path.technologies} /></div>
        </div>
        <Button type="button" className="shrink-0 gap-2" isLoading={busy} loadingLabel="Starting..." onClick={() => onSelect('learning_path', path._id)}>
          Follow path <ArrowRight size={15} aria-hidden="true" />
        </Button>
      </div>
      <div className="mt-5 border-t border-primary/15 pt-4">
        <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-primary-strong">Course sequence</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {(path.courses || []).map((entry, index) => (
            <span key={entry.course?._id || index} className="rounded-full border border-primary/15 bg-surface px-3 py-1.5 text-xs font-semibold text-foreground">
              {index + 1}. {entry.course?.title || 'Course'}
            </span>
          ))}
        </div>
      </div>
    </article>
  );
}

export default function CatalogPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [technologyFilter, setTechnologyFilter] = useState('');
  const [busyId, setBusyId] = useState('');
  const [error, setError] = useState('');
  const [catalog, setCatalog] = useState({ technologies: [], courses: [], learningPaths: [] });
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [catalogError, setCatalogError] = useState(null);
  const [loadAttempt, setLoadAttempt] = useState(0);
  const normalizedSearch = search.trim().toLowerCase();

  useEffect(() => {
    let active = true;
    setCatalogLoading(true);
    setCatalogError(null);

    onboardingApi.catalog()
      .then((result) => {
        if (active) setCatalog(result || { technologies: [], courses: [], learningPaths: [] });
      })
      .catch((requestError) => {
        if (active) setCatalogError(requestError);
      })
      .finally(() => {
        if (active) setCatalogLoading(false);
      });

    return () => {
      active = false;
    };
  }, [loadAttempt]);

  const visibleCourses = useMemo(() => catalog.courses.filter((course) => {
    const matchesTechnology = !technologyFilter || (course.technologies || []).some((technology) => technology._id === technologyFilter);
    if (!matchesTechnology) return false;
    if (!normalizedSearch) return true;
    const haystack = [course.title, course.description, course.category, ...(course.technologies || []).map((technology) => technology.name)].join(' ').toLowerCase();
    return haystack.includes(normalizedSearch);
  }), [catalog.courses, normalizedSearch, technologyFilter]);

  const visiblePaths = useMemo(() => catalog.learningPaths.filter((path) => {
    const matchesTechnology = !technologyFilter || (path.technologies || []).some((technology) => technology._id === technologyFilter);
    if (!matchesTechnology) return false;
    if (!normalizedSearch) return true;
    const haystack = [path.title, path.description, path.category, ...(path.technologies || []).map((technology) => technology.name)].join(' ').toLowerCase();
    return haystack.includes(normalizedSearch);
  }), [catalog.learningPaths, normalizedSearch, technologyFilter]);

  const groupedCourses = useMemo(() => categoryOrder
    .map((category) => ({ category, courses: visibleCourses.filter((course) => course.category === category) }))
    .filter((group) => group.courses.length), [visibleCourses]);

  const selectOffering = async (type, id) => {
    try {
      setBusyId(id);
      setError('');
      await onboardingApi.selectOffering(type === 'course'
        ? { type, courseId: id }
        : { type, learningPathId: id });
      navigate('/onboarding/level');
    } catch (err) {
      setError(err?.message || 'Could not start this learning option.');
    } finally {
      setBusyId('');
    }
  };

  if (catalogLoading) return <Loader label="Loading learning catalog..." />;
  if (catalogError) return <EmptyState title="Learning catalog could not load" description={catalogError.message} actionLabel="Try again" onAction={() => setLoadAttempt((value) => value + 1)} />;

  return (
    <OnboardingShell
      current="catalog"
      eyebrow="Step 1 · Choose what to learn"
      title="Start with a course or follow a complete path"
      description="Choose React, JavaScript, Java, backend, full stack, or any other available course directly. Technologies help you discover content—they never block you from starting the course you want."
      aside={<>
        <OnboardingInsightCard title="Two ways to learn" badge="Your choice" items={[
          { title: 'Start a course directly', description: 'Already know what you want? Open React, Node.js, Java, or another course without choosing a language first.' },
          { title: 'Follow a complete path', description: 'Use an ordered learning path when you want several courses connected into one larger goal.' }
        ]} />
        <Card className="bg-primary-soft">
          <Sparkles className="text-primary" />
          <p className="mt-3 font-bold text-foreground">Multi-technology by design</p>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">A course can combine several technologies, so full-stack paths are not restricted to one programming language.</p>
        </Card>
      </>}
    >
      <ErrorMessage message={error} />

      <Card className="shadow-sm">
        <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
          <Input label="Search courses and technologies" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="React, Java, backend, PostgreSQL..." />
          <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground"><Search size={14} aria-hidden="true" /> {visibleCourses.length} course{visibleCourses.length === 1 ? '' : 's'} found</div>
        </div>
        <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
          <button type="button" onClick={() => setTechnologyFilter('')} className={cn('shrink-0 rounded-full border px-3 py-1.5 text-xs font-semibold transition', !technologyFilter ? 'border-primary bg-primary-soft text-primary-strong' : 'border-border bg-surface text-muted-foreground hover:border-primary/30')}>All technologies</button>
          {catalog.technologies.map((technology) => (
            <button key={technology._id} type="button" onClick={() => setTechnologyFilter(technology._id)} className={cn('shrink-0 rounded-full border px-3 py-1.5 text-xs font-semibold transition', technologyFilter === technology._id ? 'border-primary bg-primary-soft text-primary-strong' : 'border-border bg-surface text-muted-foreground hover:border-primary/30')}>
              {technology.name}
            </button>
          ))}
        </div>
      </Card>

      {visiblePaths.length ? (
        <section aria-labelledby="learning-paths-title" className="space-y-3">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-primary-strong">Complete paths</p>
            <h2 id="learning-paths-title" className="mt-1 text-xl font-bold text-foreground">Learn through an ordered course roadmap</h2>
          </div>
          <div className="space-y-4">{visiblePaths.map((path) => <PathCard key={path._id} path={path} busyId={busyId} onSelect={selectOffering} />)}</div>
        </section>
      ) : null}

      {groupedCourses.map((group) => (
        <section key={group.category} aria-labelledby={`course-category-${group.category}`} className="space-y-3">
          <div className="flex items-end justify-between gap-3">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-primary-strong">Courses</p>
              <h2 id={`course-category-${group.category}`} className="mt-1 text-xl font-bold text-foreground">{categoryLabels[group.category] || 'Courses'}</h2>
            </div>
            <span className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground"><Layers3 size={14} aria-hidden="true" /> {group.courses.length}</span>
          </div>
          <div className="grid gap-4 md:grid-cols-2">{group.courses.map((course) => <CourseCard key={course._id} course={course} busyId={busyId} onSelect={selectOffering} />)}</div>
        </section>
      ))}

      {!visibleCourses.length && !visiblePaths.length ? (
        <EmptyState title="No matching learning options" description="Try another search term or remove the technology filter." actionLabel="Clear filters" onAction={() => { setSearch(''); setTechnologyFilter(''); }} />
      ) : null}
    </OnboardingShell>
  );
}
