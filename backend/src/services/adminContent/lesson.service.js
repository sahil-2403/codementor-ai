import mongoose from 'mongoose';
import { Lesson } from '../../models/Lesson.js';
import { QuizQuestion } from '../../models/QuizQuestion.js';
import { ProjectTask } from '../../models/ProjectTask.js';
import { ProjectSubmission } from '../../models/ProjectSubmission.js';
import { QuizAttempt } from '../../models/QuizAttempt.js';
import { CoursePlan } from '../../models/CoursePlan.js';
import { Progress } from '../../models/Progress.js';
import { RevisionItem } from '../../models/RevisionItem.js';
import { WeeklyReport } from '../../models/WeeklyReport.js';
import { env } from '../../config/env.js';
import { ApiError } from '../../utils/ApiError.js';
import { generateSlug } from '../../utils/generateSlug.js';
import { makeSearchRegex } from '../../utils/pagination.js';
import { listWithPagination } from '../listQuery.service.js';
import { invalidateContentCache } from '../cacheInvalidation.service.js';
import {
  PUBLISHABLE_STATUS,
  assertTopicExists,
  cleanInterviewPairs,
  cleanStringArray,
  ensureEditable,
  ensureFound,
  transitionStatus
} from './common.js';

const ids = (documents = []) => documents.map((item) => item._id);
const withSession = (query, session) => (session ? query.session(session) : query);
const operationOptions = (session) => (session ? { session } : undefined);

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

const archiveDependentContent = async ({ model, contentIds, lessonId, session }) => {
  if (!contentIds.length) return;

  await model.updateMany(
    { _id: { $in: contentIds } },
    [
      {
        $set: {
          archivedByLessons: {
            $setUnion: [{ $ifNull: ['$archivedByLessons', []] }, [lessonId]]
          },
          statusBeforeCascadeArchive: {
            $cond: [
              { $ne: [{ $ifNull: ['$statusBeforeCascadeArchive', null] }, null] },
              '$statusBeforeCascadeArchive',
              {
                $cond: [
                  { $in: ['$status', ['draft', 'published']] },
                  '$status',
                  { $ifNull: ['$statusBeforeTopicArchive', null] }
                ]
              }
            ]
          },
          // If a Topic archived this item first, move the original status into the
          // shared cascade field so restoring the Topic cannot bypass this Lesson blocker.
          statusBeforeTopicArchive: null,
          status: 'archived'
        }
      }
    ],
    operationOptions(session)
  );
};

const restoreDependentContent = async ({ model, contentIds, lessonId, session }) => {
  if (!contentIds.length) return;

  await model.updateMany(
    { _id: { $in: contentIds } },
    [
      {
        $set: {
          archivedByLessons: {
            $setDifference: [{ $ifNull: ['$archivedByLessons', []] }, [lessonId]]
          }
        }
      },
      {
        $set: {
          status: {
            $cond: [
              {
                $and: [
                  { $eq: [{ $size: { $ifNull: ['$archivedByLessons', []] } }, 0] },
                  { $eq: [{ $size: { $ifNull: ['$archivedByTopics', []] } }, 0] },
                  { $in: ['$statusBeforeCascadeArchive', ['draft', 'published']] }
                ]
              },
              '$statusBeforeCascadeArchive',
              '$status'
            ]
          },
          statusBeforeCascadeArchive: {
            $cond: [
              {
                $and: [
                  { $eq: [{ $size: { $ifNull: ['$archivedByLessons', []] } }, 0] },
                  { $eq: [{ $size: { $ifNull: ['$archivedByTopics', []] } }, 0] },
                  { $in: ['$statusBeforeCascadeArchive', ['draft', 'published']] }
                ]
              },
              null,
              '$statusBeforeCascadeArchive'
            ]
          }
        }
      }
    ],
    operationOptions(session)
  );
};

