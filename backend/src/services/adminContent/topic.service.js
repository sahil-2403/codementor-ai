import mongoose from 'mongoose';
import { Topic } from '../../models/Topic.js';
import { Lesson } from '../../models/Lesson.js';
import { QuizQuestion } from '../../models/QuizQuestion.js';
import { ProjectTask } from '../../models/ProjectTask.js';
import { InterviewQuestion } from '../../models/InterviewQuestion.js';
import { ProjectSubmission } from '../../models/ProjectSubmission.js';
import { InterviewAttempt } from '../../models/InterviewAttempt.js';
import { QuizAttempt } from '../../models/QuizAttempt.js';
import { CoursePlan } from '../../models/CoursePlan.js';
import { Progress } from '../../models/Progress.js';
import { RevisionItem } from '../../models/RevisionItem.js';
import { WeeklyReport } from '../../models/WeeklyReport.js';
import { ApiError } from '../../utils/ApiError.js';
import { generateSlug } from '../../utils/generateSlug.js';
import { makeSearchRegex } from '../../utils/pagination.js';
import { listWithPagination } from '../listQuery.service.js';
import { invalidateContentCache } from '../cacheInvalidation.service.js';
import { ensureFound } from './common.js';

const ACTIVE_TOPIC_FILTER = {
  $or: [{ status: 'active' }, { status: { $exists: false } }]
};

const escapeRegex = (value = '') => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const exactTitleRegex = (title) => new RegExp(`^${escapeRegex(title)}$`, 'i');
const ids = (documents = []) => documents.map((item) => item._id);
const withSession = (query, session) => (session ? query.session(session) : query);

const archiveContent = async ({ model, contentIds, topicId, session }) => {
  if (!contentIds.length) return;

  await model.updateMany(
    { _id: { $in: contentIds } },
    [
      {
        $set: {
          archivedByTopics: {
            $setUnion: [{ $ifNull: ['$archivedByTopics', []] }, [topicId]]
          },
          statusBeforeTopicArchive: {
            $cond: [
              {
                $and: [
                  { $ne: ['$status', 'archived'] },
                  { $eq: [{ $ifNull: ['$statusBeforeTopicArchive', null] }, null] }
                ]
              },
              '$status',
              '$statusBeforeTopicArchive'
            ]
          },
          status: 'archived'
        }
      }
    ],
    { session }
  );
};

const restoreContent = async ({ model, contentIds, topicId, session }) => {
  if (!contentIds.length) return;

  await model.updateMany(
    { _id: { $in: contentIds } },
    [
      {
        $set: {
          archivedByTopics: {
            $setDifference: [{ $ifNull: ['$archivedByTopics', []] }, [topicId]]
          }
        }
      },
      {
        $set: {
          status: {
            $cond: [
              {
                $and: [
                  { $eq: [{ $size: '$archivedByTopics' }, 0] },
                  { $in: ['$statusBeforeTopicArchive', ['draft', 'published']] }
                ]
              },
              '$statusBeforeTopicArchive',
              '$status'
            ]
          },
          statusBeforeTopicArchive: {
            $cond: [
              {
                $and: [
                  { $eq: [{ $size: '$archivedByTopics' }, 0] },
                  { $in: ['$statusBeforeTopicArchive', ['draft', 'published']] }
                ]
              },
              null,
              '$statusBeforeTopicArchive'
            ]
          }
        }
      }
    ],
    { session }
  );
};

