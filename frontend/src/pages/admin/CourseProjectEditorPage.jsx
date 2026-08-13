import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, useWatch } from 'react-hook-form';
import { ArrowLeft, Hammer } from 'lucide-react';
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
import { adminProjectApi } from '../../api/adminProjectApi.js';
import { parseProjectTaskForm, projectTaskFormSchema } from '../../validations/projectAdmin.schema.js';

const defaults = { course: '', title: '', description: '', moduleTitle: '', topicOrder: 0, solution: '', difficulty: 'beginner', relatedLessons: [], requirementsText: '', starterHintsText: '', expectedOutput: '', evaluationChecklistText: '', tagsText: '', estimatedMinutes: 90 };
function LessonChoice({ lesson, registration }) { return <label className="flex cursor-pointer items-start gap-3 rounded-surface border border-transparent px-3 py-2.5 hover:border-border hover:bg-surface-secondary/60"><input type="checkbox" value={lesson._id} className="mt-1 h-4 w-4 rounded border-border" {...registration} /><span className="min-w-0"><span className="block break-words text-sm font-semibold text-foreground">{lesson.title}</span><span className="mt-0.5 block text-xs capitalize text-muted-foreground">{lesson.difficulty} · {lesson.status}</span></span></label>; }

export default function CourseProjectEditorPage() {
  const { projectId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const editing = Boolean(projectId);
  const [project, setProject] = useState(null);
  const [courses, setCourses] = useState([]);
  const [lessons, setLessons] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lessonsLoading, setLessonsLoading] = useState(false);
  const [loadError, setLoadError] = useState(null);
  const [saveError, setSaveError] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const { register, control, handleSubmit, reset, formState: { errors } } = useForm({ resolver: zodResolver(projectTaskFormSchema), defaultValues: { ...defaults, course: searchParams.get('course') || '' } });
  const courseId = useWatch({ control, name: 'course' }) || '';

  useEffect(() => {
    let active = true;
    setIsLoading(true); setLoadError(null);
    const requests = [adminApi.courses({ limit: 100 })];
    if (editing) requests.push(adminProjectApi.get(projectId));
    Promise.all(requests).then(([courseResult, projectResult]) => {
      if (!active) return;
      setCourses((courseResult?.courses || []).filter((course) => course.status !== 'archived'));
      if (editing) setProject(projectResult?.projectTask || null);
    }).catch((requestError) => { if (active) setLoadError(requestError); }).finally(() => { if (active) setIsLoading(false); });
    return () => { active = false; };
  }, [editing, projectId]);

  useEffect(() => {
    if (!project) return;
    reset({ course: project.course?._id || project.course || '', title: project.title || '', description: project.description || '', moduleTitle: project.moduleTitle || '', topicOrder: project.topicOrder || 0, solution: project.solution || '', difficulty: project.difficulty || 'beginner', relatedLessons: (project.relatedLessons || []).map((lesson) => lesson._id || lesson), requirementsText: (project.requirements || []).join(', '), starterHintsText: (project.starterHints || []).join(', '), expectedOutput: project.expectedOutput || '', evaluationChecklistText: (project.evaluationChecklist || []).join(', '), tagsText: (project.tags || []).join(', '), estimatedMinutes: project.estimatedMinutes || 90 });
  }, [project, reset]);

  useEffect(() => {
    let active = true;
    if (!courseId) { setLessons([]); return undefined; }
    setLessonsLoading(true);
    adminApi.lessons({ limit: 100, course: courseId }).then((result) => { if (active) setLessons((result?.lessons || []).filter((lesson) => lesson.status !== 'archived')); }).catch((requestError) => { if (active) setLoadError(requestError); }).finally(() => { if (active) setLessonsLoading(false); });
    return () => { active = false; };
  }, [courseId]);

  if (isLoading || lessonsLoading) return <Loader label="Loading project editor..." />;
  if (editing && loadError) return <EmptyState title="Project task is unavailable" description={loadError.message} actionLabel="Back to projects" onAction={() => navigate('/admin/project-tasks')} />;
  const selectedCourse = courses.find((course) => course._id === courseId) || project?.course;

  const submit = async (values) => {
    const payload = parseProjectTaskForm(values);
    setIsSaving(true); setSaveError(null);
    try { if (editing) await adminProjectApi.update({ id: projectId, payload }); else await adminProjectApi.create(payload); navigate(`/admin/project-tasks?course=${values.course}`); }
    catch (requestError) { setSaveError(requestError); }
    finally { setIsSaving(false); }
  };

  return <PageShell className="space-y-5 pb-8"><PageHeader eyebrow="Course projects" eyebrowIcon={Hammer} title={editing ? 'Edit project task' : 'Create project task'} description="A project belongs to one Course. Related Lessons are limited to that Course." actions={<Link to={courseId ? `/admin/project-tasks?course=${courseId}` : '/admin/project-tasks'} className="ui-button ui-button--secondary gap-2"><ArrowLeft size={16} /> Back</Link>} /><ErrorMessage message={(saveError || (!editing && loadError))?.message} /><form onSubmit={handleSubmit(submit)} className="space-y-5"><Card className="mx-auto w-full max-w-4xl space-y-4">{editing ? <><input type="hidden" {...register('course')} /><Select label="Course" value={courseId} disabled><option value={courseId}>{selectedCourse?.title || 'Selected course'}</option></Select></> : <Select label="Course" {...register('course')} error={errors.course?.message}><option value="">Select course</option>{courses.map((course) => <option key={course._id} value={course._id}>{course.title}</option>)}</Select>}<div className="grid gap-4 md:grid-cols-[1.4fr_0.6fr]"><FormInput label="Project title" registration={register('title')} error={errors.title?.message} /><Select label="Difficulty" {...register('difficulty')} error={errors.difficulty?.message}><option value="beginner">Beginner</option><option value="intermediate">Intermediate</option><option value="advanced">Advanced</option></Select></div><FormTextarea label="Description" rows={5} registration={register('description')} error={errors.description?.message} /><div className="grid gap-4 md:grid-cols-3"><FormInput label="Module label (optional)" registration={register('moduleTitle')} error={errors.moduleTitle?.message} /><FormInput label="Topic order" type="number" min="0" registration={register('topicOrder')} error={errors.topicOrder?.message} /><FormInput label="Estimated minutes" type="number" min="15" max="1440" registration={register('estimatedMinutes')} error={errors.estimatedMinutes?.message} /></div></Card><div className="grid gap-5 xl:grid-cols-2"><Card><h2 className="text-lg font-bold">Related lessons</h2><div className="mt-4 max-h-80 overflow-y-auto">{lessons.length ? lessons.map((lesson) => <LessonChoice key={lesson._id} lesson={lesson} registration={register('relatedLessons')} />) : <p className="text-sm text-muted-foreground">Choose a Course with lessons first.</p>}</div></Card><Card className="space-y-4"><h2 className="text-lg font-bold">Project requirements</h2><FormInput label="Requirements" registration={register('requirementsText')} error={errors.requirementsText?.message} /><FormInput label="Starter hints" registration={register('starterHintsText')} error={errors.starterHintsText?.message} /><FormInput label="Evaluation checklist" registration={register('evaluationChecklistText')} error={errors.evaluationChecklistText?.message} /><FormInput label="Tags" registration={register('tagsText')} error={errors.tagsText?.message} /></Card></div><Card className="space-y-4"><FormTextarea label="Expected output" rows={5} registration={register('expectedOutput')} error={errors.expectedOutput?.message} /><FormTextarea label="Reference solution / mentor notes (optional)" rows={8} registration={register('solution')} error={errors.solution?.message} /></Card><div className="flex justify-end gap-3"><Button type="button" variant="secondary" onClick={() => navigate(courseId ? `/admin/project-tasks?course=${courseId}` : '/admin/project-tasks')}>Cancel</Button><Button type="submit" isLoading={isSaving} loadingLabel="Saving project...">{editing ? 'Save changes' : 'Create project draft'}</Button></div></form></PageShell>;
}
