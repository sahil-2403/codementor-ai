import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { adminApi } from '../api/adminApi.js';
import { queryKeys } from '../constants/queryKeys.js';
import { useInvalidatingMutation } from './queryUtils.js';

const adminOverviewQueryKey = ['admin-content-overview'];
const adminCourseWorkspaceQueryKey = ['admin-course-workspace'];
const catalogQueryKeys = [
  adminOverviewQueryKey,
  adminCourseWorkspaceQueryKey,
  ['catalog'],
  ['admin-technologies'],
  ['admin-technology'],
  ['admin-courses'],
  ['admin-course'],
  ['admin-learning-paths'],
  ['admin-learning-path'],
  ['admin-topics'],
  ['admin-lessons'],
  ['admin-questions'],
  ['admin-interview-questions'],
  ['admin-templates'],
  ['onboarding-status']
];

const topicCascadeQueryKeys = [
  adminOverviewQueryKey, adminCourseWorkspaceQueryKey,
  ['admin-topics'], ['admin-topic'], ['admin-topic-impact'],
  ['admin-lessons'], ['admin-lesson'], ['admin-lesson-impact'],
  ['admin-questions'], ['admin-question'], ['admin-question-impact'],
  ['admin-interview-questions'], ['admin-interview-question'], ['admin-interview-question-impact'],
  ['project-tasks'], ['interview-questions'], ['roadmap'], ['dashboard']
];

const lessonCascadeQueryKeys = [
  adminOverviewQueryKey, adminCourseWorkspaceQueryKey,
  ['admin-lessons'], ['admin-lesson'], ['admin-lesson-impact'], ['admin-topic-impact'],
  ['admin-questions'], ['admin-question'], ['admin-question-impact'],
  ['project-tasks'], ['project-task'], ['lesson'], ['quiz'], ['roadmap'], ['dashboard'], ['reports']
];

const questionLifecycleQueryKeys = [
  adminOverviewQueryKey, adminCourseWorkspaceQueryKey,
  ['admin-questions'], ['admin-question'], ['admin-question-impact'], ['admin-topic-impact'], ['admin-lesson-impact'],
  ['quiz'], ['quiz-attempt'], ['assessment'], ['roadmap'], ['dashboard'], ['onboarding-status']
];

const interviewQuestionLifecycleQueryKeys = [
  adminOverviewQueryKey, adminCourseWorkspaceQueryKey,
  ['admin-interview-questions'], ['admin-interview-question'], ['admin-interview-question-impact'], ['admin-topic-impact'],
  ['interview-questions'], ['interview-attempts'], ['dashboard']
];

const templateLifecycleQueryKeys = [
  adminOverviewQueryKey, adminCourseWorkspaceQueryKey,
  ['admin-templates'], ['admin-template'], ['admin-courses'], ['catalog'], ['onboarding-status']
];

export const useAdminContentOverview = () => useQuery({ queryKey: queryKeys.adminContentOverview, queryFn: adminApi.contentOverview });

export const useAdminTechnologies = (params = {}) => useQuery({ queryKey: queryKeys.adminTechnologies(params), queryFn: () => adminApi.technologies(params), placeholderData: keepPreviousData });
export const useAdminTechnology = (id) => useQuery({ queryKey: queryKeys.adminTechnology(id), queryFn: () => adminApi.technology(id), enabled: Boolean(id) });
export const useAdminCourses = (params = {}) => useQuery({ queryKey: queryKeys.adminCourses(params), queryFn: () => adminApi.courses(params), placeholderData: keepPreviousData });
export const useAdminCourse = (id) => useQuery({ queryKey: queryKeys.adminCourse(id), queryFn: () => adminApi.course(id), enabled: Boolean(id) });
export const useAdminLearningPaths = (params = {}) => useQuery({ queryKey: queryKeys.adminLearningPaths(params), queryFn: () => adminApi.learningPaths(params), placeholderData: keepPreviousData });
export const useAdminLearningPath = (id) => useQuery({ queryKey: queryKeys.adminLearningPath(id), queryFn: () => adminApi.learningPath(id), enabled: Boolean(id) });

