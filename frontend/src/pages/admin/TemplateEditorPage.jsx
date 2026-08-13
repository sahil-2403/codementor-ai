import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Map as MapIcon } from 'lucide-react';
import TemplateForm from '../../components/admin/TemplateForm.jsx';
import Card from '../../components/common/Card.jsx';
import EmptyState from '../../components/common/EmptyState.jsx';
import ErrorMessage from '../../components/common/ErrorMessage.jsx';
import Loader from '../../components/common/Loader.jsx';
import PageHeader from '../../components/common/PageHeader.jsx';
import PageShell from '../../components/common/PageShell.jsx';
import Select from '../../components/common/Select.jsx';
import StatusPill from '../../components/common/StatusPill.jsx';
import { adminApi } from '../../api/adminApi.js';

const quizTagOptions = (questions) => {
  const tags = new Map();
  questions.filter((item) => item.status !== 'archived').forEach((item) => {
    (item.tags || []).forEach((value) => {
      const tag = String(value || '').trim();
      if (!tag) return;
      const current = tags.get(tag) || { tag, totalCount: 0, publishedCount: 0 };
      current.totalCount += 1;
      if (item.status === 'published') current.publishedCount += 1;
      tags.set(tag, current);
    });
  });
  return [...tags.values()].sort((a, b) => a.tag.localeCompare(b.tag));
};

export default function TemplateEditorPage() {
  const { templateId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const editing = Boolean(templateId);
  const [courseId, setCourseId] = useState(searchParams.get('course') || '');
  const [template, setTemplate] = useState(null);
  const [courses, setCourses] = useState([]);
  const [lessons, setLessons] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    const requests = [adminApi.courses({ limit: 100 })];
    if (editing) requests.push(adminApi.template(templateId));
    Promise.all(requests).then(([courseData, templateData]) => {
      if (!active) return;
      const items = (courseData?.courses || []).filter((course) => course.status !== 'archived');
      setCourses(items);
      if (editing) {
        const current = templateData?.template || null;
        setTemplate(current);
        setCourseId(String(current?.course?._id || current?.course || ''));
      } else if (!courseId && items[0]) setCourseId(items[0]._id);
    }).catch((requestError) => { if (active) setError(requestError); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [editing, templateId]);

  useEffect(() => {
    let active = true;
    if (!courseId) { setLessons([]); setQuestions([]); setTemplates([]); return undefined; }
    setLoading(true);
    setError(null);
    Promise.all([
      adminApi.lessons({ limit: 100, course: courseId }),
      adminApi.questions({ limit: 100, bank: 'quiz', course: courseId }),
      adminApi.templates({ limit: 100, course: courseId })
    ]).then(([lessonData, questionData, templateData]) => {
      if (!active) return;
      setLessons(lessonData?.lessons || []);
      setQuestions(questionData?.questions || []);
      setTemplates(templateData?.templates || []);
    }).catch((requestError) => { if (active) setError(requestError); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [courseId]);

  const quizTags = useMemo(() => quizTagOptions(questions), [questions]);
  const unavailableLevels = useMemo(() => templates.filter((item) => item._id !== templateId).map((item) => item.level), [templates, templateId]);
  const course = courses.find((item) => item._id === courseId) || template?.course || null;

  const submit = async (payload) => {
    setSaving(true);
    setSaveError(null);
    try {
      if (editing) await adminApi.updateTemplate({ id: templateId, payload });
      else await adminApi.createTemplate(payload);
      navigate(`/admin/templates?course=${courseId}`);
    } catch (requestError) {
      setSaveError(requestError);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Loader label="Loading roadmap template editor..." />;
  if (error) return <EmptyState title="Template editor data is unavailable" description={error.message} actionLabel="Back to templates" onAction={() => navigate('/admin/templates')} />;

  return <PageShell className="space-y-5 pb-6">
    <PageHeader variant="compact" eyebrow="Course curriculum" eyebrowIcon={MapIcon} title={editing ? 'Edit roadmap template' : 'Create roadmap template draft'} description="Templates belong to one Course and one learner level." actions={<Link to={courseId ? `/admin/templates?course=${courseId}` : '/admin/templates'} className="ui-button ui-button--secondary gap-2"><ArrowLeft size={16} /> Back to templates</Link>} />
    {!editing ? <Card><Select label="Course" value={courseId} onChange={(event) => setCourseId(event.target.value)}><option value="">Select course</option>{courses.map((item) => <option key={item._id} value={item._id}>{item.title}</option>)}</Select></Card> : null}
    {!course ? <EmptyState title="Choose a course first" description="A roadmap template must belong to a Course." /> : template?.status === 'archived' ? <Card className="border-warning/20 bg-warning-soft"><div className="flex items-center gap-2"><h2 className="font-bold">This template is archived</h2><StatusPill status="archived" /></div><p className="mt-2 text-sm text-muted-foreground">Restore it to Draft from Template Management before editing.</p></Card> : <><ErrorMessage message={saveError?.message} /><TemplateForm initialData={template} course={course} lessons={lessons} quizTags={quizTags} unavailableLevels={unavailableLevels} onSubmit={submit} onCancel={() => navigate(`/admin/templates?course=${courseId}`)} isLoading={saving} /></>}
  </PageShell>;
}
