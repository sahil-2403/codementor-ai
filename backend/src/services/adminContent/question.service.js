import mongoose from 'mongoose';
import { QuizQuestion } from '../../models/QuizQuestion.js';
import { QuizAttempt } from '../../models/QuizAttempt.js';
import { Assessment } from '../../models/Assessment.js';
import { CoursePlan } from '../../models/CoursePlan.js';
import { env } from '../../config/env.js';
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

const QUESTION_BANKS = Object.freeze({ QUIZ: 'quiz', SKILL_CHECK: 'skill_check' });
const legacyQuizBankFilter = { $or: [{ bank: QUESTION_BANKS.QUIZ }, { bank: { $exists: false } }] };
const withSession = (query, session) => (session ? query.session(session) : query);
const operationOptions = (session) => (session ? { session } : undefined);
const resolvedBank = (question) => question?.bank || QUESTION_BANKS.QUIZ;

const runLifecycleOperation = async (operation) => {
  if (!env.enableMongoTransactions) return operation(null);

  const session = await mongoose.startSession();
  let result;
  try {
    await session.withTransaction(async () => {
      result = await operation(session);
    });
  } finally {
    await session.endSession();
  }
  return result;
};

const assertQuestionBankRules = async ({ bank, topic, relatedLesson, difficulty }) => {
  await assertTopicExists(topic);

  if (bank === QUESTION_BANKS.SKILL_CHECK) {
    if (difficulty === 'beginner') {
      throw new ApiError(
        400,
        'Skill checks are only used for intermediate and advanced diagnostic assessments',
        [{ field: 'difficulty', message: 'Choose Intermediate or Advanced' }],
        'CONTENT_REFERENCE_INVALID'
      );
    }
    if (relatedLesson) {
      throw new ApiError(
        400,
        'Skill checks are not linked to lessons',
        [{ field: 'relatedLesson', message: 'Remove the related lesson from this skill check' }],
        'CONTENT_REFERENCE_INVALID'
      );
    }
    return;
  }

  if (relatedLesson) {
    await assertRelatedLesson({ lessonId: relatedLesson, topicId: topic });
  }
};

const assertQuestionPublishable = async (question) => {
  const errors = [];
  const options = cleanStringArray(question.options);
  const answer = String(question.correctAnswer || '').trim();
  const bank = resolvedBank(question);

  if (question.type === 'short_answer') {
    errors.push({ field: 'type', message: 'Short-answer grading is not supported yet; keep this question as a draft' });
  }
  if (question.type === 'mcq') {
    if (options.length < 2) errors.push({ field: 'options', message: 'MCQ questions need at least two unique options' });
    if (options.length > 6) errors.push({ field: 'options', message: 'MCQ questions can have at most six options' });
    if (!options.includes(answer)) errors.push({ field: 'correctAnswer', message: 'Choose one of the answer options as correct' });
  }
  if (question.type === 'code_output' && !String(question.codeSnippet || '').trim()) {
    errors.push({ field: 'codeSnippet', message: 'Add the code snippet learners should evaluate' });
  }
  if (!answer) errors.push({ field: 'correctAnswer', message: 'Correct answer is required' });
  if (String(question.explanation || '').trim().length < 10) {
    errors.push({ field: 'explanation', message: 'Add an explanation of at least 10 characters' });
  }

  if (bank === QUESTION_BANKS.QUIZ && !question.relatedLesson) {
    errors.push({ field: 'relatedLesson', message: 'Choose a related lesson before publishing a quiz question' });
  }
  if (bank === QUESTION_BANKS.SKILL_CHECK && question.difficulty === 'beginner') {
    errors.push({ field: 'difficulty', message: 'Skill checks support Intermediate and Advanced learners only' });
  }

  if (errors.length) {
    throw new ApiError(400, 'Question is not ready to publish', errors, 'CONTENT_NOT_READY');
  }

  await assertTopicExists(question.topic);
  if (bank === QUESTION_BANKS.QUIZ) {
    await assertRelatedLesson({
      lessonId: question.relatedLesson,
      topicId: question.topic,
      requirePublished: true
    });
  }
};

