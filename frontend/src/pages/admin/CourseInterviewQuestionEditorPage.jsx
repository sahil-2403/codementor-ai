import { useEffect } from 'react';
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
import {
  useAdminCourses,
  useAdminInterviewQuestion,
  useAdminTopics,
  useCreateInterviewQuestion,
  useUpdateInterviewQuestion
} from '../../queries/adminQueries.js';
import { interviewQuestionFormSchema, parseInterviewQuestionForm } from '../../validations/admin.schema.js';

const defaults = {
  course: '',
  question: '',
  topicRef: '',
  type: 'concept',
  difficulty: 'beginner',
  expectedAnswer: '',
  answerChecklistText: '',
  tagsText: ''
};

export default function CourseInterviewQuestionEditorPage() {
  const { questionId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const editing = Boolean(questionId);
  const questionQuery = useAdminInterviewQuestion(questionId);
  const coursesQuery = useAdminCourses({ limit: 100 });
  const createMutation = useCreateInterviewQuestion();
  const updateMutation = useUpdateInterviewQuestion();
  const mutation = editing ? updateMutation : createMutation;

  const {
    register,
    control,
    handleSubmit,
    reset,
    setValue,
    formState: { errors }
  } = useForm({
    resolver: zodResolver(interviewQuestionFormSchema),
    defaultValues: { ...defaults, course: searchParams.get('course') || '' }
  });

  const courseId = useWatch({ control, name: 'course' }) || '';
  const topicRef = useWatch({ control, name: 'topicRef' }) || '';
  const topicsQuery = useAdminTopics({ limit: 100, course: courseId }, Boolean(courseId));

  useEffect(() => {
    const question = questionQuery.data?.interviewQuestion;
    if (!question) return;
    reset({
      course: question.course?._id || question.course || '',
      question: question.question || '',
      topicRef: question.topicRef?._id || question.topicRef || '',
      type: question.type || 'concept',
      difficulty: question.difficulty || 'beginner',
      expectedAnswer: question.expectedAnswer || '',
      answerChecklistText: (question.answerChecklist || []).join(', '),
      tagsText: (question.tags || []).join(', ')
    });
  }, [questionQuery.data?.interviewQuestion?._id, reset]);

  useEffect(() => {
    if (editing) return;
    const topics = topicsQuery.data?.topics || [];
    if (topicRef && !topics.some((topic) => topic._id === topicRef)) setValue('topicRef', '');
  }, [courseId, editing, topicRef, topicsQuery.data?.topics, setValue]);

  if ((editing && questionQuery.isLoading) || coursesQuery.isLoading || topicsQuery.isLoading) {
    return <Loader label="Loading interview question editor..." />;
  }

  if (editing && questionQuery.error) {
    return <EmptyState title="Interview question is unavailable" description={questionQuery.error.message} actionLabel="Back to interview questions" onAction={() => navigate('/admin/questions/interview')} />;
  }

  const courses = (coursesQuery.data?.courses || []).filter((course) => course.status !== 'archived');
  const topics = (topicsQuery.data?.topics || []).filter((topic) => topic.status === 'active');

  const submit = (values) => {
    const payload = parseInterviewQuestionForm(values);
    const options = { onSuccess: () => navigate(`/admin/questions/interview?course=${values.course}`) };
    if (editing) updateMutation.mutate({ id: questionId, payload }, options);
    else createMutation.mutate(payload, options);
  };

  return (
    <PageShell className="space-y-5 pb-8">
      <PageHeader
        eyebrow="Course interview practice"
        eyebrowIcon={MessageSquareText}
        title={editing ? 'Edit interview question' : 'Create interview question'}
        description="Interview questions belong to one Course and one active Course Topic. This keeps learner practice relevant to the selected stack."
        actions={<Link to={courseId ? `/admin/questions/interview?course=${courseId}` : '/admin/questions/interview'} className="ui-button ui-button--secondary gap-2"><ArrowLeft size={16} /> Back</Link>}
      />

      <ErrorMessage message={mutation.error?.message || topicsQuery.error?.message || coursesQuery.error?.message} />

      <form onSubmit={handleSubmit(submit)} className="space-y-5">
        <Card className="mx-auto w-full max-w-4xl space-y-4 shadow-sm">
          <div className="grid gap-4 md:grid-cols-2">
            <Select label="Course" disabled={editing} {...register('course')} error={errors.course?.message}>
              <option value="">Select course</option>
              {courses.map((course) => <option key={course._id} value={course._id}>{course.title}</option>)}
            </Select>
            <Select label="Topic" disabled={!courseId} {...register('topicRef')} error={errors.topicRef?.message}>
              <option value="">Select topic</option>
              {topics.map((topic) => <option key={topic._id} value={topic._id}>{topic.title}</option>)}
            </Select>
          </div>
          {editing ? <p className="text-xs text-muted-foreground">Course ownership is fixed after creation. You may move the question only between Topics inside the same Course.</p> : null}

          <FormTextarea label="Interview question" rows={3} registration={register('question')} error={errors.question?.message} placeholder="Ask a focused concept, debugging, scenario, or design question..." />

          <div className="grid gap-4 md:grid-cols-2">
            <Select label="Question type" {...register('type')} error={errors.type?.message}>
              <option value="definition">Definition</option>
              <option value="concept">Concept</option>
              <option value="output">Output</option>
              <option value="scenario">Scenario</option>
              <option value="debugging">Debugging</option>
              <option value="system_design_lite">System design lite</option>
            </Select>
            <Select label="Difficulty" {...register('difficulty')} error={errors.difficulty?.message}>
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </Select>
          </div>

          <FormTextarea label="Expected answer" rows={7} registration={register('expectedAnswer')} error={errors.expectedAnswer?.message} placeholder="Describe what a strong learner answer should cover..." />
          <FormInput label="Answer review points" registration={register('answerChecklistText')} error={errors.answerChecklistText?.message} placeholder="Definition is accurate, explains tradeoff, gives practical example" />
          <p className="-mt-2 text-xs text-muted-foreground">Comma-separated points used to review learner answers.</p>
          <FormInput label="Tags" registration={register('tagsText')} error={errors.tagsText?.message} placeholder="react, architecture, debugging" />
        </Card>

        <div className="flex justify-end gap-3">
          <Button type="button" variant="secondary" onClick={() => navigate(courseId ? `/admin/questions/interview?course=${courseId}` : '/admin/questions/interview')}>Cancel</Button>
          <Button type="submit" isLoading={mutation.isPending} loadingLabel="Saving question...">{editing ? 'Save changes' : 'Create interview question draft'}</Button>
        </div>
      </form>
    </PageShell>
  );
}
