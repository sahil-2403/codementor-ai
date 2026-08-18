import { z } from 'zod';
import { parseAIJson, validateAIResponse } from '../domain/aiResponse.js';

export { parseAIJson, validateAIResponse };

export const aiWeakTopicSchema = z.object({
  topic: z.string().min(1),
  score: z.coerce.number().min(0).max(100).default(50)
});

export const roadmapResponseSchema = z.object({
  summary: z.string().min(1),
  focusAreas: z.array(z.object({
    focusKey: z.string().min(1),
    advice: z.string().min(1)
  })).default([])
});

export const practiceReviewResponseSchema = z.object({
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
  improvements: z.array(z.string()).default([]),
  nextWeekFocus: z.array(z.string()).default([])
});
