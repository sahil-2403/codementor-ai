import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Button from '../common/Button.jsx';
import Input from '../common/Input.jsx';
import Select from '../common/Select.jsx';
import FormTextarea from '../form/FormTextarea.jsx';
import { interviewQuestionFormSchema } from '../../validations/admin.schema.js';

const emptyForm = {
  question: '',
  topic: '',
  type: 'concept',
  difficulty: 'beginner',
  expectedAnswer: '',
  answerChecklist: '',
  tags: ''
};

const toForm = (question) => question ? {
  question: question.question || '',
  topic: question.topic || '',
  type: question.type || 'concept',
  difficulty: question.difficulty || 'beginner',
  expectedAnswer: question.expectedAnswer || '',
  answerChecklist: (question.answerChecklist || []).join('\n'),
  tags: (question.tags || []).join(', ')
} : emptyForm;

export default function InterviewQuestionForm({ initialData = null, onSubmit, onCancel, isLoading }) {
  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(interviewQuestionFormSchema),
    defaultValues: toForm(initialData)
  });

  useEffect(() => reset(toForm(initialData)), [initialData, reset]);

  const submit = (values) => onSubmit({
    ...values,
    answerChecklist: values.answerChecklist.split('\n').map((item) => item.trim()).filter(Boolean),
    tags: values.tags.split(',').map((item) => item.trim()).filter(Boolean)
  });

  return <form onSubmit={handleSubmit(submit)} className="grid gap-4 rounded-panel bg-surface-secondary p-5">
    <FormTextarea label="Interview question" rows={3} registration={register('question')} error={errors.question?.message} />
    <div className="grid gap-3 md:grid-cols-2">
      <Input label="Topic" error={errors.topic?.message} {...register('topic')} />
      <Select label="Question type" error={errors.type?.message} {...register('type')}>
        <option value="definition">Definition</option>
        <option value="concept">Concept</option>
        <option value="output">Output</option>
        <option value="scenario">Scenario</option>
        <option value="debugging">Debugging</option>
        <option value="system_design_lite">System design lite</option>
      </Select>
    </div>
    <Select label="Difficulty" error={errors.difficulty?.message} {...register('difficulty')}>
      <option value="beginner">Beginner</option>
      <option value="intermediate">Intermediate</option>
      <option value="advanced">Advanced</option>
    </Select>
    <FormTextarea label="Expected answer" rows={5} registration={register('expectedAnswer')} error={errors.expectedAnswer?.message} />
    <FormTextarea label="Answer checklist, one item per line" rows={4} registration={register('answerChecklist')} error={errors.answerChecklist?.message} />
    <Input label="Tags, comma separated" error={errors.tags?.message} {...register('tags')} />
    <p className="text-sm leading-6 text-muted-foreground">Drafts may be incomplete. Publishing requires an expected answer of at least 20 characters and one checklist item.</p>
    <div className="flex flex-wrap gap-2">
      <Button type="submit" isLoading={isLoading} loadingLabel="Saving question...">{initialData ? 'Update question' : 'Create draft'}</Button>
      {onCancel ? <Button type="button" variant="secondary" onClick={onCancel} disabled={isLoading}>Cancel edit</Button> : null}
    </div>
  </form>;
}
