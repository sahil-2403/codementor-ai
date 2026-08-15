import { z } from 'zod';

const csv = (value) => String(value || '').split(',').map((item) => item.trim()).filter(Boolean);

export const practiceTaskFormSchema = z.object({
  course: z.string().min(1, 'Select a Course'),
  title: z.string().trim().min(2, 'Title is required').max(180),
  description: z.string().trim().min(10, 'Description must contain at least 10 characters').max(4000),
  moduleTitle: z.string().trim().max(180).optional().default(''),
  topicOrder: z.coerce.number().int().min(0).default(0),
  solution: z.string().optional().default(''),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced']),
  relatedLessons: z.array(z.string()).default([]),
  requirementsText: z.string().optional().default(''),
  starterHintsText: z.string().optional().default(''),
  expectedOutput: z.string().optional().default(''),
  evaluationChecklistText: z.string().optional().default(''),
  tagsText: z.string().optional().default(''),
  estimatedMinutes: z.coerce.number().int().min(15).max(1440).default(90)
});

export const parsePracticeTaskForm = (values) => ({
  course: values.course,
  title: values.title.trim(),
  description: values.description.trim(),
  moduleTitle: values.moduleTitle.trim(),
  topicOrder: Number(values.topicOrder) || 0,
  solution: values.solution || '',
  difficulty: values.difficulty,
  relatedLessons: values.relatedLessons || [],
  requirements: csv(values.requirementsText),
  starterHints: csv(values.starterHintsText),
  expectedOutput: values.expectedOutput || '',
  evaluationChecklist: csv(values.evaluationChecklistText),
  tags: csv(values.tagsText),
  estimatedMinutes: Number(values.estimatedMinutes) || 90
});
