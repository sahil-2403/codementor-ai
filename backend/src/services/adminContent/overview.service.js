import { Topic } from '../../models/Topic.js';
import { Lesson } from '../../models/Lesson.js';
import { QuizQuestion } from '../../models/QuizQuestion.js';
import { InterviewQuestion } from '../../models/InterviewQuestion.js';
import { RoadmapTemplate } from '../../models/RoadmapTemplate.js';

const legacyQuizBankFilter = { $or: [{ bank: 'quiz' }, { bank: { $exists: false } }] };
const levels = ['beginner', 'intermediate', 'advanced'];

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
  const [topics, lessons, quizQuestions, interviewQuestions, templates] = await Promise.all([
    Topic.find().sort({ updatedAt: -1 }).limit(5).select('_id title status updatedAt').lean(),
    Lesson.find().sort({ updatedAt: -1 }).limit(5).select('_id title status updatedAt').lean(),
    QuizQuestion.find().sort({ updatedAt: -1 }).limit(5).select('_id question bank status updatedAt').lean(),
    InterviewQuestion.find().sort({ updatedAt: -1 }).limit(5).select('_id question status updatedAt').lean(),
    RoadmapTemplate.find().sort({ updatedAt: -1 }).limit(5).select('_id title goalKey level status updatedAt').lean()
  ]);

  return [
    ...topics.map((item) => ({ id: item._id, type: 'topic', title: item.title, status: item.status, updatedAt: item.updatedAt })),
    ...lessons.map((item) => ({ id: item._id, type: 'lesson', title: item.title, status: item.status, updatedAt: item.updatedAt })),
    ...quizQuestions.map((item) => ({
      id: item._id,
      type: item.bank === 'skill_check' ? 'skill_check' : 'quiz_question',
      title: item.question,
      status: item.status,
      updatedAt: item.updatedAt
    })),
    ...interviewQuestions.map((item) => ({ id: item._id, type: 'interview_question', title: item.question, status: item.status, updatedAt: item.updatedAt })),
    ...templates.map((item) => ({
      id: item._id,
      type: 'template',
      title: item.title,
      status: item.status,
      goalKey: item.goalKey,
      level: item.level,
      updatedAt: item.updatedAt
    }))
  ]
    .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
    .slice(0, 6);
};

export const getContentOverview = async () => {
  const [
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
    templates,
    recent
  ] = await Promise.all([
    Topic.countDocuments(),
    statusCounts(Topic),
    Lesson.countDocuments(),
    statusCounts(Lesson),
    QuizQuestion.countDocuments(legacyQuizBankFilter),
    statusCounts(QuizQuestion, legacyQuizBankFilter),
    QuizQuestion.countDocuments({ bank: 'skill_check' }),
    statusCounts(QuizQuestion, { bank: 'skill_check' }),
    InterviewQuestion.countDocuments(),
    statusCounts(InterviewQuestion),
    RoadmapTemplate.countDocuments(),
    statusCounts(RoadmapTemplate),
    Topic.find({ status: 'active' }).distinct('_id'),
    Lesson.find({ status: { $ne: 'archived' } }).distinct('topic'),
    Lesson.find({ status: 'published' }).distinct('_id'),
    QuizQuestion.find({
      $and: [
        legacyQuizBankFilter,
        { status: 'published' },
        { relatedLesson: { $ne: null } }
      ]
    }).distinct('relatedLesson'),
    RoadmapTemplate.find().select('_id goalKey level status title').sort({ goalKey: 1, level: 1 }).lean(),
    recentItems()
  ]);

  const topicsWithLessonsSet = new Set(topicsWithLessons.map(String));
  const coveredLessonSet = new Set(coveredLessonIds.map(String));
  const topicsWithoutLessons = activeTopicIds.filter((id) => !topicsWithLessonsSet.has(String(id))).length;
  const publishedLessonsWithoutQuizCoverage = publishedLessonIds.filter((id) => !coveredLessonSet.has(String(id))).length;

  const topicStatuses = normalizeCounts(topicStatusesRaw, ['active', 'archived']);
  const lessonStatuses = normalizeCounts(lessonStatusesRaw, ['draft', 'published', 'archived']);
  const quizStatuses = normalizeCounts(quizStatusesRaw, ['draft', 'published', 'archived']);
  const skillCheckStatuses = normalizeCounts(skillCheckStatusesRaw, ['draft', 'published', 'archived']);
  const interviewStatuses = normalizeCounts(interviewStatusesRaw, ['draft', 'published', 'archived']);
  const templateStatuses = normalizeCounts(templateStatusesRaw, ['draft', 'published', 'archived']);

  const coverageByGoal = new Map();
  templates.forEach((template) => {
    if (!coverageByGoal.has(template.goalKey)) {
      coverageByGoal.set(template.goalKey, {
        goalKey: template.goalKey,
        levels: Object.fromEntries(levels.map((level) => [level, { status: 'missing', templateId: null, title: '' }]))
      });
    }
    coverageByGoal.get(template.goalKey).levels[template.level] = {
      status: template.status,
      templateId: template._id,
      title: template.title
    };
  });

  return {
    topics: {
      total: topicTotal,
      ...topicStatuses,
      withoutLessons: topicsWithoutLessons
    },
    lessons: {
      total: lessonTotal,
      ...lessonStatuses,
      withoutQuizCoverage: publishedLessonsWithoutQuizCoverage
    },
    questions: {
      total: quizTotal + skillCheckTotal + interviewTotal,
      quiz: { total: quizTotal, ...quizStatuses },
      skillCheck: { total: skillCheckTotal, ...skillCheckStatuses },
      interview: { total: interviewTotal, ...interviewStatuses }
    },
    templates: {
      total: templateTotal,
      ...templateStatuses,
      coverage: [...coverageByGoal.values()]
    },
    attention: {
      draftLessons: lessonStatuses.draft,
      draftQuizQuestions: quizStatuses.draft,
      draftSkillChecks: skillCheckStatuses.draft,
      draftInterviewQuestions: interviewStatuses.draft,
      archivedTopics: topicStatuses.archived,
      topicsWithoutLessons,
      publishedLessonsWithoutQuizCoverage
    },
    recentContent: recent
  };
};
