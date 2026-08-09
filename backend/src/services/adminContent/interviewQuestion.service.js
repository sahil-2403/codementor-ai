import mongoose from 'mongoose';
import { InterviewQuestion } from '../../models/InterviewQuestion.js';
import { InterviewAttempt } from '../../models/InterviewAttempt.js';
import { Topic } from '../../models/Topic.js';
import { env } from '../../config/env.js';
import { ApiError } from '../../utils/ApiError.js';
import { makeSearchRegex } from '../../utils/pagination.js';
import { listWithPagination } from '../listQuery.service.js';
import { invalidateContentCache } from '../cacheInvalidation.service.js';
import {
  PUBLISHABLE_STATUS,
  assertCourseExists,
  cleanReferenceArray,
  cleanStringArray,
  ensureEditable,
  ensureFound,
  transitionStatus
} from './common.js';

const escapeRegex = (value = '') => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const operationOptions = (session) => (session ? { session } : undefined);
const withSession = (query, session) => (session ? query.session(session) : query);

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

const resolveTopicReference = async ({ courseId, topicRef, topicTitle, session = null }) => {
  let query = null;
  if (topicRef && mongoose.isValidObjectId(topicRef)) {
    query = Topic.findOne({ _id: topicRef, course: courseId, status: 'active' }).select('_id title status course');
  } else {
    const title = String(topicTitle || '').trim();
    if (title) query = Topic.findOne({ course: courseId, title: new RegExp(`^${escapeRegex(title)}$`, 'i'), status: 'active' }).select('_id title status course');
  }
  const topic = query ? await withSession(query, session) : null;
  if (!topic) throw new ApiError(400, 'Selected topic is unavailable for this course', [{ field: 'topicRef', message: 'Choose an active topic from this course' }], 'CONTENT_REFERENCE_INVALID');
  return { topic: topic.title, topicRef: topic._id };
};

const assertInterviewQuestionPublishable = async (question) => {
  const errors = [];
  if (String(question.question || '').trim().length < 5) errors.push({ field: 'question', message: 'Question is required' });
  if (String(question.expectedAnswer || '').trim().length < 20) errors.push({ field: 'expectedAnswer', message: 'Expected answer must contain at least 20 characters' });
  if (!cleanStringArray(question.answerChecklist).length) errors.push({ field: 'answerChecklist', message: 'Add at least one answer review point' });
  if (errors.length) throw new ApiError(400, 'Interview question is not ready to publish', errors, 'CONTENT_NOT_READY');
  await assertCourseExists(question.course, { requirePublished: true });
  const topicLink = await resolveTopicReference({ courseId: question.course, topicRef: question.topicRef, topicTitle: question.topic });
  question.topic = topicLink.topic;
  question.topicRef = topicLink.topicRef;
};

export const resolveInterviewQuestionImpact = async (questionId, { session = null } = {}) => {
  const question = ensureFound(
    await withSession(
      InterviewQuestion.findById(questionId)
        .populate('course', 'title slug status')
        .populate('topicRef', 'title status course'),
      session
    ),
    'Interview question'
  );
  const interviewAttempts = await withSession(InterviewAttempt.countDocuments({ question: question._id }), session);
  return { question, counts: { interviewAttempts } };
};

export const listInterviewQuestions = async (query = {}) => {
  const search = makeSearchRegex(query.search);
  const filter = {};
  if (search) filter.$or = [{ question: search }, { expectedAnswer: search }, { topic: search }, { tags: search }];
  if (query.status) filter.status = query.status;
  if (query.difficulty) filter.difficulty = query.difficulty;
  if (query.type) filter.type = query.type;
  if (query.course && mongoose.isValidObjectId(query.course)) filter.course = query.course;
  if (query.topic) {
    if (mongoose.isValidObjectId(query.topic)) filter.topicRef = query.topic;
    else filter.topic = query.topic;
  }
  return listWithPagination({
    model: InterviewQuestion,
    filter,
    query,
    populate: [
      { path: 'course', select: 'title slug status' },
      { path: 'topicRef', select: 'title status course' }
    ]
  });
};

export const getInterviewQuestion = async (id) => ensureFound(
  await InterviewQuestion.findById(id).populate('course', 'title slug status').populate('topicRef', 'title status course'),
  'Interview question'
);
export const getInterviewQuestionImpact = async (id) => { const impact = await resolveInterviewQuestionImpact(id); return { interviewQuestion: impact.question, counts: impact.counts }; };

