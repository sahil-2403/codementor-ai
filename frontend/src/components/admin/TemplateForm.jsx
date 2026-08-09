import { useEffect, useMemo } from 'react';
import { useFieldArray, useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  ArrowDown,
  ArrowUp,
  BookOpenText,
  CheckCircle2,
  CircleAlert,
  Clock3,
  Layers3,
  Plus,
  Tags,
  Trash2
} from 'lucide-react';
import Button from '../common/Button.jsx';
import Card from '../common/Card.jsx';
import Input from '../common/Input.jsx';
import Select from '../common/Select.jsx';
import FormTextarea from '../form/FormTextarea.jsx';
import { ROADMAP_TEMPLATE_GOALS, getRoadmapTemplateGoalLabel } from '../../constants/roadmapTemplateGoals.js';
import { templateFormSchema } from '../../validations/admin.schema.js';

const emptyModule = () => ({
  title: '',
  description: '',
  durationDays: 7,
  lessonSlugs: [],
  quizTags: []
});

const toForm = (template) => ({
  goalKey: template?.goalKey || ROADMAP_TEMPLATE_GOALS[0].key,
  level: template?.level || 'beginner',
  title: template?.title || '',
  description: template?.description || '',
  modules: template?.modules?.length
    ? template.modules.map((module) => ({
      title: module.title || '',
      description: module.description || '',
      durationDays: module.durationDays || 7,
      lessonSlugs: module.lessonSlugs || [],
      quizTags: module.quizTags || []
    }))
    : [emptyModule()]
});

function FormSectionHeader({ icon: Icon, eyebrow, title, description, action = null }) {
  return (
    <div className="flex flex-col gap-3 border-b border-border pb-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="flex items-start gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-control bg-primary-soft text-primary-strong" aria-hidden="true">
          <Icon size={18} />
        </span>
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-primary-strong">{eyebrow}</p>
          <h2 className="mt-1 text-lg font-bold text-foreground">{title}</h2>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">{description}</p>
        </div>
      </div>
      {action}
    </div>
  );
}

function ChoiceRow({ registration, value, disabled = false, title, meta, warning = false }) {
  return (
    <label className={`flex cursor-pointer items-start gap-3 rounded-surface border border-transparent px-3 py-2.5 transition hover:border-border hover:bg-surface ${disabled ? 'cursor-not-allowed opacity-45' : ''}`}>
      <input
        type="checkbox"
        value={value}
        disabled={disabled}
        className="mt-1 h-4 w-4 rounded border-border text-primary focus:ring-primary"
        {...registration}
      />
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold text-foreground">{title}</span>
        {meta ? <span className={`mt-0.5 block text-xs ${warning ? 'text-amber-700' : 'text-muted-foreground'}`}>{meta}</span> : null}
      </span>
    </label>
  );
}

