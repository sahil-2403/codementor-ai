import { z } from 'zod';

export const mentorAskSchema = z.object({
  message: z.string().trim().min(3, 'Ask a meaningful question').max(1000, 'Question is too long'),
  promptType: z.enum(['freeform', 'simple_explanation', 'real_project_example', 'interview_answer', 'practice_question', 'revision_notes']).default('freeform')
});
