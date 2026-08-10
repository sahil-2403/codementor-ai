import { Technology } from '../../models/Technology.js';
import { Course } from '../../models/Course.js';
import { LearningPath } from '../../models/LearningPath.js';
import { Topic } from '../../models/Topic.js';
import { RoadmapTemplate } from '../../models/RoadmapTemplate.js';
import { Enrollment } from '../../models/Enrollment.js';
import { ApiError } from '../../utils/ApiError.js';
import { generateSlug } from '../../utils/generateSlug.js';
import { makeSearchRegex } from '../../utils/pagination.js';
import { listWithPagination } from '../listQuery.service.js';
import { invalidateContentCache } from '../cacheInvalidation.service.js';
import { cleanReferenceArray, ensureEditable, ensureFound, PUBLISHABLE_STATUS, transitionStatus } from './common.js';
import { assertCourseReadyForCatalog } from './courseReadiness.service.js';

const normalizeCourse = (payload = {}) => ({
  ...payload,
  technologies: cleanReferenceArray(payload.technologies),
  recommendedPrerequisites: cleanReferenceArray(payload.recommendedPrerequisites),
  availableLevels: Array.from(new Set(payload.availableLevels || []))
});

const normalizePath = (payload = {}) => ({
  ...payload,
  technologies: cleanReferenceArray(payload.technologies),
  availableLevels: Array.from(new Set(payload.availableLevels || [])),
  courses: (payload.courses || []).map((item) => ({
    course: item.course,
    order: Number(item.order),
    defaultLevel: item.defaultLevel || null,
    required: item.required !== false
  }))
});

const assertTechnologiesExist = async (technologyIds = [], { requirePublished = false } = {}) => {
  if (!technologyIds.length) return [];
  const filter = { _id: { $in: technologyIds } };
  if (requirePublished) filter.status = PUBLISHABLE_STATUS.PUBLISHED;
  else filter.status = { $ne: PUBLISHABLE_STATUS.ARCHIVED };
  const items = await Technology.find(filter).select('_id name status').lean();
  if (items.length !== new Set(technologyIds.map(String)).size) {
    throw new ApiError(400, 'One or more selected technologies are unavailable', [], 'CONTENT_REFERENCE_INVALID');
  }
  return items;
};

const assertCoursePublishable = async (course) => {
  const errors = [];
  if (!course.technologies?.length) errors.push({ field: 'technologies', message: 'Add at least one technology' });
  if (!course.availableLevels?.length) errors.push({ field: 'availableLevels', message: 'Enable at least one learner level' });
  if (course.primaryTechnology && !course.technologies.some((id) => id.toString() === course.primaryTechnology.toString())) {
    errors.push({ field: 'primaryTechnology', message: 'Primary technology must also be included in the course technologies' });
  }
  if (course.recommendedPrerequisites?.some((id) => id.toString() === course._id.toString())) {
    errors.push({ field: 'recommendedPrerequisites', message: 'A course cannot require itself' });
  }
  if (errors.length) throw new ApiError(400, 'Course is not ready to publish', errors, 'CONTENT_NOT_READY');

  await assertTechnologiesExist(course.technologies, { requirePublished: true });
  if (course.recommendedPrerequisites?.length) {
    const prerequisites = await Course.countDocuments({
      _id: { $in: course.recommendedPrerequisites },
      status: PUBLISHABLE_STATUS.PUBLISHED
    });
    if (prerequisites !== new Set(course.recommendedPrerequisites.map(String)).size) {
      throw new ApiError(400, 'All prerequisite courses must be published first', [], 'CONTENT_NOT_READY');
    }
  }

  await assertCourseReadyForCatalog(course);
};

const assertLearningPathPublishable = async (path) => {
  const entries = path.courses || [];
  const errors = [];
  if (!entries.length) errors.push({ field: 'courses', message: 'Add at least one course' });
  if (!path.availableLevels?.length) errors.push({ field: 'availableLevels', message: 'Enable at least one learner level' });
  const courseIds = entries.map((entry) => entry.course?.toString()).filter(Boolean);
  const orders = entries.map((entry) => Number(entry.order));
  if (new Set(courseIds).size !== courseIds.length) errors.push({ field: 'courses', message: 'A course can appear only once in a learning path' });
  if (new Set(orders).size !== orders.length || orders.some((order) => !Number.isInteger(order) || order < 1)) {
    errors.push({ field: 'courses', message: 'Course order values must be unique positive integers' });
  }
  if (errors.length) throw new ApiError(400, 'Learning path is not ready to publish', errors, 'CONTENT_NOT_READY');

  const courses = await Course.find({ _id: { $in: courseIds }, status: PUBLISHABLE_STATUS.PUBLISHED })
    .select('_id availableLevels').lean();
  if (courses.length !== courseIds.length) {
    throw new ApiError(400, 'Every learning-path course must be published first', [], 'CONTENT_NOT_READY');
  }
  const byId = new Map(courses.map((course) => [course._id.toString(), course]));
  const invalidLevel = entries.find((entry) => entry.defaultLevel && !(byId.get(entry.course.toString())?.availableLevels || []).includes(entry.defaultLevel));
  if (invalidLevel) {
    throw new ApiError(400, 'A learning-path course uses a level that the course does not support', [], 'CONTENT_NOT_READY');
  }
  await assertTechnologiesExist(path.technologies || [], { requirePublished: true });
};