export const resolveQuestionImpact = async (questionId, { session = null } = {}) => {
  const question = ensureFound(
    await withSession(
      QuizQuestion.findById(questionId)
        .populate('topic', 'title status')
        .populate('relatedLesson', 'title status'),
      session
    ),
    'Question'
  );

  const [quizAttempts, affectedCoursePlans, startedAssessments, completedAssessments] = await Promise.all([
    withSession(QuizAttempt.countDocuments({ 'answers.question': question._id }), session),
    withSession(CoursePlan.countDocuments({ 'modules.quizQuestions': question._id }), session),
    withSession(Assessment.countDocuments({ status: 'started', questionIds: question._id }), session),
    withSession(
      Assessment.countDocuments({
        status: 'completed',
        $or: [{ questionIds: question._id }, { 'answers.question': question._id }]
      }),
      session
    )
  ]);

  return {
    question,
    counts: {
      quizAttempts,
      affectedCoursePlans,
      startedAssessments,
      completedAssessments
    }
  };
};

export const listQuestions = async (query = {}) => {
  const search = makeSearchRegex(query.search);
  const filter = {};
  const conditions = [];

  if (search) conditions.push({ $or: [{ question: search }, { explanation: search }, { tags: search }] });
  if (query.bank === QUESTION_BANKS.QUIZ) conditions.push(legacyQuizBankFilter);
  if (query.bank === QUESTION_BANKS.SKILL_CHECK) filter.bank = QUESTION_BANKS.SKILL_CHECK;
  if (query.status) filter.status = query.status;
  if (query.difficulty) filter.difficulty = query.difficulty;
  if (query.type) filter.type = query.type;
  if (query.topic && mongoose.isValidObjectId(query.topic)) filter.topic = query.topic;
  if (conditions.length) filter.$and = conditions;

  return listWithPagination({
    model: QuizQuestion,
    filter,
    query,
    populate: ['topic', { path: 'relatedLesson', select: 'title slug status topic' }]
  });
};

export const getQuestion = async (id) => ensureFound(
  await QuizQuestion.findById(id)
    .populate('topic', 'title status')
    .populate('relatedLesson', 'title slug status topic'),
  'Question'
);

export const getQuestionImpact = async (id) => {
  const impact = await resolveQuestionImpact(id);
  return { question: impact.question, counts: impact.counts };
};

export const createQuestion = async (payload) => {
  const bank = payload.bank === QUESTION_BANKS.SKILL_CHECK
    ? QUESTION_BANKS.SKILL_CHECK
    : QUESTION_BANKS.QUIZ;

  await assertQuestionBankRules({
    bank,
    topic: payload.topic,
    relatedLesson: bank === QUESTION_BANKS.QUIZ ? payload.relatedLesson : null,
    difficulty: payload.difficulty
  });

  const question = await QuizQuestion.create({
    ...payload,
    bank,
    codeSnippet: String(payload.codeSnippet || ''),
    options: cleanStringArray(payload.options),
    tags: cleanStringArray(payload.tags),
    relatedLesson: bank === QUESTION_BANKS.QUIZ && payload.relatedLesson
      ? payload.relatedLesson
      : undefined,
    status: PUBLISHABLE_STATUS.DRAFT,
    manualArchive: false
  });
  await invalidateContentCache();
  return question.populate('topic', 'title status');
};

