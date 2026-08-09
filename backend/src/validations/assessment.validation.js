import { z } from 'zod';
import { objectIdSchema } from '../utils/zod.js';

export const startAssessmentSchema = z.object({
  query: z.object({
    level: z.enum(['intermediate', 'advanced']).default('intermediate'),
    enrollmentId: objectIdSchema
  })
});

export const submitAssessmentSchema = z.object({
  body: z.object({
    enrollmentId: objectIdSchema,
    sessionId: objectIdSchema,
    answers: z.array(z.object({
      questionId: objectIdSchema,
      selectedAnswer: z.string().trim().max(2000)
    })).min(1).max(80)
  })
});
