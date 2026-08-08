import { InterviewQuestion } from '../../models/InterviewQuestion.js';
import { Topic } from '../../models/Topic.js';
import { ApiError } from '../../utils/ApiError.js';
import { makeSearchRegex } from '../../utils/pagination.js';
import { listWithPagination } from '../listQuery.service.js';
import { invalidateContentCache } from '../cacheInvalidation.service.js';
import {
  PUBLISHABLE_STATUS,
  cleanStringArray,
  ensureEditable,
  ensureFound,
  transitionStatus
} from './common.js';

const escapeRegex = (value = '') => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const resolveTopicReference = async (topicTitle) => {
  const title = String(topicTitle || '').trim();
  if (!title) return { topic: title, topicRef: null };

  const topic = await Topic.findOne({
    title: new RegExp(`^${escapeRegex(title)}$`, 'i'),
    $or: [{ status: 'active' }, { status: { $exists: false } }]
  }).select('_id title').lean();

  return topic
    ? { topic: topic.title, topicRef: topic._id }
    : { topic: title, topicRef: null };
};

const assertInterviewQuestionPublishable = async (question) => {
  const errors = [];
  if (String(question.question || '').trim().length < 5) errors.push({ field: 'question', message: 'Question is required' });
  if (String(question.topic || '').trim().length < 2) errors.push({ field: 'topic', message: 'Topic is required' });
  if (String(question.expectedAnswer || '').trim().length < 20) {
    errors.push({ field: 'expectedAnswer', message: 'Expected answer must contain at least 20 characters' });
  }
  if (!cleanStringArray(question.answerChecklist).length) {
    errors.push({ field: 'answerChecklist', message: 'Add at least one answer checklist item' });
  }
  if (errors.length) throw new ApiError(400, 'Interview question is not ready to publish', errors, 'CONTENT_NOT_READY');
};

export const listInterviewQuestions = async (query = {}) => {
  const search = makeSearchRegex(query.search);
  const filter = {};
  if (search) filter.$or = [{ question: search }, { expectedAnswer: search }, { topic: search }, { tags: search }];
  if (query.status) filter.status = query.status;
  if (query.difficulty) filter.difficulty = query.difficulty;
  if (query.type) filter.type = query.type;
  if (query.topic) filter.topic = query.topic;
  return listWithPagination({ model: InterviewQuestion, filter, query });
};

export const getInterviewQuestion = async (id) => ensureFound(await InterviewQuestion.findById(id), 'Interview question');

export const createInterviewQuestion = async (payload) => {
  const topicLink = await resolveTopicReference(payload.topic);
  const question = await InterviewQuestion.create({
    ...payload,
    ...topicLink,
    answerChecklist: cleanStringArray(payload.answerChecklist),
    tags: cleanStringArray(payload.tags),
    status: PUBLISHABLE_STATUS.DRAFT
  });
  await invalidateContentCache();
  return question;
};

export const updateInterviewQuestion = async ({ id, payload }) => {
  const question = ensureFound(await InterviewQuestion.findById(id), 'Interview question');
  ensureEditable(question, 'Interview question');
  const topicLink = payload.topic ? await resolveTopicReference(payload.topic) : {};
  const normalized = {
    ...payload,
    ...topicLink,
    ...(payload.answerChecklist ? { answerChecklist: cleanStringArray(payload.answerChecklist) } : {}),
    ...(payload.tags ? { tags: cleanStringArray(payload.tags) } : {})
  };
  delete normalized.status;
  Object.assign(question, normalized);
  await question.save();
  await invalidateContentCache();
  return question;
};

export const changeInterviewQuestionStatus = (args) => transitionStatus({
  model: InterviewQuestion,
  label: 'Interview question',
  validatePublish: assertInterviewQuestionPublishable,
  ...args
});