export const resolveTopicImpact = async (topicId, { session = null } = {}) => {
  const topic = ensureFound(
    await withSession(Topic.findById(topicId), session),
    'Topic'
  );

  const lessonDocs = await withSession(
    Lesson.find({ topic: topic._id }).select('_id'),
    session
  );
  const lessonIds = ids(lessonDocs);

  const quizDocs = await withSession(
    QuizQuestion.find({ topic: topic._id }).select('_id'),
    session
  );
  const quizQuestionIds = ids(quizDocs);

  const projectDocs = lessonIds.length
    ? await withSession(
        ProjectTask.find({ relatedLessons: { $in: lessonIds } }).select('_id'),
        session
      )
    : [];
  const projectTaskIds = ids(projectDocs);

  const interviewDocs = await withSession(
    InterviewQuestion.find({
      $or: [
        { topicRef: topic._id },
        { topic: exactTitleRegex(topic.title) }
      ]
    }).select('_id'),
    session
  );
  const interviewQuestionIds = ids(interviewDocs);

  const [projectSubmissions, interviewAttempts, quizAttempts, affectedCoursePlans] = await Promise.all([
    projectTaskIds.length
      ? withSession(ProjectSubmission.countDocuments({ projectTask: { $in: projectTaskIds } }), session)
      : 0,
    interviewQuestionIds.length
      ? withSession(InterviewAttempt.countDocuments({ question: { $in: interviewQuestionIds } }), session)
      : 0,
    quizQuestionIds.length
      ? withSession(QuizAttempt.countDocuments({ 'answers.question': { $in: quizQuestionIds } }), session)
      : 0,
    lessonIds.length || quizQuestionIds.length
      ? withSession(
          CoursePlan.countDocuments({
            $or: [
              ...(lessonIds.length ? [{ 'modules.lessons.lesson': { $in: lessonIds } }] : []),
              ...(quizQuestionIds.length ? [{ 'modules.quizQuestions': { $in: quizQuestionIds } }] : [])
            ]
          }),
          session
        )
      : 0
  ]);

  return {
    topic,
    lessonIds,
    quizQuestionIds,
    projectTaskIds,
    interviewQuestionIds,
    counts: {
      lessons: lessonIds.length,
      quizQuestions: quizQuestionIds.length,
      projects: projectTaskIds.length,
      interviewQuestions: interviewQuestionIds.length,
      projectSubmissions,
      interviewAttempts,
      quizAttempts,
      affectedCoursePlans
    }
  };
};

export const listTopics = async (query = {}) => {
  const search = makeSearchRegex(query.search);
  const filter = {};
  const conditions = [];

  if (search) {
    conditions.push({
      $or: [{ title: search }, { category: search }, { tags: search }]
    });
  }

  if (query.status === 'active') conditions.push(ACTIVE_TOPIC_FILTER);
  if (query.status === 'archived') filter.status = 'archived';
  if (query.difficulty) filter.difficulty = query.difficulty;
  if (conditions.length) filter.$and = conditions;

  return listWithPagination({
    model: Topic,
    filter,
    query: { sortBy: 'order', sortOrder: 'asc', ...query }
  });
};

export const getTopic = async (id) => ensureFound(await Topic.findById(id), 'Topic');

export const getTopicImpact = async (id) => {
  const impact = await resolveTopicImpact(id);
  return { topic: impact.topic, counts: impact.counts };
};

export const createTopic = async (payload) => {
  const topic = await Topic.create({
    ...payload,
    slug: generateSlug(payload.title),
    status: 'active'
  });
  await invalidateContentCache();
  return topic;
};

export const updateTopic = async ({ id, payload }) => {
  const topic = ensureFound(await Topic.findById(id), 'Topic');
  const currentStatus = topic.status || 'active';
  if (currentStatus === 'archived') {
    throw new ApiError(409, 'Archived topics must be restored before editing', [], 'TOPIC_ARCHIVED');
  }

  const previousTitle = topic.title;
  Object.assign(topic, payload);
  topic.status = 'active';
  if (payload.title) topic.slug = generateSlug(payload.title);
  await topic.save();

  if (payload.title && previousTitle !== topic.title) {
    await InterviewQuestion.updateMany(
      {
        $or: [
          { topicRef: topic._id },
          { topic: exactTitleRegex(previousTitle) }
        ]
      },
      { $set: { topic: topic.title, topicRef: topic._id } }
    );
  }

  await invalidateContentCache();
  return topic;
};

