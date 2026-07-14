import { z } from 'zod';
import { objectIdSchema } from '../utils/zod.js';

export const goalSchema = z.object({
  body: z.object({
    goalKey: z.string().trim().default('junior-mern-stack'),
    goalTitle: z.string().trim().default('Junior MERN Stack Developer'),
    level: z.enum(['beginner', 'intermediate', 'advanced'])
  })
});

export const preferencesSchema = z.object({
  body: z.object({
    learningGoalId: objectIdSchema,
    dailyStudyTime: z.coerce.number().min(15).max(600),
    targetDurationDays: z.coerce.number().min(7).max(365),
    learningStyle: z.string().trim().min(2).max(80),
    knownBasics: z.array(z.string().trim().max(80)).optional().default([]),
    mainFocus: z.string().trim().min(2).max(120)
  })
});

export const skipAssessmentSchema = z.object({
  body: z.object({ learningGoalId: objectIdSchema })
});
