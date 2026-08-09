import { Course } from '../../models/Course.js';
import { Technology } from '../../models/Technology.js';
import { RoadmapTemplate } from '../../models/RoadmapTemplate.js';
import { ApiError } from '../../utils/ApiError.js';
import { ensureFound } from './common.js';

export const getAuthorableCourse = async (courseId) => {
  const course = ensureFound(await Course.findById(courseId), 'Course');
  if (course.status === 'archived') {
    throw new ApiError(409, 'Archived Courses cannot receive new or republished curriculum', [], 'COURSE_ARCHIVED');
  }
  return course;
};

export const assertCourseReadyForCatalog = async (course) => {
  const errors = [];
  const technologyIds = (course.technologies || []).map(String);
  const publishedTechnologies = technologyIds.length
    ? await Technology.find({ _id: { $in: technologyIds }, status: 'published' }).select('_id').lean()
    : [];

  if (publishedTechnologies.length !== new Set(technologyIds).size) {
    errors.push({ field: 'technologies', message: 'Publish every technology used by this Course first' });
  }

  const levels = course.availableLevels || [];
  if (!levels.length) errors.push({ field: 'availableLevels', message: 'Enable at least one learner level' });

  const publishedTemplates = levels.length
    ? await RoadmapTemplate.find({ course: course._id, level: { $in: levels }, status: 'published' }).select('level').lean()
    : [];
  const readyLevels = new Set(publishedTemplates.map((template) => template.level));
  for (const level of levels) {
    if (!readyLevels.has(level)) {
      errors.push({ field: 'availableLevels', message: `Publish the ${level} roadmap template before publishing this Course` });
    }
  }

  if (errors.length) {
    throw new ApiError(400, 'Course is not ready for learner catalog publication', errors, 'COURSE_NOT_READY');
  }
};
