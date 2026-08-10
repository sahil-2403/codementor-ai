import { z } from 'zod';

const difficultyEnum = z.enum(['beginner', 'intermediate', 'advanced']);
const technologyTypeEnum = z.enum(['language', 'framework', 'runtime', 'database', 'library', 'platform', 'tool']);
const courseCategoryEnum = z.enum(['fundamentals', 'frontend', 'backend', 'fullstack', 'database', 'mobile', 'devops', 'data-ai', 'interview', 'other']);
const objectId = z.string().trim().regex(/^[a-f\d]{24}$/i, 'Select a valid item');
const optionalObjectId = z.union([objectId, z.literal('')]).default('');
const csvText = z.string().default('');

const csv = (value) => Array.from(new Set(
  String(value || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
));

export const technologyFormSchema = z.object({
  name: z.string().trim().min(2, 'Technology name is required').max(100),
  type: technologyTypeEnum,
  description: z.string().trim().max(1000).default(''),
  parentTechnology: optionalObjectId,
  iconKey: z.string().trim().max(80).default(''),
  order: z.coerce.number().int().min(0, 'Order cannot be negative')
});

export const courseFormSchema = z.object({
  title: z.string().trim().min(2, 'Course title is required').max(160),
  description: z.string().trim().max(2000).default(''),
  category: courseCategoryEnum,
  technologies: z.array(objectId).min(1, 'Select at least one technology'),
  primaryTechnology: optionalObjectId,
  availableLevels: z.array(difficultyEnum).min(1, 'Enable at least one learner level'),
  recommendedPrerequisites: z.array(objectId).default([]),
  featured: z.boolean().default(false),
  order: z.coerce.number().int().min(0, 'Order cannot be negative')
}).superRefine((values, context) => {
  if (values.primaryTechnology && !values.technologies.includes(values.primaryTechnology)) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ['primaryTechnology'], message: 'Primary technology must be selected above' });
  }
  if (new Set(values.technologies).size !== values.technologies.length) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ['technologies'], message: 'Choose each technology only once' });
  }
  if (new Set(values.recommendedPrerequisites).size !== values.recommendedPrerequisites.length) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ['recommendedPrerequisites'], message: 'Choose each prerequisite only once' });
  }
});

const learningPathCourseFormSchema = z.object({
  course: objectId,
  defaultLevel: z.union([difficultyEnum, z.literal('')]).default(''),
  required: z.boolean().default(true)
});

export const learningPathFormSchema = z.object({
  title: z.string().trim().min(2, 'Learning path title is required').max(160),
  description: z.string().trim().max(2000).default(''),
  category: courseCategoryEnum,
  technologies: z.array(objectId).default([]),
  availableLevels: z.array(difficultyEnum).min(1, 'Enable at least one learner level'),
  courses: z.array(learningPathCourseFormSchema).min(1, 'Add at least one course'),
  featured: z.boolean().default(false),
  order: z.coerce.number().int().min(0, 'Order cannot be negative')
}).superRefine((values, context) => {
  const courseIds = values.courses.map((entry) => entry.course);
  if (new Set(courseIds).size !== courseIds.length) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ['courses'], message: 'A course can appear only once in a learning path' });
  }
});

export const topicFormSchema = z.object({
  course: objectId,
  title: z.string().trim().min(2, 'Topic title is required'),
  category: z.string().trim().min(2, 'Category is required'),
  difficulty: difficultyEnum,
  tagsText: csvText,
  order: z.coerce.number().int().min(0, 'Order cannot be negative')
});

export const lessonFormSchema = z.object({
  course: objectId,
  title: z.string().trim().min(2, 'Lesson title is required'),
  topic: objectId,
  difficulty: difficultyEnum,
  theory: z.string().trim().min(10, 'Theory should explain the concept'),
  codeExample: z.string().default(''),
  codeExplanation: z.string().default(''),
  commonMistakesText: csvText,
  interviewDefinition: z.string().default(''),
  interviewQuestionsText: z.string().default(''),
  practiceTask: z.string().default(''),
  tagsText: csvText,
  estimatedMinutes: z.coerce.number().int().min(5, 'Use at least 5 minutes').max(300, 'Keep lessons within 300 minutes')
});

