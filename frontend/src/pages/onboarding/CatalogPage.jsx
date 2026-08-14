import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Check, Code2, Route, Search } from 'lucide-react';
import Button from '../../components/common/Button.jsx';
import EmptyState from '../../components/common/EmptyState.jsx';
import ErrorMessage from '../../components/common/ErrorMessage.jsx';
import Loader from '../../components/common/Loader.jsx';
import OnboardingShell from '../../components/onboarding/OnboardingShell.jsx';
import { onboardingApi } from '../../api/onboardingApi.js';
import { cn } from '../../utils/cn.js';

const categoryLabels = {
  fundamentals: 'Programming & fundamentals',
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

const categoryOrder = [
  'fundamentals',
  'frontend',
  'backend',
  'fullstack',
  'database',
  'mobile',
  'devops',
  'data-ai',
  'interview',
  'other'
];

const technologyMarks = {
  javascript: 'JS',
  typescript: 'TS',
  react: '⚛',
  reactjs: '⚛',
  'react-js': '⚛',
  node: 'N',
  nodejs: 'N',
  'node-js': 'N',
  express: 'EX',
  mongodb: 'M',
  mongo: 'M',
  java: 'J',
  'spring-boot': 'SB',
  python: 'PY',
  html: '<>',
  css: '#',
  postgresql: 'PG',
  postgres: 'PG',
  mysql: 'MY'
};

const getTechnologyMark = (technology) => {
  const key = String(technology?.iconKey || technology?.slug || '').toLowerCase();
  if (technologyMarks[key]) return technologyMarks[key];

  const cleanName = String(technology?.name || '').replace(/[^a-z0-9]/gi, '');
  return cleanName.slice(0, 2).toUpperCase();
};

function OfferingCard({ type, offering, selected, onSelect }) {
  const active = selected?.type === type && selected?.id === offering._id;
  const isPath = type === 'learning_path';
  const primaryTechnology = offering.primaryTechnology || offering.technologies?.[0];
  const technologyMark = getTechnologyMark(primaryTechnology);

  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={() => onSelect({ type, id: offering._id, title: offering.title })}
      className={cn(
        'relative min-h-[176px] w-[250px] shrink-0 rounded-panel border p-5 text-left transition sm:w-[280px]',
        active
          ? 'border-primary bg-primary-soft/55 shadow-sm'
          : 'border-border bg-surface hover:border-primary/30 hover:shadow-sm'
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <span
          className={cn(
            'grid h-11 w-11 place-items-center rounded-surface text-base font-extrabold tracking-tight',
            active ? 'bg-primary text-white' : 'bg-surface-secondary text-primary-strong'
          )}
          title={isPath ? 'Learning path' : primaryTechnology?.name || 'Course technology'}
          aria-hidden="true"
        >
          {isPath ? <Route size={19} /> : technologyMark || <Code2 size={19} />}
        </span>

        {active ? (
          <span className="grid h-6 w-6 place-items-center rounded-full bg-primary text-white" aria-hidden="true">
            <Check size={14} />
          </span>
        ) : null}
      </div>

      <h3 className="mt-4 text-lg font-bold text-foreground">{offering.title}</h3>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">
        {offering.description || (isPath ? 'Follow an ordered set of courses.' : 'Build skills through this course.')}
      </p>
    </button>
  );
}

function OfferingRow({ title, children, id }) {
  return (
    <section aria-labelledby={id} className="space-y-3">
      <h2 id={id} className="text-lg font-bold text-foreground sm:text-xl">{title}</h2>
      <div className="flex gap-4 overflow-x-auto pb-2 pr-2">{children}</div>
    </section>
  );
}

export default function CatalogPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);
  const [saving, setSaving] = useState(false);
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
        if (!active) return;
        setCatalog(result || { technologies: [], courses: [], learningPaths: [] });

        onboardingApi.status()
          .then((status) => {
            if (!active) return;
            const enrollment = status?.currentEnrollment;
            let restored = null;

            if (enrollment?.type === 'learning_path' && enrollment.learningPath?._id) {
              restored = {
                type: 'learning_path',
                id: enrollment.learningPath._id,
                title: enrollment.learningPath.title
              };
            } else if (enrollment?.course?._id) {
              restored = {
                type: 'course',
                id: enrollment.course._id,
                title: enrollment.course.title
              };
            }

            if (restored) setSelected((current) => current || restored);
          })
          .catch(() => {});
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
    if (!normalizedSearch) return true;
    const haystack = [
      course.title,
      course.description,
      course.category,
      ...(course.technologies || []).flatMap((technology) => [technology.name, technology.slug, technology.type])
    ].join(' ').toLowerCase();
    return haystack.includes(normalizedSearch);
  }), [catalog.courses, normalizedSearch]);

  const visiblePaths = useMemo(() => catalog.learningPaths.filter((path) => {
    if (!normalizedSearch) return true;
    const haystack = [
      path.title,
      path.description,
      path.category,
      ...(path.technologies || []).flatMap((technology) => [technology.name, technology.slug, technology.type])
    ].join(' ').toLowerCase();
    return haystack.includes(normalizedSearch);
  }), [catalog.learningPaths, normalizedSearch]);

  const groupedCourses = useMemo(() => categoryOrder
    .map((category) => ({
      category,
      courses: visibleCourses.filter((course) => course.category === category)
    }))
    .filter((group) => group.courses.length), [visibleCourses]);

  const continueNext = async () => {
    if (!selected) return;

    try {
      setSaving(true);
      setError('');
      await onboardingApi.selectOffering(
        selected.type === 'course'
          ? { type: 'course', courseId: selected.id }
          : { type: 'learning_path', learningPathId: selected.id }
      );
      navigate('/onboarding/level');
    } catch (err) {
      setError(err?.message || 'Could not save your learning choice.');
    } finally {
      setSaving(false);
    }
  };

  if (catalogLoading) return <Loader label="Loading learning catalog..." />;
  if (catalogError) {
    return (
      <EmptyState
        title="Learning catalog could not load"
        description={catalogError.message}
        actionLabel="Try again"
        onAction={() => setLoadAttempt((value) => value + 1)}
      />
    );
  }

  return (
    <OnboardingShell
      current="catalog"
      eyebrow="Course selection"
      title="Choose what you want to learn"
      description="Select a course or complete learning path to get started."
      footer={
        <div className="flex items-center justify-end gap-4 sm:justify-between">
          <p className="hidden text-sm text-muted-foreground sm:block">
            {selected ? `Selected: ${selected.title}` : 'Choose one option to continue.'}
          </p>
          <Button
            type="button"
            onClick={continueNext}
            disabled={!selected}
            isLoading={saving}
            loadingLabel="Saving..."
            className="gap-2 px-6"
          >
            Next <ArrowRight size={16} aria-hidden="true" />
          </Button>
        </div>
      }
    >
      <ErrorMessage message={error} />

      <div className="relative w-full">
        <Search
          size={18}
          className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground"
          aria-hidden="true"
        />
        <input
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          className="ui-field-control min-h-12 w-full pl-11"
          placeholder="Search courses, technologies or languages..."
          aria-label="Search courses, technologies or languages"
        />
      </div>

      {visiblePaths.length ? (
        <OfferingRow title="Complete paths" id="complete-paths">
          {visiblePaths.map((path) => (
            <OfferingCard
              key={path._id}
              type="learning_path"
              offering={path}
              selected={selected}
              onSelect={setSelected}
            />
          ))}
        </OfferingRow>
      ) : null}

      {groupedCourses.map((group) => (
        <OfferingRow
          key={group.category}
          title={categoryLabels[group.category] || 'Courses'}
          id={`course-category-${group.category}`}
        >
          {group.courses.map((course) => (
            <OfferingCard
              key={course._id}
              type="course"
              offering={course}
              selected={selected}
              onSelect={setSelected}
            />
          ))}
        </OfferingRow>
      ))}

      {!visibleCourses.length && !visiblePaths.length ? (
        <div className="rounded-panel border border-dashed border-border px-5 py-8 text-center">
          <p className="font-semibold text-foreground">No matching courses found</p>
          <p className="mt-1 text-sm text-muted-foreground">Try another course, language, or technology name.</p>
          <Button type="button" variant="secondary" className="mt-4" onClick={() => setSearch('')}>
            Clear search
          </Button>
        </div>
      ) : null}
    </OnboardingShell>
  );
}
