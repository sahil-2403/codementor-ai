import { ProjectTask } from '../../models/ProjectTask.js';
import { ProjectSubmission } from '../../models/ProjectSubmission.js';
import { Course } from '../../models/Course.js';
import { Lesson } from '../../models/Lesson.js';
import { ApiError } from '../../utils/ApiError.js';
import { generateSlug } from '../../utils/generateSlug.js';
import { makeSearchRegex } from '../../utils/pagination.js';
import { listWithPagination } from '../listQuery.service.js';
import { invalidateContentCache } from '../cacheInvalidation.service.js';
import { ensureFound, requireArchivedForDelete, transitionStatus } from './common.js';

const referenceId = (value) => value?._id || value;

const validateLessons = async ({ courseId, lessonIds = [], requirePublished = false }) => {
  const normalizedIds = lessonIds.map(referenceId).filter(Boolean);
  if (!normalizedIds.length) return [];

  const lessons = await Lesson.find({
    _id: { $in: normalizedIds },
    course: referenceId(courseId)
  }).select('_id status title').lean();

  if (lessons.length !== new Set(normalizedIds.map(String)).size) {
    throw new ApiError(400, 'Every related lesson must belong to the selected Course', [], 'CONTENT_REFERENCE_INVALID');
  }

  if (requirePublished) {
    const unavailable = lessons.filter((lesson) => lesson.status !== 'published');
    if (unavailable.length) {
      throw new ApiError(
        400,
        'Publish all related lessons before publishing this project',
        unavailable.map((lesson) => ({ field: 'relatedLessons', message: lesson.title })),
        'CONTENT_NOT_READY'
      );
    }
  }

  return lessons;
};

const validatePublish = async (project) => {
  const courseId = referenceId(project.course);
  const course = await Course.findById(courseId).select('status title').lean();
  if (!course || course.status === 'archived') {
    throw new ApiError(400, 'Project task must belong to an available Course', [
      { field: 'course', message: 'Restore the parent Course before publishing this Project task.' }
    ], 'CONTENT_NOT_READY');
  }

  await validateLessons({ courseId, lessonIds: project.relatedLessons || [], requirePublished: true });
  if (!project.requirements?.length) {
    throw new ApiError(400, 'Add at least one project requirement before publishing', [
      { field: 'requirements', message: 'At least one requirement is required' }
    ], 'CONTENT_NOT_READY');
  }
  if (!String(project.expectedOutput || '').trim()) {
    throw new ApiError(400, 'Describe the expected output before publishing', [
      { field: 'expectedOutput', message: 'Expected output is required' }
    ], 'CONTENT_NOT_READY');
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
  if (course.status === 'archived') throw new ApiError(409, 'Archived Courses cannot receive project tasks', [], 'COURSE_ARCHIVED');
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
  if (project.status === 'archived') {
    throw new ApiError(409, 'Archived project tasks are read-only. Restore the project first.', [], 'CONTENT_ARCHIVED');
  }

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

export const changeProjectTaskStatus = async (args) => {
  const project = ensureFound(await ProjectTask.findById(args.id).select('course status'), 'Project task');

  if (args.status === 'draft' && project.status === 'archived') {
    const course = await Course.findById(project.course).select('status').lean();
    if (!course || course.status === 'archived') {
      throw new ApiError(409, 'This project task cannot be restored while its Course is archived.', [
        { field: 'course', message: 'Restore the parent Course first.' }
      ], 'PARENT_ARCHIVED');
    }
  }

  return transitionStatus({
    model: ProjectTask,
    label: 'Project task',
    validatePublish,
    ...args
  });
};

export const deleteProjectTask = async (id) => {
  const project = ensureFound(await ProjectTask.findById(id), 'Project task');
  requireArchivedForDelete(project, 'Project task');
  const submissions = await ProjectSubmission.countDocuments({ projectTask: project._id });

  if (submissions) {
    throw new ApiError(
      409,
      'This project task has learner submissions, so it cannot be permanently deleted.',
      [{ field: 'submissions', message: `Keep the project archived. ${submissions} learner submission(s) must remain connected to it.` }],
      'CONTENT_HAS_HISTORY'
    );
  }

  await project.deleteOne();
  await invalidateContentCache();
  return project;
};
