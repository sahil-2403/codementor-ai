import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Button from '../common/Button.jsx';
import Input from '../common/Input.jsx';
import Select from '../common/Select.jsx';
import { questionFormSchema } from '../../validations/admin.schema.js';

const emptyForm = { question: '', type: 'mcq', topic: '', difficulty: 'beginner', options: 'Yes,No', correctAnswer: '', explanation: '', tags: '', status: 'published' };
const toForm = (question, topics) => question ? {
  question: question.question || '',
  type: question.type || 'mcq',
  topic: question.topic?._id || question.topic || topics[0]?._id || '',
  difficulty: question.difficulty || 'beginner',
  options: (question.options || []).join(', '),
  correctAnswer: question.correctAnswer || '',
  explanation: question.explanation || '',
  tags: (question.tags || []).join(', '),
  status: question.status || 'published'
} : { ...emptyForm, topic: topics[0]?._id || '' };

export default function QuestionForm({ topics = [], initialData = null, onSubmit, onCancel, isLoading }) {
  const { register, handleSubmit, reset, formState: { errors } } = useForm({ resolver: zodResolver(questionFormSchema), defaultValues: toForm(initialData, topics) });
  useEffect(() => reset(toForm(initialData, topics)), [initialData, topics, reset]);
  const submit = (values) => onSubmit({ ...values, options: values.options.split(',').map((item) => item.trim()).filter(Boolean), tags: values.tags.split(',').map((item) => item.trim()).filter(Boolean) });

  return <form onSubmit={handleSubmit(submit)} className="grid gap-3 rounded-[2rem] bg-white/70 p-5">
    <Input label="Question" error={errors.question?.message} {...register('question')} />
    <div className="grid gap-3 md:grid-cols-2"><Select label="Topic" {...register('topic')}>{topics.map((topic) => <option key={topic._id} value={topic._id}>{topic.title}</option>)}</Select><Select label="Type" {...register('type')}><option value="mcq">MCQ</option><option value="code_output">Code output</option><option value="short_answer">Short answer</option></Select></div>
    <div className="grid gap-3 md:grid-cols-2"><Select label="Difficulty" {...register('difficulty')}><option value="beginner">Beginner</option><option value="intermediate">Intermediate</option><option value="advanced">Advanced</option></Select><Select label="Status" {...register('status')}><option value="draft">Draft</option><option value="published">Published</option><option value="archived">Archived</option></Select></div>
    <Input label="Options comma separated" error={errors.options?.message} {...register('options')} />
    <Input label="Correct answer" error={errors.correctAnswer?.message} {...register('correctAnswer')} />
    <Input label="Explanation" error={errors.explanation?.message} {...register('explanation')} />
    <Input label="Tags comma separated" error={errors.tags?.message} {...register('tags')} />
    <div className="flex gap-2"><Button disabled={isLoading}>{isLoading ? 'Saving...' : initialData ? 'Update question' : 'Create question'}</Button>{onCancel && <Button type="button" variant="secondary" onClick={onCancel}>Cancel edit</Button>}</div>
  </form>;
}
