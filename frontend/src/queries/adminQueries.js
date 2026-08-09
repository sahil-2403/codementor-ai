import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { adminApi } from '../api/adminApi.js';
import { queryKeys } from '../constants/queryKeys.js';
import { useInvalidatingMutation } from './queryUtils.js';

const adminOverviewQueryKey = ['admin-content-overview'];

const topicCascadeQueryKeys = [
  adminOverviewQueryKey,
  ['admin-topics'],
  ['admin-topic'],
  ['admin-topic-impact'],
  ['admin-lessons'],
  ['admin-lesson'],
  ['admin-lesson-impact'],
  ['admin-questions'],
  ['admin-question'],
  ['admin-question-impact'],
  ['admin-interview-questions'],
  ['admin-interview-question'],
  ['admin-interview-question-impact'],
  ['project-tasks'],
  ['interview-questions'],
  ['roadmap'],
  ['dashboard']
];

const lessonCascadeQueryKeys = [
  adminOverviewQueryKey,
  ['admin-lessons'],
  ['admin-lesson'],
  ['admin-lesson-impact'],
  ['admin-topic-impact'],
  ['admin-questions'],
  ['admin-question'],
  ['admin-question-impact'],
  ['project-tasks'],
  ['project-task'],
  ['lesson'],
  ['quiz'],
  ['roadmap'],
  ['dashboard'],
  ['reports']
];

const questionLifecycleQueryKeys = [
  adminOverviewQueryKey,
  ['admin-questions'],
  ['admin-question'],
  ['admin-question-impact'],
  ['admin-topic-impact'],
  ['admin-lesson-impact'],
  ['quiz'],
  ['quiz-attempt'],
  ['assessment'],
  ['roadmap'],
  ['dashboard'],
  ['onboarding-status']
];

const interviewQuestionLifecycleQueryKeys = [
  adminOverviewQueryKey,
  ['admin-interview-questions'],
  ['admin-interview-question'],
  ['admin-interview-question-impact'],
  ['admin-topic-impact'],
  ['interview-questions'],
  ['interview-attempts'],
  ['dashboard']
];

const templateLifecycleQueryKeys = [
  adminOverviewQueryKey,
  ['admin-templates'],
  ['admin-template'],
  ['onboarding-status']
];

export const useAdminContentOverview = () => useQuery({ queryKey: queryKeys.adminContentOverview, queryFn: adminApi.contentOverview });
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

export const useCreateTopic = () => useInvalidatingMutation(adminApi.createTopic, [adminOverviewQueryKey, ['admin-topics']]);
export const useUpdateTopic = () => useInvalidatingMutation(adminApi.updateTopic, [adminOverviewQueryKey, ['admin-topics'], ['admin-topic'], ['admin-interview-questions']]);
export const useUpdateTopicStatus = () => useInvalidatingMutation(adminApi.updateTopicStatus, topicCascadeQueryKeys);
export const useDeleteTopic = () => useInvalidatingMutation(adminApi.deleteTopic, topicCascadeQueryKeys);

export const useCreateLesson = () => useInvalidatingMutation(adminApi.createLesson, [adminOverviewQueryKey, ['admin-lessons']]);
export const useUpdateLesson = () => useInvalidatingMutation(adminApi.updateLesson, [adminOverviewQueryKey, ['admin-lessons'], ['admin-lesson']]);
export const useUpdateLessonStatus = () => useInvalidatingMutation(adminApi.updateLessonStatus, lessonCascadeQueryKeys);
export const useDeleteLesson = () => useInvalidatingMutation(adminApi.deleteLesson, lessonCascadeQueryKeys);

export const useCreateQuestion = () => useInvalidatingMutation(adminApi.createQuestion, [adminOverviewQueryKey, ['admin-questions']]);
export const useUpdateQuestion = () => useInvalidatingMutation(adminApi.updateQuestion, [adminOverviewQueryKey, ['admin-questions'], ['admin-question']]);
export const useUpdateQuestionStatus = () => useInvalidatingMutation(adminApi.updateQuestionStatus, questionLifecycleQueryKeys);
export const useDeleteQuestion = () => useInvalidatingMutation(adminApi.deleteQuestion, questionLifecycleQueryKeys);

export const useCreateInterviewQuestion = () => useInvalidatingMutation(adminApi.createInterviewQuestion, [adminOverviewQueryKey, ['admin-interview-questions']]);
export const useUpdateInterviewQuestion = () => useInvalidatingMutation(adminApi.updateInterviewQuestion, [adminOverviewQueryKey, ['admin-interview-questions'], ['admin-interview-question']]);
export const useUpdateInterviewQuestionStatus = () => useInvalidatingMutation(adminApi.updateInterviewQuestionStatus, interviewQuestionLifecycleQueryKeys);
export const useDeleteInterviewQuestion = () => useInvalidatingMutation(adminApi.deleteInterviewQuestion, interviewQuestionLifecycleQueryKeys);

export const useCreateTemplate = () => useInvalidatingMutation(adminApi.createTemplate, templateLifecycleQueryKeys);
export const useUpdateTemplate = () => useInvalidatingMutation(adminApi.updateTemplate, templateLifecycleQueryKeys);
export const useUpdateTemplateStatus = () => useInvalidatingMutation(adminApi.updateTemplateStatus, templateLifecycleQueryKeys);
export const useDeleteTemplate = () => useInvalidatingMutation(adminApi.deleteTemplate, templateLifecycleQueryKeys);
