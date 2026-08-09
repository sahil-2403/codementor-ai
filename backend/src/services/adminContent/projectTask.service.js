import { ProjectTask } from '../../models/ProjectTask.js';
import { ProjectSubmission } from '../../models/ProjectSubmission.js';
import { Course } from '../../models/Course.js';
import { Lesson } from '../../models/Lesson.js';
import { ApiError } from '../../utils/ApiError.js';
import { generateSlug } from '../../utils/generateSlug.js';
import { makeSearchRegex } from '../../utils/pagination.js';
import { listWithPagination } from '../listQuery.service.js';
import { invalidateContentCache } from '../cacheInvalidation.service.js';
import { ensureFound } from './common.js';

const validateLessons = async ({ courseId, lessonIds = [], requirePublished = false }) => {
  if (!lessonIds.length) return [];
  const lessons = await Lesson.find({ _id: { $in: lessonIds }, course: courseId }).select('_id status title').lean();
  if (lessons.length !== new Set(lessonIds.map(String)).size) {
    throw new ApiError(400, 'Every related lesson must belong to the selected Course', [], 'CONTENT_REFERENCE_INVALID');
  }
  if (requirePublished) {
    const unavailable = lessons.filter((lesson) => lesson.status !== 'published');
    if (unavailable.length) {
      throw new ApiError(400, 'Publish all related lessons before publishing this project', unavailable.map((lesson) => ({ field: 'relatedLessons', message: lesson.title })), 'CONTENT_NOT_READY');
    }
  }
  return lessons;
};

const validatePublish = async (project) => {
  const course = await Course.findById(project.course).select('status title').lean();
  if (!course || course.status !== 'published') {
    throw new ApiError(400, 'Publish the Course before publishing its project tasks', [], 'CONTENT_NOT_READY');
  }
  await validateLessons({ courseId: project.course, lessonIds: project.relatedLessons || [], requirePublished: true });
  if (!project.requirements?.length) {
    throw new ApiError(400, 'Add at least one project requirement before publishing', [{ field: 'requirements', message: 'At least one requirement is required' }], 'CONTENT_NOT_READY');
  }
  if (!String(project.expectedOutput || '').trim()) {
    throw new ApiError(400, 'Describe the expected output before publishing', [{ field: 'expectedOutput', message: 'Expected output is required' }], 'CONTENT_NOT_READY');
  }
};

export const listProjectTasks = async (query = {}) => {
  const search = makeSearchRegex(query.search);
  const filter = {};
  if (query.course) filter.course = query.course;
  if (query.status) filter.status = query.status;
  if (query.difficulty) filter.difficulty = query.difficulty;
  if (search) filter.$or = [{ title: search }, { description: search }, { moduleTitle: search }, { tags: search }];
  return listWithPagination({
    model: ProjectTask,
    filter,
    query,
    populate: [
      { path: 'course', select: 'title slug status' },
      { path: 'relatedLessons', select: 'title slug status difficulty' }
    ]
  });
};

export const getProjectTask = async (id) => ensureFound(
  await ProjectTask.findById(id)
    .populate('course', 'title slug status technologies availableLevels')
    .populate('relatedLessons', 'title slug status difficulty topic'),
  'Project task'
);

export const createProjectTask = async (payload) => {
  const course = ensureFound(await Course.findById(payload.course).select('_id status'), 'Course');
  await validateLessons({ courseId: course._id, lessonIds: payload.relatedLessons || [] });
  const project = await ProjectTask.create({
    ...payload,
    slug: generateSlug(payload.title),
    status: 'draft'
  });
  await invalidateContentCache();
  return project;
};

export const updateProjectTask = async ({ id, payload }) => {
  const project = ensureFound(await ProjectTask.findById(id), 'Project task');
  if (project.status === 'archived') throw new ApiError(409, 'Archived project tasks are read-only', [], 'CONTENT_ARCHIVED');
  await validateLessons({ courseId: project.course, lessonIds: payload.relatedLessons ?? project.relatedLessons ?? [] });

  const normalized = { ...payload };
  delete normalized.course;
  delete normalized.status;
  if (normalized.title) normalized.slug = generateSlug(normalized.title);
  Object.assign(project, normalized);
  if (project.status === 'published') await validatePublish(project);
  await project.save();
  await invalidateContentCache();
  return project;
};

export const changeProjectTaskStatus = async ({ id, status, confirmPublish = false }) => {
  const project = ensureFound(await ProjectTask.findById(id), 'Project task');
  if (project.status === 'archived') throw new ApiError(409, 'Archived project tasks are read-only', [], 'CONTENT_ARCHIVED');

  if (status === 'published') {
    if (!confirmPublish) throw new ApiError(400, 'Confirm publishing this project task', [], 'PUBLISH_CONFIRMATION_REQUIRED');
    await validatePublish(project);
  }

  if (!['published', 'archived'].includes(status)) throw new ApiError(400, 'Invalid project task status');
  project.status = status;
  await project.save();
  await invalidateContentCache();
  return project;
};

export const deleteProjectTask = async (id) => {
  const project = ensureFound(await ProjectTask.findById(id), 'Project task');
  if (project.status === 'published') {
    throw new ApiError(409, 'Archive the project task before permanently deleting it', [], 'PROJECT_DELETE_REQUIRES_ARCHIVE');
  }
  const submissions = await ProjectSubmission.countDocuments({ task: project._id });
  if (submissions) {
    throw new ApiError(409, 'This project task has learner submissions and cannot be permanently deleted', [{ field: 'submissions', message: `${submissions} submission(s) depend on this project` }], 'CONTENT_HAS_HISTORY');
  }
  await project.deleteOne();
  await invalidateContentCache();
  return project;
};