export const changeTopicStatus = async ({ id, status }) => {
  if (!['active', 'archived'].includes(status)) {
    throw new ApiError(400, 'Invalid topic status', [], 'VALIDATION_ERROR');
  }

  const session = await mongoose.startSession();
  let result = null;

  try {
    await session.withTransaction(async () => {
      const impact = await resolveTopicImpact(id, { session });
      const topic = impact.topic;
      const currentStatus = topic.status || 'active';

      if (currentStatus === status) {
        result = { topic, counts: impact.counts };
        return;
      }

      topic.status = status;
      await topic.save({ session });

      if (impact.interviewQuestionIds.length) {
        await InterviewQuestion.updateMany(
          { _id: { $in: impact.interviewQuestionIds } },
          { $set: { topicRef: topic._id, topic: topic.title } },
          { session }
        );
      }

      const contentGroups = [
        [Lesson, impact.lessonIds],
        [QuizQuestion, impact.quizQuestionIds],
        [ProjectTask, impact.projectTaskIds],
        [InterviewQuestion, impact.interviewQuestionIds]
      ];

      for (const [model, contentIds] of contentGroups) {
        if (status === 'archived') {
          await archiveContent({ model, contentIds, topicId: topic._id, session });
        } else {
          await restoreContent({ model, contentIds, topicId: topic._id, session });
        }
      }

      result = { topic, counts: impact.counts };
    });
  } finally {
    await session.endSession();
  }

  await invalidateContentCache();
  return result;
};

export const deleteTopic = async (id) => {
  const session = await mongoose.startSession();
  let result = null;

  try {
    await session.withTransaction(async () => {
      const impact = await resolveTopicImpact(id, { session });
      const {
        topic,
        lessonIds,
        quizQuestionIds,
        projectTaskIds,
        interviewQuestionIds
      } = impact;

      if (projectTaskIds.length) {
        await ProjectSubmission.deleteMany(
          { projectTask: { $in: projectTaskIds } },
          { session }
        );
      }

      if (interviewQuestionIds.length) {
        await InterviewAttempt.deleteMany(
          { question: { $in: interviewQuestionIds } },
          { session }
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
          { session }
        );
      }

      if (lessonIds.length || quizQuestionIds.length) {
        const courseFilter = {
          $or: [
            ...(lessonIds.length ? [{ 'modules.lessons.lesson': { $in: lessonIds } }] : []),
            ...(quizQuestionIds.length ? [{ 'modules.quizQuestions': { $in: quizQuestionIds } }] : [])
          ]
        };

        await CoursePlan.updateMany(
          courseFilter,
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
                              cond: { $not: { $in: ['$$courseLesson.lesson', lessonIds] } }
                            }
                          },
                          quizQuestions: {
                            $filter: {
                              input: { $ifNull: ['$$module.quizQuestions', []] },
                              as: 'questionId',
                              cond: { $not: { $in: ['$$questionId', quizQuestionIds] } }
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
          { session }
        );
      }

      if (lessonIds.length) {
        await Progress.updateMany(
          { completedLessons: { $in: lessonIds } },
          {
            $pull: {
              completedLessons: { $in: lessonIds },
              weakTopics: { relatedLessons: { $in: lessonIds } }
            }
          },
          { session }
        );

        await WeeklyReport.updateMany(
          { completedLessons: { $in: lessonIds } },
          { $pull: { completedLessons: { $in: lessonIds } } },
          { session }
        );
      }

      await RevisionItem.deleteMany(
        {
          $or: [
            ...(lessonIds.length ? [{ relatedLesson: { $in: lessonIds } }] : []),
            { topic: exactTitleRegex(topic.title) }
          ]
        },
        { session }
      );

      await WeeklyReport.updateMany(
        {},
        {
          $pull: {
            weakTopics: topic.title,
            strongTopics: topic.title
          }
        },
        { session }
      );

      if (projectTaskIds.length) {
        await ProjectTask.deleteMany({ _id: { $in: projectTaskIds } }, { session });
      }
      if (interviewQuestionIds.length) {
        await InterviewQuestion.deleteMany({ _id: { $in: interviewQuestionIds } }, { session });
      }
      if (quizQuestionIds.length) {
        await QuizQuestion.deleteMany({ _id: { $in: quizQuestionIds } }, { session });
      }
      if (lessonIds.length) {
        await Lesson.deleteMany({ _id: { $in: lessonIds } }, { session });
      }

      await Topic.deleteOne({ _id: topic._id }, { session });
      result = { topic, counts: impact.counts };
    });
  } finally {
    await session.endSession();
  }

  await invalidateContentCache();
  return result;
};