export const createInterviewQuestion = async (payload) => {
  await assertCourseExists(payload.course);
  const topicLink = await resolveTopicReference({ courseId: payload.course, topicRef: payload.topicRef, topicTitle: payload.topic });
  const question = await InterviewQuestion.create({
    ...payload,
    ...topicLink,
    technologies: cleanReferenceArray(payload.technologies),
    answerChecklist: cleanStringArray(payload.answerChecklist),
    tags: cleanStringArray(payload.tags),
    status: PUBLISHABLE_STATUS.DRAFT,
    manualArchive: false
  });
  await invalidateContentCache();
  return question.populate([
    { path: 'course', select: 'title slug status' },
    { path: 'topicRef', select: 'title status course' }
  ]);
};

export const updateInterviewQuestion = async ({ id, payload }) => {
  const question = ensureFound(await InterviewQuestion.findById(id), 'Interview question');
  ensureEditable(question, 'Interview question');
  if (payload.course && payload.course.toString() !== question.course.toString()) {
    throw new ApiError(409, 'Interview question course cannot be changed. Create it under the target course instead.', [], 'CONTENT_COURSE_IMMUTABLE');
  }
  const hasTopicChange = Object.prototype.hasOwnProperty.call(payload, 'topicRef') || Object.prototype.hasOwnProperty.call(payload, 'topic');
  const topicLink = hasTopicChange
    ? await resolveTopicReference({ courseId: question.course, topicRef: payload.topicRef, topicTitle: payload.topic || question.topic })
    : {};
  const normalized = {
    ...payload,
    ...topicLink,
    ...(payload.technologies ? { technologies: cleanReferenceArray(payload.technologies) } : {}),
    ...(payload.answerChecklist ? { answerChecklist: cleanStringArray(payload.answerChecklist) } : {}),
    ...(payload.tags ? { tags: cleanStringArray(payload.tags) } : {})
  };
  delete normalized.course;
  for (const field of ['status', 'manualArchive', 'statusBeforeManualArchive', 'archivedByTopics', 'statusBeforeCascadeArchive', 'statusBeforeTopicArchive']) delete normalized[field];
  Object.assign(question, normalized);
  if (question.status === PUBLISHABLE_STATUS.PUBLISHED) await assertInterviewQuestionPublishable(question);
  await question.save();
  await invalidateContentCache();
  return question.populate([
    { path: 'course', select: 'title slug status' },
    { path: 'topicRef', select: 'title status course' }
  ]);
};

export const changeInterviewQuestionStatus = async ({ id, status, confirmPublish = false }) => {
  if (status === PUBLISHABLE_STATUS.PUBLISHED) {
    return transitionStatus({
      model: InterviewQuestion,
      id,
      label: 'Interview question',
      status,
      confirmPublish,
      validatePublish: assertInterviewQuestionPublishable,
      populate: [
        { path: 'course', select: 'title slug status' },
        { path: 'topicRef', select: 'title status course' }
      ]
    });
  }
  if (!['archived', 'restored'].includes(status)) throw new ApiError(400, 'Invalid interview question status', [], 'VALIDATION_ERROR');

  const result = await runLifecycleOperation(async (session) => {
    const impact = await resolveInterviewQuestionImpact(id, { session });
    const question = impact.question;
    if (status === 'archived') {
      if (question.status === PUBLISHABLE_STATUS.ARCHIVED) return { question, counts: impact.counts };
      question.statusBeforeManualArchive = ['draft', 'published'].includes(question.status) ? question.status : PUBLISHABLE_STATUS.DRAFT;
      question.manualArchive = true;
      question.status = PUBLISHABLE_STATUS.ARCHIVED;
      await question.save(operationOptions(session));
      return { question, counts: impact.counts };
    }
    if (question.status !== PUBLISHABLE_STATUS.ARCHIVED) return { question, counts: impact.counts };
    if ((question.archivedByTopics || []).length) throw new ApiError(409, 'Restore the parent topic before restoring this interview question.', [], 'INTERVIEW_QUESTION_ARCHIVED_BY_TOPIC');
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

export const deleteInterviewQuestion = async (id) => {
  const result = await runLifecycleOperation(async (session) => {
    const impact = await resolveInterviewQuestionImpact(id, { session });
    if (impact.counts.interviewAttempts > 0) {
      throw new ApiError(409, 'This interview question already has learner attempts. Archive it instead of deleting it.', [], 'LEARNER_HISTORY_EXISTS');
    }
    await InterviewQuestion.deleteOne({ _id: impact.question._id }, operationOptions(session));
    return { question: impact.question, counts: impact.counts };
  });
  await invalidateContentCache();
  return result;
};
