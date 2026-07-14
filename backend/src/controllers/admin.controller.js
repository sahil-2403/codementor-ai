import mongoose from 'mongoose';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendResponse } from '../utils/ApiResponse.js';
import { ApiError } from '../utils/ApiError.js';
import { generateSlug } from '../utils/generateSlug.js';
import { makeSearchRegex } from '../utils/pagination.js';
import { listWithPagination } from '../services/listQuery.service.js';
import { Topic } from '../models/Topic.js';
import { Lesson } from '../models/Lesson.js';
import { QuizQuestion } from '../models/QuizQuestion.js';
import { RoadmapTemplate } from '../models/RoadmapTemplate.js';
import { User } from '../models/User.js';
import { AIUsageLog } from '../models/AIUsageLog.js';
import { CoursePlan } from '../models/CoursePlan.js';
import { ProjectTask } from '../models/ProjectTask.js';
import { ProjectSubmission } from '../models/ProjectSubmission.js';
import { InterviewQuestion } from '../models/InterviewQuestion.js';
import { InterviewAttempt } from '../models/InterviewAttempt.js';
import { AIJob } from '../models/AIJob.js';
import { listJobs } from '../services/job.service.js';
import { listActivityLogs, logActivity } from '../services/activityLog.service.js';
import { invalidateContentCache } from '../services/cacheInvalidation.service.js';
import { CACHE_TTL, getOrSetCache } from '../services/cache.service.js';
import { cacheKeys } from '../services/cacheKeys.service.js';

const ensureFound = (doc, label) => {
  if (!doc) throw new ApiError(404, `${label} not found`);
  return doc;
};

const safeStatus = (status) => ['draft', 'published', 'archived'].includes(status) ? status : undefined;

export const analytics = asyncHandler(async (req, res) => {
  const stats = await getOrSetCache(cacheKeys.adminAnalytics(), async () => {
    const [users, lessons, publishedLessons, questions, courses, aiLogs, jobs, failedJobs, projectTasks, projectSubmissions, interviewQuestions, interviewAttempts, templates] = await Promise.all([
      User.countDocuments(),
      Lesson.countDocuments(),
      Lesson.countDocuments({ status: 'published' }),
      QuizQuestion.countDocuments(),
      CoursePlan.countDocuments(),
      AIUsageLog.countDocuments(),
      AIJob.countDocuments(),
      AIJob.countDocuments({ status: 'failed' }),
      ProjectTask.countDocuments(),
      ProjectSubmission.countDocuments(),
      InterviewQuestion.countDocuments(),
      InterviewAttempt.countDocuments(),
      RoadmapTemplate.countDocuments()
    ]);
    return { users, lessons, publishedLessons, questions, courses, aiLogs, jobs, failedJobs, projectTasks, projectSubmissions, interviewQuestions, interviewAttempts, templates };
  }, CACHE_TTL.SHORT);
  sendResponse(res, 200, 'Admin analytics', { stats });
});

export const listTopics = asyncHandler(async (req, res) => {
  const search = makeSearchRegex(req.query.search);
  const filter = {};
  if (search) filter.$or = [{ title: search }, { category: search }, { tags: search }];
  if (req.query.difficulty) filter.difficulty = req.query.difficulty;
  const { items, pagination } = await listWithPagination({ model: Topic, filter, query: { sortBy: 'order', sortOrder: 'asc', ...req.query } });
  sendResponse(res, 200, 'Topics', { topics: items, pagination });
});

export const createTopic = asyncHandler(async (req, res) => {
  const topic = await Topic.create({ ...req.body, slug: generateSlug(req.body.title) });
  await invalidateContentCache();
  await logActivity({ user: req.user._id, action: 'admin_topic_created', entityType: 'Topic', entityId: topic._id, message: `Topic created: ${topic.title}`, req });
  sendResponse(res, 201, 'Topic created', { topic });
});

export const updateTopic = asyncHandler(async (req, res) => {
  const payload = { ...req.body };
  if (payload.title) payload.slug = generateSlug(payload.title);
  const topic = ensureFound(await Topic.findByIdAndUpdate(req.params.id, payload, { new: true, runValidators: true }), 'Topic');
  await invalidateContentCache();
  await logActivity({ user: req.user._id, action: 'admin_topic_updated', entityType: 'Topic', entityId: topic._id, message: `Topic updated: ${topic.title}`, req });
  sendResponse(res, 200, 'Topic updated', { topic });
});