export const questionFormSchema = z.object({
  course: objectId,
  question: z.string().trim().min(5, 'Question is required'),
  type: z.enum(['mcq', 'code_output', 'short_answer']),
  codeSnippet: z.string().default(''),
  optionsText: csvText,
  correctAnswer: z.string().trim().min(1, 'Correct answer is required'),
  explanation: z.string().default(''),
  topic: objectId,
  difficulty: difficultyEnum,
  relatedLesson: optionalObjectId,
  tagsText: csvText
}).superRefine((values, context) => {
  if (values.type === 'mcq') {
    const options = csv(values.optionsText);
    if (options.length < 2) {
      context.addIssue({ code: z.ZodIssueCode.custom, path: ['optionsText'], message: 'Add at least two answer options' });
    }
    if (options.length > 6) {
      context.addIssue({ code: z.ZodIssueCode.custom, path: ['optionsText'], message: 'Use at most six answer options' });
    }
    if (values.correctAnswer && !options.includes(values.correctAnswer)) {
      context.addIssue({ code: z.ZodIssueCode.custom, path: ['correctAnswer'], message: 'Correct answer must exactly match one option' });
    }
  }
  if (values.type === 'code_output' && !values.codeSnippet.trim()) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ['codeSnippet'], message: 'Add the code snippet learners should evaluate' });
  }
});

export const parseQuestionForm = (values, bank = 'quiz') => ({
  course: values.course,
  question: values.question.trim(),
  bank,
  type: values.type,
  codeSnippet: values.codeSnippet || '',
  options: values.type === 'short_answer' ? [] : csv(values.optionsText),
  correctAnswer: values.correctAnswer.trim(),
  explanation: values.explanation || '',
  topic: values.topic,
  difficulty: values.difficulty,
  relatedLesson: bank === 'quiz' ? (values.relatedLesson || null) : null,
  tags: csv(values.tagsText)
});

export const interviewQuestionFormSchema = z.object({
  course: objectId,
  question: z.string().trim().min(5, 'Question is required'),
  topicRef: objectId,
  type: z.enum(['definition', 'concept', 'output', 'scenario', 'debugging', 'system_design_lite']),
  difficulty: difficultyEnum,
  expectedAnswer: z.string().trim().min(1, 'Expected answer is required'),
  answerChecklistText: csvText,
  tagsText: csvText
});

export const parseInterviewQuestionForm = (values) => ({
  course: values.course,
  question: values.question.trim(),
  topicRef: values.topicRef,
  type: values.type,
  difficulty: values.difficulty,
  expectedAnswer: values.expectedAnswer.trim(),
  answerChecklist: csv(values.answerChecklistText),
  tags: csv(values.tagsText)
});

const roadmapModuleFormSchema = z.object({
  title: z.string().trim().min(2, 'Module title is required'),
  description: z.string().default(''),
  durationDays: z.coerce.number().int().min(1, 'Use at least 1 day').max(90, 'Keep a module within 90 days'),
  lessons: z.array(objectId).default([]),
  quizTags: z.array(z.string().trim().min(1)).default([])
});

export const templateFormSchema = z.object({
  course: objectId,
  level: difficultyEnum,
  title: z.string().trim().min(2, 'Title is required'),
  description: z.string().default(''),
  modules: z.array(roadmapModuleFormSchema).min(1, 'Add at least one roadmap module')
}).superRefine((values, context) => {
  const totalDays = values.modules.reduce((sum, module) => sum + Number(module.durationDays || 0), 0);
  if (totalDays > 365) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ['modules'], message: 'The full roadmap must be 365 days or less' });
  }
  const lessonIds = values.modules.flatMap((module) => module.lessons || []);
  if (new Set(lessonIds).size !== lessonIds.length) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ['modules'], message: 'A lesson can appear only once in a roadmap template' });
  }
});
