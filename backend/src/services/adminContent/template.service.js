import { RoadmapTemplate } from '../../models/RoadmapTemplate.js';
import { Lesson } from '../../models/Lesson.js';
import { QuizQuestion } from '../../models/QuizQuestion.js';
import { ApiError } from '../../utils/ApiError.js';
import { makeSearchRegex } from '../../utils/pagination.js';
import { listWithPagination } from '../listQuery.service.js';
import { invalidateContentCache } from '../cacheInvalidation.service.js';
import {
  PUBLISHABLE_STATUS,
  cleanTemplateModules,
  ensureEditable,
  ensureFound,
  transitionStatus
} from './common.js';

const assertTemplateIdentityAvailable = async ({ goalKey, level, excludeId = null }) => {
  const filter = { goalKey, level };
  if (excludeId) filter._id = { $ne: excludeId };
  const existing = await RoadmapTemplate.findOne(filter).select('_id title status').lean();
  if (existing) {
    throw new ApiError(409, 'A roadmap template already exists for this goal and level', [
      { field: 'goalKey', message: `Existing template: ${existing.title}` },
      { field: 'level', message: 'Each goal and level combination can have only one template' }
    ], 'ROADMAP_TEMPLATE_ALREADY_EXISTS');
  }
};

const assertTemplatePublishable = async (template) => {
  const errors = [];
  const modules = template.modules || [];
  if (!modules.length) errors.push({ field: 'modules', message: 'Add at least one roadmap module' });

  const orders = new Set();
  const allLessonSlugs = [];
  const allQuizTags = [];
  modules.forEach((module, index) => {
    if (!String(module.title || '').trim()) errors.push({ field: `modules.${index}.title`, message: 'Module title is required' });
    if (!Number.isInteger(module.order) || module.order < 1) errors.push({ field: `modules.${index}.order`, message: 'Module order must be a positive integer' });
    if (orders.has(module.order)) errors.push({ field: `modules.${index}.order`, message: 'Module order values must be unique' });
    orders.add(module.order);
    if (!module.lessonSlugs?.length) errors.push({ field: `modules.${index}.lessonSlugs`, message: 'Add at least one lesson' });
    if (!module.quizTags?.length) errors.push({ field: `modules.${index}.quizTags`, message: 'Add at least one quiz tag' });
    allLessonSlugs.push(...(module.lessonSlugs || []));
    allQuizTags.push(...(module.quizTags || []));
  });

  if (new Set(allLessonSlugs).size !== allLessonSlugs.length) {
    errors.push({ field: 'modules', message: 'A lesson can appear only once in a roadmap template' });
  }
  if (errors.length) throw new ApiError(400, 'Roadmap template is not ready to publish', errors, 'CONTENT_NOT_READY');

  const [lessons, questions] = await Promise.all([
    Lesson.find({ slug: { $in: allLessonSlugs }, status: PUBLISHABLE_STATUS.PUBLISHED }).select('slug').lean(),
    QuizQuestion.find({ tags: { $in: allQuizTags }, status: PUBLISHABLE_STATUS.PUBLISHED }).select('tags').lean()
  ]);

  const publishedLessonSlugs = new Set(lessons.map((lesson) => lesson.slug));
  const missingLessons = allLessonSlugs.filter((slug) => !publishedLessonSlugs.has(slug));
  if (missingLessons.length) {
    throw new ApiError(400, 'Roadmap template references lessons that are missing or not published',
      missingLessons.map((slug) => ({ field: 'modules.lessonSlugs', message: slug })),
      'CONTENT_REFERENCE_INVALID');
  }

  const publishedQuestionTags = new Set(questions.flatMap((question) => question.tags || []));
  const missingQuizTags = Array.from(new Set(allQuizTags)).filter((tag) => !publishedQuestionTags.has(tag));
  if (missingQuizTags.length) {
    throw new ApiError(400, 'Roadmap template references quiz tags with no published questions',
      missingQuizTags.map((tag) => ({ field: 'modules.quizTags', message: tag })),
      'CONTENT_REFERENCE_INVALID');
  }
};

export const listTemplates = async (query = {}) => {
  const search = makeSearchRegex(query.search);
  const filter = {};
  if (search) filter.$or = [{ title: search }, { description: search }, { goalKey: search }];
  if (query.status) filter.status = query.status;
  if (query.level) filter.level = query.level;
  if (query.goalKey) filter.goalKey = query.goalKey;
  return listWithPagination({ model: RoadmapTemplate, filter, query: { sortBy: 'level', sortOrder: 'asc', ...query } });
};

export const getTemplate = async (id) => ensureFound(await RoadmapTemplate.findById(id), 'Roadmap template');

export const createTemplate = async (payload) => {
  await assertTemplateIdentityAvailable(payload);
  const template = await RoadmapTemplate.create({
    ...payload,
    modules: cleanTemplateModules(payload.modules),
    status: PUBLISHABLE_STATUS.DRAFT
  });
  await invalidateContentCache();
  return template;
};

export const updateTemplate = async ({ id, payload }) => {
  const template = ensureFound(await RoadmapTemplate.findById(id), 'Roadmap template');
  ensureEditable(template, 'Roadmap template');
  const nextGoalKey = payload.goalKey || template.goalKey;
  const nextLevel = payload.level || template.level;
  if (nextGoalKey !== template.goalKey || nextLevel !== template.level) {
    await assertTemplateIdentityAvailable({ goalKey: nextGoalKey, level: nextLevel, excludeId: id });
  }
  const normalized = {
    ...payload,
    ...(payload.modules ? { modules: cleanTemplateModules(payload.modules) } : {})
  };
  delete normalized.status;
  Object.assign(template, normalized);
  await template.save();
  await invalidateContentCache();
  return template;
};

export const changeTemplateStatus = (args) => transitionStatus({
  model: RoadmapTemplate,
  label: 'Roadmap template',
  validatePublish: assertTemplatePublishable,
  ...args
});

export const duplicateTemplate = async (id) => {
  const original = ensureFound(await RoadmapTemplate.findById(id), 'Roadmap template');
  const duplicate = await RoadmapTemplate.create({
    goalKey: `${original.goalKey}-copy-${Date.now()}`,
    level: original.level,
    title: `${original.title} Copy`,
    description: original.description,
    modules: original.modules,
    estimatedDurationDays: original.estimatedDurationDays,
    status: PUBLISHABLE_STATUS.DRAFT
  });
  await invalidateContentCache();
  return duplicate;
};
