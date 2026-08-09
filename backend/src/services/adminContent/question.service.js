import mongoose from 'mongoose';
import { QuizQuestion } from '../../models/QuizQuestion.js';
import { QuizAttempt } from '../../models/QuizAttempt.js';
import { Assessment } from '../../models/Assessment.js';
import { CoursePlan } from '../../models/CoursePlan.js';
import { RoadmapTemplate } from '../../models/RoadmapTemplate.js';
import { env } from '../../config/env.js';
import { ApiError } from '../../utils/ApiError.js';
import { makeSearchRegex } from '../../utils/pagination.js';
import { listWithPagination } from '../listQuery.service.js';
import { invalidateContentCache } from '../cacheInvalidation.service.js';
import {
  PUBLISHABLE_STATUS,
  assertCourseExists,
  assertRelatedLesson,
  assertTopicExists,
  cleanReferenceArray,
  cleanStringArray,
  ensureEditable,
  ensureFound,
  transitionStatus
} from './common.js';

const QUESTION_BANKS = Object.freeze({ QUIZ: 'quiz', SKILL_CHECK: 'skill_check' });
const withSession = (query, session) => (session ? query.session(session) : query);
const operationOptions = (session) => (session ? { session } : undefined);

const runLifecycleOperation = async (operation) => {
  if (!env.enableMongoTransactions) return operation(null);
  const session = await mongoose.startSession();
  let result;
  try {
    await session.withTransaction(async () => { result = await operation(session); });
  } finally {
    await session.endSession();
  }
  return result;
};

const assertQuestionBankRules = async ({ bank, course, topic, relatedLesson, difficulty, requirePublished = false }) => {
  await assertCourseExists(course, { requirePublished });
  await assertTopicExists({ topicId: topic, courseId: course });
  if (bank === QUESTION_BANKS.SKILL_CHECK) {
    if (difficulty === 'beginner') {
      throw new ApiError(400, 'Skill checks are only used for intermediate and advanced diagnostic assessments', [{ field: 'difficulty', message: 'Choose Intermediate or Advanced' }], 'CONTENT_REFERENCE_INVALID');
    }
    if (relatedLesson) {
      throw new ApiError(400, 'Skill checks are not linked to lessons', [{ field: 'relatedLesson', message: 'Remove the related lesson from this skill check' }], 'CONTENT_REFERENCE_INVALID');
    }
    return;
  }
  if (relatedLesson) await assertRelatedLesson({ lessonId: relatedLesson, topicId: topic, courseId: course, requirePublished });
};

const assertQuestionPublishable = async (question) => {
  const errors = [];
  const options = cleanStringArray(question.options);
  const answer = String(question.correctAnswer || '').trim();

  if (question.type === 'short_answer') errors.push({ field: 'type', message: 'Short-answer grading is not supported yet; keep this question as a draft' });
  if (question.type === 'mcq') {
    if (options.length < 2) errors.push({ field: 'options', message: 'MCQ questions need at least two unique options' });
    if (options.length > 6) errors.push({ field: 'options', message: 'MCQ questions can have at most six options' });
    if (!options.includes(answer)) errors.push({ field: 'correctAnswer', message: 'Choose one of the answer options as correct' });
  }
  if (question.type === 'code_output' && !String(question.codeSnippet || '').trim()) errors.push({ field: 'codeSnippet', message: 'Add the code snippet learners should evaluate' });
  if (!answer) errors.push({ field: 'correctAnswer', message: 'Correct answer is required' });
  if (String(question.explanation || '').trim().length < 10) errors.push({ field: 'explanation', message: 'Add an explanation of at least 10 characters' });
  if (question.bank === QUESTION_BANKS.QUIZ && !question.relatedLesson) errors.push({ field: 'relatedLesson', message: 'Choose a related lesson before publishing a quiz question' });
  if (question.bank === QUESTION_BANKS.SKILL_CHECK && question.difficulty === 'beginner') errors.push({ field: 'difficulty', message: 'Skill checks support Intermediate and Advanced learners only' });
  if (errors.length) throw new ApiError(400, 'Question is not ready to publish', errors, 'CONTENT_NOT_READY');

  await assertQuestionBankRules({
    bank: question.bank,
    course: question.course,
    topic: question.topic,
    relatedLesson: question.relatedLesson,
    difficulty: question.difficulty,
    requirePublished: true
  });
};

const assertQuestionCanLeavePublished = async (question) => {
  if (question.bank !== QUESTION_BANKS.QUIZ || question.status !== PUBLISHABLE_STATUS.PUBLISHED || !question.tags?.length) return;
  const templates = await RoadmapTemplate.find({ course: question.course, status: PUBLISHABLE_STATUS.PUBLISHED, 'modules.quizTags': { $in: question.tags } })
    .select('_id title modules.quizTags').lean();
  if (!templates.length) return;

  const relevantTags = new Set(templates.flatMap((template) => template.modules.flatMap((module) => module.quizTags || [])));
  const remaining = await QuizQuestion.find({
    _id: { $ne: question._id },
    course: question.course,
    bank: QUESTION_BANKS.QUIZ,
    status: PUBLISHABLE_STATUS.PUBLISHED,
    tags: { $in: [...relevantTags] }
  }).select('tags').lean();
  const coveredTags = new Set(remaining.flatMap((item) => item.tags || []));
  const uncovered = [...relevantTags].filter((tag) => !coveredTags.has(tag));
  if (uncovered.length) {
    throw new ApiError(409, 'This question provides required coverage for a published roadmap template', uncovered.map((tag) => ({ field: 'tags', message: tag })), 'TEMPLATE_DEPENDENCY_EXISTS');
  }
};

