import { RoadmapTemplate } from '../models/RoadmapTemplate.js';
import { Lesson } from '../models/Lesson.js';
import { QuizQuestion } from '../models/QuizQuestion.js';
import { ApiError } from '../utils/ApiError.js';
import { CACHE_TTL, getOrSetCache } from './cache.service.js';
import { cacheKeys } from './cacheKeys.service.js';

export const getPublishedTemplate = async ({ goalKey, level }) => {
  const cacheKey = cacheKeys.template({ goalKey, level });
  const template = await getOrSetCache(cacheKey, async () => RoadmapTemplate.findOne({ goalKey, level, status: 'published' }).lean(), CACHE_TTL.LONG);
  if (!template) throw new ApiError(404, `No roadmap template found for ${goalKey}/${level}`);
  return template;
};

const resolveModulesWithoutCache = async (template) => {
  const modules = [];

  for (const module of template.modules) {
    const lessons = await Lesson.find({ slug: { $in: module.lessonSlugs }, status: 'published' }).select('_id slug').lean();
    const lessonOrder = new Map(module.lessonSlugs.map((slug, index) => [slug, index]));
    const orderedLessons = lessons
      .sort((a, b) => (lessonOrder.get(a.slug) ?? 999) - (lessonOrder.get(b.slug) ?? 999))
      .map((lesson, index) => ({ lesson: lesson._id, status: module.order === 1 ? 'available' : 'locked', order: index + 1 }));

    const questions = await QuizQuestion.find({
      $and: [
        { tags: { $in: module.quizTags } },
        { status: 'published' },
        { $or: [{ bank: 'quiz' }, { bank: { $exists: false } }] }
      ]
    }).limit(8).select('_id').lean();

    modules.push({
      title: module.title,
      description: module.description,
      order: module.order,
      durationDays: module.durationDays,
      status: module.order === 1 ? 'available' : 'locked',
      lessons: orderedLessons,
      quizQuestions: questions.map((question) => question._id)
    });
  }

  return modules;
};

export const resolveTemplateModules = async (template) => {
  const templateId = template._id?.toString();
  // AI-personalized roadmaps may reuse the same template id while modifying module descriptions/order.
  // Bypass the resolved-template cache so personalized module structure is not overwritten by stale cached modules.
  if (!templateId || template._aiGenerated) return resolveModulesWithoutCache(template);
  return getOrSetCache(cacheKeys.resolvedTemplate(templateId), () => resolveModulesWithoutCache(template), CACHE_TTL.LONG);
};
