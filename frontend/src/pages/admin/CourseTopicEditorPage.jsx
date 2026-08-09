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
import { useAdminCourses, useAdminTopic, useCreateTopic, useUpdateTopic } from '../../queries/adminQueries.js';
import { topicFormSchema } from '../../validations/admin.schema.js';

const defaults = { course: '', title: '', category: '', difficulty: 'beginner', tagsText: '', order: 0 };

export default function CourseTopicEditorPage() {
  const { topicId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const editing = Boolean(topicId);
  const topicQuery = useAdminTopic(topicId);
  const coursesQuery = useAdminCourses({ limit: 100 });
  const createMutation = useCreateTopic();
  const updateMutation = useUpdateTopic();
  const mutation = editing ? updateMutation : createMutation;
  const [courseLocked, setCourseLocked] = useState(editing);
  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm({ resolver: zodResolver(topicFormSchema), defaultValues: { ...defaults, course: searchParams.get('course') || '' } });
  const courseId = watch('course');

  useEffect(() => {
    const topic = topicQuery.data?.topic;
    if (!topic) return;
    reset({ course: topic.course?._id || topic.course || '', title: topic.title || '', category: topic.category || '', difficulty: topic.difficulty || 'beginner', tagsText: (topic.tags || []).join(', '), order: topic.order || 0 });
    setCourseLocked(true);
  }, [topicQuery.data?.topic?._id, reset]);

  if ((editing && topicQuery.isLoading) || coursesQuery.isLoading) return <Loader label="Loading topic editor..." />;
  if (editing && topicQuery.error) return <EmptyState title="Topic is unavailable" description={topicQuery.error.message} actionLabel="Back to topics" onAction={() => navigate('/admin/topics')} />;
  const courses = (coursesQuery.data?.courses || []).filter((course) => course.status !== 'archived');
  const selectedCourse = courses.find((course) => course._id === courseId);

  const submit = (values) => {
    const payload = { course: values.course, title: values.title.trim(), category: values.category.trim(), difficulty: values.difficulty, tags: values.tagsText.split(',').map((tag) => tag.trim()).filter(Boolean), order: Number(values.order) || 0 };
    const options = { onSuccess: () => navigate(`/admin/topics?course=${values.course}`) };
    if (editing) updateMutation.mutate({ id: topicId, payload }, options);
    else createMutation.mutate(payload, options);
  };

  return <PageShell className="space-y-5 pb-8">
    <PageHeader eyebrow="Course curriculum" eyebrowIcon={Tags} title={editing ? 'Edit topic' : 'Create topic'} description="A Topic belongs to exactly one Course. Its lessons and questions inherit that Course context." actions={<Link to={courseId ? `/admin/topics?course=${courseId}` : '/admin/topics'} className="ui-button ui-button--secondary gap-2"><ArrowLeft size={16} /> Back</Link>} />
    <ErrorMessage message={mutation.error?.message} />
    <form onSubmit={handleSubmit(submit)} className="mx-auto w-full max-w-3xl space-y-5">
      <Card className="space-y-4 shadow-sm">
        <Select label="Course" disabled={courseLocked} {...register('course')} error={errors.course?.message}><option value="">Select course</option>{courses.map((course) => <option key={course._id} value={course._id}>{course.title}</option>)}</Select>
        {courseLocked ? <p className="text-xs text-muted-foreground">Course ownership is fixed after creation. Create a new Topic if this content belongs to another Course.</p> : null}
        <div className="grid gap-4 md:grid-cols-[1.4fr_0.6fr]"><FormInput label="Topic title" registration={register('title')} error={errors.title?.message} placeholder="Example: React Components" /><Select label="Difficulty" {...register('difficulty')} error={errors.difficulty?.message}><option value="beginner">Beginner</option><option value="intermediate">Intermediate</option><option value="advanced">Advanced</option></Select></div>
        <FormInput label="Category" registration={register('category')} error={errors.category?.message} placeholder={selectedCourse ? `Example category inside ${selectedCourse.title}` : 'Example: state-management'} />
        <FormInput label="Tags" registration={register('tagsText')} error={errors.tagsText?.message} placeholder="react, components, jsx" />
        <p className="-mt-2 text-xs text-muted-foreground">Comma-separated discovery/search tags.</p>
        <FormInput label="Display order" type="number" min="0" registration={register('order')} error={errors.order?.message} />
      </Card>
      <div className="flex justify-end gap-3"><Button type="button" variant="secondary" onClick={() => navigate(courseId ? `/admin/topics?course=${courseId}` : '/admin/topics')}>Cancel</Button><Button type="submit" isLoading={mutation.isPending} loadingLabel="Saving topic...">{editing ? 'Save changes' : 'Create topic'}</Button></div>
    </form>
  </PageShell>;
}
