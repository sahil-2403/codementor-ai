import { z } from 'zod';
import { objectIdSchema } from '../utils/zod.js';

const goalFields = {
  goalKey: z.string().trim().min(2).max(100).default('junior-mern-stack'),
  goalTitle: z.string().trim().min(2).max(160).default('Junior MERN Stack Developer')
};

export const goalSchema = z.object({
  body: z.object({
    ...goalFields,
    level: z.enum(['beginner', 'intermediate', 'advanced']).optional()
  })
});

export const saveGoalSchema = z.object({ body: z.object(goalFields) });

export const levelSchema = z.object({
  body: z.object({
    learningGoalId: objectIdSchema.optional(),
    level: z.enum(['beginner', 'intermediate', 'advanced'])
  })
});

export const preferencesSchema = z.object({
  body: z.object({
    learningGoalId: objectIdSchema.optional(),
    dailyStudyTime: z.coerce.number().min(15).max(600),
    targetDurationDays: z.coerce.number().min(7).max(365),
    learningStyle: z.string().trim().min(2).max(80),
    knownBasics: z.array(z.string().trim().max(80)).optional().default([]),
    mainFocus: z.string().trim().min(2).max(120)
  })
});

export const skipAssessmentSchema = z.object({
  body: z.object({ learningGoalId: objectIdSchema.optional() })
});
