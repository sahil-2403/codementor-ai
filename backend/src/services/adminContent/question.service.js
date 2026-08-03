import mongoose from 'mongoose';
import { QuizQuestion } from '../../models/QuizQuestion.js';
import { ApiError } from '../../utils/ApiError.js';
import { makeSearchRegex } from '../../utils/pagination.js';
import { listWithPagination } from '../listQuery.service.js';
import { invalidateContentCache } from '../cacheInvalidation.service.js';
import {
  PUBLISHABLE_STATUS,
  assertRelatedLesson,
  assertTopicExists,
  cleanStringArray,
  ensureEditable,
  ensureFound,
  transitionStatus
} from './common.js';

const assertQuizQuestionPublishable = async (question) => {
  const errors = [];
  const options = cleanStringArray(question.options);
  const answer = String(question.correctAnswer || '').trim();

  if (question.type === 'short_answer') {
    errors.push({ field: 'type', message: 'Short-answer grading is not supported yet; keep this question as a draft' });
  }
  if (question.type === 'mcq') {
    if (options.length < 2) errors.push({ field: 'options', message: 'MCQ questions need at least two unique options' });
    if (options.length > 6) errors.push({ field: 'options', message: 'MCQ questions can have at most six options' });
    if (!options.includes(answer)) errors.push({ field: 'correctAnswer', message: 'Correct answer must exactly match one of the options' });
  }
  if (!answer) errors.push({ field: 'correctAnswer', message: 'Correct answer is required' });
  if (String(question.explanation || '').trim().length < 10) {
    errors.push({ field: 'explanation', message: 'Add an explanation of at least 10 characters' });
  }
  if (!question.relatedLesson) errors.push({ field: 'relatedLesson', message: 'Choose a related lesson before publishing' });
  if (errors.length) throw new ApiError(400, 'Question is not ready to publish', errors, 'CONTENT_NOT_READY');

  await assertTopicExists(question.topic);
  await assertRelatedLesson({ lessonId: question.relatedLesson, topicId: question.topic, requirePublished: true });
};

export const listQuestions = async (query = {}) => {
  const search = makeSearchRegex(query.search);
  const filter = {};
  if (search) filter.$or = [{ question: search }, { explanation: search }, { tags: search }];
  if (query.status) filter.status = query.status;
  if (query.difficulty) filter.difficulty = query.difficulty;
  if (query.type) filter.type = query.type;
  if (query.topic && mongoose.isValidObjectId(query.topic)) filter.topic = query.topic;
  return listWithPagination({
    model: QuizQuestion,
    filter,
    query,
    populate: ['topic', { path: 'relatedLesson', select: 'title slug status' }]
  });
};

export const getQuestion = async (id) => ensureFound(
  await QuizQuestion.findById(id).populate('topic', 'title').populate('relatedLesson', 'title slug status'),
  'Question'
);

export const createQuestion = async (payload) => {
  await assertTopicExists(payload.topic);
  await assertRelatedLesson({ lessonId: payload.relatedLesson, topicId: payload.topic });
  const question = await QuizQuestion.create({
    ...payload,
    options: cleanStringArray(payload.options),
    tags: cleanStringArray(payload.tags),
    relatedLesson: payload.relatedLesson || undefined,
    status: PUBLISHABLE_STATUS.DRAFT
  });
  await invalidateContentCache();
  return question.populate('topic', 'title');
};

export const updateQuestion = async ({ id, payload }) => {
  const question = ensureFound(await QuizQuestion.findById(id), 'Question');
  ensureEditable(question, 'Question');
  const nextTopic = payload.topic || question.topic;
  if (payload.topic) await assertTopicExists(payload.topic);
  if (Object.prototype.hasOwnProperty.call(payload, 'relatedLesson')) {
    await assertRelatedLesson({ lessonId: payload.relatedLesson, topicId: nextTopic });
  } else if (payload.topic && question.relatedLesson) {
    await assertRelatedLesson({ lessonId: question.relatedLesson, topicId: nextTopic });
  }
  const normalized = {
    ...payload,
    ...(payload.options ? { options: cleanStringArray(payload.options) } : {}),
    ...(payload.tags ? { tags: cleanStringArray(payload.tags) } : {})
  };
  if (Object.prototype.hasOwnProperty.call(payload, 'relatedLesson')) normalized.relatedLesson = payload.relatedLesson || undefined;
  delete normalized.status;
  Object.assign(question, normalized);
  await question.save();
  await invalidateContentCache();
  return question.populate('topic', 'title');
};

export const changeQuestionStatus = (args) => transitionStatus({
  model: QuizQuestion,
  label: 'Question',
  validatePublish: assertQuizQuestionPublishable,
  populate: ['topic', { path: 'relatedLesson', select: 'title slug status' }],
  ...args
});
