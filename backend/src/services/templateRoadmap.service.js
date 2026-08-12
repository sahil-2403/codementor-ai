import { RoadmapTemplate } from '../models/RoadmapTemplate.js';
import { Lesson } from '../models/Lesson.js';
import { QuizQuestion } from '../models/QuizQuestion.js';
import { ApiError } from '../utils/ApiError.js';

export const getPublishedTemplate = async ({ courseId, level }) => {
  const template = await RoadmapTemplate.findOne({
    course: courseId,
    level,
    status: 'published'
  }).lean();

  if (!template) {
    throw new ApiError(404, `No roadmap template found for this course at ${level} level`);
  }
  return template;
};

export const resolveTemplateModules = async (template) => {
  const modules = [];
  const courseId = template.course?._id || template.course;

  for (const module of template.modules || []) {
    const lessonIds = (module.lessons || []).map((value) => value?._id || value).filter(Boolean);
    const lessons = await Lesson.find({
      _id: { $in: lessonIds },
      course: courseId,
      status: 'published'
    }).select('_id').lean();

    const lessonOrder = new Map(lessonIds.map((id, index) => [id.toString(), index]));
    const orderedLessons = lessons
      .sort((a, b) => (lessonOrder.get(a._id.toString()) ?? 999) - (lessonOrder.get(b._id.toString()) ?? 999))
      .map((lesson, index) => ({
        lesson: lesson._id,
        status: module.order === 1 ? 'available' : 'locked',
        order: index + 1
      }));

    const questions = await QuizQuestion.find({
      course: courseId,
      bank: 'quiz',
      tags: { $in: module.quizTags || [] },
      status: 'published'
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
