import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ArrowLeft, FileQuestion } from 'lucide-react';
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

export default function QuizQuestionEditorPage() {
  const { questionId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const editing = Boolean(questionId);
  const [question, setQuestion] = useState(null);
  const [courses, setCourses] = useState([]);
  const [topics, setTopics] = useState([]);
  const [lessons, setLessons] = useState([]);
  const [technologies, setTechnologies] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [saveError, setSaveError] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [form, setForm] = useState({
    course: searchParams.get('course') || '', topic: '', relatedLesson: '', question: '', type: 'mcq', codeSnippet: '', options: '', correctAnswer: '', explanation: '', difficulty: 'beginner', technologies: [], tags: ''
  });

  useEffect(() => {
    let active = true;
    setIsLoading(true);
    const requests = [adminApi.listCourses({ limit: 100 }), adminApi.listTechnologies({ limit: 100 })];
    if (editing) requests.push(adminApi.getQuestion(questionId));

    Promise.all(requests)
      .then(async ([courseResult, technologyResult, questionResult]) => {
        if (!active) return;
        setCourses(courseResult?.courses || []);
        setTechnologies(technologyResult?.technologies || []);
        const item = questionResult?.question;
        const courseId = item?.course?._id || item?.course || searchParams.get('course') || '';
        if (courseId) {
          const [topicResult, lessonResult] = await Promise.all([
            adminApi.listTopics({ course: courseId, limit: 100 }),
            adminApi.listLessons({ course: courseId, limit: 100 })
          ]);
          if (active) {
            setTopics(topicResult?.topics || []);
            setLessons(lessonResult?.lessons || []);
          }
        }
        if (item && active) {
          setQuestion(item);
          setForm({
            course: courseId,
            topic: item.topic?._id || item.topic || '',
            relatedLesson: item.relatedLesson?._id || item.relatedLesson || '',
            question: item.question || '',
            type: item.type || 'mcq',
            codeSnippet: item.codeSnippet || '',
            options: (item.options || []).join('\n'),
            correctAnswer: item.correctAnswer || '',
            explanation: item.explanation || '',
            difficulty: item.difficulty || 'beginner',
            technologies: (item.technologies || []).map((value) => value._id || value),
            tags: (item.tags || []).join(', ')
          });
        }
      })
      .catch((error) => { if (active) setLoadError(error); })
      .finally(() => { if (active) setIsLoading(false); });

    return () => { active = false; };
  }, [editing, questionId, searchParams]);

  if (isLoading) return <Loader label="Loading quiz question editor..." />;
  if (editing && (loadError || !question)) return <EmptyState title="Quiz question is unavailable" description={loadError?.message || 'This Question could not be loaded.'} actionLabel="Back to quiz questions" onAction={() => navigate('/admin/questions/quiz')} />;

  const setField = async (key, value) => {
    setForm((current) => ({ ...current, [key]: value, ...(key === 'course' ? { topic: '', relatedLesson: '' } : {}) }));
    if (key === 'course') {
      try {
        const [topicResult, lessonResult] = value ? await Promise.all([adminApi.listTopics({ course: value, limit: 100 }), adminApi.listLessons({ course: value, limit: 100 })]) : [{ topics: [] }, { lessons: [] }];
        setTopics(topicResult?.topics || []);
        setLessons(lessonResult?.lessons || []);
      } catch (error) {
        setSaveError(error);
      }
    }
  };
  const toggleTechnology = (id) => setForm((current) => ({ ...current, technologies: current.technologies.includes(id) ? current.technologies.filter((value) => value !== id) : [...current.technologies, id] }));

  const submit = async (event) => {
    event.preventDefault();
    setSaveError(null);
    if (!form.course || !form.topic || !form.relatedLesson) return setSaveError(new Error('Choose a Course, Topic, and related Lesson.'));
    if (!form.question.trim()) return setSaveError(new Error('Question text is required.'));
    if (!form.correctAnswer.trim()) return setSaveError(new Error('Correct answer is required.'));

    const payload = {
      bank: 'quiz',
      ...form,
      question: form.question.trim(),
      codeSnippet: form.codeSnippet.trim(),
      options: form.options.split('\n').map((value) => value.trim()).filter(Boolean),
      correctAnswer: form.correctAnswer.trim(),
      explanation: form.explanation.trim(),
      tags: form.tags.split(',').map((value) => value.trim()).filter(Boolean)
    };

    setIsSaving(true);
    try {
      if (editing) await adminApi.updateQuestion(questionId, payload);
      else await adminApi.createQuestion(payload);
      navigate(`/admin/questions/quiz${form.course ? `?course=${form.course}` : ''}`);
    } catch (error) {
      setSaveError(error);
    } finally {
      setIsSaving(false);
    }
  };

  const availableLessons = lessons.filter((lesson) => !form.topic || (lesson.topic?._id || lesson.topic) === form.topic);

  return <PageShell className="space-y-5 pb-8">
    <PageHeader eyebrow="Question bank" eyebrowIcon={FileQuestion} title={editing ? 'Edit quiz question' : 'Create quiz question'} description="Create a Course-owned question and link it to the Lesson it assesses." actions={<Link to="/admin/questions/quiz" className="ui-button ui-button--secondary gap-2"><ArrowLeft size={16} /> Back</Link>} />
    <ErrorMessage message={(saveError || (!editing && loadError))?.message} />
    <form onSubmit={submit} className="space-y-5">
      <Card className="space-y-4 shadow-sm"><div className="grid gap-4 md:grid-cols-3"><Select label="Course" value={form.course} onChange={(event) => void setField('course', event.target.value)} disabled={editing}><option value="">Choose course</option>{courses.filter((course) => course.status !== 'archived').map((course) => <option key={course._id} value={course._id}>{course.title}</option>)}</Select><Select label="Topic" value={form.topic} onChange={(event) => setField('topic', event.target.value)}><option value="">Choose topic</option>{topics.filter((topic) => topic.status !== 'archived').map((topic) => <option key={topic._id} value={topic._id}>{topic.title}</option>)}</Select><Select label="Related lesson" value={form.relatedLesson} onChange={(event) => setField('relatedLesson', event.target.value)}><option value="">Choose lesson</option>{availableLessons.filter((lesson) => lesson.status !== 'archived').map((lesson) => <option key={lesson._id} value={lesson._id}>{lesson.title}</option>)}</Select></div><Textarea label="Question" rows={4} value={form.question} onChange={(event) => setField('question', event.target.value)} /><div className="grid gap-4 md:grid-cols-2"><Select label="Question type" value={form.type} onChange={(event) => setField('type', event.target.value)}><option value="mcq">MCQ</option><option value="code_output">Code output</option><option value="short_answer">Short answer draft</option></Select><Select label="Difficulty" value={form.difficulty} onChange={(event) => setField('difficulty', event.target.value)}><option value="beginner">Beginner</option><option value="intermediate">Intermediate</option><option value="advanced">Advanced</option></Select></div>{form.type === 'code_output' ? <Textarea label="Code snippet" rows={6} value={form.codeSnippet} onChange={(event) => setField('codeSnippet', event.target.value)} /> : null}{form.type === 'mcq' ? <Textarea label="Options (one per line)" rows={6} value={form.options} onChange={(event) => setField('options', event.target.value)} /> : null}<Input label="Correct answer" value={form.correctAnswer} onChange={(event) => setField('correctAnswer', event.target.value)} /><Textarea label="Explanation" rows={5} value={form.explanation} onChange={(event) => setField('explanation', event.target.value)} /><Input label="Quiz tags" value={form.tags} onChange={(event) => setField('tags', event.target.value)} placeholder="arrays, methods" /></Card>
      <Card className="shadow-sm"><h2 className="text-lg font-bold text-foreground">Technologies</h2><div className="mt-3 flex flex-wrap gap-3">{technologies.filter((item) => item.status !== 'archived').map((technology) => <label key={technology._id} className="flex items-center gap-2 rounded-control border border-border px-3 py-2 text-sm"><input type="checkbox" checked={form.technologies.includes(technology._id)} onChange={() => toggleTechnology(technology._id)} /> {technology.name}</label>)}</div></Card>
      <div className="flex justify-end gap-3"><Button type="button" variant="secondary" onClick={() => navigate('/admin/questions/quiz')}>Cancel</Button><Button type="submit" isLoading={isSaving} loadingLabel="Saving...">{editing ? 'Save changes' : 'Create draft'}</Button></div>
    </form>
  </PageShell>;
}
