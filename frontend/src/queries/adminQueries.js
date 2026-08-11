import { adminApi } from '../api/adminApi.js';
import { adminCourseWorkspaceApi } from '../api/adminCourseWorkspaceApi.js';
import { adminProjectApi } from '../api/adminProjectApi.js';
import { useAsyncAction } from '../hooks/useAsyncAction.js';
import { useAsyncData } from '../hooks/useAsyncData.js';

const paramsKey = (params) => JSON.stringify(params || {});

export const useAdminContentOverview = () => useAsyncData(adminApi.contentOverview);
export const useAdminCourseWorkspace = (courseId) => useAsyncData(
  () => adminCourseWorkspaceApi.get(courseId),
  [courseId],
  { enabled: Boolean(courseId) }
);

export const useAdminTechnologies = (params = {}) => useAsyncData(() => adminApi.technologies(params), [paramsKey(params)]);
export const useAdminTechnology = (id) => useAsyncData(() => adminApi.technology(id), [id], { enabled: Boolean(id) });
export const useAdminCourses = (params = {}) => useAsyncData(() => adminApi.courses(params), [paramsKey(params)]);
export const useAdminCourse = (id) => useAsyncData(() => adminApi.course(id), [id], { enabled: Boolean(id) });
export const useAdminLearningPaths = (params = {}) => useAsyncData(() => adminApi.learningPaths(params), [paramsKey(params)]);
export const useAdminLearningPath = (id) => useAsyncData(() => adminApi.learningPath(id), [id], { enabled: Boolean(id) });

export const useAdminTopics = (params = {}, enabled = true) => useAsyncData(() => adminApi.topics(params), [paramsKey(params)], { enabled });
export const useAdminTopic = (topicId) => useAsyncData(() => adminApi.topic(topicId), [topicId], { enabled: Boolean(topicId) });
export const useAdminTopicImpact = (topicId, enabled = true) => useAsyncData(() => adminApi.topicImpact(topicId), [topicId], { enabled: Boolean(topicId) && enabled });
export const useAdminLessons = (params = {}, enabled = true) => useAsyncData(() => adminApi.lessons(params), [paramsKey(params)], { enabled });
export const useAdminLesson = (lessonId) => useAsyncData(() => adminApi.lesson(lessonId), [lessonId], { enabled: Boolean(lessonId) });
export const useAdminLessonImpact = (lessonId, enabled = true) => useAsyncData(() => adminApi.lessonImpact(lessonId), [lessonId], { enabled: Boolean(lessonId) && enabled });
export const useAdminQuestions = (params = {}, enabled = true) => useAsyncData(() => adminApi.questions(params), [paramsKey(params)], { enabled });
export const useAdminQuestion = (questionId) => useAsyncData(() => adminApi.question(questionId), [questionId], { enabled: Boolean(questionId) });
export const useAdminQuestionImpact = (questionId, enabled = true) => useAsyncData(() => adminApi.questionImpact(questionId), [questionId], { enabled: Boolean(questionId) && enabled });
export const useAdminInterviewQuestions = (params = {}, enabled = true) => useAsyncData(() => adminApi.interviewQuestions(params), [paramsKey(params)], { enabled });
export const useAdminInterviewQuestion = (questionId) => useAsyncData(() => adminApi.interviewQuestion(questionId), [questionId], { enabled: Boolean(questionId) });
export const useAdminInterviewQuestionImpact = (questionId, enabled = true) => useAsyncData(() => adminApi.interviewQuestionImpact(questionId), [questionId], { enabled: Boolean(questionId) && enabled });
export const useAdminTemplates = (params = {}, enabled = true) => useAsyncData(() => adminApi.templates(params), [paramsKey(params)], { enabled });
export const useAdminTemplate = (templateId) => useAsyncData(() => adminApi.template(templateId), [templateId], { enabled: Boolean(templateId) });

export const useAdminProjectTasks = (params = {}, enabled = true) => useAsyncData(() => adminProjectApi.list(params), [paramsKey(params)], { enabled });
export const useAdminProjectTask = (id) => useAsyncData(() => adminProjectApi.get(id), [id], { enabled: Boolean(id) });

export const useCreateTechnology = () => useAsyncAction(adminApi.createTechnology);
export const useUpdateTechnology = () => useAsyncAction(adminApi.updateTechnology);
export const useUpdateTechnologyStatus = () => useAsyncAction(adminApi.updateTechnologyStatus);
export const useDeleteTechnology = () => useAsyncAction(adminApi.deleteTechnology);

export const useCreateCourse = () => useAsyncAction(adminApi.createCourse);
export const useUpdateCourse = () => useAsyncAction(adminApi.updateCourse);
export const useUpdateCourseStatus = () => useAsyncAction(adminApi.updateCourseStatus);
export const useDeleteCourse = () => useAsyncAction(adminApi.deleteCourse);

export const useCreateLearningPath = () => useAsyncAction(adminApi.createLearningPath);
export const useUpdateLearningPath = () => useAsyncAction(adminApi.updateLearningPath);
export const useUpdateLearningPathStatus = () => useAsyncAction(adminApi.updateLearningPathStatus);
export const useDeleteLearningPath = () => useAsyncAction(adminApi.deleteLearningPath);

export const useCreateTopic = () => useAsyncAction(adminApi.createTopic);
export const useUpdateTopic = () => useAsyncAction(adminApi.updateTopic);
export const useUpdateTopicStatus = () => useAsyncAction(adminApi.updateTopicStatus);
export const useDeleteTopic = () => useAsyncAction(adminApi.deleteTopic);

export const useCreateLesson = () => useAsyncAction(adminApi.createLesson);
export const useUpdateLesson = () => useAsyncAction(adminApi.updateLesson);
export const useUpdateLessonStatus = () => useAsyncAction(adminApi.updateLessonStatus);
export const useDeleteLesson = () => useAsyncAction(adminApi.deleteLesson);

export const useCreateQuestion = () => useAsyncAction(adminApi.createQuestion);
export const useUpdateQuestion = () => useAsyncAction(adminApi.updateQuestion);
export const useUpdateQuestionStatus = () => useAsyncAction(adminApi.updateQuestionStatus);
export const useDeleteQuestion = () => useAsyncAction(adminApi.deleteQuestion);

export const useCreateInterviewQuestion = () => useAsyncAction(adminApi.createInterviewQuestion);
export const useUpdateInterviewQuestion = () => useAsyncAction(adminApi.updateInterviewQuestion);
export const useUpdateInterviewQuestionStatus = () => useAsyncAction(adminApi.updateInterviewQuestionStatus);
export const useDeleteInterviewQuestion = () => useAsyncAction(adminApi.deleteInterviewQuestion);

export const useCreateTemplate = () => useAsyncAction(adminApi.createTemplate);
export const useUpdateTemplate = () => useAsyncAction(adminApi.updateTemplate);
export const useUpdateTemplateStatus = () => useAsyncAction(adminApi.updateTemplateStatus);
export const useDeleteTemplate = () => useAsyncAction(adminApi.deleteTemplate);

export const useCreateAdminProjectTask = () => useAsyncAction(adminProjectApi.create);
export const useUpdateAdminProjectTask = () => useAsyncAction(adminProjectApi.update);
export const useUpdateAdminProjectTaskStatus = () => useAsyncAction(adminProjectApi.updateStatus);
export const useDeleteAdminProjectTask = () => useAsyncAction(adminProjectApi.delete);