export const updateQuestion = async ({ id, payload }) => {
  const question = ensureFound(await QuizQuestion.findById(id), 'Question');
  ensureEditable(question, 'Question');

  const bank = resolvedBank(question);
  if (payload.bank && payload.bank !== bank) {
    throw new ApiError(409, 'Move between question banks by creating a new question instead', [], 'QUESTION_BANK_IMMUTABLE');
  }

  const nextTopic = payload.topic || question.topic;
  const nextDifficulty = payload.difficulty || question.difficulty;
  const hasRelatedLesson = Object.prototype.hasOwnProperty.call(payload, 'relatedLesson');
  const nextRelatedLesson = hasRelatedLesson ? payload.relatedLesson : question.relatedLesson;

  await assertQuestionBankRules({
    bank,
    topic: nextTopic,
    relatedLesson: bank === QUESTION_BANKS.QUIZ ? nextRelatedLesson : null,
    difficulty: nextDifficulty
  });

  const normalized = {
    ...payload,
    bank,
    ...(payload.options ? { options: cleanStringArray(payload.options) } : {}),
    ...(payload.tags ? { tags: cleanStringArray(payload.tags) } : {})
  };

  if (bank === QUESTION_BANKS.SKILL_CHECK) {
    normalized.relatedLesson = undefined;
  } else if (hasRelatedLesson) {
    normalized.relatedLesson = payload.relatedLesson || undefined;
  }

  delete normalized.status;
  delete normalized.manualArchive;
  delete normalized.archivedByTopics;
  delete normalized.archivedByLessons;
  delete normalized.statusBeforeCascadeArchive;
  delete normalized.statusBeforeTopicArchive;

  Object.assign(question, normalized);
  await question.save();
  await invalidateContentCache();
  return question.populate('topic', 'title status');
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
      populate: ['topic', { path: 'relatedLesson', select: 'title slug status topic' }]
    });
  }

  if (!['archived', 'restored'].includes(status)) {
    throw new ApiError(400, 'Invalid question status', [], 'VALIDATION_ERROR');
  }

  const result = await runLifecycleOperation(async (session) => {
    const impact = await resolveQuestionImpact(id, { session });
    const question = impact.question;
    const topicBlockers = question.archivedByTopics || [];
    const lessonBlockers = question.archivedByLessons || [];

    if (status === 'archived') {
      if (question.status === PUBLISHABLE_STATUS.ARCHIVED) return { question, counts: impact.counts };

      question.statusBeforeCascadeArchive =
        question.statusBeforeCascadeArchive ||
        question.statusBeforeTopicArchive ||
        question.status;
      question.statusBeforeTopicArchive = null;
      question.manualArchive = true;
      question.status = PUBLISHABLE_STATUS.ARCHIVED;
      await question.save(operationOptions(session));
      return { question, counts: impact.counts };
    }

    if (question.status !== PUBLISHABLE_STATUS.ARCHIVED) return { question, counts: impact.counts };

    if (topicBlockers.length || lessonBlockers.length) {
      throw new ApiError(
        409,
        'Restore the parent topic or lesson before restoring this question.',
        [],
        'QUESTION_ARCHIVED_BY_PARENT'
      );
    }

    const previousStatus =
      question.statusBeforeCascadeArchive ||
      question.statusBeforeTopicArchive ||
      PUBLISHABLE_STATUS.DRAFT;

    question.manualArchive = false;
    question.status = ['draft', 'published'].includes(previousStatus)
      ? previousStatus
      : PUBLISHABLE_STATUS.DRAFT;
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

    await QuizAttempt.updateMany(
      { 'answers.question': question._id },
      [
        {
          $set: {
            answers: {
              $map: {
                input: { $ifNull: ['$answers', []] },
                as: 'answer',
                in: {
                  $cond: [
                    { $eq: ['$$answer.question', question._id] },
                    { $mergeObjects: ['$$answer', { question: null }] },
                    '$$answer'
                  ]
                }
              }
            }
          }
        }
      ],
      operationOptions(session)
    );

    await CoursePlan.updateMany(
      { 'modules.quizQuestions': question._id },
      [
        {
          $set: {
            modules: {
              $map: {
                input: { $ifNull: ['$modules', []] },
                as: 'module',
                in: {
                  $mergeObjects: [
                    '$$module',
                    {
                      quizQuestions: {
                        $filter: {
                          input: { $ifNull: ['$$module.quizQuestions', []] },
                          as: 'questionId',
                          cond: { $ne: ['$$questionId', question._id] }
                        }
                      }
                    }
                  ]
                }
              }
            }
          }
        }
      ],
      operationOptions(session)
    );

    await Assessment.deleteMany(
      { status: 'started', questionIds: question._id },
      operationOptions(session)
    );

    await Assessment.updateMany(
      { status: 'completed', questionIds: question._id },
      { $pull: { questionIds: question._id } },
      operationOptions(session)
    );

    await Assessment.updateMany(
      { status: 'completed', 'answers.question': question._id },
      [
        {
          $set: {
            answers: {
              $map: {
                input: { $ifNull: ['$answers', []] },
                as: 'answer',
                in: {
                  $cond: [
                    { $eq: ['$$answer.question', question._id] },
                    { $mergeObjects: ['$$answer', { question: null }] },
                    '$$answer'
                  ]
                }
              }
            }
          }
        }
      ],
      operationOptions(session)
    );

    await QuizQuestion.deleteOne({ _id: question._id }, operationOptions(session));
    return { question, counts: impact.counts };
  });

  await invalidateContentCache();
  return result;
};
