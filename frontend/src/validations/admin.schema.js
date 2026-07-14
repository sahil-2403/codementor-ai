import { z } from 'zod';

const statusEnum = z.enum(['draft', 'published', 'archived']);
const difficultyEnum = z.enum(['beginner', 'intermediate', 'advanced']);

export const lessonFormSchema = z.object({
  title: z.string().trim().min(2, 'Title is required'),
  topic: z.string().trim().min(1, 'Topic is required'),
  difficulty: difficultyEnum,
  theory: z.string().trim().min(10, 'Theory should explain the concept'),
  codeExample: z.string().default(''),
  codeExplanation: z.string().default(''),
  commonMistakes: z.string().default(''),
  interviewDefinition: z.string().default(''),
  interviewQuestions: z.string().default(''),
  practiceTask: z.string().default(''),
  tags: z.string().default(''),
  estimatedMinutes: z.coerce.number().min(5).max(300),
  status: statusEnum
});

export const questionFormSchema = z.object({
  question: z.string().trim().min(5, 'Question is required'),
  type: z.enum(['mcq', 'code_output', 'short_answer']),
  topic: z.string().trim().min(1, 'Topic is required'),
  difficulty: difficultyEnum,
  options: z.string().default(''),
  correctAnswer: z.string().trim().min(1, 'Correct answer is required'),
  explanation: z.string().default(''),
  tags: z.string().default(''),
  status: statusEnum
});

const roadmapModuleSchema = z.object({
  title: z.string().min(2),
  description: z.string().default(''),
  order: z.coerce.number().default(0),
  durationDays: z.coerce.number().default(7),
  lessonSlugs: z.array(z.string()).default([]),
  quizTags: z.array(z.string()).default([])
});

export const templateFormSchema = z.object({
  goalKey: z.string().trim().min(2, 'Goal key is required'),
  level: difficultyEnum,
  title: z.string().trim().min(2, 'Title is required'),
  description: z.string().default(''),
  estimatedDurationDays: z.coerce.number().min(1).max(365),
  status: statusEnum,
  modulesText: z.string().refine((value) => {
    try { return z.array(roadmapModuleSchema).safeParse(JSON.parse(value)).success; } catch { return false; }
  }, 'Modules must be valid JSON matching the roadmap module schema')
});
