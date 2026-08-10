import { useEffect } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, useWatch } from 'react-hook-form';
import { ArrowLeft, Hammer } from 'lucide-react';
import { adminProjectApi } from '../../api/adminProjectApi.js';
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
import { useAdminCourses, useAdminLessons } from '../../queries/adminQueries.js';
import { parseProjectTaskForm, projectTaskFormSchema } from '../../validations/projectAdmin.schema.js';

const defaults = {
  course: '', title: '', description: '', moduleTitle: '', topicOrder: 0, solution: '', difficulty: 'beginner',
  relatedLessons: [], requirementsText: '', starterHintsText: '', expectedOutput: '', evaluationChecklistText: '', tagsText: '', estimatedMinutes: 90
};

function LessonChoice({ lesson, registration }) {
  return <label className="flex cursor-pointer items-start gap-3 rounded-surface border border-transparent px-3 py-2.5 hover:border-border hover:bg-surface-secondary/60"><input type="checkbox" value={lesson._id} className="mt-1 h-4 w-4 rounded border-border" {...registration} /><span className="min-w-0"><span className="block break-words text-sm font-semibold text-foreground">{lesson.title}</span><span className="mt-0.5 block text-xs capitalize text-muted-foreground">{lesson.difficulty} · {lesson.status}</span></span></label>;
}

