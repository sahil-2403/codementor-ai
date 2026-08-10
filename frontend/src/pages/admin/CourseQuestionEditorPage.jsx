import { useEffect } from 'react';
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
import {
  useAdminCourses,
  useAdminLessons,
  useAdminQuestion,
  useAdminTopics,
  useCreateQuestion,
  useUpdateQuestion
} from '../../queries/adminQueries.js';
import { parseQuestionForm, questionFormSchema } from '../../validations/admin.schema.js';

const defaults = {
  course: '', question: '', type: 'mcq', codeSnippet: '', optionsText: '', correctAnswer: '', explanation: '',
  topic: '', difficulty: 'beginner', relatedLesson: '', tagsText: ''
};

const bankMeta = {
  quiz: { title: 'Quiz question', path: 'quiz', helper: 'Quiz questions belong to one Course, Topic, and optionally a related Lesson while drafting. Publishing requires a published related Lesson.' },
  skill_check: { title: 'Skill check', path: 'skill-checks', helper: 'Skill checks are Course-specific diagnostic questions for Intermediate and Advanced learners and never link to a Lesson.' }
};

export default function CourseQuestionEditorPage({ bank = 'quiz' }) {
  const { questionId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const editing = Boolean(questionId);
  const meta = bankMeta[bank];
  const questionQuery = useAdminQuestion(questionId);
  const coursesQuery = useAdminCourses({ limit: 100 });
  const createMutation = useCreateQuestion();
  const updateMutation = useUpdateQuestion();
  const mutation = editing ? updateMutation : createMutation;

  const { register, control, handleSubmit, reset, setValue, formState: { errors } } = useForm({
    resolver: zodResolver(questionFormSchema),
    defaultValues: { ...defaults, course: searchParams.get('course') || '', difficulty: bank === 'skill_check' ? 'intermediate' : 'beginner' }
  });

  const courseId = useWatch({ control, name: 'course' }) || '';
  const topicId = useWatch({ control, name: 'topic' }) || '';
  const questionType = useWatch({ control, name: 'type' }) || 'mcq';
  const topicsQuery = useAdminTopics({ limit: 100, course: courseId }, Boolean(courseId));
  const lessonsQuery = useAdminLessons(
    { limit: 100, course: courseId, topic: topicId, status: '' },
    bank === 'quiz' && Boolean(courseId) && Boolean(topicId)
  );

  useEffect(() => {
    const question = questionQuery.data?.question;
    if (!question || question.bank !== bank) return;
    reset({
      course: question.course?._id || question.course || '', question: question.question || '', type: question.type || 'mcq',
      codeSnippet: question.codeSnippet || '', optionsText: (question.options || []).join(', '), correctAnswer: question.correctAnswer || '',
      explanation: question.explanation || '', topic: question.topic?._id || question.topic || '',
      difficulty: question.difficulty || (bank === 'skill_check' ? 'intermediate' : 'beginner'),
      relatedLesson: question.relatedLesson?._id || question.relatedLesson || '', tagsText: (question.tags || []).join(', ')
    });
  }, [questionQuery.data?.question?._id, bank, reset]);

  useEffect(() => {
    if (editing) return;
    const topics = topicsQuery.data?.topics || [];
    if (topicId && !topics.some((topic) => topic._id === topicId)) {
      setValue('topic', '');
      setValue('relatedLesson', '');
    }
  }, [courseId, editing, topicId, topicsQuery.data?.topics, setValue]);

  if ((editing && questionQuery.isLoading) || coursesQuery.isLoading || topicsQuery.isLoading || (bank === 'quiz' && lessonsQuery.isLoading)) {
    return <Loader label="Loading question editor..." />;
  }
  if (editing && questionQuery.error) return <EmptyState title="Question is unavailable" description={questionQuery.error.message} actionLabel={`Back to ${meta.path}`} onAction={() => navigate(`/admin/questions/${meta.path}`)} />;
  if (editing && questionQuery.data?.question?.bank !== bank) return <EmptyState title="Question bank mismatch" description="This question belongs to a different question bank." actionLabel="Back to questions" onAction={() => navigate('/admin/questions')} />;

  const courses = (coursesQuery.data?.courses || []).filter((course) => course.status !== 'archived');
  const topics = (topicsQuery.data?.topics || []).filter((topic) => topic.status === 'active');
  const lessons = (lessonsQuery.data?.lessons || []).filter((lesson) => lesson.status !== 'archived');
  const selectedCourse = courses.find((course) => course._id === courseId) || questionQuery.data?.question?.course;

  const submit = (values) => {
    const payload = parseQuestionForm(values, bank);
    const options = { onSuccess: () => navigate(`/admin/questions/${meta.path}?course=${values.course}`) };
    if (editing) updateMutation.mutate({ id: questionId, payload }, options);
    else createMutation.mutate(payload, options);
  };

  return <PageShell className="space-y-5 pb-8">
    <PageHeader eyebrow="Course assessments" eyebrowIcon={FileQuestion} title={editing ? `Edit ${meta.title.toLowerCase()}` : `Create ${meta.title.toLowerCase()}`} description={meta.helper} actions={<Link to={courseId ? `/admin/questions/${meta.path}?course=${courseId}` : `/admin/questions/${meta.path}`} className="ui-button ui-button--secondary gap-2"><ArrowLeft size={16} /> Back</Link>} />
    <ErrorMessage message={mutation.error?.message || topicsQuery.error?.message || lessonsQuery.error?.message || coursesQuery.error?.message} />

    <form onSubmit={handleSubmit(submit)} className="space-y-5">
      <Card className="mx-auto w-full max-w-4xl space-y-4 shadow-sm">
        <div className="grid gap-4 md:grid-cols-2">
          {editing ? <><input type="hidden" {...register('course')} /><Select label="Course" value={courseId} disabled><option value={courseId}>{selectedCourse?.title || 'Selected course'}</option></Select></> : <Select label="Course" {...register('course')} error={errors.course?.message}><option value="">Select course</option>{courses.map((course) => <option key={course._id} value={course._id}>{course.title}</option>)}</Select>}
          <Select label="Topic" disabled={!courseId} {...register('topic')} error={errors.topic?.message}><option value="">Select topic</option>{topics.map((topic) => <option key={topic._id} value={topic._id}>{topic.title}</option>)}</Select>
        </div>
        {editing ? <p className="text-xs text-muted-foreground">Course ownership is fixed after creation. Topic changes are limited to the same Course.</p> : null}

        <FormTextarea label="Question" rows={3} registration={register('question')} error={errors.question?.message} placeholder={`Write the ${meta.title.toLowerCase()}...`} />
        <div className="grid gap-4 md:grid-cols-2">
          <Select label="Question type" {...register('type')} error={errors.type?.message}><option value="mcq">Multiple choice</option><option value="code_output">Code output</option><option value="short_answer">Short answer (draft only)</option></Select>
          <Select label="Difficulty" {...register('difficulty')} error={errors.difficulty?.message}>{bank === 'quiz' ? <option value="beginner">Beginner</option> : null}<option value="intermediate">Intermediate</option><option value="advanced">Advanced</option></Select>
        </div>
        {questionType === 'code_output' ? <FormTextarea label="Code snippet" rows={7} registration={register('codeSnippet')} error={errors.codeSnippet?.message} placeholder="Paste the code the learner should evaluate..." /> : null}
        {questionType !== 'short_answer' ? <FormInput label="Answer options" registration={register('optionsText')} error={errors.optionsText?.message} placeholder="Option A, Option B, Option C" /> : null}
        <FormInput label="Correct answer" registration={register('correctAnswer')} error={errors.correctAnswer?.message} placeholder="Must exactly match an option for MCQ" />
        <FormTextarea label="Explanation" rows={4} registration={register('explanation')} error={errors.explanation?.message} placeholder="Explain why the answer is correct..." />
        {bank === 'quiz' ? <Select label="Related lesson" disabled={!topicId} {...register('relatedLesson')} error={errors.relatedLesson?.message}><option value="">No related lesson yet (draft only)</option>{lessons.map((lesson) => <option key={lesson._id} value={lesson._id}>{lesson.title}{lesson.status !== 'published' ? ' — draft' : ''}</option>)}</Select> : <div className="rounded-surface border border-primary/15 bg-primary-soft/35 p-3 text-sm leading-6 text-muted-foreground">Skill checks are intentionally not linked to Lessons. They assess the learner's current Course knowledge before roadmap generation.</div>}
        <FormInput label="Tags" registration={register('tagsText')} error={errors.tagsText?.message} placeholder={selectedCourse ? `${selectedCourse.slug || 'course'}, fundamentals, async` : 'course-tag, topic-tag'} />
        <p className="-mt-2 text-xs text-muted-foreground">Comma-separated tags. Quiz templates use published Quiz-bank tags for module coverage.</p>
      </Card>
      <div className="flex justify-end gap-3"><Button type="button" variant="secondary" onClick={() => navigate(courseId ? `/admin/questions/${meta.path}?course=${courseId}` : `/admin/questions/${meta.path}`)}>Cancel</Button><Button type="submit" isLoading={mutation.isPending} loadingLabel="Saving question...">{editing ? 'Save changes' : 'Create question draft'}</Button></div>
    </form>
  </PageShell>;
}
