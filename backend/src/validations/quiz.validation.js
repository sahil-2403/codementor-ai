import { z } from 'zod';
import { objectIdSchema } from '../utils/zod.js';

export const submitQuizSchema = z.object({
  body: z.object({
    moduleId: objectIdSchema,
    answers: z.array(z.object({
      questionId: objectIdSchema,
      selectedAnswer: z.string().trim().max(2000).default('')
    })).min(1).max(50)
  })
});
