import { useEffect, useMemo } from 'react';
import { useFieldArray, useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowDown, ArrowUp, BookOpenText, CheckCircle2, CircleAlert, Clock3, Layers3, Plus, Tags, Trash2 } from 'lucide-react';
import Button from '../common/Button.jsx';
import Card from '../common/Card.jsx';
import Input from '../common/Input.jsx';
import Select from '../common/Select.jsx';
import FormTextarea from '../form/FormTextarea.jsx';
import { COURSE_LEVELS } from '../../constants/catalog.js';
import { templateFormSchema } from '../../validations/admin.schema.js';

const emptyModule = () => ({ title: '', description: '', durationDays: 7, lessons: [], quizTags: [] });
const idOf = (value) => value?._id || value || '';

const toForm = (template, courseId) => ({
  course: idOf(template?.course) || courseId || '',
  level: template?.level || 'beginner',
  title: template?.title || '',
  description: template?.description || '',
  modules: template?.modules?.length
    ? template.modules.map((module) => ({
      title: module.title || '',
      description: module.description || '',
      durationDays: module.durationDays || 7,
      lessons: (module.lessons || []).map(idOf).filter(Boolean),
      quizTags: module.quizTags || []
    }))
    : [emptyModule()]
});

function SectionHeader({ icon: Icon, eyebrow, title, description, action = null }) {
  return <div className="flex flex-col gap-3 border-b border-border pb-4 sm:flex-row sm:items-start sm:justify-between"><div className="flex items-start gap-3"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-control bg-primary-soft text-primary-strong" aria-hidden="true"><Icon size={18} /></span><div><p className="text-[11px] font-bold uppercase tracking-[0.16em] text-primary-strong">{eyebrow}</p><h2 className="mt-1 text-lg font-bold text-foreground">{title}</h2><p className="mt-1 text-sm leading-6 text-muted-foreground">{description}</p></div></div>{action}</div>;
}

function ChoiceRow({ registration, value, disabled = false, title, meta, warning = false }) {
  return <label className={`flex cursor-pointer items-start gap-3 rounded-surface border border-transparent px-3 py-2.5 transition hover:border-border hover:bg-surface ${disabled ? 'cursor-not-allowed opacity-45' : ''}`}><input type="checkbox" value={value} disabled={disabled} className="mt-1 h-4 w-4 rounded border-border text-primary focus:ring-primary" {...registration} /><span className="min-w-0 flex-1"><span className="block break-words text-sm font-semibold text-foreground">{title}</span>{meta ? <span className={`mt-0.5 block text-xs leading-5 ${warning ? 'text-amber-700' : 'text-muted-foreground'}`}>{meta}</span> : null}</span></label>;
}

