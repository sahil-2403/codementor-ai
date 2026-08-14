import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, useWatch } from 'react-hook-form';
import { ArrowLeft, MessageSquareText } from 'lucide-react';
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
import { interviewQuestionFormSchema, parseInterviewQuestionForm } from '../../validations/admin.schema.js';

const defaults = { course: '', question: '', topicRef: '', type: 'concept', difficulty: 'beginner', expectedAnswer: '', answerChecklistText: '', tagsText: '' };

export default function CourseInterviewQuestionEditorPage() {
  const { questionId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const editing = Boolean(questionId);
  const [question, setQuestion] = useState(null);
  const [courses, setCourses] = useState([]);
  const [topics, setTopics] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [topicsLoading, setTopicsLoading] = useState(false);
  const [loadError, setLoadError] = useState(null);
  const [saveError, setSaveError] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const { register, control, handleSubmit, reset, setValue, formState: { errors } } = useForm({ resolver: zodResolver(interviewQuestionFormSchema), defaultValues: { ...defaults, course: searchParams.get('course') || '' } });
  const courseId = useWatch({ control, name: 'course' }) || '';
  const topicRef = useWatch({ control, name: 'topicRef' }) || '';

  useEffect(() => {
    let active = true;
    setIsLoading(true);
    setLoadError(null);
    const requests = [adminApi.courses({ limit: 100 })];
    if (editing) requests.push(adminApi.interviewQuestion(questionId));
    Promise.all(requests)
      .then(([courseResult, questionResult]) => {
        if (!active) return;
        setCourses((courseResult?.courses || []).filter((course) => course.status !== 'archived'));
        if (editing) setQuestion(questionResult?.interviewQuestion || null);
      })
      .catch((requestError) => { if (active) setLoadError(requestError); })
      .finally(() => { if (active) setIsLoading(false); });
    return () => { active = false; };
  }, [editing, questionId]);

  useEffect(() => {
    if (!question) return;
    reset({ course: question.course?._id || question.course || '', question: question.question || '', topicRef: question.topicRef?._id || question.topicRef || '', type: question.type || 'concept', difficulty: question.difficulty || 'beginner', expectedAnswer: question.expectedAnswer || '', answerChecklistText: (question.answerChecklist || []).join(', '), tagsText: (question.tags || []).join(', ') });
  }, [question, reset]);

  useEffect(() => {
    let active = true;
    if (!courseId) { setTopics([]); return undefined; }
    setTopicsLoading(true);
    adminApi.topics({ limit: 100, course: courseId })
      .then((result) => {
        if (!active) return;
        const items = (result?.topics || []).filter((topic) => topic.status === 'active');
        setTopics(items);
        if (!editing && topicRef && !items.some((topic) => topic._id === topicRef)) setValue('topicRef', '');
      })
      .catch((requestError) => { if (active) setLoadError(requestError); })
      .finally(() => { if (active) setTopicsLoading(false); });
    return () => { active = false; };
  }, [courseId, editing, topicRef, setValue]);

  if (isLoading) return <Loader label="Loading interview question editor..." />;
  if (editing && loadError) return <EmptyState title="Interview question is unavailable" description={loadError.message} actionLabel="Back to interview questions" onAction={() => navigate('/admin/questions/interview')} />;
  const selectedCourse = courses.find((course) => course._id === courseId) || question?.course;

  const submit = async (values) => {
    const payload = parseInterviewQuestionForm(values);
    setIsSaving(true);
    setSaveError(null);
    try {
      if (editing) await adminApi.updateInterviewQuestion({ id: questionId, payload });
      else await adminApi.createInterviewQuestion(payload);
      navigate(`/admin/questions/interview?course=${values.course}`);
    } catch (requestError) {
      setSaveError(requestError);
    } finally {
      setIsSaving(false);
    }
  };

  return <PageShell className="space-y-5 pb-8">
    <PageHeader eyebrow="Course interview practice" eyebrowIcon={MessageSquareText} title={editing ? 'Edit interview question' : 'Create interview question'} description="Interview questions belong to one Course and one active Course Topic." actions={<Link to={courseId ? `/admin/questions/interview?course=${courseId}` : '/admin/questions/interview'} className="ui-button ui-button--secondary gap-2"><ArrowLeft size={16} /> Back</Link>} />
    <ErrorMessage message={(saveError || (!editing && loadError))?.message} />
    <form onSubmit={handleSubmit(submit)} className="space-y-5">
      <Card className="mx-auto w-full max-w-4xl space-y-4 shadow-sm"><div className="grid gap-4 md:grid-cols-2">{editing ? <><input type="hidden" {...register('course')} /><Select label="Course" value={courseId} disabled><option value={courseId}>{selectedCourse?.title || 'Selected course'}</option></Select></> : <Select label="Course" {...register('course')} error={errors.course?.message}><option value="">Select course</option>{courses.map((course) => <option key={course._id} value={course._id}>{course.title}</option>)}</Select>}<Select label="Topic" disabled={!courseId || topicsLoading} {...register('topicRef')} error={errors.topicRef?.message}><option value="">{topicsLoading ? 'Loading topics...' : 'Select topic'}</option>{topics.map((topic) => <option key={topic._id} value={topic._id}>{topic.title}</option>)}</Select></div><FormTextarea label="Interview question" rows={3} registration={register('question')} error={errors.question?.message} /><div className="grid gap-4 md:grid-cols-2"><Select label="Question type" {...register('type')} error={errors.type?.message}><option value="definition">Definition</option><option value="concept">Concept</option><option value="output">Output</option><option value="scenario">Scenario</option><option value="debugging">Debugging</option><option value="system_design_lite">System design lite</option></Select><Select label="Difficulty" {...register('difficulty')} error={errors.difficulty?.message}><option value="beginner">Beginner</option><option value="intermediate">Intermediate</option><option value="advanced">Advanced</option></Select></div><FormTextarea label="Expected answer" rows={7} registration={register('expectedAnswer')} error={errors.expectedAnswer?.message} /><FormInput label="Answer review points" registration={register('answerChecklistText')} error={errors.answerChecklistText?.message} /><FormInput label="Tags" registration={register('tagsText')} error={errors.tagsText?.message} /></Card>
      <div className="flex justify-end gap-3"><Button type="button" variant="secondary" onClick={() => navigate(courseId ? `/admin/questions/interview?course=${courseId}` : '/admin/questions/interview')}>Cancel</Button><Button type="submit" isLoading={isSaving} loadingLabel="Saving question...">{editing ? 'Save changes' : 'Create interview question draft'}</Button></div>
    </form>
  </PageShell>;
}
