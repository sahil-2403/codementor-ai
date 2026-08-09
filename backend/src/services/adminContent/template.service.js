import { RoadmapTemplate } from '../../models/RoadmapTemplate.js';
import { Lesson } from '../../models/Lesson.js';
import { QuizQuestion } from '../../models/QuizQuestion.js';
import { ApiError } from '../../utils/ApiError.js';
import { makeSearchRegex } from '../../utils/pagination.js';
import { listWithPagination } from '../listQuery.service.js';
import { invalidateContentCache } from '../cacheInvalidation.service.js';
import {
  PUBLISHABLE_STATUS,
  assertCourseExists,
  cleanTemplateModules,
  ensureEditable,
  ensureFound,
  transitionStatus
} from './common.js';

const templateDurationDays = (modules = []) => modules.reduce((sum, module) => sum + (Number(module.durationDays) || 0), 0);

const assertTemplateIdentityAvailable = async ({ course, level, excludeId = null }) => {
  const filter = { course, level };
  if (excludeId) filter._id = { $ne: excludeId };
  const existing = await RoadmapTemplate.findOne(filter).select('_id title status').lean();
  if (existing) {
    throw new ApiError(409, 'A roadmap template already exists for this course and level', [
      { field: 'course', message: `Existing template: ${existing.title}` },
      { field: 'level', message: 'Each course and level combination can have only one template' }
    ], 'ROADMAP_TEMPLATE_ALREADY_EXISTS');
  }
};

const assertTemplatePublishable = async (template) => {
  const errors = [];
  const modules = template.modules || [];
  const course = await assertCourseExists(template.course, { requirePublished: true });
  if (!(course.availableLevels || []).includes(template.level)) {
    errors.push({ field: 'level', message: 'This level is not enabled for the selected course' });
  }
  if (!modules.length) errors.push({ field: 'modules', message: 'Add at least one roadmap module' });

  const orders = new Set();
  const allLessonIds = [];
  const allQuizTags = [];
  modules.forEach((module, index) => {
    if (!String(module.title || '').trim()) errors.push({ field: `modules.${index}.title`, message: 'Module title is required' });
    if (!Number.isInteger(module.order) || module.order < 1) errors.push({ field: `modules.${index}.order`, message: 'Module order must be a positive integer' });
    if (orders.has(module.order)) errors.push({ field: `modules.${index}.order`, message: 'Module order values must be unique' });
    orders.add(module.order);
    if (!module.lessons?.length) errors.push({ field: `modules.${index}.lessons`, message: 'Add at least one lesson' });
    if (!module.quizTags?.length) errors.push({ field: `modules.${index}.quizTags`, message: 'Add at least one quiz tag' });
    allLessonIds.push(...(module.lessons || []).map((lesson) => lesson?._id || lesson));
    allQuizTags.push(...(module.quizTags || []));
  });

  if (templateDurationDays(modules) > 365) errors.push({ field: 'modules', message: 'The full roadmap must be 365 days or less' });
  if (new Set(allLessonIds.map(String)).size !== allLessonIds.length) {
    errors.push({ field: 'modules', message: 'A lesson can appear only once in a roadmap template' });
  }
  if (errors.length) throw new ApiError(400, 'Roadmap template is not ready to publish', errors, 'CONTENT_NOT_READY');

  const [lessons, questions] = await Promise.all([
    Lesson.find({
      _id: { $in: allLessonIds },
      course: template.course,
      status: PUBLISHABLE_STATUS.PUBLISHED
    }).select('_id').lean(),
    QuizQuestion.find({
      course: template.course,
      bank: 'quiz',
      tags: { $in: allQuizTags },
      status: PUBLISHABLE_STATUS.PUBLISHED
    }).select('tags').lean()
  ]);

  const publishedLessonIds = new Set(lessons.map((lesson) => lesson._id.toString()));
  const missingLessons = allLessonIds.filter((id) => !publishedLessonIds.has(id.toString()));
  if (missingLessons.length) {
    throw new ApiError(
      400,
      'Roadmap template references lessons that are missing, unpublished, or belong to another course',
      missingLessons.map((id) => ({ field: 'modules.lessons', message: id.toString() })),
      'CONTENT_REFERENCE_INVALID'
    );
  }

  const publishedQuestionTags = new Set(questions.flatMap((question) => question.tags || []));
  const missingQuizTags = Array.from(new Set(allQuizTags)).filter((tag) => !publishedQuestionTags.has(tag));
  if (missingQuizTags.length) {
    throw new ApiError(
      400,
      'Roadmap template references quiz tags with no published Quiz-bank questions in this course',
      missingQuizTags.map((tag) => ({ field: 'modules.quizTags', message: tag })),
      'CONTENT_REFERENCE_INVALID'
    );
  }
};

