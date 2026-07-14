import { z } from 'zod';
import { objectIdSchema } from '../utils/zod.js';

export const submitInterviewSchema = z.object({
  body: z.object({
    questionId: objectIdSchema,
    answer: z.string().trim().min(10, 'Answer should be at least 10 characters').max(3000)
  })
});
