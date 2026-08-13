import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, useWatch } from 'react-hook-form';
import { ArrowLeft, BookOpen } from 'lucide-react';
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
import { adminApi } from '../../api/adminApi.js';
import { lessonFormSchema } from '../../validations/admin.schema.js';

const defaults = { course: '', title: '', topic: '', difficulty: 'beginner', theory: '', codeExample: '', codeExplanation: '', commonMistakesText: '', interviewDefinition: '', interviewQuestionsText: '', practiceTask: '', tagsText: '', estimatedMinutes: 45 };
const csv = (value) => String(value || '').split(',').map((item) => item.trim()).filter(Boolean);

export default function CourseLessonEditorPage() {
  const { lessonId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const editing = Boolean(lessonId);
  const [lesson, setLesson] = useState(null);
  const [courses, setCourses] = useState([]);
  const [topics, setTopics] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [topicsLoading, setTopicsLoading] = useState(false);
  const [loadError, setLoadError] = useState(null);
  const [saveError, setSaveError] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const { register, control, handleSubmit, reset, setValue, formState: { errors } } = useForm({ resolver: zodResolver(lessonFormSchema), defaultValues: { ...defaults, course: searchParams.get('course') || '' } });
  const courseId = useWatch({ control, name: 'course' }) || '';
  const topicId = useWatch({ control, name: 'topic' }) || '';

  useEffect(() => {
    let active = true;
    setIsLoading(true); setLoadError(null);
    const requests = [adminApi.courses({ limit: 100 })];
    if (editing) requests.push(adminApi.lesson(lessonId));
    Promise.all(requests).then(([courseResult, lessonResult]) => {
      if (!active) return;
      setCourses((courseResult?.courses || []).filter((course) => course.status !== 'archived'));
      if (editing) setLesson(lessonResult?.lesson || null);
    }).catch((requestError) => { if (active) setLoadError(requestError); }).finally(() => { if (active) setIsLoading(false); });
    return () => { active = false; };
  }, [editing, lessonId]);

  useEffect(() => {
    if (!lesson) return;
    reset({ course: lesson.course?._id || lesson.course || '', title: lesson.title || '', topic: lesson.topic?._id || lesson.topic || '', difficulty: lesson.difficulty || 'beginner', theory: lesson.theory || '', codeExample: lesson.codeExample || '', codeExplanation: lesson.codeExplanation || '', commonMistakesText: (lesson.commonMistakes || []).join(', '), interviewDefinition: lesson.interviewDefinition || '', interviewQuestionsText: '', practiceTask: lesson.practiceTask || '', tagsText: (lesson.tags || []).join(', '), estimatedMinutes: lesson.estimatedMinutes || 45 });
  }, [lesson, reset]);

  useEffect(() => {
    let active = true;
    if (!courseId) { setTopics([]); return undefined; }
    setTopicsLoading(true);
    adminApi.topics({ limit: 100, course: courseId })
      .then((result) => {
        if (!active) return;
        const items = (result?.topics || []).filter((topic) => topic.status === 'active');
        setTopics(items);
        if (!editing && topicId && !items.some((topic) => topic._id === topicId)) setValue('topic', '');
      })
      .catch((requestError) => { if (active) setLoadError(requestError); })
      .finally(() => { if (active) setTopicsLoading(false); });
    return () => { active = false; };
  }, [courseId, editing, topicId, setValue]);

  if (isLoading || topicsLoading) return <Loader label="Loading lesson editor..." />;
  if (editing && loadError) return <EmptyState title="Lesson is unavailable" description={loadError.message} actionLabel="Back to lessons" onAction={() => navigate('/admin/lessons')} />;
  const selectedCourse = courses.find((course) => course._id === courseId) || lesson?.course;

  const submit = async (values) => {
    const payload = { course: values.course, title: values.title.trim(), topic: values.topic, difficulty: values.difficulty, theory: values.theory.trim(), codeExample: values.codeExample || '', codeExplanation: values.codeExplanation || '', commonMistakes: csv(values.commonMistakesText), interviewDefinition: values.interviewDefinition || '', practiceTask: values.practiceTask || '', tags: csv(values.tagsText), estimatedMinutes: Number(values.estimatedMinutes) || 45 };
    setIsSaving(true); setSaveError(null);
    try { if (editing) await adminApi.updateLesson({ id: lessonId, payload }); else await adminApi.createLesson(payload); navigate(`/admin/lessons?course=${values.course}`); }
    catch (requestError) { setSaveError(requestError); }
    finally { setIsSaving(false); }
  };

  return <PageShell className="space-y-5 pb-8">
    <PageHeader eyebrow="Course curriculum" eyebrowIcon={BookOpen} title={editing ? 'Edit lesson' : 'Create lesson'} description="A Lesson belongs to one Course and one active Topic." actions={<Link to={courseId ? `/admin/lessons?course=${courseId}` : '/admin/lessons'} className="ui-button ui-button--secondary gap-2"><ArrowLeft size={16} /> Back</Link>} />
    <ErrorMessage message={(saveError || (!editing && loadError))?.message} />
    <form onSubmit={handleSubmit(submit)} className="space-y-5">
      <Card className="mx-auto w-full max-w-4xl space-y-4"><div className="grid gap-4 md:grid-cols-2">{editing ? <><input type="hidden" {...register('course')} /><Select label="Course" value={courseId} disabled><option value={courseId}>{selectedCourse?.title || 'Selected course'}</option></Select></> : <Select label="Course" {...register('course')} error={errors.course?.message}><option value="">Select course</option>{courses.map((course) => <option key={course._id} value={course._id}>{course.title}</option>)}</Select>}<Select label="Topic" {...register('topic')} error={errors.topic?.message} disabled={!courseId}><option value="">Select topic</option>{topics.map((topic) => <option key={topic._id} value={topic._id}>{topic.title}</option>)}</Select></div><div className="grid gap-4 md:grid-cols-[1.4fr_0.6fr]"><FormInput label="Lesson title" registration={register('title')} error={errors.title?.message} /><Select label="Difficulty" {...register('difficulty')} error={errors.difficulty?.message}><option value="beginner">Beginner</option><option value="intermediate">Intermediate</option><option value="advanced">Advanced</option></Select></div><FormTextarea label="Theory / lesson content" rows={8} registration={register('theory')} error={errors.theory?.message} /></Card>
      <div className="grid gap-5 xl:grid-cols-2"><Card className="space-y-4"><h2 className="text-lg font-bold">Code example</h2><FormTextarea label="Example code" rows={8} registration={register('codeExample')} error={errors.codeExample?.message} /><FormTextarea label="Code explanation" rows={5} registration={register('codeExplanation')} error={errors.codeExplanation?.message} /></Card><Card className="space-y-4"><h2 className="text-lg font-bold">Practice & interview context</h2><FormTextarea label="Interview definition" rows={4} registration={register('interviewDefinition')} error={errors.interviewDefinition?.message} /><FormTextarea label="Practice task" rows={4} registration={register('practiceTask')} error={errors.practiceTask?.message} /><FormInput label="Common mistakes" registration={register('commonMistakesText')} error={errors.commonMistakesText?.message} /></Card></div>
      <Card className="space-y-4"><div className="grid gap-4 md:grid-cols-[1fr_180px]"><FormInput label="Tags" registration={register('tagsText')} error={errors.tagsText?.message} /><FormInput label="Estimated minutes" type="number" min="5" max="300" registration={register('estimatedMinutes')} error={errors.estimatedMinutes?.message} /></div></Card>
      <div className="flex justify-end gap-3"><Button type="button" variant="secondary" onClick={() => navigate(courseId ? `/admin/lessons?course=${courseId}` : '/admin/lessons')}>Cancel</Button><Button type="submit" isLoading={isSaving} loadingLabel="Saving lesson...">{editing ? 'Save changes' : 'Create lesson draft'}</Button></div>
    </form>
  </PageShell>;
}