export const listTechnologies = async (query = {}) => {
  const search = makeSearchRegex(query.search);
  const filter = {};
  if (search) filter.$or = [{ name: search }, { slug: search }, { description: search }];
  if (query.status) filter.status = query.status;
  if (query.type) filter.type = query.type;
  return listWithPagination({ model: Technology, filter, query: { sortBy: 'order', sortOrder: 'asc', ...query }, populate: [{ path: 'parentTechnology', select: 'name slug type status' }] });
};

export const getTechnology = async (id) => ensureFound(await Technology.findById(id).populate('parentTechnology', 'name slug type status'), 'Technology');

export const createTechnology = async (payload) => {
  if (payload.parentTechnology) {
    const parent = await Technology.findOne({ _id: payload.parentTechnology, status: { $ne: PUBLISHABLE_STATUS.ARCHIVED } });
    if (!parent) throw new ApiError(400, 'Parent technology is unavailable', [], 'CONTENT_REFERENCE_INVALID');
  }
  const technology = await Technology.create({ ...payload, slug: generateSlug(payload.name), status: PUBLISHABLE_STATUS.DRAFT });
  await invalidateContentCache();
  return technology;
};

export const updateTechnology = async ({ id, payload }) => {
  const technology = ensureFound(await Technology.findById(id), 'Technology');
  ensureEditable(technology, 'Technology');
  if (payload.parentTechnology?.toString() === id.toString()) throw new ApiError(400, 'Technology cannot be its own parent');
  if (payload.parentTechnology) {
    const parent = await Technology.findOne({ _id: payload.parentTechnology, status: { $ne: PUBLISHABLE_STATUS.ARCHIVED } });
    if (!parent) throw new ApiError(400, 'Parent technology is unavailable', [], 'CONTENT_REFERENCE_INVALID');
  }
  Object.assign(technology, { ...payload, ...(payload.name ? { slug: generateSlug(payload.name) } : {}) });
  await technology.save();
  await invalidateContentCache();
  return technology;
};

export const changeTechnologyStatus = (args) => transitionStatus({ model: Technology, label: 'Technology', ...args });

export const deleteTechnology = async (id) => {
  const technology = ensureFound(await Technology.findById(id), 'Technology');
  if (technology.status === PUBLISHABLE_STATUS.PUBLISHED) throw new ApiError(409, 'Archive the technology before deleting it');
  const dependentCount = await Course.countDocuments({ $or: [{ technologies: id }, { primaryTechnology: id }] });
  const pathCount = await LearningPath.countDocuments({ technologies: id });
  if (dependentCount || pathCount) throw new ApiError(409, 'Technology is still used by courses or learning paths', [], 'CONTENT_DEPENDENCY_EXISTS');
  await technology.deleteOne();
  await invalidateContentCache();
  return technology;
};

export const listCourses = async (query = {}) => {
  const search = makeSearchRegex(query.search);
  const filter = {};
  if (search) filter.$or = [{ title: search }, { slug: search }, { description: search }];
  if (query.status) filter.status = query.status;
  if (query.category) filter.category = query.category;
  if (query.technology) filter.technologies = query.technology;
  return listWithPagination({
    model: Course,
    filter,
    query: { sortBy: 'order', sortOrder: 'asc', ...query },
    populate: [
      { path: 'technologies', select: 'name slug type status' },
      { path: 'primaryTechnology', select: 'name slug type status' },
      { path: 'recommendedPrerequisites', select: 'title slug category status' }
    ]
  });
};

export const getCourse = async (id) => ensureFound(await Course.findById(id)
  .populate('technologies', 'name slug type status')
  .populate('primaryTechnology', 'name slug type status')
  .populate('recommendedPrerequisites', 'title slug category status'), 'Course');

export const createCourse = async (payload) => {
  const normalized = normalizeCourse(payload);
  await assertTechnologiesExist(normalized.technologies);
  if (normalized.primaryTechnology && !normalized.technologies.includes(normalized.primaryTechnology.toString())) {
    throw new ApiError(400, 'Primary technology must be included in course technologies');
  }
  const course = await Course.create({ ...normalized, slug: generateSlug(payload.title), status: PUBLISHABLE_STATUS.DRAFT });
  await invalidateContentCache();
  return course;
};