export default function CourseProjectEditorPage() {
  const { projectId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const editing = Boolean(projectId);
  const projectQuery = useQuery({ queryKey: ['admin-project-task', projectId], queryFn: () => adminProjectApi.get(projectId), enabled: editing });
  const coursesQuery = useAdminCourses({ limit: 100 });
  const { register, control, handleSubmit, reset, formState: { errors } } = useForm({ resolver: zodResolver(projectTaskFormSchema), defaultValues: { ...defaults, course: searchParams.get('course') || '' } });
  const courseId = useWatch({ control, name: 'course' }) || '';
  const lessonsQuery = useAdminLessons({ limit: 100, course: courseId }, Boolean(courseId));

  const invalidate = async () => Promise.all([
    queryClient.invalidateQueries({ queryKey: ['admin-project-tasks'] }),
    queryClient.invalidateQueries({ queryKey: ['admin-project-task'] }),
    queryClient.invalidateQueries({ queryKey: ['admin-course-workspace'] }),
    queryClient.invalidateQueries({ queryKey: ['admin-content-overview'] })
  ]);
  const createMutation = useMutation({ mutationFn: adminProjectApi.create, onSuccess: invalidate });
  const updateMutation = useMutation({ mutationFn: adminProjectApi.update, onSuccess: invalidate });
  const mutation = editing ? updateMutation : createMutation;

  useEffect(() => {
    const project = projectQuery.data?.projectTask;
    if (!project) return;
    reset({
      course: project.course?._id || project.course || '', title: project.title || '', description: project.description || '',
      moduleTitle: project.moduleTitle || '', topicOrder: project.topicOrder || 0, solution: project.solution || '', difficulty: project.difficulty || 'beginner',
      relatedLessons: (project.relatedLessons || []).map((lesson) => lesson._id || lesson), requirementsText: (project.requirements || []).join(', '),
      starterHintsText: (project.starterHints || []).join(', '), expectedOutput: project.expectedOutput || '',
      evaluationChecklistText: (project.evaluationChecklist || []).join(', '), tagsText: (project.tags || []).join(', '), estimatedMinutes: project.estimatedMinutes || 90
    });
  }, [projectQuery.data?.projectTask?._id, reset]);

  if ((editing && projectQuery.isLoading) || coursesQuery.isLoading || lessonsQuery.isLoading) return <Loader label="Loading project editor..." />;
  if (editing && projectQuery.error) return <EmptyState title="Project task is unavailable" description={projectQuery.error.message} actionLabel="Back to projects" onAction={() => navigate('/admin/project-tasks')} />;

  const courses = (coursesQuery.data?.courses || []).filter((course) => course.status !== 'archived');
  const lessons = (lessonsQuery.data?.lessons || []).filter((lesson) => lesson.status !== 'archived');
  const selectedCourse = courses.find((course) => course._id === courseId) || projectQuery.data?.projectTask?.course;

  const submit = async (values) => {
    const payload = parseProjectTaskForm(values);
    if (editing) await updateMutation.mutateAsync({ id: projectId, payload });
    else await createMutation.mutateAsync(payload);
    navigate(`/admin/project-tasks?course=${values.course}`);
  };

  return <PageShell className="space-y-5 pb-8">
    <PageHeader eyebrow="Course projects" eyebrowIcon={Hammer} title={editing ? 'Edit project task' : 'Create project task'} description="A project belongs to one Course. Related Lessons are automatically limited to that Course so requirements cannot accidentally mix curricula." actions={<Link to={courseId ? `/admin/project-tasks?course=${courseId}` : '/admin/project-tasks'} className="ui-button ui-button--secondary gap-2"><ArrowLeft size={16} /> Back</Link>} />
    <ErrorMessage message={mutation.error?.message || projectQuery.error?.message || coursesQuery.error?.message || lessonsQuery.error?.message} />

    <form onSubmit={handleSubmit(submit)} className="space-y-5">
      <Card className="mx-auto w-full max-w-4xl space-y-4 shadow-sm">
        {editing ? <><input type="hidden" {...register('course')} /><Select label="Course" value={courseId} disabled><option value={courseId}>{selectedCourse?.title || 'Selected course'}</option></Select></> : <Select label="Course" {...register('course')} error={errors.course?.message}><option value="">Select course</option>{courses.map((course) => <option key={course._id} value={course._id}>{course.title}</option>)}</Select>}
        {editing ? <p className="text-xs text-muted-foreground">Course ownership is fixed after creation.</p> : null}
        <div className="grid gap-4 md:grid-cols-[1.4fr_0.6fr]"><FormInput label="Project title" registration={register('title')} error={errors.title?.message} /><Select label="Difficulty" {...register('difficulty')} error={errors.difficulty?.message}><option value="beginner">Beginner</option><option value="intermediate">Intermediate</option><option value="advanced">Advanced</option></Select></div>
        <FormTextarea label="Description" rows={5} registration={register('description')} error={errors.description?.message} placeholder="Explain the project outcome and learner scenario..." />
        <div className="grid gap-4 md:grid-cols-3"><FormInput label="Module label (optional)" registration={register('moduleTitle')} error={errors.moduleTitle?.message} /><FormInput label="Topic order" type="number" min="0" registration={register('topicOrder')} error={errors.topicOrder?.message} /><FormInput label="Estimated minutes" type="number" min="15" max="1440" registration={register('estimatedMinutes')} error={errors.estimatedMinutes?.message} /></div>
      </Card>

      <div className="grid gap-5 xl:grid-cols-2">
        <Card className="min-w-0 shadow-sm"><h2 className="text-lg font-bold text-foreground">Related lessons</h2><p className="mt-1 text-sm leading-6 text-muted-foreground">Choose Course lessons that prepare the learner for this project.</p><div className="mt-4 max-h-80 overflow-y-auto">{lessons.length ? lessons.map((lesson) => <LessonChoice key={lesson._id} lesson={lesson} registration={register('relatedLessons')} />) : <p className="text-sm text-muted-foreground">Choose a Course with lessons first.</p>}</div></Card>
        <Card className="space-y-4 shadow-sm"><h2 className="text-lg font-bold text-foreground">Project requirements</h2><FormInput label="Requirements" registration={register('requirementsText')} error={errors.requirementsText?.message} placeholder="Requirement one, Requirement two" /><FormInput label="Starter hints" registration={register('starterHintsText')} error={errors.starterHintsText?.message} placeholder="Hint one, Hint two" /><FormInput label="Evaluation checklist" registration={register('evaluationChecklistText')} error={errors.evaluationChecklistText?.message} placeholder="API works, errors handled, responsive UI" /><FormInput label="Tags" registration={register('tagsText')} error={errors.tagsText?.message} placeholder="react, api, fullstack" /></Card>
      </div>

      <Card className="space-y-4 shadow-sm"><FormTextarea label="Expected output" rows={5} registration={register('expectedOutput')} error={errors.expectedOutput?.message} placeholder="Describe what a complete learner submission should demonstrate..." /><FormTextarea label="Reference solution / mentor notes (optional)" rows={8} registration={register('solution')} error={errors.solution?.message} placeholder="Keep implementation notes or a reference solution here..." /></Card>

      <div className="flex justify-end gap-3"><Button type="button" variant="secondary" onClick={() => navigate(courseId ? `/admin/project-tasks?course=${courseId}` : '/admin/project-tasks')}>Cancel</Button><Button type="submit" isLoading={mutation.isPending} loadingLabel="Saving project...">{editing ? 'Save changes' : 'Create project draft'}</Button></div>
    </form>
  </PageShell>;
}
