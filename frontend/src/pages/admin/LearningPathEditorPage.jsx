import { useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { zodResolver } from '@hookform/resolvers/zod';
import { useFieldArray, useForm } from 'react-hook-form';
import { ArrowDown, ArrowLeft, ArrowUp, Plus, Route, Trash2 } from 'lucide-react';
import Button from '../../components/common/Button.jsx';
import Card from '../../components/common/Card.jsx';
import EmptyState from '../../components/common/EmptyState.jsx';
import ErrorMessage from '../../components/common/ErrorMessage.jsx';
import FormInput from '../../components/form/FormInput.jsx';
import FormTextarea from '../../components/form/FormTextarea.jsx';
import Loader from '../../components/common/Loader.jsx';
import PageHeader from '../../components/common/PageHeader.jsx';
import PageShell from '../../components/common/PageShell.jsx';
import Select from '../../components/common/Select.jsx';
import { COURSE_CATEGORIES, COURSE_LEVELS } from '../../constants/catalog.js';
import { useAdminCourses, useAdminLearningPath, useAdminTechnologies, useCreateLearningPath, useUpdateLearningPath } from '../../queries/adminQueries.js';
import { learningPathFormSchema } from '../../validations/admin.schema.js';

const defaults = { title: '', description: '', category: 'fullstack', technologies: [], availableLevels: [...COURSE_LEVELS], courses: [{ course: '', defaultLevel: '', required: true }], featured: false, order: 0 };

function Choice({ registration, value, title, meta }) {
  return <label className="flex cursor-pointer items-start gap-3 rounded-surface border border-transparent px-3 py-2.5 hover:border-border hover:bg-surface-secondary/60"><input type="checkbox" value={value} className="mt-1 h-4 w-4 rounded border-border" {...registration} /><span><span className="block text-sm font-semibold text-foreground">{title}</span>{meta ? <span className="mt-0.5 block text-xs text-muted-foreground">{meta}</span> : null}</span></label>;
}

export default function LearningPathEditorPage() {
  const { pathId } = useParams();
  const navigate = useNavigate();
  const editing = Boolean(pathId);
  const pathQuery = useAdminLearningPath(pathId);
  const coursesQuery = useAdminCourses({ limit: 100 });
  const technologiesQuery = useAdminTechnologies({ limit: 100 });
  const createMutation = useCreateLearningPath();
  const updateMutation = useUpdateLearningPath();
  const mutation = editing ? updateMutation : createMutation;
  const { register, control, handleSubmit, reset, formState: { errors } } = useForm({ resolver: zodResolver(learningPathFormSchema), defaultValues: defaults });
  const courseFields = useFieldArray({ control, name: 'courses' });

  useEffect(() => {
    const path = pathQuery.data?.learningPath;
    if (!path) return;
    reset({
      title: path.title || '', description: path.description || '', category: path.category || 'fullstack',
      technologies: (path.technologies || []).map((item) => item._id), availableLevels: path.availableLevels || [...COURSE_LEVELS],
      courses: (path.courses || []).sort((a, b) => a.order - b.order).map((entry) => ({ course: entry.course?._id || '', defaultLevel: entry.defaultLevel || '', required: entry.required !== false })),
      featured: Boolean(path.featured), order: path.order || 0
    });
  }, [pathQuery.data?.learningPath?._id, reset]);

  if ((editing && pathQuery.isLoading) || coursesQuery.isLoading || technologiesQuery.isLoading) return <Loader label="Loading learning path editor..." />;
  if (editing && pathQuery.error) return <EmptyState title="Learning path is unavailable" description={pathQuery.error.message} actionLabel="Back to learning paths" onAction={() => navigate('/admin/learning-paths')} />;

  const courses = (coursesQuery.data?.courses || []).filter((item) => item.status !== 'archived');
  const technologies = (technologiesQuery.data?.technologies || []).filter((item) => item.status !== 'archived');

  const submit = (values) => {
    const payload = {
      ...values,
      order: Number(values.order) || 0,
      courses: values.courses.map((entry, index) => ({ course: entry.course, order: index + 1, defaultLevel: entry.defaultLevel || null, required: entry.required !== false }))
    };
    const options = { onSuccess: () => navigate('/admin/learning-paths') };
    if (editing) updateMutation.mutate({ id: pathId, payload }, options);
    else createMutation.mutate(payload, options);
  };

  return <PageShell className="space-y-5 pb-8">
    <PageHeader eyebrow="Learning catalog" eyebrowIcon={Route} title={editing ? 'Edit learning path' : 'Create learning path'} description="Arrange independently learnable courses into a recommended sequence. The path never changes whether those courses can be started directly." actions={<Link to="/admin/learning-paths" className="ui-button ui-button--secondary gap-2"><ArrowLeft size={16} /> Back</Link>} />
    <ErrorMessage message={mutation.error?.message} />
    <form onSubmit={handleSubmit(submit)} className="space-y-5">
      <Card className="mx-auto w-full max-w-4xl space-y-4 shadow-sm">
        <div className="grid gap-4 md:grid-cols-[1.4fr_0.6fr]"><FormInput label="Path title" registration={register('title')} error={errors.title?.message} placeholder="Example: Java Full Stack Path" /><Select label="Category" {...register('category')} error={errors.category?.message}>{COURSE_CATEGORIES.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</Select></div>
        <FormTextarea label="Description" rows={4} registration={register('description')} error={errors.description?.message} placeholder="Describe the larger goal this course sequence achieves..." />
        <div className="grid gap-4 md:grid-cols-2"><FormInput label="Display order" type="number" min="0" registration={register('order')} error={errors.order?.message} /><label className="mt-auto flex min-h-12 items-center gap-3 rounded-surface border border-border px-3 text-sm font-semibold text-foreground"><input type="checkbox" className="h-4 w-4 rounded border-border" {...register('featured')} /> Feature this path in learner discovery</label></div>
      </Card>

      <div className="grid gap-5 xl:grid-cols-2">
        <Card className="shadow-sm"><h2 className="text-lg font-bold text-foreground">Technologies represented</h2><p className="mt-1 text-sm text-muted-foreground">Used for discovery/filtering. The course sequence remains the actual learning structure.</p><div className="mt-4 max-h-72 overflow-y-auto">{technologies.map((item) => <Choice key={item._id} registration={register('technologies')} value={item._id} title={item.name} meta={item.type} />)}</div></Card>
        <Card className="shadow-sm"><h2 className="text-lg font-bold text-foreground">Path entry levels</h2><p className="mt-1 text-sm text-muted-foreground">Choose which learner levels can start this overall path.</p>{errors.availableLevels?.message ? <p className="mt-2 text-sm font-semibold text-error">{errors.availableLevels.message}</p> : null}<div className="mt-4">{COURSE_LEVELS.map((level) => <Choice key={level} registration={register('availableLevels')} value={level} title={level[0].toUpperCase() + level.slice(1)} />)}</div></Card>
      </div>

      <Card className="shadow-sm">
        <div className="flex flex-col gap-3 border-b border-border pb-4 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="text-lg font-bold text-foreground">Course sequence</h2><p className="mt-1 text-sm text-muted-foreground">The order below is the learning path. A course may also appear in other paths or be learned independently.</p></div><Button type="button" variant="secondary" className="gap-2" onClick={() => courseFields.append({ course: '', defaultLevel: '', required: true })}><Plus size={15} /> Add course</Button></div>
        {errors.courses?.message ? <p className="mt-3 text-sm font-semibold text-error">{errors.courses.message}</p> : null}
        <div className="mt-4 space-y-3">{courseFields.fields.map((field, index) => <div key={field.id} className="grid gap-3 rounded-panel border border-border bg-surface-secondary/30 p-4 md:grid-cols-[56px_minmax(0,1fr)_190px_auto] md:items-end"><div><p className="text-xs font-bold text-muted-foreground">Order</p><p className="mt-2 text-xl font-extrabold text-foreground">{index + 1}</p></div><Select label="Course" {...register(`courses.${index}.course`)} error={errors.courses?.[index]?.course?.message}><option value="">Select course</option>{courses.map((course) => <option key={course._id} value={course._id}>{course.title}</option>)}</Select><Select label="Default level (optional)" {...register(`courses.${index}.defaultLevel`)}><option value="">Use path level</option>{COURSE_LEVELS.map((level) => <option key={level} value={level}>{level[0].toUpperCase() + level.slice(1)}</option>)}</Select><div className="flex flex-wrap gap-1"><Button type="button" variant="ghost" className="h-9 w-9 p-0" disabled={index === 0} onClick={() => courseFields.move(index, index - 1)} aria-label="Move course up"><ArrowUp size={14} /></Button><Button type="button" variant="ghost" className="h-9 w-9 p-0" disabled={index === courseFields.fields.length - 1} onClick={() => courseFields.move(index, index + 1)} aria-label="Move course down"><ArrowDown size={14} /></Button><Button type="button" variant="ghost" className="h-9 w-9 p-0 text-error" disabled={courseFields.fields.length <= 1} onClick={() => courseFields.remove(index)} aria-label="Remove course"><Trash2 size={14} /></Button></div><label className="md:col-start-2 md:col-span-2 flex items-center gap-2 text-xs font-semibold text-muted-foreground"><input type="checkbox" className="h-4 w-4 rounded border-border" {...register(`courses.${index}.required`)} /> Required part of this path</label></div>)}</div>
      </Card>

      <div className="flex justify-end gap-3"><Button type="button" variant="secondary" onClick={() => navigate('/admin/learning-paths')}>Cancel</Button><Button type="submit" isLoading={mutation.isPending} loadingLabel="Saving path...">{editing ? 'Save changes' : 'Create path draft'}</Button></div>
    </form>
  </PageShell>;
}
