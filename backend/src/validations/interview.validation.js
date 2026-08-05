import { z } from 'zod';
import { objectIdSchema } from '../utils/zod.js';

const interviewTypes = ['definition', 'concept', 'output', 'scenario', 'debugging', 'system_design_lite'];
const difficulties = ['beginner', 'intermediate', 'advanced'];

export const listInterviewQuestionsSchema = z.object({
  query: z.object({
    topic: z.string().trim().min(1).max(80).optional(),
    difficulty: z.enum(difficulties).optional(),
    type: z.enum(interviewTypes).optional()
  })
});

export const submitInterviewSchema = z.object({
  body: z.object({
    questionId: objectIdSchema,
    answer: z.string().trim().min(10, 'Answer should be at least 10 characters').max(3000)
  })
});