export default function TemplateForm({
  initialData = null,
  lessons = [],
  quizTags = [],
  unavailableLevels = [],
  onSubmit,
  onCancel,
  isLoading = false
}) {
  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm({
    resolver: zodResolver(templateFormSchema),
    defaultValues: toForm(initialData)
  });

  const modules = useFieldArray({ control, name: 'modules' });
  const moduleValues = useWatch({ control, name: 'modules' }) || [];
  const goalKey = useWatch({ control, name: 'goalKey' }) || ROADMAP_TEMPLATE_GOALS[0].key;

  useEffect(() => {
    reset(toForm(initialData));
  }, [initialData, reset]);

  const lessonsByTopic = useMemo(() => {
    const groups = new Map();
    lessons
      .filter((lesson) => lesson.status !== 'archived')
      .forEach((lesson) => {
        const topic = lesson.topic?.title || 'Other lessons';
        if (!groups.has(topic)) groups.set(topic, []);
        groups.get(topic).push(lesson);
      });

    return [...groups.entries()]
      .map(([topic, items]) => ({
        topic,
        lessons: items.sort((a, b) => String(a.title).localeCompare(String(b.title)))
      }))
      .sort((a, b) => a.topic.localeCompare(b.topic));
  }, [lessons]);

  const lessonBySlug = useMemo(() => new Map(lessons.map((lesson) => [lesson.slug, lesson])), [lessons]);
  const quizTagByName = useMemo(() => new Map(quizTags.map((item) => [item.tag, item])), [quizTags]);

  const totalDays = moduleValues.reduce((sum, module) => sum + (Number(module?.durationDays) || 0), 0);
  const selectedLessons = moduleValues.flatMap((module) => module?.lessonSlugs || []);
  const selectedQuizTags = moduleValues.flatMap((module) => module?.quizTags || []);

  const readiness = [
    {
      label: `${moduleValues.length} module${moduleValues.length === 1 ? '' : 's'} arranged in roadmap order`,
      ready: moduleValues.length > 0
    },
    {
      label: 'Every module has at least one lesson',
      ready: moduleValues.length > 0 && moduleValues.every((module) => module?.lessonSlugs?.length)
    },
    {
      label: 'Every module has quiz coverage',
      ready: moduleValues.length > 0 && moduleValues.every((module) => module?.quizTags?.length)
    },
    {
      label: 'No lesson is used in more than one module',
      ready: new Set(selectedLessons).size === selectedLessons.length
    },
    {
      label: 'Selected lessons are published',
      ready: selectedLessons.length > 0 && selectedLessons.every((slug) => lessonBySlug.get(slug)?.status === 'published')
    },
    {
      label: 'Selected quiz tags have published quiz questions',
      ready: selectedQuizTags.length > 0 && selectedQuizTags.every((tag) => (quizTagByName.get(tag)?.publishedCount || 0) > 0)
    }
  ];

  const lessonUsedElsewhere = (slug, currentIndex) => {
    const currentValues = moduleValues[currentIndex]?.lessonSlugs || [];
    if (currentValues.includes(slug)) return false;
    return moduleValues.some((module, index) => index !== currentIndex && module?.lessonSlugs?.includes(slug));
  };

  const submit = (values) => {
    const normalizedModules = values.modules.map((module, index) => ({
      title: module.title.trim(),
      description: module.description.trim(),
      order: index + 1,
      durationDays: Number(module.durationDays) || 7,
      lessonSlugs: module.lessonSlugs || [],
      quizTags: module.quizTags || []
    }));

    onSubmit({
      goalKey: values.goalKey,
      level: values.level,
      title: values.title.trim(),
      description: values.description.trim(),
      modules: normalizedModules,
      estimatedDurationDays: normalizedModules.reduce((sum, module) => sum + module.durationDays, 0)
    });
  };

  return (
    <form onSubmit={handleSubmit(submit)} className="space-y-5">
      <input type="hidden" {...register('goalKey')} />

      <Card className="shadow-sm">
        <FormSectionHeader
          icon={Layers3}
          eyebrow="Template basics"
          title="Define the roadmap"
          description="Choose the learner level and give this roadmap a clear title. The learning path is stored internally so you never need to manage technical goal keys."
        />

        <div className="mt-5 space-y-4">
          <div className="rounded-panel border border-border bg-surface-secondary/45 p-4">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">Learning path</p>
            <p className="mt-1 text-base font-bold text-foreground">{getRoadmapTemplateGoalLabel(goalKey)}</p>
          </div>

          <div className="grid gap-4 md:grid-cols-[1.4fr_0.6fr]">
            <Input
              label="Template title"
              placeholder="Example: Junior MERN Developer — Beginner"
              error={errors.title?.message}
              {...register('title')}
            />
            <Select label="Level" error={errors.level?.message} {...register('level')}>
              {['beginner', 'intermediate', 'advanced'].map((level) => {
                const unavailable = unavailableLevels.includes(level) && initialData?.level !== level;
                const label = `${level.charAt(0).toUpperCase()}${level.slice(1)}`;
                return <option key={level} value={level} disabled={unavailable}>{label}{unavailable ? ' — already configured' : ''}</option>;
              })}
            </Select>
          </div>

          <FormTextarea
            label="Description"
            rows={3}
            placeholder="Explain what this roadmap helps the learner achieve..."
            registration={register('description')}
            error={errors.description?.message}
          />

          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock3 size={16} aria-hidden="true" />
            <span><strong className="text-foreground">{totalDays || 0} days</strong> estimated from the module durations below.</span>
          </div>
        </div>
      </Card>

      <Card className="shadow-sm">
        <FormSectionHeader
          icon={BookOpenText}
          eyebrow="Roadmap modules"
          title="Build the learning sequence"
          description="Each card is one roadmap module. Add its lessons and quiz coverage, then move cards up or down to change the learner sequence."
          action={
            <Button
              type="button"
              variant="secondary"
              className="min-h-9 gap-2 self-start px-3 text-xs"
              onClick={() => modules.append(emptyModule())}
            >
              <Plus size={14} aria-hidden="true" />
              Add module
            </Button>
          }
        />

        {errors.modules?.message ? <p className="mt-4 text-sm font-semibold text-rose-700">{errors.modules.message}</p> : null}

        <div className="mt-5 space-y-4">
          {modules.fields.map((field, index) => {
            const selectedLessonCount = moduleValues[index]?.lessonSlugs?.length || 0;
            const selectedTagCount = moduleValues[index]?.quizTags?.length || 0;

            return (
              <article key={field.id} className="rounded-panel border border-border bg-surface-secondary/25 p-4 sm:p-5">
                <div className="flex flex-col gap-3 border-b border-border pb-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-primary-strong">Module {index + 1}</p>
                    <p className="mt-1 text-sm text-muted-foreground">The card position defines the roadmap order automatically.</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      variant="ghost"
                      className="min-h-9 w-9 px-0"
                      disabled={index === 0}
                      onClick={() => modules.move(index, index - 1)}
                      aria-label={`Move module ${index + 1} up`}
                    >
                      <ArrowUp size={15} aria-hidden="true" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      className="min-h-9 w-9 px-0"
                      disabled={index === modules.fields.length - 1}
                      onClick={() => modules.move(index, index + 1)}
                      aria-label={`Move module ${index + 1} down`}
                    >
                      <ArrowDown size={15} aria-hidden="true" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      className="min-h-9 gap-1.5 px-3 text-xs text-rose-700"
                      disabled={modules.fields.length <= 1}
                      onClick={() => modules.remove(index)}
                    >
                      <Trash2 size={14} aria-hidden="true" />
                      Remove
                    </Button>
                  </div>
                </div>

                <div className="mt-4 grid gap-4 md:grid-cols-[1fr_160px]">
                  <Input
                    label="Module title"
                    placeholder="Example: JavaScript foundations"
                    error={errors.modules?.[index]?.title?.message}
                    {...register(`modules.${index}.title`)}
                  />
                  <Input
                    label="Duration (days)"
                    type="number"
                    min="1"
                    max="90"
                    error={errors.modules?.[index]?.durationDays?.message}
                    {...register(`modules.${index}.durationDays`)}
                  />
                </div>

                <div className="mt-4">
                  <FormTextarea
                    label="Module description"
                    rows={2}
                    placeholder="Describe the outcome of this module..."
                    registration={register(`modules.${index}.description`)}
                    error={errors.modules?.[index]?.description?.message}
                  />
                </div>

                <div className="mt-5 grid gap-4 xl:grid-cols-2">
                  <div className="rounded-panel border border-border bg-surface p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <BookOpenText size={16} className="text-primary-strong" aria-hidden="true" />
                          <p className="text-sm font-bold text-foreground">Lessons</p>
                        </div>
                        <p className="mt-1 text-xs leading-5 text-muted-foreground">Choose lesson titles; their internal slugs are stored automatically.</p>
                      </div>
                      <span className="rounded-full bg-primary-soft px-2.5 py-1 text-xs font-bold text-primary-strong">{selectedLessonCount} selected</span>
                    </div>

                    {lessonsByTopic.length ? (
                      <div className="mt-3 max-h-72 space-y-3 overflow-y-auto pr-1">
                        {lessonsByTopic.map((group) => (
                          <div key={group.topic}>
                            <p className="px-3 text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground">{group.topic}</p>
                            <div className="mt-1">
                              {group.lessons.map((lesson) => {
                                const usedElsewhere = lessonUsedElsewhere(lesson.slug, index);
                                return (
                                  <ChoiceRow
                                    key={lesson._id}
                                    registration={register(`modules.${index}.lessonSlugs`)}
                                    value={lesson.slug}
                                    disabled={usedElsewhere}
                                    title={lesson.title}
                                    meta={usedElsewhere ? 'Already used in another module' : lesson.status === 'published' ? 'Published lesson' : 'Draft lesson — publish before this template'}
                                    warning={!usedElsewhere && lesson.status !== 'published'}
                                  />
                                );
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="mt-3 rounded-surface border border-dashed border-border p-4 text-sm text-muted-foreground">No editable lessons are available yet.</div>
                    )}
                  </div>

                  <div className="rounded-panel border border-border bg-surface p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <Tags size={16} className="text-primary-strong" aria-hidden="true" />
                          <p className="text-sm font-bold text-foreground">Quiz coverage</p>
                        </div>
                        <p className="mt-1 text-xs leading-5 text-muted-foreground">Select tags already used by Quiz-bank questions. Skill Check tags are intentionally excluded.</p>
                      </div>
                      <span className="rounded-full bg-primary-soft px-2.5 py-1 text-xs font-bold text-primary-strong">{selectedTagCount} selected</span>
                    </div>

                    {quizTags.length ? (
                      <div className="mt-3 max-h-72 overflow-y-auto pr-1">
                        {quizTags.map((item) => (
                          <ChoiceRow
                            key={item.tag}
                            registration={register(`modules.${index}.quizTags`)}
                            value={item.tag}
                            title={item.tag}
                            meta={item.publishedCount > 0
                              ? `${item.publishedCount} published quiz question${item.publishedCount === 1 ? '' : 's'}`
                              : 'Draft questions only — publish a matching quiz question first'}
                            warning={item.publishedCount === 0}
                          />
                        ))}
                      </div>
                    ) : (
                      <div className="mt-3 rounded-surface border border-dashed border-border p-4 text-sm text-muted-foreground">No Quiz-bank tags are available yet. Add tags to quiz questions first.</div>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </Card>

      <Card className="shadow-sm">
        <FormSectionHeader
          icon={CheckCircle2}
          eyebrow="Publish readiness"
          title="Review the real template dependencies"
          description="These checks use the lessons and Quiz-bank questions currently available in admin. The backend performs the same authoritative checks again when you publish."
        />

        <div className="mt-5 grid gap-2 md:grid-cols-2">
          {readiness.map((item) => (
            <div key={item.label} className={`flex items-start gap-2 rounded-surface border px-3 py-3 text-sm ${item.ready ? 'border-emerald-200 bg-emerald-50/60 text-emerald-800' : 'border-amber-200 bg-amber-50/60 text-amber-800'}`}>
              {item.ready ? <CheckCircle2 size={17} className="mt-0.5 shrink-0" aria-hidden="true" /> : <CircleAlert size={17} className="mt-0.5 shrink-0" aria-hidden="true" />}
              <span className="font-semibold">{item.label}</span>
            </div>
          ))}
        </div>
      </Card>

      <div className="flex flex-col-reverse gap-3 rounded-panel border border-border bg-surface p-4 shadow-sm sm:flex-row sm:items-center sm:justify-end">
        <Button type="button" variant="secondary" onClick={onCancel} disabled={isLoading}>Cancel</Button>
        <Button type="submit" isLoading={isLoading} loadingLabel="Saving template...">
          {initialData ? 'Save template changes' : 'Create template draft'}
        </Button>
      </div>
    </form>
  );
}