export const deleteTopic = asyncHandler(async (req, res) => {
  const lessonCount = await Lesson.countDocuments({ topic: req.params.id });
  const questionCount = await QuizQuestion.countDocuments({ topic: req.params.id });
  if (lessonCount || questionCount) throw new ApiError(400, 'Topic is used by lessons or questions. Reassign content before deleting.');
  ensureFound(await Topic.findByIdAndDelete(req.params.id), 'Topic');
  await invalidateContentCache();
  sendResponse(res, 200, 'Topic deleted', {});
});

export const listLessons = asyncHandler(async (req, res) => {
  const search = makeSearchRegex(req.query.search);
  const filter = {};
  if (search) filter.$or = [{ title: search }, { theory: search }, { tags: search }];
  if (req.query.status) filter.status = req.query.status;
  if (req.query.difficulty) filter.difficulty = req.query.difficulty;
  if (req.query.topic && mongoose.isValidObjectId(req.query.topic)) filter.topic = req.query.topic;
  const { items, pagination } = await listWithPagination({ model: Lesson, filter, query: req.query, populate: ['topic'] });
  sendResponse(res, 200, 'Lessons', { lessons: items, pagination });
});

export const getLesson = asyncHandler(async (req, res) => {
  const lesson = ensureFound(await Lesson.findById(req.params.id).populate('topic', 'title'), 'Lesson');
  sendResponse(res, 200, 'Lesson details', { lesson });
});

export const createLesson = asyncHandler(async (req, res) => {
  const lesson = await Lesson.create({ ...req.body, slug: generateSlug(req.body.title) });
  await invalidateContentCache();
  await logActivity({ user: req.user._id, action: 'admin_lesson_created', entityType: 'Lesson', entityId: lesson._id, message: `Lesson created: ${lesson.title}`, req });
  sendResponse(res, 201, 'Lesson created', { lesson });
});

export const updateLesson = asyncHandler(async (req, res) => {
  const payload = { ...req.body };
  if (payload.title) payload.slug = generateSlug(payload.title);
  const lesson = ensureFound(await Lesson.findByIdAndUpdate(req.params.id, payload, { new: true, runValidators: true }).populate('topic', 'title'), 'Lesson');
  await invalidateContentCache();
  await logActivity({ user: req.user._id, action: 'admin_lesson_updated', entityType: 'Lesson', entityId: lesson._id, message: `Lesson updated: ${lesson.title}`, req });
  sendResponse(res, 200, 'Lesson updated', { lesson });
});

export const updateLessonStatus = asyncHandler(async (req, res) => {
  const lesson = ensureFound(await Lesson.findByIdAndUpdate(req.params.id, { status: safeStatus(req.body.status) }, { new: true, runValidators: true }).populate('topic', 'title'), 'Lesson');
  await invalidateContentCache();
  await logActivity({ user: req.user._id, action: 'admin_lesson_status_changed', entityType: 'Lesson', entityId: lesson._id, message: `Lesson status changed to ${lesson.status}`, metadata: { status: lesson.status }, req });
  sendResponse(res, 200, `Lesson ${lesson.status}`, { lesson });
});

export const archiveLesson = asyncHandler(async (req, res) => {
  const lesson = ensureFound(await Lesson.findByIdAndUpdate(req.params.id, { status: 'archived' }, { new: true, runValidators: true }), 'Lesson');
  await invalidateContentCache();
  sendResponse(res, 200, 'Lesson archived', { lesson });
});

export const listQuestions = asyncHandler(async (req, res) => {
  const search = makeSearchRegex(req.query.search);
  const filter = {};
  if (search) filter.$or = [{ question: search }, { explanation: search }, { tags: search }];
  if (req.query.status) filter.status = req.query.status;
  if (req.query.difficulty) filter.difficulty = req.query.difficulty;
  if (req.query.type) filter.type = req.query.type;
  if (req.query.topic && mongoose.isValidObjectId(req.query.topic)) filter.topic = req.query.topic;
  const { items, pagination } = await listWithPagination({ model: QuizQuestion, filter, query: req.query, populate: ['topic', { path: 'relatedLesson', select: 'title slug' }] });
  sendResponse(res, 200, 'Questions', { questions: items, pagination });
});

export const getQuestion = asyncHandler(async (req, res) => {
  const question = ensureFound(await QuizQuestion.findById(req.params.id).populate('topic', 'title').populate('relatedLesson', 'title slug'), 'Question');
  sendResponse(res, 200, 'Question details', { question });
});