export const useAdminTopics = (params = {}) => useQuery({ queryKey: queryKeys.adminTopics(params), queryFn: () => adminApi.topics(params), placeholderData: keepPreviousData });
export const useAdminTopic = (topicId) => useQuery({ queryKey: queryKeys.adminTopic(topicId), queryFn: () => adminApi.topic(topicId), enabled: Boolean(topicId) });
export const useAdminTopicImpact = (topicId, enabled = true) => useQuery({ queryKey: queryKeys.adminTopicImpact(topicId), queryFn: () => adminApi.topicImpact(topicId), enabled: Boolean(topicId) && enabled });
export const useAdminLessons = (params = {}, enabled = true) => useQuery({ queryKey: queryKeys.adminLessons(params), queryFn: () => adminApi.lessons(params), placeholderData: keepPreviousData, enabled });
export const useAdminLesson = (lessonId) => useQuery({ queryKey: queryKeys.adminLesson(lessonId), queryFn: () => adminApi.lesson(lessonId), enabled: Boolean(lessonId) });
export const useAdminLessonImpact = (lessonId, enabled = true) => useQuery({ queryKey: queryKeys.adminLessonImpact(lessonId), queryFn: () => adminApi.lessonImpact(lessonId), enabled: Boolean(lessonId) && enabled });
export const useAdminQuestions = (params = {}) => useQuery({ queryKey: queryKeys.adminQuestions(params), queryFn: () => adminApi.questions(params), placeholderData: keepPreviousData });
export const useAdminQuestion = (questionId) => useQuery({ queryKey: queryKeys.adminQuestion(questionId), queryFn: () => adminApi.question(questionId), enabled: Boolean(questionId) });
export const useAdminQuestionImpact = (questionId, enabled = true) => useQuery({ queryKey: queryKeys.adminQuestionImpact(questionId), queryFn: () => adminApi.questionImpact(questionId), enabled: Boolean(questionId) && enabled });
export const useAdminInterviewQuestions = (params = {}) => useQuery({ queryKey: queryKeys.adminInterviewQuestions(params), queryFn: () => adminApi.interviewQuestions(params), placeholderData: keepPreviousData });
export const useAdminInterviewQuestion = (questionId) => useQuery({ queryKey: queryKeys.adminInterviewQuestion(questionId), queryFn: () => adminApi.interviewQuestion(questionId), enabled: Boolean(questionId) });
export const useAdminInterviewQuestionImpact = (questionId, enabled = true) => useQuery({ queryKey: queryKeys.adminInterviewQuestionImpact(questionId), queryFn: () => adminApi.interviewQuestionImpact(questionId), enabled: Boolean(questionId) && enabled });
export const useAdminTemplates = (params = {}) => useQuery({ queryKey: queryKeys.adminTemplates(params), queryFn: () => adminApi.templates(params), placeholderData: keepPreviousData });
export const useAdminTemplate = (templateId) => useQuery({ queryKey: queryKeys.adminTemplate(templateId), queryFn: () => adminApi.template(templateId), enabled: Boolean(templateId) });

export const useCreateTechnology = () => useInvalidatingMutation(adminApi.createTechnology, catalogQueryKeys);
export const useUpdateTechnology = () => useInvalidatingMutation(adminApi.updateTechnology, catalogQueryKeys);
export const useUpdateTechnologyStatus = () => useInvalidatingMutation(adminApi.updateTechnologyStatus, catalogQueryKeys);
export const useDeleteTechnology = () => useInvalidatingMutation(adminApi.deleteTechnology, catalogQueryKeys);

export const useCreateCourse = () => useInvalidatingMutation(adminApi.createCourse, catalogQueryKeys);
export const useUpdateCourse = () => useInvalidatingMutation(adminApi.updateCourse, catalogQueryKeys);
export const useUpdateCourseStatus = () => useInvalidatingMutation(adminApi.updateCourseStatus, catalogQueryKeys);
export const useDeleteCourse = () => useInvalidatingMutation(adminApi.deleteCourse, catalogQueryKeys);