const assertLessonPublishable = async (lesson) => {
  const errors = [];
  if (String(lesson.title || '').trim().length < 2) errors.push({ field: 'title', message: 'Title is required' });
  if (String(lesson.theory || '').trim().length < 10) errors.push({ field: 'theory', message: 'Theory must contain at least 10 characters' });
  if (!lesson.topic) errors.push({ field: 'topic', message: 'Topic is required' });
  if (lesson.codeExample && !String(lesson.codeExplanation || '').trim()) {
    errors.push({ field: 'codeExplanation', message: 'Explain the code example before publishing' });
  }
  lesson.interviewQuestions.forEach((item, index) => {
    if (!String(item.question || '').trim() || !String(item.answer || '').trim()) {
      errors.push({ field: `interviewQuestions.${index}`, message: 'Each interview question must include both a question and answer' });
    }
  });
  if (errors.length) throw new ApiError(400, 'Lesson is not ready to publish', errors, 'CONTENT_NOT_READY');
  await assertTopicExists(lesson.topic);
};

export const resolveLessonImpact = async (lessonId, { session = null } = {}) => {
  const lesson = ensureFound(
    await withSession(Lesson.findById(lessonId).populate('topic', 'title status'), session),
    'Lesson'
  );

  const quizDocs = await withSession(
    QuizQuestion.find({ relatedLesson: lesson._id }).select('_id'),
    session
  );
  const quizQuestionIds = ids(quizDocs);

  const projectDocs = await withSession(
    ProjectTask.find({ relatedLessons: lesson._id }).select('_id'),
    session
  );
  const projectTaskIds = ids(projectDocs);

  const [
    projectSubmissions,
    quizAttempts,
    affectedCoursePlans,
    progressRecords,
    revisionItems,
    weeklyReports
  ] = await Promise.all([
    projectTaskIds.length
      ? withSession(ProjectSubmission.countDocuments({ projectTask: { $in: projectTaskIds } }), session)
      : 0,
    quizQuestionIds.length
      ? withSession(QuizAttempt.countDocuments({ 'answers.question': { $in: quizQuestionIds } }), session)
      : 0,
    withSession(
      CoursePlan.countDocuments({
        $or: [
          { 'modules.lessons.lesson': lesson._id },
          ...(quizQuestionIds.length ? [{ 'modules.quizQuestions': { $in: quizQuestionIds } }] : [])
        ]
      }),
      session
    ),
    withSession(Progress.countDocuments({ completedLessons: lesson._id }), session),
    withSession(RevisionItem.countDocuments({ relatedLesson: lesson._id }), session),
    withSession(WeeklyReport.countDocuments({ completedLessons: lesson._id }), session)
  ]);

  return {
    lesson,
    quizQuestionIds,
    projectTaskIds,
    counts: {
      quizQuestions: quizQuestionIds.length,
      projects: projectTaskIds.length,
      projectSubmissions,
      quizAttempts,
      affectedCoursePlans,
      progressRecords,
      revisionItems,
      weeklyReports
    }
  };
};

export const listLessons = async (query = {}) => {
  const search = makeSearchRegex(query.search);
  const filter = {};
  if (search) filter.$or = [{ title: search }, { theory: search }, { tags: search }];
  if (query.status) filter.status = query.status;
  if (query.difficulty) filter.difficulty = query.difficulty;
  if (query.topic && mongoose.isValidObjectId(query.topic)) filter.topic = query.topic;
  return listWithPagination({ model: Lesson, filter, query, populate: ['topic'] });
};

export const getLesson = async (id) => ensureFound(
  await Lesson.findById(id).populate('topic', 'title status'),
  'Lesson'
);

export const getLessonImpact = async (id) => {
  const impact = await resolveLessonImpact(id);
  return { lesson: impact.lesson, counts: impact.counts };
};

