import { z } from 'zod';
import { parseAIJson, validateAIResponse } from '../domain/aiResponse.js';

export { parseAIJson, validateAIResponse };

export const aiWeakTopicSchema = z.object({
  topic: z.string().min(1),
  score: z.coerce.number().min(0).max(100).default(50)
});

export const roadmapResponseSchema = z.object({
  title: z.string().min(2),
  description: z.string().default(''),
  modules: z.array(z.object({
    title: z.string().min(1),
    description: z.string().default(''),
    order: z.coerce.number().optional(),
    durationDays: z.coerce.number().optional(),
    lessonSlugs: z.array(z.string()).default([]),
    quizTags: z.array(z.string()).default([])
  })).min(1)
});

export const projectReviewResponseSchema = z.object({
  score: z.coerce.number().min(0).max(100),
  summary: z.string().min(1),
  strengths: z.array(z.string()).default([]),
  improvements: z.array(z.string()).default([]),
  checklist: z.array(z.object({
    item: z.string().min(1),
    passed: z.coerce.boolean().default(false),
    feedback: z.string().default('')
  })).default([]),
  weakTopicsDetected: z.array(aiWeakTopicSchema).default([])
});

export const interviewReviewResponseSchema = z.object({
  score: z.coerce.number().min(0).max(100),
  summary: z.string().min(1),
  expectedAnswer: z.string().default(''),
  strengths: z.array(z.string()).default([]),
  improvements: z.array(z.string()).default([]),
  weakTopicsDetected: z.array(aiWeakTopicSchema).default([])
});

export const weeklyReportResponseSchema = z.object({
  summary: z.string().min(1),
  nextWeekFocus: z.array(z.string()).default([])
});