export const useCreateLearningPath = () => useInvalidatingMutation(adminApi.createLearningPath, catalogQueryKeys);
export const useUpdateLearningPath = () => useInvalidatingMutation(adminApi.updateLearningPath, catalogQueryKeys);
export const useUpdateLearningPathStatus = () => useInvalidatingMutation(adminApi.updateLearningPathStatus, catalogQueryKeys);
export const useDeleteLearningPath = () => useInvalidatingMutation(adminApi.deleteLearningPath, catalogQueryKeys);

export const useCreateTopic = () => useInvalidatingMutation(adminApi.createTopic, [adminOverviewQueryKey, adminCourseWorkspaceQueryKey, ['admin-topics']]);
export const useUpdateTopic = () => useInvalidatingMutation(adminApi.updateTopic, [adminOverviewQueryKey, adminCourseWorkspaceQueryKey, ['admin-topics'], ['admin-topic'], ['admin-interview-questions']]);
export const useUpdateTopicStatus = () => useInvalidatingMutation(adminApi.updateTopicStatus, topicCascadeQueryKeys);
export const useDeleteTopic = () => useInvalidatingMutation(adminApi.deleteTopic, topicCascadeQueryKeys);

export const useCreateLesson = () => useInvalidatingMutation(adminApi.createLesson, [adminOverviewQueryKey, adminCourseWorkspaceQueryKey, ['admin-lessons'], ['admin-templates']]);
export const useUpdateLesson = () => useInvalidatingMutation(adminApi.updateLesson, [adminOverviewQueryKey, adminCourseWorkspaceQueryKey, ['admin-lessons'], ['admin-lesson'], ['admin-templates']]);
export const useUpdateLessonStatus = () => useInvalidatingMutation(adminApi.updateLessonStatus, lessonCascadeQueryKeys);
export const useDeleteLesson = () => useInvalidatingMutation(adminApi.deleteLesson, lessonCascadeQueryKeys);

export const useCreateQuestion = () => useInvalidatingMutation(adminApi.createQuestion, [adminOverviewQueryKey, adminCourseWorkspaceQueryKey, ['admin-questions'], ['admin-templates']]);
export const useUpdateQuestion = () => useInvalidatingMutation(adminApi.updateQuestion, [adminOverviewQueryKey, adminCourseWorkspaceQueryKey, ['admin-questions'], ['admin-question'], ['admin-templates']]);
export const useUpdateQuestionStatus = () => useInvalidatingMutation(adminApi.updateQuestionStatus, questionLifecycleQueryKeys);
export const useDeleteQuestion = () => useInvalidatingMutation(adminApi.deleteQuestion, questionLifecycleQueryKeys);

export const useCreateInterviewQuestion = () => useInvalidatingMutation(adminApi.createInterviewQuestion, [adminOverviewQueryKey, adminCourseWorkspaceQueryKey, ['admin-interview-questions']]);
export const useUpdateInterviewQuestion = () => useInvalidatingMutation(adminApi.updateInterviewQuestion, [adminOverviewQueryKey, adminCourseWorkspaceQueryKey, ['admin-interview-questions'], ['admin-interview-question']]);
export const useUpdateInterviewQuestionStatus = () => useInvalidatingMutation(adminApi.updateInterviewQuestionStatus, interviewQuestionLifecycleQueryKeys);
export const useDeleteInterviewQuestion = () => useInvalidatingMutation(adminApi.deleteInterviewQuestion, interviewQuestionLifecycleQueryKeys);

export const useCreateTemplate = () => useInvalidatingMutation(adminApi.createTemplate, templateLifecycleQueryKeys);
export const useUpdateTemplate = () => useInvalidatingMutation(adminApi.updateTemplate, templateLifecycleQueryKeys);
export const useUpdateTemplateStatus = () => useInvalidatingMutation(adminApi.updateTemplateStatus, templateLifecycleQueryKeys);
export const useDeleteTemplate = () => useInvalidatingMutation(adminApi.deleteTemplate, templateLifecycleQueryKeys);