export const updateCourse = async ({ id, payload }) => {
  const course = ensureFound(await Course.findById(id), 'Course');
  ensureEditable(course, 'Course');
  const normalized = normalizeCourse({ ...course.toObject(), ...payload });
  if (normalized.recommendedPrerequisites.includes(id.toString())) throw new ApiError(400, 'A course cannot require itself');
  await assertTechnologiesExist(normalized.technologies);
  if (normalized.primaryTechnology && !normalized.technologies.includes(normalized.primaryTechnology.toString())) {
    throw new ApiError(400, 'Primary technology must be included in course technologies');
  }
  Object.assign(course, normalized, payload.title ? { slug: generateSlug(payload.title) } : {});
  if (course.status === PUBLISHABLE_STATUS.PUBLISHED) await assertCoursePublishable(course);
  await course.save();
  await invalidateContentCache();
  return course;
};

export const changeCourseStatus = (args) => transitionStatus({ model: Course, label: 'Course', validatePublish: assertCoursePublishable, ...args });

export const deleteCourse = async (id) => {
  const course = ensureFound(await Course.findById(id), 'Course');
  if (course.status === PUBLISHABLE_STATUS.PUBLISHED) throw new ApiError(409, 'Archive the course before deleting it');
  const [topics, templates, paths, enrollments] = await Promise.all([
    Topic.countDocuments({ course: id }),
    RoadmapTemplate.countDocuments({ course: id }),
    LearningPath.countDocuments({ 'courses.course': id }),
    Enrollment.countDocuments({ $or: [{ course: id }, { currentCourse: id }] })
  ]);
  if (topics || templates || paths || enrollments) {
    throw new ApiError(409, 'Course still has curriculum, learning-path, or enrollment dependencies', [], 'CONTENT_DEPENDENCY_EXISTS');
  }
  await course.deleteOne();
  await invalidateContentCache();
  return course;
};

export const listLearningPaths = async (query = {}) => {
  const search = makeSearchRegex(query.search);
  const filter = {};
  if (search) filter.$or = [{ title: search }, { slug: search }, { description: search }];
  if (query.status) filter.status = query.status;
  if (query.category) filter.category = query.category;
  if (query.technology) filter.technologies = query.technology;
  return listWithPagination({
    model: LearningPath,
    filter,
    query: { sortBy: 'order', sortOrder: 'asc', ...query },
    populate: [
      { path: 'technologies', select: 'name slug type status' },
      { path: 'courses.course', select: 'title slug category status availableLevels' }
    ]
  });
};

export const getLearningPath = async (id) => ensureFound(await LearningPath.findById(id)
  .populate('technologies', 'name slug type status')
  .populate('courses.course', 'title slug category status availableLevels'), 'Learning path');

export const createLearningPath = async (payload) => {
  const normalized = normalizePath(payload);
  await assertTechnologiesExist(normalized.technologies);
  const courseIds = normalized.courses.map((item) => item.course);
  const courses = await Course.countDocuments({ _id: { $in: courseIds }, status: { $ne: PUBLISHABLE_STATUS.ARCHIVED } });
  if (courses !== new Set(courseIds.map(String)).size) throw new ApiError(400, 'One or more learning-path courses are unavailable');
  const path = await LearningPath.create({ ...normalized, slug: generateSlug(payload.title), status: PUBLISHABLE_STATUS.DRAFT });
  await invalidateContentCache();
  return path;
};

export const updateLearningPath = async ({ id, payload }) => {
  const path = ensureFound(await LearningPath.findById(id), 'Learning path');
  ensureEditable(path, 'Learning path');
  const normalized = normalizePath({ ...path.toObject(), ...payload });
  await assertTechnologiesExist(normalized.technologies);
  Object.assign(path, normalized, payload.title ? { slug: generateSlug(payload.title) } : {});
  if (path.status === PUBLISHABLE_STATUS.PUBLISHED) await assertLearningPathPublishable(path);
  await path.save();
  await invalidateContentCache();
  return path;
};

export const changeLearningPathStatus = (args) => transitionStatus({ model: LearningPath, label: 'Learning path', validatePublish: assertLearningPathPublishable, ...args });

export const deleteLearningPath = async (id) => {
  const path = ensureFound(await LearningPath.findById(id), 'Learning path');
  if (path.status === PUBLISHABLE_STATUS.PUBLISHED) throw new ApiError(409, 'Archive the learning path before deleting it');
  const enrollments = await Enrollment.countDocuments({ learningPath: id });
  if (enrollments) throw new ApiError(409, 'Learning path still has enrollment dependencies', [], 'CONTENT_DEPENDENCY_EXISTS');
  await path.deleteOne();
  await invalidateContentCache();
  return path;
};