export const createQuestion = asyncHandler(async (req, res) => {
  const payload = { ...req.body };
  if (!payload.relatedLesson) delete payload.relatedLesson;
  const question = await QuizQuestion.create(payload);
  await invalidateContentCache();
  await logActivity({ user: req.user._id, action: 'admin_question_created', entityType: 'QuizQuestion', entityId: question._id, message: 'Quiz question created', req });
  sendResponse(res, 201, 'Question created', { question });
});

export const updateQuestion = asyncHandler(async (req, res) => {
  const payload = { ...req.body };
  if (!payload.relatedLesson) payload.relatedLesson = undefined;
  const question = ensureFound(await QuizQuestion.findByIdAndUpdate(req.params.id, payload, { new: true, runValidators: true }).populate('topic', 'title'), 'Question');
  await invalidateContentCache();
  sendResponse(res, 200, 'Question updated', { question });
});

export const updateQuestionStatus = asyncHandler(async (req, res) => {
  const question = ensureFound(await QuizQuestion.findByIdAndUpdate(req.params.id, { status: safeStatus(req.body.status) }, { new: true, runValidators: true }).populate('topic', 'title'), 'Question');
  await invalidateContentCache();
  sendResponse(res, 200, `Question ${question.status}`, { question });
});

export const archiveQuestion = asyncHandler(async (req, res) => {
  const question = ensureFound(await QuizQuestion.findByIdAndUpdate(req.params.id, { status: 'archived' }, { new: true, runValidators: true }), 'Question');
  await invalidateContentCache();
  sendResponse(res, 200, 'Question archived', { question });
});

export const listTemplates = asyncHandler(async (req, res) => {
  const search = makeSearchRegex(req.query.search);
  const filter = {};
  if (search) filter.$or = [{ title: search }, { description: search }, { goalKey: search }];
  if (req.query.status) filter.status = req.query.status;
  if (req.query.level) filter.level = req.query.level;
  if (req.query.goalKey) filter.goalKey = req.query.goalKey;
  const { items, pagination } = await listWithPagination({ model: RoadmapTemplate, filter, query: { sortBy: 'level', sortOrder: 'asc', ...req.query } });
  sendResponse(res, 200, 'Templates', { templates: items, pagination });
});

export const getTemplate = asyncHandler(async (req, res) => {
  const template = ensureFound(await RoadmapTemplate.findById(req.params.id), 'Roadmap template');
  sendResponse(res, 200, 'Roadmap template details', { template });
});

export const createTemplate = asyncHandler(async (req, res) => {
  const template = await RoadmapTemplate.create(req.body);
  await invalidateContentCache();
  await logActivity({ user: req.user._id, action: 'admin_template_created', entityType: 'RoadmapTemplate', entityId: template._id, message: `Template created: ${template.title}`, req });
  sendResponse(res, 201, 'Roadmap template created', { template });
});

export const updateTemplate = asyncHandler(async (req, res) => {
  const template = ensureFound(await RoadmapTemplate.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true }), 'Roadmap template');
  await invalidateContentCache();
  sendResponse(res, 200, 'Roadmap template updated', { template });
});

export const updateTemplateStatus = asyncHandler(async (req, res) => {
  const template = ensureFound(await RoadmapTemplate.findByIdAndUpdate(req.params.id, { status: safeStatus(req.body.status) }, { new: true, runValidators: true }), 'Roadmap template');
  await invalidateContentCache();
  sendResponse(res, 200, `Roadmap template ${template.status}`, { template });
});

export const archiveTemplate = asyncHandler(async (req, res) => {
  const template = ensureFound(await RoadmapTemplate.findByIdAndUpdate(req.params.id, { status: 'archived' }, { new: true, runValidators: true }), 'Roadmap template');
  await invalidateContentCache();
  sendResponse(res, 200, 'Roadmap template archived', { template });
});

export const duplicateTemplate = asyncHandler(async (req, res) => {
  const original = ensureFound(await RoadmapTemplate.findById(req.params.id), 'Roadmap template');
  const duplicate = await RoadmapTemplate.create({
    goalKey: `${original.goalKey}-copy-${Date.now()}`,
    level: original.level,
    title: `${original.title} Copy`,
    description: original.description,
    modules: original.modules,
    estimatedDurationDays: original.estimatedDurationDays,
    status: 'draft'
  });
  await invalidateContentCache();
  sendResponse(res, 201, 'Roadmap template duplicated', { template: duplicate });
});