export const listTemplates = async (query = {}) => {
  const search = makeSearchRegex(query.search);
  const filter = {};
  if (search) filter.$or = [{ title: search }, { description: search }];
  if (query.status) filter.status = query.status;
  if (query.level) filter.level = query.level;
  if (query.course) filter.course = query.course;
  return listWithPagination({
    model: RoadmapTemplate,
    filter,
    query: { sortBy: 'level', sortOrder: 'asc', ...query },
    populate: [{ path: 'course', select: 'title slug category status availableLevels' }]
  });
};

export const getTemplate = async (id) => ensureFound(
  await RoadmapTemplate.findById(id)
    .populate('course', 'title slug category status availableLevels')
    .populate('modules.lessons', 'title slug status course topic'),
  'Roadmap template'
);

export const createTemplate = async (payload) => {
  await assertCourseExists(payload.course);
  await assertTemplateIdentityAvailable(payload);
  const modules = cleanTemplateModules(payload.modules);
  const template = await RoadmapTemplate.create({
    ...payload,
    modules,
    estimatedDurationDays: templateDurationDays(modules),
    status: PUBLISHABLE_STATUS.DRAFT
  });
  await invalidateContentCache();
  return template.populate('course', 'title slug category status availableLevels');
};

export const updateTemplate = async ({ id, payload }) => {
  const template = ensureFound(await RoadmapTemplate.findById(id), 'Roadmap template');
  ensureEditable(template, 'Roadmap template');

  if (payload.course && payload.course.toString() !== template.course.toString()) {
    throw new ApiError(409, 'Template course cannot be changed. Create a template under the target course instead.', [], 'TEMPLATE_IDENTITY_IMMUTABLE');
  }
  if (payload.level && payload.level !== template.level) {
    throw new ApiError(409, 'Template level cannot be changed. Create a template for the other level instead.', [], 'TEMPLATE_IDENTITY_IMMUTABLE');
  }

  const normalized = { ...payload };
  delete normalized.status;
  delete normalized.course;
  delete normalized.level;
  delete normalized.estimatedDurationDays;
  if (Object.prototype.hasOwnProperty.call(payload, 'modules')) {
    normalized.modules = cleanTemplateModules(payload.modules);
    normalized.estimatedDurationDays = templateDurationDays(normalized.modules);
  }

  Object.assign(template, normalized);
  if (template.status === PUBLISHABLE_STATUS.PUBLISHED) await assertTemplatePublishable(template);
  await template.save();
  await invalidateContentCache();
  return template.populate('course', 'title slug category status availableLevels');
};

export const changeTemplateStatus = (args) => transitionStatus({
  model: RoadmapTemplate,
  label: 'Roadmap template',
  validatePublish: assertTemplatePublishable,
  populate: [{ path: 'course', select: 'title slug category status availableLevels' }],
  ...args
});

export const deleteTemplate = async (id) => {
  const template = ensureFound(await RoadmapTemplate.findById(id), 'Roadmap template');
  if (template.status === PUBLISHABLE_STATUS.PUBLISHED) {
    throw new ApiError(409, 'Archive the roadmap template before permanently deleting it', [], 'TEMPLATE_DELETE_REQUIRES_ARCHIVE');
  }
  await template.deleteOne();
  await invalidateContentCache();
  return template;
};
