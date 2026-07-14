import { z } from 'zod';

export const interviewAnswerSchema = z.object({
  answer: z.string().trim().min(10, 'Write at least a few meaningful lines').max(3000, 'Answer is too long')
});
