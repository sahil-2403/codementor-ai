import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, useWatch } from 'react-hook-form';
import { ArrowLeft, FileQuestion } from 'lucide-react';
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
import { parseQuestionForm, questionFormSchema } from '../../validations/admin.schema.js';

const defaults = { course: '', question: '', type: 'mcq', codeSnippet: '', optionsText: '', correctAnswer: '', explanation: '', topic: '', difficulty: 'beginner', relatedLesson: '', tagsText: '' };
const bankMeta = { quiz: { title: 'Quiz question', path: 'quiz', helper: 'Quiz questions belong to one Course, Topic, and optionally a related Lesson while drafting.' }, skill_check: { title: 'Skill check', path: 'skill-checks', helper: 'Skill checks are Course-specific diagnostic questions for Intermediate and Advanced learners.' } };

export default function CourseQuestionEditorPage({ bank = 'quiz' }) {
  const { questionId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const editing = Boolean(questionId);
  const meta = bankMeta[bank];
  const [question, setQuestion] = useState(null);
  const [courses, setCourses] = useState([]);
  const [topics, setTopics] = useState([]);
  const [lessons, setLessons] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [relatedLoading, setRelatedLoading] = useState(false);
  const [loadError, setLoadError] = useState(null);
  const [saveError, setSaveError] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const { register, control, handleSubmit, reset, setValue, formState: { errors } } = useForm({ resolver: zodResolver(questionFormSchema), defaultValues: { ...defaults, course: searchParams.get('course') || '', difficulty: bank === 'skill_check' ? 'intermediate' : 'beginner' } });
  const courseId = useWatch({ control, name: 'course' }) || '';
  const topicId = useWatch({ control, name: 'topic' }) || '';
  const questionType = useWatch({ control, name: 'type' }) || 'mcq';

  useEffect(() => {
    let active = true;
    setIsLoading(true); setLoadError(null);
    const requests = [adminApi.courses({ limit: 100 })];
    if (editing) requests.push(adminApi.question(questionId));
    Promise.all(requests).then(([courseResult, questionResult]) => {
      if (!active) return;
      setCourses((courseResult?.courses || []).filter((course) => course.status !== 'archived'));
      if (editing) setQuestion(questionResult?.question || null);
    }).catch((requestError) => { if (active) setLoadError(requestError); }).finally(() => { if (active) setIsLoading(false); });
    return () => { active = false; };
  }, [editing, questionId]);

  useEffect(() => {
    if (!question || question.bank !== bank) return;
    reset({ course: question.course?._id || question.course || '', question: question.question || '', type: question.type || 'mcq', codeSnippet: question.codeSnippet || '', optionsText: (question.options || []).join(', '), correctAnswer: question.correctAnswer || '', explanation: question.explanation || '', topic: question.topic?._id || question.topic || '', difficulty: question.difficulty || (bank === 'skill_check' ? 'intermediate' : 'beginner'), relatedLesson: question.relatedLesson?._id || question.relatedLesson || '', tagsText: (question.tags || []).join(', ') });
  }, [question, bank, reset]);

  useEffect(() => {
    let active = true;
    if (!courseId) { setTopics([]); setLessons([]); return undefined; }
    setRelatedLoading(true); setLoadError(null);
    adminApi.topics({ limit: 100, course: courseId }).then((result) => {
      if (!active) return;
      const items = (result?.topics || []).filter((topic) => topic.status === 'active');
      setTopics(items);
      if (!editing && topicId && !items.some((topic) => topic._id === topicId)) { setValue('topic', ''); setValue('relatedLesson', ''); }
    }).catch((requestError) => { if (active) setLoadError(requestError); }).finally(() => { if (active) setRelatedLoading(false); });
    return () => { active = false; };
  }, [courseId, editing, topicId, setValue]);

  useEffect(() => {
    let active = true;
    if (bank !== 'quiz' || !courseId || !topicId) { setLessons([]); return undefined; }
    setRelatedLoading(true);
    adminApi.lessons({ limit: 100, course: courseId, topic: topicId, status: '' }).then((result) => { if (active) setLessons((result?.lessons || []).filter((lesson) => lesson.status !== 'archived')); }).catch((requestError) => { if (active) setLoadError(requestError); }).finally(() => { if (active) setRelatedLoading(false); });
    return () => { active = false; };
  }, [bank, courseId, topicId]);

  if (isLoading || relatedLoading) return <Loader label="Loading question editor..." />;
  if (editing && loadError) return <EmptyState title="Question is unavailable" description={loadError.message} actionLabel={`Back to ${meta.path}`} onAction={() => navigate(`/admin/questions/${meta.path}`)} />;
  if (editing && question?.bank !== bank) return <EmptyState title="Question bank mismatch" description="This question belongs to a different question bank." actionLabel="Back to questions" onAction={() => navigate('/admin/questions')} />;
  const selectedCourse = courses.find((course) => course._id === courseId) || question?.course;

  const submit = async (values) => {
    const payload = parseQuestionForm(values, bank);
    setIsSaving(true); setSaveError(null);
    try { if (editing) await adminApi.updateQuestion({ id: questionId, payload }); else await adminApi.createQuestion(payload); navigate(`/admin/questions/${meta.path}?course=${values.course}`); }
    catch (requestError) { setSaveError(requestError); }
    finally { setIsSaving(false); }
  };

  return <PageShell className="space-y-5 pb-8"><PageHeader eyebrow="Course assessments" eyebrowIcon={FileQuestion} title={editing ? `Edit ${meta.title.toLowerCase()}` : `Create ${meta.title.toLowerCase()}`} description={meta.helper} actions={<Link to={courseId ? `/admin/questions/${meta.path}?course=${courseId}` : `/admin/questions/${meta.path}`} className="ui-button ui-button--secondary gap-2"><ArrowLeft size={16} /> Back</Link>} /><ErrorMessage message={(saveError || (!editing && loadError))?.message} /><form onSubmit={handleSubmit(submit)} className="space-y-5"><Card className="mx-auto w-full max-w-4xl space-y-4"><div className="grid gap-4 md:grid-cols-2">{editing ? <><input type="hidden" {...register('course')} /><Select label="Course" value={courseId} disabled><option value={courseId}>{selectedCourse?.title || 'Selected course'}</option></Select></> : <Select label="Course" {...register('course')} error={errors.course?.message}><option value="">Select course</option>{courses.map((course) => <option key={course._id} value={course._id}>{course.title}</option>)}</Select>}<Select label="Topic" disabled={!courseId} {...register('topic')} error={errors.topic?.message}><option value="">Select topic</option>{topics.map((topic) => <option key={topic._id} value={topic._id}>{topic.title}</option>)}</Select></div><FormTextarea label="Question" rows={3} registration={register('question')} error={errors.question?.message} /><div className="grid gap-4 md:grid-cols-2"><Select label="Question type" {...register('type')} error={errors.type?.message}><option value="mcq">Multiple choice</option><option value="code_output">Code output</option><option value="short_answer">Short answer (draft only)</option></Select><Select label="Difficulty" {...register('difficulty')} error={errors.difficulty?.message}>{bank === 'quiz' ? <option value="beginner">Beginner</option> : null}<option value="intermediate">Intermediate</option><option value="advanced">Advanced</option></Select></div>{questionType === 'code_output' ? <FormTextarea label="Code snippet" rows={7} registration={register('codeSnippet')} error={errors.codeSnippet?.message} /> : null}{questionType !== 'short_answer' ? <FormInput label="Answer options" registration={register('optionsText')} error={errors.optionsText?.message} /> : null}<FormInput label="Correct answer" registration={register('correctAnswer')} error={errors.correctAnswer?.message} /><FormTextarea label="Explanation" rows={4} registration={register('explanation')} error={errors.explanation?.message} />{bank === 'quiz' ? <Select label="Related lesson" disabled={!topicId} {...register('relatedLesson')} error={errors.relatedLesson?.message}><option value="">No related lesson yet (draft only)</option>{lessons.map((lesson) => <option key={lesson._id} value={lesson._id}>{lesson.title}{lesson.status !== 'published' ? ' — draft' : ''}</option>)}</Select> : <div className="rounded-surface border border-primary/15 bg-primary-soft/35 p-3 text-sm text-muted-foreground">Skill checks are not linked to Lessons.</div>}<FormInput label="Tags" registration={register('tagsText')} error={errors.tagsText?.message} /></Card><div className="flex justify-end gap-3"><Button type="button" variant="secondary" onClick={() => navigate(courseId ? `/admin/questions/${meta.path}?course=${courseId}` : `/admin/questions/${meta.path}`)}>Cancel</Button><Button type="submit" isLoading={isSaving} loadingLabel="Saving question...">{editing ? 'Save changes' : 'Create question draft'}</Button></div></form></PageShell>;
}
