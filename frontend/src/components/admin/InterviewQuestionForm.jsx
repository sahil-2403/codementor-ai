import { useEffect } from 'react';
import { useFieldArray, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  ClipboardCheck,
  MessageSquareQuote,
  Plus,
  Settings2,
  Trash2
} from 'lucide-react';
import FormSectionHeader from './FormSectionHeader.jsx';
import Button from '../common/Button.jsx';
import Card from '../common/Card.jsx';
import Input from '../common/Input.jsx';
import Select from '../common/Select.jsx';
import Textarea from '../common/Textarea.jsx';
import { interviewQuestionFormSchema } from '../../validations/admin.schema.js';

const emptyForm = {
  question: '',
  topicRef: '',
  type: 'concept',
  difficulty: 'beginner',
  expectedAnswer: '',
  answerChecklist: [],
  tags: ''
};

const toForm = (question, topics) => {
  if (!question) return { ...emptyForm, topicRef: topics[0]?._id || '' };

  const linkedTopicId = question.topicRef?._id || question.topicRef || topics.find(
    (topic) => topic.title?.toLowerCase() === question.topic?.toLowerCase()
  )?._id || '';

  return {
    question: question.question || '',
    topicRef: linkedTopicId,
    type: question.type || 'concept',
    difficulty: question.difficulty || 'beginner',
    expectedAnswer: question.expectedAnswer || '',
    answerChecklist: (question.answerChecklist || []).map((value) => ({ value })),
    tags: (question.tags || []).join(', ')
  };
};

export default function InterviewQuestionForm({
  topics = [],
  initialData = null,
  onSubmit,
  onCancel,
  isLoading = false
}) {
  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm({
    resolver: zodResolver(interviewQuestionFormSchema),
    defaultValues: toForm(initialData, topics)
  });

  const checklist = useFieldArray({ control, name: 'answerChecklist' });

  useEffect(() => {
    reset(toForm(initialData, topics));
  }, [initialData, topics, reset]);

  const submit = (values) => onSubmit({
    question: values.question,
    topicRef: values.topicRef,
    type: values.type,
    difficulty: values.difficulty,
    expectedAnswer: values.expectedAnswer,
    answerChecklist: values.answerChecklist.map((item) => item.value.trim()).filter(Boolean),
    tags: values.tags.split(',').map((item) => item.trim()).filter(Boolean)
  });

  return (
    <form onSubmit={handleSubmit(submit)} className="space-y-5">
      <Card className="shadow-sm">
        <FormSectionHeader
          icon={MessageSquareQuote}
          eyebrow="Interview question"
          title="Prompt and context"
          description="Create a focused prompt and connect it to the Topic that owns its lifecycle."
        />
        <div className="mt-5 space-y-4">
          <Textarea
            label="Interview question"
            rows={4}
            error={errors.question?.message}
            placeholder="Ask one clear concept, scenario, debugging, or system-design question."
            {...register('question')}
          />
          <div className="grid gap-4 md:grid-cols-3">
            <Select label="Topic" error={errors.topicRef?.message} {...register('topicRef')}>
              {topics.map((topic) => <option key={topic._id} value={topic._id}>{topic.title}</option>)}
            </Select>
            <Select label="Question type" error={errors.type?.message} {...register('type')}>
              <option value="definition">Definition</option>
              <option value="concept">Concept</option>
              <option value="output">Output</option>
              <option value="scenario">Scenario</option>
              <option value="debugging">Debugging</option>
              <option value="system_design_lite">System design lite</option>
            </Select>
            <Select label="Difficulty" error={errors.difficulty?.message} {...register('difficulty')}>
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </Select>
          </div>
        </div>
      </Card>

      <Card className="shadow-sm">
        <FormSectionHeader
          icon={ClipboardCheck}
          eyebrow="Review guidance"
          title="Expected answer and review points"
          description="These fields guide AI feedback after the learner submits an answer."
        />
        <div className="mt-5 space-y-5">
          <Textarea
            label="Expected answer"
            rows={7}
            error={errors.expectedAnswer?.message}
            placeholder="Describe the key ideas a strong answer should cover."
            {...register('expectedAnswer')}
          />

          <div>
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="ui-field-label">Answer review points</p>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">Publishing requires at least one review point.</p>
              </div>
              <Button type="button" variant="secondary" className="gap-2" onClick={() => checklist.append({ value: '' })}>
                <Plus size={15} aria-hidden="true" /> Add review point
              </Button>
            </div>

            <div className="mt-3 space-y-3">
              {checklist.fields.length ? checklist.fields.map((field, index) => (
                <div key={field.id} className="flex items-start gap-3 rounded-surface border border-border bg-surface-secondary/35 p-3">
                  <div className="min-w-0 flex-1">
                    <Input
                      label={`Review point ${index + 1}`}
                      error={errors.answerChecklist?.[index]?.value?.message}
                      placeholder="Example: Explains lexical scope clearly"
                      {...register(`answerChecklist.${index}.value`)}
                    />
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    className="mt-6 min-h-9 w-9 p-0 text-muted-foreground"
                    onClick={() => checklist.remove(index)}
                    aria-label={`Remove review point ${index + 1}`}
                  >
                    <Trash2 size={15} aria-hidden="true" />
                  </Button>
                </div>
              )) : (
                <div className="rounded-surface border border-dashed border-border bg-surface-secondary/25 px-4 py-5 text-sm text-muted-foreground">
                  No review points yet. Add the ideas the learner should mention in a strong answer.
                </div>
              )}
            </div>
          </div>
        </div>
      </Card>

      <Card className="shadow-sm">
        <FormSectionHeader
          icon={Settings2}
          eyebrow="Discovery"
          title="Search tags"
          description="Add concise keywords that help organise and retrieve this interview question."
        />
        <div className="mt-5">
          <Input
            label="Tags"
            error={errors.tags?.message}
            placeholder="closures, scope, javascript"
            {...register('tags')}
          />
          <p className="mt-2 text-xs leading-5 text-muted-foreground">Use commas to separate keywords.</p>
        </div>
      </Card>

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        {onCancel ? <Button type="button" variant="secondary" onClick={onCancel} disabled={isLoading}>Cancel</Button> : null}
        <Button type="submit" isLoading={isLoading} loadingLabel="Saving question...">
          {initialData ? 'Save changes' : 'Create interview-question draft'}
        </Button>
      </div>
    </form>
  );
}