export const listUsers = asyncHandler(async (req, res) => {
  const search = makeSearchRegex(req.query.search);
  const filter = {};
  if (search) filter.$or = [{ name: search }, { email: search }];
  if (req.query.role) filter.role = req.query.role;
  const { items, pagination } = await listWithPagination({ model: User, filter, query: req.query, select: '-password -refreshTokenHash -emailVerificationToken -passwordResetToken' });
  sendResponse(res, 200, 'Users', { users: items, pagination });
});

export const listAIUsage = asyncHandler(async (req, res) => {
  const search = makeSearchRegex(req.query.search);
  const filter = {};
  if (search) filter.$or = [{ feature: search }, { model: search }, { provider: search }, { promptFingerprint: search }];
  if (req.query.feature) filter.feature = req.query.feature;
  if (req.query.status) filter.status = req.query.status;
  const { items, pagination } = await listWithPagination({ model: AIUsageLog, filter, query: req.query, populate: [{ path: 'user', select: 'name email' }] });
  sendResponse(res, 200, 'AI usage logs', { logs: items, pagination });
});

export const listAdminJobs = asyncHandler(async (req, res) => {
  const { items, pagination } = await listJobs(req.query);
  sendResponse(res, 200, 'Background jobs', { jobs: items, pagination });
});

export const listAdminActivityLogs = asyncHandler(async (req, res) => {
  const { items, pagination } = await listActivityLogs(req.query);
  sendResponse(res, 200, 'Activity logs', { logs: items, pagination });
});

export const aiUsageSummary = asyncHandler(async (req, res) => {
  const since = req.query.days ? new Date(Date.now() - Number(req.query.days || 7) * 24 * 60 * 60 * 1000) : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const [statusBreakdown, featureBreakdown, providerBreakdown, topUsers, totals] = await Promise.all([
    AIUsageLog.aggregate([
      { $match: { createdAt: { $gte: since } } },
      { $group: { _id: '$status', count: { $sum: 1 }, tokens: { $sum: { $add: ['$inputTokens', '$outputTokens'] } }, cost: { $sum: '$estimatedCost' }, avgLatency: { $avg: '$latencyMs' } } },
      { $sort: { count: -1 } }
    ]),
    AIUsageLog.aggregate([
      { $match: { createdAt: { $gte: since } } },
      { $group: { _id: '$feature', count: { $sum: 1 }, blocked: { $sum: { $cond: [{ $eq: ['$status', 'blocked'] }, 1, 0] } }, failed: { $sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] } }, tokens: { $sum: { $add: ['$inputTokens', '$outputTokens'] } }, cost: { $sum: '$estimatedCost' } } },
      { $sort: { count: -1 } }
    ]),
    AIUsageLog.aggregate([
      { $match: { createdAt: { $gte: since } } },
      { $group: { _id: { provider: '$provider', model: '$model' }, count: { $sum: 1 }, cost: { $sum: '$estimatedCost' }, avgLatency: { $avg: '$latencyMs' } } },
      { $sort: { count: -1 } }
    ]),
    AIUsageLog.aggregate([
      { $match: { createdAt: { $gte: since } } },
      { $group: { _id: '$user', count: { $sum: 1 }, blocked: { $sum: { $cond: [{ $eq: ['$status', 'blocked'] }, 1, 0] } }, tokens: { $sum: { $add: ['$inputTokens', '$outputTokens'] } } } },
      { $sort: { count: -1 } },
      { $limit: 5 },
      { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'user' } },
      { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } },
      { $project: { count: 1, blocked: 1, tokens: 1, 'user.name': 1, 'user.email': 1 } }
    ]),
    AIUsageLog.aggregate([
      { $match: { createdAt: { $gte: since } } },
      { $group: { _id: null, totalRequests: { $sum: 1 }, totalBlocked: { $sum: { $cond: [{ $eq: ['$status', 'blocked'] }, 1, 0] } }, totalFailed: { $sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] } }, totalTokens: { $sum: { $add: ['$inputTokens', '$outputTokens'] } }, totalCost: { $sum: '$estimatedCost' }, avgLatency: { $avg: '$latencyMs' } } }
    ])
  ]);

  sendResponse(res, 200, 'AI usage summary', {
    summary: {
      since,
      totals: totals[0] || { totalRequests: 0, totalBlocked: 0, totalFailed: 0, totalTokens: 0, totalCost: 0, avgLatency: 0 },
      statusBreakdown,
      featureBreakdown,
      providerBreakdown,
      topUsers
    }
  });
});