export const resolveQuestionImpact = async (questionId, { session = null } = {}) => {
  const question = ensureFound(
    await withSession(
      QuizQuestion.findById(questionId)
        .populate('course', 'title slug status')
        .populate('topic', 'title status course')
        .populate('relatedLesson', 'title status course topic'),
      session
    ),
    'Question'
  );
  const [quizAttempts, affectedCoursePlans, startedAssessments, completedAssessments] = await Promise.all([
    withSession(QuizAttempt.countDocuments({ 'answers.question': question._id }), session),
    withSession(CoursePlan.countDocuments({ 'modules.quizQuestions': question._id }), session),
    withSession(Assessment.countDocuments({ status: 'started', questionIds: question._id }), session),
    withSession(Assessment.countDocuments({ status: 'completed', $or: [{ questionIds: question._id }, { 'answers.question': question._id }] }), session)
  ]);
  return { question, counts: { quizAttempts, affectedCoursePlans, startedAssessments, completedAssessments } };
};

export const listQuestions = async (query = {}) => {
  const search = makeSearchRegex(query.search);
  const filter = {};
  if (search) filter.$or = [{ question: search }, { explanation: search }, { tags: search }];
  if (query.bank) filter.bank = query.bank;
  if (query.status) filter.status = query.status;
  if (query.difficulty) filter.difficulty = query.difficulty;
  if (query.type) filter.type = query.type;
  if (query.course && mongoose.isValidObjectId(query.course)) filter.course = query.course;
  if (query.topic && mongoose.isValidObjectId(query.topic)) filter.topic = query.topic;
  return listWithPagination({
    model: QuizQuestion,
    filter,
    query,
    populate: [
      { path: 'course', select: 'title slug status' },
      { path: 'topic', select: 'title status course' },
      { path: 'relatedLesson', select: 'title slug status topic course' }
    ]
  });
};

export const getQuestion = async (id) => ensureFound(
  await QuizQuestion.findById(id)
    .populate('course', 'title slug status')
    .populate('topic', 'title status course')
    .populate('relatedLesson', 'title slug status topic course'),
  'Question'
);
export const getQuestionImpact = async (id) => { const impact = await resolveQuestionImpact(id); return { question: impact.question, counts: impact.counts }; };

export const createQuestion = async (payload) => {
  const bank = payload.bank === QUESTION_BANKS.SKILL_CHECK ? QUESTION_BANKS.SKILL_CHECK : QUESTION_BANKS.QUIZ;
  await assertQuestionBankRules({ bank, course: payload.course, topic: payload.topic, relatedLesson: bank === QUESTION_BANKS.QUIZ ? payload.relatedLesson : null, difficulty: payload.difficulty });
  const question = await QuizQuestion.create({
    ...payload,
    bank,
    technologies: cleanReferenceArray(payload.technologies),
    codeSnippet: String(payload.codeSnippet || ''),
    options: cleanStringArray(payload.options),
    tags: cleanStringArray(payload.tags),
    relatedLesson: bank === QUESTION_BANKS.QUIZ && payload.relatedLesson ? payload.relatedLesson : undefined,
    status: PUBLISHABLE_STATUS.DRAFT,
    manualArchive: false
  });
  await invalidateContentCache();
  return question.populate([
    { path: 'course', select: 'title slug status' },
    { path: 'topic', select: 'title status course' }
  ]);
};

export const updateQuestion = async ({ id, payload }) => {
  const question = ensureFound(await QuizQuestion.findById(id), 'Question');
  ensureEditable(question, 'Question');
  if (payload.bank && payload.bank !== question.bank) throw new ApiError(409, 'Move between question banks by creating a new question instead', [], 'QUESTION_BANK_IMMUTABLE');
  if (payload.course && payload.course.toString() !== question.course.toString()) throw new ApiError(409, 'Question course cannot be changed. Create it under the target course instead.', [], 'CONTENT_COURSE_IMMUTABLE');

  const nextTopic = payload.topic || question.topic;
  const nextDifficulty = payload.difficulty || question.difficulty;
  const hasRelatedLesson = Object.prototype.hasOwnProperty.call(payload, 'relatedLesson');
  const nextRelatedLesson = hasRelatedLesson ? payload.relatedLesson : question.relatedLesson;
  await assertQuestionBankRules({ bank: question.bank, course: question.course, topic: nextTopic, relatedLesson: question.bank === QUESTION_BANKS.QUIZ ? nextRelatedLesson : null, difficulty: nextDifficulty });

  const normalized = {
    ...payload,
    bank: question.bank,
    ...(payload.options ? { options: cleanStringArray(payload.options) } : {}),
    ...(payload.tags ? { tags: cleanStringArray(payload.tags) } : {}),
    ...(payload.technologies ? { technologies: cleanReferenceArray(payload.technologies) } : {})
  };
  delete normalized.course;
  if (question.bank === QUESTION_BANKS.SKILL_CHECK) normalized.relatedLesson = undefined;
  else if (hasRelatedLesson) normalized.relatedLesson = payload.relatedLesson || undefined;
  for (const field of ['status', 'manualArchive', 'statusBeforeManualArchive', 'archivedByTopics', 'archivedByLessons', 'statusBeforeCascadeArchive', 'statusBeforeTopicArchive']) delete normalized[field];

  Object.assign(question, normalized);
  if (question.status === PUBLISHABLE_STATUS.PUBLISHED) await assertQuestionPublishable(question);
  await question.save();
  await invalidateContentCache();
  return question.populate([
    { path: 'course', select: 'title slug status' },
    { path: 'topic', select: 'title status course' }
  ]);
};

