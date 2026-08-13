import { useEffect, useState } from 'react';
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
import { adminApi } from '../../api/adminApi.js';
import { courseFormSchema } from '../../validations/admin.schema.js';

const defaults = { title: '', description: '', category: 'fundamentals', technologies: [], primaryTechnology: '', availableLevels: [...COURSE_LEVELS], recommendedPrerequisites: [], featured: false, order: 0 };
function Choice({ registration, value, title, meta }) { return <label className="flex cursor-pointer items-start gap-3 rounded-surface border border-transparent px-3 py-2.5 hover:border-border hover:bg-surface-secondary/60"><input type="checkbox" value={value} className="mt-1 h-4 w-4 rounded border-border" {...registration} /><span><span className="block text-sm font-semibold text-foreground">{title}</span>{meta ? <span className="mt-0.5 block text-xs text-muted-foreground">{meta}</span> : null}</span></label>; }

export default function CourseEditorPage() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const editing = Boolean(courseId);
  const [course, setCourse] = useState(null);
  const [technologies, setTechnologies] = useState([]);
  const [courses, setCourses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [saveError, setSaveError] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const { register, control, handleSubmit, reset, setValue, formState: { errors } } = useForm({ resolver: zodResolver(courseFormSchema), defaultValues: defaults });
  const selectedTechnologies = useWatch({ control, name: 'technologies' }) || [];

  useEffect(() => {
    let active = true;
    setIsLoading(true); setLoadError(null);
    const requests = [adminApi.technologies({ limit: 100, status: editing ? '' : 'published' }), adminApi.courses({ limit: 100 })];
    if (editing) requests.push(adminApi.course(courseId));
    Promise.all(requests).then(([technologyResult, courseListResult, courseResult]) => {
      if (!active) return;
      setTechnologies((technologyResult?.technologies || []).filter((item) => item.status !== 'archived'));
      setCourses(courseListResult?.courses || []);
      if (editing) setCourse(courseResult?.course || null);
    }).catch((requestError) => { if (active) setLoadError(requestError); }).finally(() => { if (active) setIsLoading(false); });
    return () => { active = false; };
  }, [editing, courseId]);

  useEffect(() => {
    if (!course) return;
    reset({ title: course.title || '', description: course.description || '', category: course.category || 'fundamentals', technologies: (course.technologies || []).map((item) => item._id), primaryTechnology: course.primaryTechnology?._id || '', availableLevels: course.availableLevels || [...COURSE_LEVELS], recommendedPrerequisites: (course.recommendedPrerequisites || []).map((item) => item._id), featured: Boolean(course.featured), order: course.order || 0 });
  }, [course, reset]);

  useEffect(() => {
    const primary = course?.primaryTechnology?._id || '';
    if (primary && !selectedTechnologies.includes(primary)) setValue('primaryTechnology', '');
  }, [selectedTechnologies, course, setValue]);

  if (isLoading) return <Loader label="Loading course editor..." />;
  if (editing && loadError) return <EmptyState title="Course is unavailable" description={loadError.message} actionLabel="Back to courses" onAction={() => navigate('/admin/courses')} />;
  const prerequisites = courses.filter((item) => item._id !== courseId && item.status !== 'archived');
  const selectedTechnologyDocs = technologies.filter((item) => selectedTechnologies.includes(item._id));

  const submit = async (values) => {
    setIsSaving(true); setSaveError(null);
    const payload = { ...values, primaryTechnology: values.primaryTechnology || null, order: Number(values.order) || 0 };
    try { if (editing) await adminApi.updateCourse({ id: courseId, payload }); else await adminApi.createCourse(payload); navigate('/admin/courses'); }
    catch (requestError) { setSaveError(requestError); }
    finally { setIsSaving(false); }
  };

  return <PageShell className="space-y-5 pb-8">
    <PageHeader eyebrow="Learning catalog" eyebrowIcon={GraduationCap} title={editing ? 'Edit course' : 'Create course'} description="A course is an independently learnable unit." actions={<Link to="/admin/courses" className="ui-button ui-button--secondary gap-2"><ArrowLeft size={16} /> Back</Link>} />
    <ErrorMessage message={(saveError || (!editing && loadError))?.message} />
    <form onSubmit={handleSubmit(submit)} className="space-y-5">
      <Card className="mx-auto w-full max-w-4xl space-y-4"><div className="grid gap-4 md:grid-cols-[1.4fr_0.6fr]"><FormInput label="Course title" registration={register('title')} error={errors.title?.message} /><Select label="Category" {...register('category')} error={errors.category?.message}>{COURSE_CATEGORIES.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</Select></div><FormTextarea label="Description" rows={4} registration={register('description')} error={errors.description?.message} /><div className="grid gap-4 md:grid-cols-2"><Select label="Primary technology" {...register('primaryTechnology')} error={errors.primaryTechnology?.message}><option value="">No primary technology</option>{selectedTechnologyDocs.map((item) => <option key={item._id} value={item._id}>{item.name}</option>)}</Select><FormInput label="Display order" type="number" min="0" registration={register('order')} error={errors.order?.message} /></div><label className="flex items-center gap-3 rounded-surface border border-border p-3 text-sm font-semibold"><input type="checkbox" className="h-4 w-4" {...register('featured')} /> Feature this course in learner discovery</label></Card>
      <div className="grid gap-5 xl:grid-cols-2"><Card><h2 className="text-lg font-bold">Technologies used</h2><div className="mt-4 max-h-80 overflow-y-auto">{technologies.map((item) => <Choice key={item._id} registration={register('technologies')} value={item._id} title={item.name} meta={labelFor(TECHNOLOGY_TYPES, item.type)} />)}</div></Card><Card><h2 className="text-lg font-bold">Learner levels</h2><div className="mt-4">{COURSE_LEVELS.map((level) => <Choice key={level} registration={register('availableLevels')} value={level} title={level[0].toUpperCase() + level.slice(1)} />)}</div></Card></div>
      <Card><h2 className="text-lg font-bold">Recommended prerequisites</h2><div className="mt-4 grid gap-1 md:grid-cols-2">{prerequisites.map((item) => <Choice key={item._id} registration={register('recommendedPrerequisites')} value={item._id} title={item.title} meta={labelFor(COURSE_CATEGORIES, item.category)} />)}</div></Card>
      <div className="flex justify-end gap-3"><Button type="button" variant="secondary" onClick={() => navigate('/admin/courses')}>Cancel</Button><Button type="submit" isLoading={isSaving} loadingLabel="Saving course...">{editing ? 'Save changes' : 'Create course draft'}</Button></div>
    </form>
  </PageShell>;
}