export const createLesson = async (payload) => {
  await assertTopicExists(payload.topic);
  const lesson = await Lesson.create({
    ...payload,
    slug: generateSlug(payload.title),
    commonMistakes: cleanStringArray(payload.commonMistakes),
    interviewQuestions: cleanInterviewPairs(payload.interviewQuestions),
    tags: cleanStringArray(payload.tags),
    status: PUBLISHABLE_STATUS.DRAFT,
    manualArchive: false
  });
  await invalidateContentCache();
  return lesson.populate('topic', 'title status');
};

export const updateLesson = async ({ id, payload }) => {
  const lesson = ensureFound(await Lesson.findById(id), 'Lesson');
  ensureEditable(lesson, 'Lesson');
  if (payload.topic) await assertTopicExists(payload.topic);
  const normalized = {
    ...payload,
    ...(payload.title ? { slug: generateSlug(payload.title) } : {}),
    ...(payload.commonMistakes ? { commonMistakes: cleanStringArray(payload.commonMistakes) } : {}),
    ...(payload.interviewQuestions ? { interviewQuestions: cleanInterviewPairs(payload.interviewQuestions) } : {}),
    ...(payload.tags ? { tags: cleanStringArray(payload.tags) } : {})
  };
  delete normalized.status;
  delete normalized.manualArchive;
  delete normalized.archivedByTopics;
  delete normalized.statusBeforeCascadeArchive;
  delete normalized.statusBeforeTopicArchive;
  Object.assign(lesson, normalized);
  await lesson.save();
  await invalidateContentCache();
  return lesson.populate('topic', 'title status');
};

export const changeLessonStatus = async ({ id, status, confirmPublish = false }) => {
  if (status === PUBLISHABLE_STATUS.PUBLISHED) {
    return transitionStatus({
      model: Lesson,
      id,
      label: 'Lesson',
      status,
      confirmPublish,
      validatePublish: assertLessonPublishable,
      populate: ['topic']
    });
  }

  if (!['archived', 'restored'].includes(status)) {
    throw new ApiError(400, 'Invalid lesson status', [], 'VALIDATION_ERROR');
  }

  const result = await runLifecycleOperation(async (session) => {
    const impact = await resolveLessonImpact(id, { session });
    const lesson = impact.lesson;
    const topicBlockers = lesson.archivedByTopics || [];

    if (status === 'archived') {
      if (lesson.status === PUBLISHABLE_STATUS.ARCHIVED) {
        if (topicBlockers.length) {
          throw new ApiError(
            409,
            'This lesson is archived by its parent topic. Manage the topic lifecycle instead.',
            [],
            'LESSON_ARCHIVED_BY_TOPIC'
          );
        }
        return { lesson, counts: impact.counts };
      }

      lesson.statusBeforeCascadeArchive =
        lesson.statusBeforeCascadeArchive ||
        lesson.statusBeforeTopicArchive ||
        lesson.status;
      lesson.statusBeforeTopicArchive = null;
      lesson.manualArchive = true;
      lesson.status = PUBLISHABLE_STATUS.ARCHIVED;
      await lesson.save(operationOptions(session));

      await archiveDependentContent({
        model: QuizQuestion,
        contentIds: impact.quizQuestionIds,
        lessonId: lesson._id,
        session
      });
      await archiveDependentContent({
        model: ProjectTask,
        contentIds: impact.projectTaskIds,
        lessonId: lesson._id,
        session
      });

      return { lesson, counts: impact.counts };
    }

    if (lesson.status !== PUBLISHABLE_STATUS.ARCHIVED) {
      return { lesson, counts: impact.counts };
    }

    if (topicBlockers.length) {
      throw new ApiError(
        409,
        'Restore the parent topic before restoring this lesson.',
        [{ field: 'topic', message: 'The lesson is still archived by its parent topic' }],
        'LESSON_ARCHIVED_BY_TOPIC'
      );
    }

    const previousStatus =
      lesson.statusBeforeCascadeArchive ||
      lesson.statusBeforeTopicArchive ||
      PUBLISHABLE_STATUS.DRAFT;

    lesson.manualArchive = false;
    lesson.status = ['draft', 'published'].includes(previousStatus)
      ? previousStatus
      : PUBLISHABLE_STATUS.DRAFT;
    lesson.statusBeforeCascadeArchive = null;
    lesson.statusBeforeTopicArchive = null;
    await lesson.save(operationOptions(session));

    await restoreDependentContent({
      model: QuizQuestion,
      contentIds: impact.quizQuestionIds,
      lessonId: lesson._id,
      session
    });
    await restoreDependentContent({
      model: ProjectTask,
      contentIds: impact.projectTaskIds,
      lessonId: lesson._id,
      session
    });

    return { lesson, counts: impact.counts };
  });

  await invalidateContentCache();
  return result;
};

