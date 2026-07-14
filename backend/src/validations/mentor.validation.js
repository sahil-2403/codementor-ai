import { z } from 'zod';
import { objectIdSchema } from '../utils/zod.js';

export const askMentorSchema = z.object({
  body: z.object({
    message: z.string().trim().min(2).max(1000),
    lessonId: objectIdSchema.optional(),
    promptType: z.string().trim().max(60).optional()
  })
});
