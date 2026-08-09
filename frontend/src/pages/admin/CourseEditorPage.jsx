import { useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, useWatch } from 'react-hook-form';
import { ArrowLeft, GraduationCap } from 'lucide-react';
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
import { COURSE_CATEGORIES, COURSE_LEVELS, TECHNOLOGY_TYPES, labelFor } from '../../constants/catalog.js';
import { useAdminCourse, useAdminCourses, useAdminTechnologies, useCreateCourse, useUpdateCourse } from '../../queries/adminQueries.js';
import { courseFormSchema } from '../../validations/admin.schema.js';

const defaults = { title: '', description: '', category: 'fundamentals', technologies: [], primaryTechnology: '', availableLevels: [...COURSE_LEVELS], recommendedPrerequisites: [], featured: false, order: 0 };

function Choice({ registration, value, title, meta }) {
  return <label className="flex cursor-pointer items-start gap-3 rounded-surface border border-transparent px-3 py-2.5 hover:border-border hover:bg-surface-secondary/60"><input type="checkbox" value={value} className="mt-1 h-4 w-4 rounded border-border" {...registration} /><span><span className="block text-sm font-semibold text-foreground">{title}</span>{meta ? <span className="mt-0.5 block text-xs text-muted-foreground">{meta}</span> : null}</span></label>;
}

