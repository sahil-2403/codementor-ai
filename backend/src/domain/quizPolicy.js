import { ApiError } from '../utils/ApiError.js';

export const findModuleInCourse = (course, moduleId) => {
  if (!course || !moduleId) return null;
  if (typeof course.modules?.id === 'function') return course.modules.id(moduleId);
  return course.modules?.find((module) => module._id?.toString() === moduleId.toString()) || null;
};

export const assertModuleBelongsToCourse = ({ course, moduleId }) => {
  const module = findModuleInCourse(course, moduleId);
  if (!module) throw new ApiError(404, 'Module not found in active course');
  return module;
};

export const assertModuleUnlocked = (module) => {
  if (!module || module.status === 'locked') {
    throw new ApiError(403, 'This module is locked. Complete earlier lessons before taking this quiz.', [], 'QUIZ_LOCKED');
  }
  return module;
};

export const assertQuestionsBelongToModule = ({ module, questionIds = [], requireExactSet = false }) => {
  const allowedIds = (module.quizQuestions || []).map((question) => (question._id || question).toString());
  const allowedQuestionIds = new Set(allowedIds);
  const normalizedQuestionIds = questionIds.map((id) => id.toString());
  const uniqueQuestionIds = new Set(normalizedQuestionIds);

  if (uniqueQuestionIds.size !== normalizedQuestionIds.length) {
    throw new ApiError(400, 'Duplicate quiz question submitted');
  }
  if (!normalizedQuestionIds.length) throw new ApiError(400, 'Submit at least one quiz answer');
  if (!normalizedQuestionIds.every((id) => allowedQuestionIds.has(id))) {
    throw new ApiError(403, 'Quiz question does not belong to this module');
  }

  if (requireExactSet) {
    if (allowedIds.length !== normalizedQuestionIds.length) {
      throw new ApiError(400, 'Submit answers for every quiz question in this module');
    }
    const missingIds = allowedIds.filter((id) => !uniqueQuestionIds.has(id));
    if (missingIds.length) throw new ApiError(400, 'Missing answers for required quiz questions');
  }
  return true;
};
