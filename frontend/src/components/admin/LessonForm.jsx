import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Button from '../common/Button.jsx';
import Input from '../common/Input.jsx';
import Select from '../common/Select.jsx';
import FormTextarea from '../form/FormTextarea.jsx';
import { lessonFormSchema } from '../../validations/admin.schema.js';

const emptyForm = { title: '', topic: '', difficulty: 'beginner', theory: '', codeExample: '', codeExplanation: '', commonMistakes: '', interviewDefinition: '', interviewQuestions: '', practiceTask: '', tags: '', estimatedMinutes: 45, status: 'published' };

const toForm = (lesson, topics) => lesson ? {
  title: lesson.title || '',
  topic: lesson.topic?._id || lesson.topic || topics[0]?._id || '',
  difficulty: lesson.difficulty || 'beginner',
  theory: lesson.theory || '',
  codeExample: lesson.codeExample || '',
  codeExplanation: lesson.codeExplanation || '',
  commonMistakes: (lesson.commonMistakes || []).join('\n'),
  interviewDefinition: lesson.interviewDefinition || '',
  interviewQuestions: (lesson.interviewQuestions || []).map((item) => `${item.question}::${item.answer}`).join('\n'),
  practiceTask: lesson.practiceTask || '',
  tags: (lesson.tags || []).join(', '),
  estimatedMinutes: lesson.estimatedMinutes || 45,
  status: lesson.status || 'published'
} : { ...emptyForm, topic: topics[0]?._id || '' };

const parseInterviewQuestions = (value) => value.split('\n').map((line) => line.trim()).filter(Boolean).map((line) => {
  const [question, ...answer] = line.split('::');
  return { question: question?.trim(), answer: answer.join('::').trim() || 'Add answer later.' };
}).filter((item) => item.question);

export default function LessonForm({ topics = [], initialData = null, onSubmit, onCancel, isLoading }) {
  const { register, handleSubmit, reset, formState: { errors } } = useForm({ resolver: zodResolver(lessonFormSchema), defaultValues: toForm(initialData, topics) });
  useEffect(() => reset(toForm(initialData, topics)), [initialData, topics, reset]);

  const submit = (values) => onSubmit({
    ...values,
    estimatedMinutes: Number(values.estimatedMinutes) || 45,
    tags: values.tags.split(',').map((item) => item.trim()).filter(Boolean),
    commonMistakes: values.commonMistakes.split('\n').map((item) => item.trim()).filter(Boolean),
    interviewQuestions: parseInterviewQuestions(values.interviewQuestions)
  });

  return <form onSubmit={handleSubmit(submit)} className="grid gap-3 rounded-[2rem] bg-white/70 p-5">
    <div className="grid gap-3 md:grid-cols-2"><Input label="Title" error={errors.title?.message} {...register('title')} /><Select label="Topic" {...register('topic')}>{topics.map((topic) => <option key={topic._id} value={topic._id}>{topic.title}</option>)}</Select></div>
    <div className="grid gap-3 md:grid-cols-3"><Select label="Difficulty" {...register('difficulty')}><option value="beginner">Beginner</option><option value="intermediate">Intermediate</option><option value="advanced">Advanced</option></Select><Select label="Status" {...register('status')}><option value="draft">Draft</option><option value="published">Published</option><option value="archived">Archived</option></Select><Input label="Minutes" type="number" error={errors.estimatedMinutes?.message} {...register('estimatedMinutes')} /></div>
    <FormTextarea label="Theory" rows={4} registration={register('theory')} error={errors.theory?.message} />
    <FormTextarea label="Code example" rows={4} registration={register('codeExample')} error={errors.codeExample?.message} />
    <FormTextarea label="Code explanation" rows={3} registration={register('codeExplanation')} error={errors.codeExplanation?.message} />
    <FormTextarea label="Common mistakes, one per line" rows={3} registration={register('commonMistakes')} error={errors.commonMistakes?.message} />
    <Input label="Interview definition" error={errors.interviewDefinition?.message} {...register('interviewDefinition')} />
    <FormTextarea label="Interview Q&A: question::answer, one per line" rows={3} registration={register('interviewQuestions')} error={errors.interviewQuestions?.message} />
    <Input label="Practice task" error={errors.practiceTask?.message} {...register('practiceTask')} />
    <Input label="Tags comma separated" error={errors.tags?.message} {...register('tags')} />
    <div className="flex gap-2"><Button disabled={isLoading}>{isLoading ? 'Saving...' : initialData ? 'Update lesson' : 'Create lesson'}</Button>{onCancel && <Button type="button" variant="secondary" onClick={onCancel}>Cancel edit</Button>}</div>
  </form>;
}