export default function CourseEditorPage() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const editing = Boolean(courseId);
  const courseQuery = useAdminCourse(courseId);
  const technologiesQuery = useAdminTechnologies({ limit: 100, status: editing ? '' : 'published' });
  const coursesQuery = useAdminCourses({ limit: 100 });
  const createMutation = useCreateCourse();
  const updateMutation = useUpdateCourse();
  const mutation = editing ? updateMutation : createMutation;
  const { register, control, handleSubmit, reset, setValue, formState: { errors } } = useForm({ resolver: zodResolver(courseFormSchema), defaultValues: defaults });
  const selectedTechnologies = useWatch({ control, name: 'technologies' }) || [];

  useEffect(() => {
    const course = courseQuery.data?.course;
    if (!course) return;
    reset({
      title: course.title || '', description: course.description || '', category: course.category || 'fundamentals',
      technologies: (course.technologies || []).map((item) => item._id), primaryTechnology: course.primaryTechnology?._id || '',
      availableLevels: course.availableLevels || [...COURSE_LEVELS], recommendedPrerequisites: (course.recommendedPrerequisites || []).map((item) => item._id),
      featured: Boolean(course.featured), order: course.order || 0
    });
  }, [courseQuery.data?.course?._id, reset]);

  useEffect(() => {
    const primary = courseQuery.data?.course?.primaryTechnology?._id;
    const current = primary || '';
    if (current && !selectedTechnologies.includes(current)) setValue('primaryTechnology', '');
  }, [selectedTechnologies, courseQuery.data?.course?.primaryTechnology?._id, setValue]);

  if ((editing && courseQuery.isLoading) || technologiesQuery.isLoading || coursesQuery.isLoading) return <Loader label="Loading course editor..." />;
  if (editing && courseQuery.error) return <EmptyState title="Course is unavailable" description={courseQuery.error.message} actionLabel="Back to courses" onAction={() => navigate('/admin/courses')} />;

  const technologies = (technologiesQuery.data?.technologies || []).filter((item) => item.status !== 'archived');
  const prerequisites = (coursesQuery.data?.courses || []).filter((item) => item._id !== courseId && item.status !== 'archived');
  const selectedTechnologyDocs = technologies.filter((item) => selectedTechnologies.includes(item._id));

  const submit = (values) => {
    const payload = { ...values, primaryTechnology: values.primaryTechnology || null, order: Number(values.order) || 0 };
    const options = { onSuccess: () => navigate('/admin/courses') };
    if (editing) updateMutation.mutate({ id: courseId, payload }, options);
    else createMutation.mutate(payload, options);
  };

  return <PageShell className="space-y-5 pb-8">
    <PageHeader eyebrow="Learning catalog" eyebrowIcon={GraduationCap} title={editing ? 'Edit course' : 'Create course'} description="A course is an independently learnable unit. Add every technology the course uses; this does not force learners to study those technologies first." actions={<Link to="/admin/courses" className="ui-button ui-button--secondary gap-2"><ArrowLeft size={16} /> Back</Link>} />
    <ErrorMessage message={mutation.error?.message} />
    <form onSubmit={handleSubmit(submit)} className="space-y-5">
      <Card className="mx-auto w-full max-w-4xl space-y-4 shadow-sm">
        <div className="grid gap-4 md:grid-cols-[1.4fr_0.6fr]"><FormInput label="Course title" registration={register('title')} error={errors.title?.message} placeholder="Example: React Developer" /><Select label="Category" {...register('category')} error={errors.category?.message}>{COURSE_CATEGORIES.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</Select></div>
        <FormTextarea label="Description" rows={4} registration={register('description')} error={errors.description?.message} placeholder="What will a learner be able to do after this course?" />
        <div className="grid gap-4 md:grid-cols-2"><Select label="Primary technology" {...register('primaryTechnology')} error={errors.primaryTechnology?.message}><option value="">No primary technology</option>{selectedTechnologyDocs.map((item) => <option key={item._id} value={item._id}>{item.name}</option>)}</Select><FormInput label="Display order" type="number" min="0" registration={register('order')} error={errors.order?.message} /></div>
        <label className="flex items-center gap-3 rounded-surface border border-border p-3 text-sm font-semibold text-foreground"><input type="checkbox" className="h-4 w-4 rounded border-border" {...register('featured')} /> Feature this course in learner discovery</label>
      </Card>

      <div className="grid gap-5 xl:grid-cols-2">
        <Card className="min-w-0 shadow-sm"><h2 className="text-lg font-bold text-foreground">Technologies used</h2><p className="mt-1 text-sm text-muted-foreground">Select all languages, frameworks, runtimes, databases, and tools represented by this course.</p>{errors.technologies?.message ? <p className="mt-2 text-sm font-semibold text-error">{errors.technologies.message}</p> : null}<div className="mt-4 max-h-80 overflow-y-auto">{technologies.map((item) => <Choice key={item._id} registration={register('technologies')} value={item._id} title={item.name} meta={labelFor(TECHNOLOGY_TYPES, item.type)} />)}</div></Card>
        <Card className="min-w-0 shadow-sm"><h2 className="text-lg font-bold text-foreground">Learner levels</h2><p className="mt-1 text-sm text-muted-foreground">Only enabled levels can have course templates and learner enrollments.</p>{errors.availableLevels?.message ? <p className="mt-2 text-sm font-semibold text-error">{errors.availableLevels.message}</p> : null}<div className="mt-4">{COURSE_LEVELS.map((level) => <Choice key={level} registration={register('availableLevels')} value={level} title={level[0].toUpperCase() + level.slice(1)} meta={`Allow ${level} learners to start this course.`} />)}</div></Card>
      </div>

      <Card className="shadow-sm"><h2 className="text-lg font-bold text-foreground">Recommended prerequisites</h2><p className="mt-1 text-sm text-muted-foreground">Optional guidance only. Prerequisites never block direct enrollment.</p><div className="mt-4 grid gap-1 md:grid-cols-2">{prerequisites.length ? prerequisites.map((item) => <Choice key={item._id} registration={register('recommendedPrerequisites')} value={item._id} title={item.title} meta={labelFor(COURSE_CATEGORIES, item.category)} />) : <p className="text-sm text-muted-foreground">No other courses are available yet.</p>}</div></Card>

      <div className="flex justify-end gap-3"><Button type="button" variant="secondary" onClick={() => navigate('/admin/courses')}>Cancel</Button><Button type="submit" isLoading={mutation.isPending} loadingLabel="Saving course...">{editing ? 'Save changes' : 'Create course draft'}</Button></div>
    </form>
  </PageShell>;
}
