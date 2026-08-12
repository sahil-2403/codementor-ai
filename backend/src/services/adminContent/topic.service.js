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
import { RoadmapTemplate } from '../../models/RoadmapTemplate.js';
import { ApiError } from '../../utils/ApiError.js';
import { generateSlug } from '../../utils/generateSlug.js';
import { makeSearchRegex } from '../../utils/pagination.js';
import { listWithPagination } from '../listQuery.service.js';
import { assertCourseExists, cleanReferenceArray, cleanStringArray, ensureFound, requireArchivedForDelete } from './common.js';

const ids = (documents = []) => documents.map((item) => item._id);

export const resolveTopicImpact = async (topicId) => {
  const topic = ensureFound(
    await Topic.findById(topicId).populate('course', 'title slug status'),
    'Topic'
  );

  const lessonDocs = await Lesson.find({ topic: topic._id }).select('_id');
  const quizDocs = await QuizQuestion.find({ topic: topic._id }).select('_id');
  const lessonIds = ids(lessonDocs);
  const quizQuestionIds = ids(quizDocs);
  const projectDocs = lessonIds.length
    ? await ProjectTask.find({ course: topic.course?._id || topic.course, relatedLessons: { $in: lessonIds } }).select('_id')
    : [];
  const interviewDocs = await InterviewQuestion.find({
    course: topic.course?._id || topic.course,
    topicRef: topic._id
  }).select('_id');
  const projectTaskIds = ids(projectDocs);
  const interviewQuestionIds = ids(interviewDocs);

  const [projectSubmissions, interviewAttempts, quizAttempts, affectedCoursePlans, templates] = await Promise.all([
    projectTaskIds.length ? ProjectSubmission.countDocuments({ projectTask: { $in: projectTaskIds } }) : 0,
    interviewQuestionIds.length ? InterviewAttempt.countDocuments({ question: { $in: interviewQuestionIds } }) : 0,
    quizQuestionIds.length ? QuizAttempt.countDocuments({ 'answers.question': { $in: quizQuestionIds } }) : 0,
    lessonIds.length || quizQuestionIds.length
      ? CoursePlan.countDocuments({
        $or: [
          ...(lessonIds.length ? [{ 'modules.lessons.lesson': { $in: lessonIds } }] : []),
          ...(quizQuestionIds.length ? [{ 'modules.quizQuestions': { $in: quizQuestionIds } }] : [])
        ]
      })
      : 0,
    lessonIds.length ? RoadmapTemplate.countDocuments({ 'modules.lessons': { $in: lessonIds } }) : 0
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
      affectedCoursePlans,
      templates
    }
  };
};

export const listTopics = async (query = {}) => {
  const search = makeSearchRegex(query.search);
  const filter = {};
  if (search) filter.$or = [{ title: search }, { category: search }, { tags: search }];
  if (query.status) filter.status = query.status;
  if (query.difficulty) filter.difficulty = query.difficulty;
  if (query.course && mongoose.isValidObjectId(query.course)) filter.course = query.course;

  return listWithPagination({
    model: Topic,
    filter,
    query: { sortBy: 'order', sortOrder: 'asc', ...query },
    populate: [{ path: 'course', select: 'title slug status' }]
  });
};

export const getTopic = async (id) => ensureFound(
  await Topic.findById(id).populate('course', 'title slug status'),
  'Topic'
);

export const getTopicImpact = async (id) => {
  const impact = await resolveTopicImpact(id);
  return { topic: impact.topic, counts: impact.counts };
};

export const createTopic = async (payload) => {
  await assertCourseExists(payload.course);
  const topic = await Topic.create({
    ...payload,
    technologies: cleanReferenceArray(payload.technologies),
    tags: cleanStringArray(payload.tags),
    slug: generateSlug(payload.title),
    status: 'active'
  });
  return topic.populate('course', 'title slug status');
};

