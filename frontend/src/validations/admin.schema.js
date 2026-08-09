import { z } from 'zod';

const difficultyEnum = z.enum(['beginner', 'intermediate', 'advanced']);

export const lessonFormSchema = z.object({
  title: z.string().trim().min(2, 'Title is required'),
  topic: z.string().trim().min(1, 'Topic is required'),
  difficulty: difficultyEnum,
  theory: z.string().trim().min(10, 'Theory should explain the concept'),
  codeExample: z.string().default(''),
  codeExplanation: z.string().default(''),
  commonMistakes: z.array(z.object({
    value: z.string().trim().min(1, 'Enter the mistake or remove this row')
  })).default([]),
  interviewDefinition: z.string().default(''),
  interviewQuestions: z.array(z.object({
    question: z.string().trim().min(1, 'Question is required'),
    answer: z.string().trim().min(1, 'Expected answer is required')
  })).default([]),
  practiceTask: z.string().default(''),
  tags: z.string().default(''),
  estimatedMinutes: z.coerce.number().min(5).max(300)
});

export const questionFormSchema = z.object({
  question: z.string().trim().min(5, 'Question is required'),
  type: z.enum(['mcq', 'code_output', 'short_answer']),
  topic: z.string().trim().min(1, 'Topic is required'),
  relatedLesson: z.string().default(''),
  difficulty: difficultyEnum,
  codeSnippet: z.string().default(''),
  options: z.array(z.object({
    value: z.string().trim().min(1, 'Enter an option or remove this row')
  })).default([]),
  correctOptionIndex: z.string().default(''),
  correctAnswer: z.string().default(''),
  explanation: z.string().default(''),
  tags: z.string().default('')
}).superRefine((values, context) => {
  if (values.type === 'mcq') {
    if (values.options.length < 2) {
      context.addIssue({ code: z.ZodIssueCode.custom, path: ['options'], message: 'Add at least two answer options' });
    }
    const correctIndex = Number(values.correctOptionIndex);
    if (!Number.isInteger(correctIndex) || !values.options[correctIndex]?.value?.trim()) {
      context.addIssue({ code: z.ZodIssueCode.custom, path: ['correctOptionIndex'], message: 'Choose the correct option' });
    }
  } else if (!values.correctAnswer.trim()) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ['correctAnswer'], message: 'Correct answer is required' });
  }
});

export const interviewQuestionFormSchema = z.object({
  question: z.string().trim().min(5, 'Question is required'),
  topicRef: z.string().trim().min(1, 'Topic is required'),
  type: z.enum(['definition', 'concept', 'output', 'scenario', 'debugging', 'system_design_lite']),
  difficulty: difficultyEnum,
  expectedAnswer: z.string().trim().min(1, 'Expected answer is required'),
  answerChecklist: z.array(z.object({
    value: z.string().trim().min(1, 'Enter a review point or remove this row')
  })).default([]),
  tags: z.string().default('')
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
  modulesText: z.string().refine((value) => {
    try { return z.array(roadmapModuleSchema).safeParse(JSON.parse(value)).success; } catch { return false; }
  }, 'Modules must be valid JSON matching the roadmap module schema')
});