export const changeQuestionStatus = async ({ id, status, confirmPublish = false }) => {
  if (status === PUBLISHABLE_STATUS.PUBLISHED) {
    return transitionStatus({
      model: QuizQuestion,
      id,
      label: 'Question',
      status,
      confirmPublish,
      validatePublish: assertQuestionPublishable,
      populate: [
        { path: 'course', select: 'title slug status' },
        { path: 'topic', select: 'title status course' },
        { path: 'relatedLesson', select: 'title slug status topic course' }
      ]
    });
  }
  if (!['archived', 'restored'].includes(status)) throw new ApiError(400, 'Invalid question status', [], 'VALIDATION_ERROR');

  const result = await runLifecycleOperation(async (session) => {
    const impact = await resolveQuestionImpact(id, { session });
    const question = impact.question;
    if (status === 'archived') {
      if (question.status === PUBLISHABLE_STATUS.ARCHIVED) return { question, counts: impact.counts };
      await assertQuestionCanLeavePublished(question);
      question.statusBeforeManualArchive = ['draft', 'published'].includes(question.status) ? question.status : PUBLISHABLE_STATUS.DRAFT;
      question.manualArchive = true;
      question.status = PUBLISHABLE_STATUS.ARCHIVED;
      await question.save(operationOptions(session));
      return { question, counts: impact.counts };
    }

    if (question.status !== PUBLISHABLE_STATUS.ARCHIVED) return { question, counts: impact.counts };
    if ((question.archivedByTopics || []).length || (question.archivedByLessons || []).length) {
      throw new ApiError(409, 'Restore the parent topic or lesson before restoring this question.', [], 'QUESTION_ARCHIVED_BY_PARENT');
    }
    question.manualArchive = false;
    question.status = ['draft', 'published'].includes(question.statusBeforeManualArchive) ? question.statusBeforeManualArchive : PUBLISHABLE_STATUS.DRAFT;
    question.statusBeforeManualArchive = null;
    question.statusBeforeCascadeArchive = null;
    question.statusBeforeTopicArchive = null;
    await question.save(operationOptions(session));
    return { question, counts: impact.counts };
  });

  await invalidateContentCache();
  return result;
};

export const deleteQuestion = async (id) => {
  const result = await runLifecycleOperation(async (session) => {
    const impact = await resolveQuestionImpact(id, { session });
    const question = impact.question;
    await assertQuestionCanLeavePublished(question);

    await QuizAttempt.updateMany({ 'answers.question': question._id }, [{ $set: { answers: { $map: { input: { $ifNull: ['$answers', []] }, as: 'answer', in: { $cond: [{ $eq: ['$$answer.question', question._id] }, { $mergeObjects: ['$$answer', { question: null }] }, '$$answer'] } } } } }], operationOptions(session));
    await CoursePlan.updateMany({ 'modules.quizQuestions': question._id }, [{ $set: { modules: { $map: { input: { $ifNull: ['$modules', []] }, as: 'module', in: { $mergeObjects: ['$$module', { quizQuestions: { $filter: { input: { $ifNull: ['$$module.quizQuestions', []] }, as: 'questionId', cond: { $ne: ['$$questionId', question._id] } } } }] } } } } }], operationOptions(session));
    await Assessment.deleteMany({ status: 'started', questionIds: question._id }, operationOptions(session));
    await Assessment.updateMany({ status: 'completed', questionIds: question._id }, { $pull: { questionIds: question._id } }, operationOptions(session));
    await Assessment.updateMany({ status: 'completed', 'answers.question': question._id }, [{ $set: { answers: { $map: { input: { $ifNull: ['$answers', []] }, as: 'answer', in: { $cond: [{ $eq: ['$$answer.question', question._id] }, { $mergeObjects: ['$$answer', { question: null }] }, '$$answer'] } } } } }], operationOptions(session));
    await QuizQuestion.deleteOne({ _id: question._id }, operationOptions(session));
    return { question, counts: impact.counts };
  });

  await invalidateContentCache();
  return result;
};