export const updateTopic = async ({ id, payload }) => {
  const topic = ensureFound(await Topic.findById(id), 'Topic');
  if (topic.status === 'archived') {
    throw new ApiError(409, 'Archived topics must be restored before editing', [], 'TOPIC_ARCHIVED');
  }
  if (payload.course && payload.course.toString() !== topic.course.toString()) {
    throw new ApiError(409, 'Topic course cannot be changed. Create the topic under the target course instead.', [], 'CONTENT_COURSE_IMMUTABLE');
  }

  const previousTitle = topic.title;
  const normalized = {
    ...payload,
    ...(payload.technologies ? { technologies: cleanReferenceArray(payload.technologies) } : {}),
    ...(payload.tags ? { tags: cleanStringArray(payload.tags) } : {})
  };
  delete normalized.course;
  delete normalized.status;
  Object.assign(topic, normalized);
  if (payload.title) topic.slug = generateSlug(payload.title);
  await topic.save();

  if (payload.title && previousTitle !== topic.title) {
    await InterviewQuestion.updateMany(
      { course: topic.course, topicRef: topic._id },
      { $set: { topic: topic.title } }
    );
  }

  return topic.populate('course', 'title slug status');
};

export const changeTopicStatus = async ({ id, status }) => {
  if (!['active', 'archived'].includes(status)) {
    throw new ApiError(400, 'Invalid topic status', [], 'VALIDATION_ERROR');
  }

  const impact = await resolveTopicImpact(id);
  const topic = impact.topic;
  if (topic.status === status) return { topic, counts: impact.counts };

  if (status === 'archived') {
    const publishedTemplate = impact.lessonIds.length
      ? await RoadmapTemplate.findOne({ status: 'published', 'modules.lessons': { $in: impact.lessonIds } }).select('title')
      : null;
    if (publishedTemplate) {
      throw new ApiError(
        409,
        'This topic contains lessons used by a published roadmap template.',
        [{ field: 'template', message: `Archive or update “${publishedTemplate.title}” first, then archive this Topic again.` }],
        'TEMPLATE_DEPENDENCY_EXISTS'
      );
    }

    topic.status = 'archived';
    await topic.save();
    await Promise.all([
      Lesson.updateMany({ _id: { $in: impact.lessonIds } }, { status: 'archived' }),
      QuizQuestion.updateMany({ _id: { $in: impact.quizQuestionIds } }, { status: 'archived' }),
      ProjectTask.updateMany({ _id: { $in: impact.projectTaskIds } }, { status: 'archived' }),
      InterviewQuestion.updateMany({ _id: { $in: impact.interviewQuestionIds } }, { status: 'archived' })
    ]);
  } else {
    if (topic.course?.status === 'archived') {
      throw new ApiError(409, 'This topic cannot be restored while its Course is archived.', [
        { field: 'course', message: 'Restore the parent Course first.' }
      ], 'PARENT_ARCHIVED');
    }

    topic.status = 'active';
    await topic.save();
    await Promise.all([
      Lesson.updateMany({ _id: { $in: impact.lessonIds } }, { status: 'draft' }),
      QuizQuestion.updateMany({ _id: { $in: impact.quizQuestionIds } }, { status: 'draft' }),
      ProjectTask.updateMany({ _id: { $in: impact.projectTaskIds } }, { status: 'draft' }),
      InterviewQuestion.updateMany({ _id: { $in: impact.interviewQuestionIds } }, { status: 'draft' })
    ]);
  }

  return { topic, counts: impact.counts };
};

export const deleteTopic = async (id) => {
  const impact = await resolveTopicImpact(id);
  const { topic, lessonIds, quizQuestionIds, projectTaskIds, interviewQuestionIds, counts } = impact;
  requireArchivedForDelete(topic, 'Topic');

  if (counts.templates) {
    throw new ApiError(
      409,
      'This topic still contains lessons referenced by roadmap templates.',
      [{ field: 'templates', message: 'Remove these lessons from every Roadmap Template first.' }],
      'TEMPLATE_DEPENDENCY_EXISTS'
    );
  }

  const history = counts.projectSubmissions + counts.interviewAttempts + counts.quizAttempts + counts.affectedCoursePlans;
  if (history > 0) {
    throw new ApiError(
      409,
      'This topic has learner history, so it cannot be permanently deleted.',
      [{ field: 'learnerHistory', message: 'Keep the Topic archived so existing learner history remains valid.' }],
      'LEARNER_HISTORY_EXISTS'
    );
  }

  await Promise.all([
    ProjectTask.deleteMany({ _id: { $in: projectTaskIds } }),
    InterviewQuestion.deleteMany({ _id: { $in: interviewQuestionIds } }),
    QuizQuestion.deleteMany({ _id: { $in: quizQuestionIds } }),
    Lesson.deleteMany({ _id: { $in: lessonIds } })
  ]);
  await Topic.deleteOne({ _id: topic._id });
  return { topic, counts };
};