export const deleteLesson = async (id) => {
  const result = await runLifecycleOperation(async (session) => {
    const impact = await resolveLessonImpact(id, { session });
    const { lesson, quizQuestionIds, projectTaskIds } = impact;

    if (projectTaskIds.length) {
      await ProjectSubmission.deleteMany(
        { projectTask: { $in: projectTaskIds } },
        operationOptions(session)
      );
    }

    if (quizQuestionIds.length) {
      await QuizAttempt.updateMany(
        { 'answers.question': { $in: quizQuestionIds } },
        [
          {
            $set: {
              answers: {
                $map: {
                  input: { $ifNull: ['$answers', []] },
                  as: 'answer',
                  in: {
                    $cond: [
                      { $in: ['$$answer.question', quizQuestionIds] },
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
    }

    await CoursePlan.updateMany(
      {
        $or: [
          { 'modules.lessons.lesson': lesson._id },
          ...(quizQuestionIds.length ? [{ 'modules.quizQuestions': { $in: quizQuestionIds } }] : [])
        ]
      },
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
                      lessons: {
                        $filter: {
                          input: { $ifNull: ['$$module.lessons', []] },
                          as: 'courseLesson',
                          cond: { $ne: ['$$courseLesson.lesson', lesson._id] }
                        }
                      },
                      quizQuestions: {
                        $filter: {
                          input: { $ifNull: ['$$module.quizQuestions', []] },
                          as: 'questionId',
                          cond: { $not: [{ $in: ['$$questionId', quizQuestionIds] }] }
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

    await Progress.updateMany(
      {
        $or: [
          { completedLessons: lesson._id },
          { 'weakTopics.relatedLessons': lesson._id }
        ]
      },
      [
        {
          $set: {
            completedLessons: {
              $filter: {
                input: { $ifNull: ['$completedLessons', []] },
                as: 'lessonId',
                cond: { $ne: ['$$lessonId', lesson._id] }
              }
            },
            weakTopics: {
              $map: {
                input: { $ifNull: ['$weakTopics', []] },
                as: 'weakTopic',
                in: {
                  $mergeObjects: [
                    '$$weakTopic',
                    {
                      relatedLessons: {
                        $filter: {
                          input: { $ifNull: ['$$weakTopic.relatedLessons', []] },
                          as: 'relatedLessonId',
                          cond: { $ne: ['$$relatedLessonId', lesson._id] }
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

    await RevisionItem.deleteMany(
      { relatedLesson: lesson._id },
      operationOptions(session)
    );

    await WeeklyReport.updateMany(
      { completedLessons: lesson._id },
      { $pull: { completedLessons: lesson._id } },
      operationOptions(session)
    );

    if (projectTaskIds.length) {
      await ProjectTask.deleteMany(
        { _id: { $in: projectTaskIds } },
        operationOptions(session)
      );
    }
    if (quizQuestionIds.length) {
      await QuizQuestion.deleteMany(
        { _id: { $in: quizQuestionIds } },
        operationOptions(session)
      );
    }

    await Lesson.deleteOne({ _id: lesson._id }, operationOptions(session));
    return { lesson, counts: impact.counts };
  });

  await invalidateContentCache();
  return result;
};