export default function TemplateForm({ initialData = null, course, lessons = [], quizTags = [], unavailableLevels = [], onSubmit, onCancel, isLoading = false }) {
  const courseId = idOf(course);
  const { register, control, handleSubmit, reset, formState: { errors } } = useForm({ resolver: zodResolver(templateFormSchema), defaultValues: toForm(initialData, courseId) });
  const modules = useFieldArray({ control, name: 'modules' });
  const moduleValues = useWatch({ control, name: 'modules' }) || [];

  useEffect(() => { reset(toForm(initialData, courseId)); }, [initialData, courseId, reset]);

  const lessonsByTopic = useMemo(() => {
    const groups = new Map();
    lessons.filter((lesson) => lesson.status !== 'archived').forEach((lesson) => {
      const topic = lesson.topic?.title || 'Other lessons';
      if (!groups.has(topic)) groups.set(topic, []);
      groups.get(topic).push(lesson);
    });
    return [...groups.entries()].map(([topic, items]) => ({ topic, lessons: items.sort((a, b) => String(a.title).localeCompare(String(b.title))) })).sort((a, b) => a.topic.localeCompare(b.topic));
  }, [lessons]);

  const lessonById = useMemo(() => new Map(lessons.map((lesson) => [lesson._id, lesson])), [lessons]);
  const quizTagByName = useMemo(() => new Map(quizTags.map((item) => [item.tag, item])), [quizTags]);
  const totalDays = moduleValues.reduce((sum, module) => sum + (Number(module?.durationDays) || 0), 0);
  const selectedLessons = moduleValues.flatMap((module) => module?.lessons || []);
  const selectedQuizTags = moduleValues.flatMap((module) => module?.quizTags || []);

  const readiness = [
    { label: `${moduleValues.length} module${moduleValues.length === 1 ? '' : 's'} arranged in roadmap order`, ready: moduleValues.length > 0 },
    { label: 'Every module has at least one lesson', ready: moduleValues.length > 0 && moduleValues.every((module) => module?.lessons?.length) },
    { label: 'Every module has Quiz-bank coverage', ready: moduleValues.length > 0 && moduleValues.every((module) => module?.quizTags?.length) },
    { label: 'No lesson is used in more than one module', ready: new Set(selectedLessons).size === selectedLessons.length },
    { label: 'Selected lessons are published in this course', ready: selectedLessons.length > 0 && selectedLessons.every((id) => lessonById.get(id)?.status === 'published') },
    { label: 'Selected quiz tags have published questions in this course', ready: selectedQuizTags.length > 0 && selectedQuizTags.every((tag) => (quizTagByName.get(tag)?.publishedCount || 0) > 0) }
  ];

  const lessonUsedElsewhere = (lessonId, currentIndex) => {
    const currentValues = moduleValues[currentIndex]?.lessons || [];
    if (currentValues.includes(lessonId)) return false;
    return moduleValues.some((module, index) => index !== currentIndex && module?.lessons?.includes(lessonId));
  };

  const submit = (values) => {
    const normalizedModules = values.modules.map((module, index) => ({
      title: module.title.trim(), description: module.description.trim(), order: index + 1,
      durationDays: Number(module.durationDays) || 7, lessons: module.lessons || [], quizTags: module.quizTags || []
    }));
    onSubmit({ course: values.course, level: values.level, title: values.title.trim(), description: values.description.trim(), modules: normalizedModules, estimatedDurationDays: normalizedModules.reduce((sum, module) => sum + module.durationDays, 0) });
  };

  return <form onSubmit={handleSubmit(submit)} className="space-y-5">
    <input type="hidden" {...register('course')} />
    <Card className="shadow-sm">
      <SectionHeader icon={Layers3} eyebrow="Template basics" title="Define the course roadmap" description="The template belongs to one course and one learner level. Content from another course cannot be selected." />
      <div className="mt-5 space-y-4">
        <div className="rounded-panel border border-border bg-surface-secondary/45 p-4"><p className="text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">Course</p><p className="mt-1 text-base font-bold text-foreground">{course?.title || 'Select a course first'}</p></div>
        <div className="grid gap-4 md:grid-cols-[1.4fr_0.6fr]"><Input label="Template title" placeholder="Example: React Developer — Beginner" error={errors.title?.message} {...register('title')} /><Select label="Level" error={errors.level?.message} {...register('level')}>{COURSE_LEVELS.map((level) => { const unavailable = unavailableLevels.includes(level) && initialData?.level !== level; return <option key={level} value={level} disabled={unavailable || !(course?.availableLevels || []).includes(level)}>{level[0].toUpperCase() + level.slice(1)}{unavailable ? ' — already configured' : !(course?.availableLevels || []).includes(level) ? ' — disabled for course' : ''}</option>; })}</Select></div>
        <FormTextarea label="Description" rows={3} placeholder="Explain what this roadmap helps the learner achieve..." registration={register('description')} error={errors.description?.message} />
        <div className="flex items-center gap-2 text-sm text-muted-foreground"><Clock3 size={16} aria-hidden="true" /><span><strong className="text-foreground">{totalDays || 0} days</strong> estimated from the module durations below.</span></div>
      </div>
    </Card>

    <Card className="shadow-sm">
      <SectionHeader icon={BookOpenText} eyebrow="Roadmap modules" title="Build the learning sequence" description="Each card is one module. Lesson choices and Quiz-bank tags are limited to the selected course." action={<Button type="button" variant="secondary" className="min-h-9 gap-2 self-start px-3 text-xs" onClick={() => modules.append(emptyModule())}><Plus size={14} /> Add module</Button>} />
      {errors.modules?.message ? <p className="mt-4 text-sm font-semibold text-error">{errors.modules.message}</p> : null}
      <div className="mt-5 space-y-4">{modules.fields.map((field, index) => {
        const selectedLessonCount = moduleValues[index]?.lessons?.length || 0;
        const selectedTagCount = moduleValues[index]?.quizTags?.length || 0;
        return <article key={field.id} className="rounded-panel border border-border bg-surface-secondary/25 p-4 sm:p-5">
          <div className="flex flex-col gap-3 border-b border-border pb-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-[11px] font-bold uppercase tracking-[0.16em] text-primary-strong">Module {index + 1}</p><p className="mt-1 text-sm text-muted-foreground">Card position defines the learner order automatically.</p></div><div className="flex flex-wrap gap-2"><Button type="button" variant="ghost" className="min-h-9 w-9 px-0" disabled={index === 0} onClick={() => modules.move(index, index - 1)}><ArrowUp size={15} /></Button><Button type="button" variant="ghost" className="min-h-9 w-9 px-0" disabled={index === modules.fields.length - 1} onClick={() => modules.move(index, index + 1)}><ArrowDown size={15} /></Button><Button type="button" variant="ghost" className="min-h-9 gap-1.5 px-3 text-xs text-error" disabled={modules.fields.length <= 1} onClick={() => modules.remove(index)}><Trash2 size={14} /> Remove</Button></div></div>
          <div className="mt-4 grid gap-4 md:grid-cols-[1fr_160px]"><Input label="Module title" placeholder="Example: Components and state" error={errors.modules?.[index]?.title?.message} {...register(`modules.${index}.title`)} /><Input label="Duration (days)" type="number" min="1" max="90" error={errors.modules?.[index]?.durationDays?.message} {...register(`modules.${index}.durationDays`)} /></div>
          <div className="mt-4"><FormTextarea label="Module description" rows={2} registration={register(`modules.${index}.description`)} error={errors.modules?.[index]?.description?.message} /></div>
          <div className="mt-5 grid gap-4 xl:grid-cols-2">
            <div className="min-w-0 rounded-panel border border-border bg-surface p-4"><div className="flex items-start justify-between gap-3"><div><p className="text-sm font-bold text-foreground">Lessons</p><p className="mt-1 text-xs leading-5 text-muted-foreground">Select published or draft lessons from {course?.title || 'this course'}.</p></div><span className="shrink-0 rounded-full bg-primary-soft px-2.5 py-1 text-xs font-bold text-primary-strong">{selectedLessonCount}</span></div>{lessonsByTopic.length ? <div className="mt-3 max-h-72 space-y-3 overflow-y-auto pr-1">{lessonsByTopic.map((group) => <div key={group.topic}><p className="px-3 text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground">{group.topic}</p><div className="mt-1">{group.lessons.map((lesson) => { const usedElsewhere = lessonUsedElsewhere(lesson._id, index); return <ChoiceRow key={lesson._id} registration={register(`modules.${index}.lessons`)} value={lesson._id} disabled={usedElsewhere} title={lesson.title} meta={usedElsewhere ? 'Already used in another module' : lesson.status === 'published' ? 'Published lesson' : 'Draft lesson — publish before this template'} warning={!usedElsewhere && lesson.status !== 'published'} />; })}</div></div>)}</div> : <p className="mt-3 text-sm text-muted-foreground">No lessons are available in this course yet.</p>}</div>
            <div className="min-w-0 rounded-panel border border-border bg-surface p-4"><div className="flex items-start justify-between gap-3"><div><p className="text-sm font-bold text-foreground">Quiz coverage</p><p className="mt-1 text-xs leading-5 text-muted-foreground">Tags are collected only from Quiz-bank questions in this course.</p></div><span className="shrink-0 rounded-full bg-primary-soft px-2.5 py-1 text-xs font-bold text-primary-strong">{selectedTagCount}</span></div>{quizTags.length ? <div className="mt-3 max-h-72 overflow-y-auto pr-1">{quizTags.map((item) => <ChoiceRow key={item.tag} registration={register(`modules.${index}.quizTags`)} value={item.tag} title={item.tag} meta={item.publishedCount > 0 ? `${item.publishedCount} published quiz question${item.publishedCount === 1 ? '' : 's'}` : 'Draft questions only'} warning={item.publishedCount === 0} />)}</div> : <p className="mt-3 text-sm text-muted-foreground">No Quiz-bank tags are available in this course yet.</p>}</div>
          </div>
        </article>;
      })}</div>
    </Card>

    <Card className="shadow-sm"><SectionHeader icon={CheckCircle2} eyebrow="Publish readiness" title="Review real course dependencies" description="The server performs these checks again before publishing." /><div className="mt-5 grid gap-2 md:grid-cols-2">{readiness.map((item) => <div key={item.label} className={`flex items-start gap-2 rounded-surface border px-3 py-3 text-sm ${item.ready ? 'border-success/20 bg-success-soft text-success' : 'border-warning/20 bg-warning-soft text-warning'}`}>{item.ready ? <CheckCircle2 size={17} className="mt-0.5 shrink-0" /> : <CircleAlert size={17} className="mt-0.5 shrink-0" />}<span className="font-semibold">{item.label}</span></div>)}</div></Card>
    <div className="flex flex-col-reverse gap-3 rounded-panel border border-border bg-surface p-4 shadow-sm sm:flex-row sm:items-center sm:justify-end"><Button type="button" variant="secondary" onClick={onCancel} disabled={isLoading}>Cancel</Button><Button type="submit" isLoading={isLoading} loadingLabel="Saving template...">{initialData ? 'Save template changes' : 'Create template draft'}</Button></div>
  </form>;
}
