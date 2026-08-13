import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { ArrowLeft, Tags } from 'lucide-react';
import Button from '../../components/common/Button.jsx';
import Card from '../../components/common/Card.jsx';
import EmptyState from '../../components/common/EmptyState.jsx';
import ErrorMessage from '../../components/common/ErrorMessage.jsx';
import FormInput from '../../components/form/FormInput.jsx';
import Loader from '../../components/common/Loader.jsx';
import PageHeader from '../../components/common/PageHeader.jsx';
import PageShell from '../../components/common/PageShell.jsx';
import Select from '../../components/common/Select.jsx';
import { adminApi } from '../../api/adminApi.js';
import { topicFormSchema } from '../../validations/admin.schema.js';

const defaults = { course: '', title: '', category: '', difficulty: 'beginner', tagsText: '', order: 0 };

export default function CourseTopicEditorPage() {
  const { topicId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const editing = Boolean(topicId);
  const [topic, setTopic] = useState(null);
  const [courses, setCourses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [saveError, setSaveError] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [courseLocked, setCourseLocked] = useState(editing);
  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm({ resolver: zodResolver(topicFormSchema), defaultValues: { ...defaults, course: searchParams.get('course') || '' } });
  const courseId = watch('course');

  useEffect(() => {
    let active = true;
    setIsLoading(true);
    setLoadError(null);
    const requests = [adminApi.courses({ limit: 100 })];
    if (editing) requests.push(adminApi.topic(topicId));
    Promise.all(requests)
      .then(([courseResult, topicResult]) => {
        if (!active) return;
        setCourses((courseResult?.courses || []).filter((course) => course.status !== 'archived'));
        if (editing) setTopic(topicResult?.topic || null);
      })
      .catch((requestError) => { if (active) setLoadError(requestError); })
      .finally(() => { if (active) setIsLoading(false); });
    return () => { active = false; };
  }, [editing, topicId]);

  useEffect(() => {
    if (!topic) return;
    reset({ course: topic.course?._id || topic.course || '', title: topic.title || '', category: topic.category || '', difficulty: topic.difficulty || 'beginner', tagsText: (topic.tags || []).join(', '), order: topic.order || 0 });
    setCourseLocked(true);
  }, [topic, reset]);

  if (isLoading) return <Loader label="Loading topic editor..." />;
  if (editing && loadError) return <EmptyState title="Topic is unavailable" description={loadError.message} actionLabel="Back to topics" onAction={() => navigate('/admin/topics')} />;
  const selectedCourse = courses.find((course) => course._id === courseId);

  const submit = async (values) => {
    const payload = { course: values.course, title: values.title.trim(), category: values.category.trim(), difficulty: values.difficulty, tags: values.tagsText.split(',').map((tag) => tag.trim()).filter(Boolean), order: Number(values.order) || 0 };
    setIsSaving(true);
    setSaveError(null);
    try {
      if (editing) await adminApi.updateTopic({ id: topicId, payload });
      else await adminApi.createTopic(payload);
      navigate(`/admin/topics?course=${values.course}`);
    } catch (requestError) {
      setSaveError(requestError);
    } finally {
      setIsSaving(false);
    }
  };

  return <PageShell className="space-y-5 pb-8">
    <PageHeader eyebrow="Course curriculum" eyebrowIcon={Tags} title={editing ? 'Edit topic' : 'Create topic'} description="A Topic belongs to exactly one Course." actions={<Link to={courseId ? `/admin/topics?course=${courseId}` : '/admin/topics'} className="ui-button ui-button--secondary gap-2"><ArrowLeft size={16} /> Back</Link>} />
    <ErrorMessage message={(saveError || (!editing && loadError))?.message} />
    <form onSubmit={handleSubmit(submit)} className="mx-auto w-full max-w-3xl space-y-5">
      <Card className="space-y-4">{courseLocked ? <><input type="hidden" {...register('course')} /><Select label="Course" value={courseId} disabled><option value={courseId}>{selectedCourse?.title || topic?.course?.title || 'Selected course'}</option></Select></> : <Select label="Course" {...register('course')} error={errors.course?.message}><option value="">Select course</option>{courses.map((course) => <option key={course._id} value={course._id}>{course.title}</option>)}</Select>}<div className="grid gap-4 md:grid-cols-[1.4fr_0.6fr]"><FormInput label="Topic title" registration={register('title')} error={errors.title?.message} /><Select label="Difficulty" {...register('difficulty')} error={errors.difficulty?.message}><option value="beginner">Beginner</option><option value="intermediate">Intermediate</option><option value="advanced">Advanced</option></Select></div><FormInput label="Category" registration={register('category')} error={errors.category?.message} /><FormInput label="Tags" registration={register('tagsText')} error={errors.tagsText?.message} /><FormInput label="Display order" type="number" min="0" registration={register('order')} error={errors.order?.message} /></Card>
      <div className="flex justify-end gap-3"><Button type="button" variant="secondary" onClick={() => navigate(courseId ? `/admin/topics?course=${courseId}` : '/admin/topics')}>Cancel</Button><Button type="submit" isLoading={isSaving} loadingLabel="Saving topic...">{editing ? 'Save changes' : 'Create topic'}</Button></div>
    </form>
  </PageShell>;
}
