import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ArrowLeft, FolderCode } from 'lucide-react';
import Button from '../../components/common/Button.jsx';
import Card from '../../components/common/Card.jsx';
import EmptyState from '../../components/common/EmptyState.jsx';
import ErrorMessage from '../../components/common/ErrorMessage.jsx';
import Input from '../../components/common/Input.jsx';
import Loader from '../../components/common/Loader.jsx';
import PageHeader from '../../components/common/PageHeader.jsx';
import PageShell from '../../components/common/PageShell.jsx';
import Select from '../../components/common/Select.jsx';
import Textarea from '../../components/common/Textarea.jsx';
import { adminApi } from '../../api/adminApi.js';

export default function ProjectTaskEditorPage() {
  const { taskId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const editing = Boolean(taskId);
  const [task, setTask] = useState(null);
  const [courses, setCourses] = useState([]);
  const [lessons, setLessons] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [saveError, setSaveError] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [form, setForm] = useState({
    course: searchParams.get('course') || '', title: '', description: '', moduleTitle: '', topicOrder: 0, difficulty: 'beginner', estimatedMinutes: 60,
    requirements: '', starterHints: '', expectedOutput: '', solution: '', relatedLessons: [], tags: ''
  });

  useEffect(() => {
    let active = true;
    setIsLoading(true);
    const requests = [adminApi.listCourses({ limit: 100 })];
    if (editing) requests.push(adminApi.getProjectTask(taskId));

    Promise.all(requests)
      .then(async ([courseResult, taskResult]) => {
        if (!active) return;
        setCourses(courseResult?.courses || []);
        const item = taskResult?.projectTask;
        const courseId = item?.course?._id || item?.course || searchParams.get('course') || '';
        if (courseId) {
          const lessonResult = await adminApi.listLessons({ course: courseId, limit: 100 });
          if (active) setLessons(lessonResult?.lessons || []);
        }
        if (item && active) {
          setTask(item);
          setForm({
            course: courseId,
            title: item.title || '',
            description: item.description || '',
            moduleTitle: item.moduleTitle || '',
            topicOrder: item.topicOrder || 0,
            difficulty: item.difficulty || 'beginner',
            estimatedMinutes: item.estimatedMinutes || 60,
            requirements: (item.requirements || []).join('\n'),
            starterHints: (item.starterHints || []).join('\n'),
            expectedOutput: item.expectedOutput || '',
            solution: item.solution || '',
            relatedLessons: (item.relatedLessons || []).map((value) => value._id || value),
            tags: (item.tags || []).join(', ')
          });
        }
      })
      .catch((error) => { if (active) setLoadError(error); })
      .finally(() => { if (active) setIsLoading(false); });

    return () => { active = false; };
  }, [editing, searchParams, taskId]);

  if (isLoading) return <Loader label="Loading project task editor..." />;
  if (editing && (loadError || !task)) return <EmptyState title="Project task is unavailable" description={loadError?.message || 'This Project Task could not be loaded.'} actionLabel="Back to project tasks" onAction={() => navigate('/admin/projects')} />;

  const setField = async (key, value) => {
    setForm((current) => ({ ...current, [key]: value, ...(key === 'course' ? { relatedLessons: [] } : {}) }));
    if (key === 'course') {
      try {
        const lessonResult = value ? await adminApi.listLessons({ course: value, limit: 100 }) : { lessons: [] };
        setLessons(lessonResult?.lessons || []);
      } catch (error) {
        setSaveError(error);
      }
    }
  };
  const toggleLesson = (id) => setForm((current) => ({ ...current, relatedLessons: current.relatedLessons.includes(id) ? current.relatedLessons.filter((value) => value !== id) : [...current.relatedLessons, id] }));

  const submit = async (event) => {
    event.preventDefault();
    setSaveError(null);
    if (!form.course) return setSaveError(new Error('Choose a Course.'));
    if (!form.title.trim() || !form.description.trim()) return setSaveError(new Error('Title and description are required.'));
    if (!form.relatedLessons.length) return setSaveError(new Error('Choose at least one related Lesson.'));

    const payload = {
      ...form,
      title: form.title.trim(),
      description: form.description.trim(),
      moduleTitle: form.moduleTitle.trim(),
      topicOrder: Number(form.topicOrder) || 0,
      estimatedMinutes: Number(form.estimatedMinutes) || 60,
      requirements: form.requirements.split('\n').map((value) => value.trim()).filter(Boolean),
      starterHints: form.starterHints.split('\n').map((value) => value.trim()).filter(Boolean),
      expectedOutput: form.expectedOutput.trim(),
      solution: form.solution.trim(),
      tags: form.tags.split(',').map((value) => value.trim()).filter(Boolean)
    };

    setIsSaving(true);
    try {
      if (editing) await adminApi.updateProjectTask(taskId, payload);
      else await adminApi.createProjectTask(payload);
      navigate(`/admin/projects${form.course ? `?course=${form.course}` : ''}`);
    } catch (error) {
      setSaveError(error);
    } finally {
      setIsSaving(false);
    }
  };

  return <PageShell className="space-y-5 pb-8">
    <PageHeader eyebrow="Course curriculum" eyebrowIcon={FolderCode} title={editing ? 'Edit project task' : 'Create project task'} description="Create a practical task linked to Lessons from one Course." actions={<Link to="/admin/projects" className="ui-button ui-button--secondary gap-2"><ArrowLeft size={16} /> Back</Link>} />
    <ErrorMessage message={(saveError || (!editing && loadError))?.message} />
    <form onSubmit={submit} className="space-y-5">
      <Card className="space-y-4 shadow-sm"><Select label="Course" value={form.course} onChange={(event) => void setField('course', event.target.value)} disabled={editing}><option value="">Choose course</option>{courses.filter((course) => course.status !== 'archived').map((course) => <option key={course._id} value={course._id}>{course.title}</option>)}</Select><div className="grid gap-4 md:grid-cols-2"><Input label="Title" value={form.title} onChange={(event) => setField('title', event.target.value)} /><Input label="Module label (optional)" value={form.moduleTitle} onChange={(event) => setField('moduleTitle', event.target.value)} /></div><Textarea label="Description" rows={5} value={form.description} onChange={(event) => setField('description', event.target.value)} /><div className="grid gap-4 md:grid-cols-3"><Select label="Difficulty" value={form.difficulty} onChange={(event) => setField('difficulty', event.target.value)}><option value="beginner">Beginner</option><option value="intermediate">Intermediate</option><option value="advanced">Advanced</option></Select><Input label="Estimated minutes" type="number" min="1" value={form.estimatedMinutes} onChange={(event) => setField('estimatedMinutes', event.target.value)} /><Input label="Display order" type="number" min="0" value={form.topicOrder} onChange={(event) => setField('topicOrder', event.target.value)} /></div><Textarea label="Requirements (one per line)" rows={5} value={form.requirements} onChange={(event) => setField('requirements', event.target.value)} /><Textarea label="Starter hints (one per line)" rows={5} value={form.starterHints} onChange={(event) => setField('starterHints', event.target.value)} /><Textarea label="Expected output" rows={4} value={form.expectedOutput} onChange={(event) => setField('expectedOutput', event.target.value)} /><Textarea label="Suggested solution" rows={8} value={form.solution} onChange={(event) => setField('solution', event.target.value)} /><Input label="Tags" value={form.tags} onChange={(event) => setField('tags', event.target.value)} placeholder="api, crud, react" /></Card>
      <Card className="shadow-sm"><h2 className="text-lg font-bold text-foreground">Related lessons</h2><p className="mt-1 text-sm text-muted-foreground">Choose Lessons from the same Course that learners should complete before this task.</p><div className="mt-3 grid gap-2 md:grid-cols-2">{lessons.filter((lesson) => lesson.status !== 'archived').map((lesson) => <label key={lesson._id} className="flex items-center gap-2 rounded-control border border-border px-3 py-2 text-sm"><input type="checkbox" checked={form.relatedLessons.includes(lesson._id)} onChange={() => toggleLesson(lesson._id)} /> {lesson.title}</label>)}</div></Card>
      <div className="flex justify-end gap-3"><Button type="button" variant="secondary" onClick={() => navigate('/admin/projects')}>Cancel</Button><Button type="submit" isLoading={isSaving} loadingLabel="Saving...">{editing ? 'Save changes' : 'Create draft'}</Button></div>
    </form>
  </PageShell>;
}
