import { Technology } from '../../models/Technology.js';
import { Course } from '../../models/Course.js';
import { LearningPath } from '../../models/LearningPath.js';
import { Topic } from '../../models/Topic.js';
import { Lesson } from '../../models/Lesson.js';
import { QuizQuestion } from '../../models/QuizQuestion.js';
import { InterviewQuestion } from '../../models/InterviewQuestion.js';
import { RoadmapTemplate } from '../../models/RoadmapTemplate.js';

const statusCounts = async (model, filter = {}) => {
  const rows = await model.aggregate([
    { $match: filter },
    { $group: { _id: '$status', count: { $sum: 1 } } }
  ]);
  return rows.reduce((counts, row) => ({ ...counts, [row._id]: row.count }), {});
};

const normalizeCounts = (counts, statuses) => statuses.reduce(
  (result, status) => ({ ...result, [status]: counts[status] || 0 }),
  {}
);

const recentItems = async () => {
  const [technologies, courses, paths, topics, lessons, quizQuestions, interviewQuestions, templates] = await Promise.all([
    Technology.find().sort({ updatedAt: -1 }).limit(4).select('_id name status updatedAt').lean(),
    Course.find().sort({ updatedAt: -1 }).limit(4).select('_id title status updatedAt').lean(),
    LearningPath.find().sort({ updatedAt: -1 }).limit(4).select('_id title status updatedAt').lean(),
    Topic.find().sort({ updatedAt: -1 }).limit(4).select('_id title course status updatedAt').populate('course', 'title').lean(),
    Lesson.find().sort({ updatedAt: -1 }).limit(4).select('_id title course status updatedAt').populate('course', 'title').lean(),
    QuizQuestion.find().sort({ updatedAt: -1 }).limit(4).select('_id question course bank status updatedAt').populate('course', 'title').lean(),
    InterviewQuestion.find().sort({ updatedAt: -1 }).limit(4).select('_id question course status updatedAt').populate('course', 'title').lean(),
    RoadmapTemplate.find().sort({ updatedAt: -1 }).limit(4).select('_id title course level status updatedAt').populate('course', 'title').lean()
  ]);

  return [
    ...technologies.map((item) => ({ id: item._id, type: 'technology', title: item.name, status: item.status, updatedAt: item.updatedAt })),
    ...courses.map((item) => ({ id: item._id, type: 'course', title: item.title, status: item.status, updatedAt: item.updatedAt })),
    ...paths.map((item) => ({ id: item._id, type: 'learning_path', title: item.title, status: item.status, updatedAt: item.updatedAt })),
    ...topics.map((item) => ({ id: item._id, type: 'topic', title: item.title, courseTitle: item.course?.title || '', status: item.status, updatedAt: item.updatedAt })),
    ...lessons.map((item) => ({ id: item._id, type: 'lesson', title: item.title, courseTitle: item.course?.title || '', status: item.status, updatedAt: item.updatedAt })),
    ...quizQuestions.map((item) => ({
      id: item._id,
      type: item.bank === 'skill_check' ? 'skill_check' : 'quiz_question',
      title: item.question,
      courseTitle: item.course?.title || '',
      status: item.status,
      updatedAt: item.updatedAt
    })),
    ...interviewQuestions.map((item) => ({ id: item._id, type: 'interview_question', title: item.question, courseTitle: item.course?.title || '', status: item.status, updatedAt: item.updatedAt })),
    ...templates.map((item) => ({
      id: item._id,
      type: 'template',
      title: item.title,
      courseId: item.course?._id || item.course,
      courseTitle: item.course?.title || '',
      status: item.status,
      level: item.level,
      updatedAt: item.updatedAt
    }))
  ].sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)).slice(0, 8);
};

export const getContentOverview = async () => {
  const [
    technologyTotal,
    technologyStatusesRaw,
    courseTotal,
    courseStatusesRaw,
    pathTotal,
    pathStatusesRaw,
    topicTotal,
    topicStatusesRaw,
    lessonTotal,
    lessonStatusesRaw,
    quizTotal,
    quizStatusesRaw,
    skillCheckTotal,
    skillCheckStatusesRaw,
    interviewTotal,
    interviewStatusesRaw,
    templateTotal,
    templateStatusesRaw,
    activeTopicIds,
    topicsWithLessons,
    publishedLessonIds,
    coveredLessonIds,
    courses,
    templates,
    recent
  ] = await Promise.all([
    Technology.countDocuments(),
    statusCounts(Technology),
    Course.countDocuments(),
    statusCounts(Course),
    LearningPath.countDocuments(),
    statusCounts(LearningPath),
    Topic.countDocuments(),
    statusCounts(Topic),
    Lesson.countDocuments(),
    statusCounts(Lesson),
    QuizQuestion.countDocuments({ bank: 'quiz' }),
    statusCounts(QuizQuestion, { bank: 'quiz' }),
    QuizQuestion.countDocuments({ bank: 'skill_check' }),
    statusCounts(QuizQuestion, { bank: 'skill_check' }),
    InterviewQuestion.countDocuments(),
    statusCounts(InterviewQuestion),
    RoadmapTemplate.countDocuments(),
    statusCounts(RoadmapTemplate),
    Topic.find({ status: 'active' }).distinct('_id'),
    Lesson.find({ status: { $ne: 'archived' } }).distinct('topic'),
    Lesson.find({ status: 'published' }).distinct('_id'),
    QuizQuestion.find({ bank: 'quiz', status: 'published', relatedLesson: { $ne: null } }).distinct('relatedLesson'),
    Course.find({ status: { $ne: 'archived' } }).select('_id title slug status category availableLevels').sort({ order: 1, title: 1 }).lean(),
    RoadmapTemplate.find().select('_id course level status title').lean(),
    recentItems()
  ]);

  const topicStatuses = normalizeCounts(topicStatusesRaw, ['active', 'archived']);
  const technologyStatuses = normalizeCounts(technologyStatusesRaw, ['draft', 'published', 'archived']);
  const courseStatuses = normalizeCounts(courseStatusesRaw, ['draft', 'published', 'archived']);
  const pathStatuses = normalizeCounts(pathStatusesRaw, ['draft', 'published', 'archived']);
  const lessonStatuses = normalizeCounts(lessonStatusesRaw, ['draft', 'published', 'archived']);
  const quizStatuses = normalizeCounts(quizStatusesRaw, ['draft', 'published', 'archived']);
  const skillCheckStatuses = normalizeCounts(skillCheckStatusesRaw, ['draft', 'published', 'archived']);
  const interviewStatuses = normalizeCounts(interviewStatusesRaw, ['draft', 'published', 'archived']);
  const templateStatuses = normalizeCounts(templateStatusesRaw, ['draft', 'published', 'archived']);

  const topicsWithLessonsSet = new Set(topicsWithLessons.map(String));
  const coveredLessonSet = new Set(coveredLessonIds.map(String));
  const topicsWithoutLessons = activeTopicIds.filter((id) => !topicsWithLessonsSet.has(String(id))).length;
  const publishedLessonsWithoutQuizCoverage = publishedLessonIds.filter((id) => !coveredLessonSet.has(String(id))).length;

  const templateByCourseLevel = new Map(templates.map((template) => [`${template.course}:${template.level}`, template]));
  const coverage = courses.map((course) => ({
    courseId: course._id,
    courseTitle: course.title,
    courseSlug: course.slug,
    courseStatus: course.status,
    category: course.category,
    levels: Object.fromEntries((course.availableLevels || []).map((level) => {
      const template = templateByCourseLevel.get(`${course._id}:${level}`);
      return [level, template
        ? { status: template.status, templateId: template._id, title: template.title }
        : { status: 'missing', templateId: null, title: '' }];
    }))
  }));

  const missingPublishedTemplateLevels = coverage
    .filter((item) => item.courseStatus === 'published')
    .reduce((count, item) => count + Object.values(item.levels).filter((level) => level.status !== 'published').length, 0);

  return {
    catalog: {
      technologies: { total: technologyTotal, ...technologyStatuses },
      courses: { total: courseTotal, ...courseStatuses },
      learningPaths: { total: pathTotal, ...pathStatuses }
    },
    topics: { total: topicTotal, ...topicStatuses, withoutLessons: topicsWithoutLessons },
    lessons: { total: lessonTotal, ...lessonStatuses, withoutQuizCoverage: publishedLessonsWithoutQuizCoverage },
    questions: {
      total: quizTotal + skillCheckTotal + interviewTotal,
      quiz: { total: quizTotal, ...quizStatuses },
      skillCheck: { total: skillCheckTotal, ...skillCheckStatuses },
      interview: { total: interviewTotal, ...interviewStatuses }
    },
    templates: { total: templateTotal, ...templateStatuses, coverage },
    attention: {
      draftTechnologies: technologyStatuses.draft,
      draftCourses: courseStatuses.draft,
      draftLearningPaths: pathStatuses.draft,
      draftLessons: lessonStatuses.draft,
      draftQuizQuestions: quizStatuses.draft,
      draftSkillChecks: skillCheckStatuses.draft,
      draftInterviewQuestions: interviewStatuses.draft,
      archivedTopics: topicStatuses.archived,
      topicsWithoutLessons,
      publishedLessonsWithoutQuizCoverage,
      missingPublishedTemplateLevels
    },
    recentContent: recent
  };
};
