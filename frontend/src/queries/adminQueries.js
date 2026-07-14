import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { adminApi } from '../api/adminApi.js';
import { queryKeys } from '../constants/queryKeys.js';
import { useInvalidatingMutation } from './queryUtils.js';

export const useAdminAnalytics = () => useQuery({ queryKey: queryKeys.adminAnalytics, queryFn: adminApi.analytics });
export const useAdminTopics = (params = {}) => useQuery({ queryKey: queryKeys.adminTopics(params), queryFn: () => adminApi.topics(params), placeholderData: keepPreviousData });
export const useAdminLessons = (params = {}) => useQuery({ queryKey: queryKeys.adminLessons(params), queryFn: () => adminApi.lessons(params), placeholderData: keepPreviousData });
export const useAdminQuestions = (params = {}) => useQuery({ queryKey: queryKeys.adminQuestions(params), queryFn: () => adminApi.questions(params), placeholderData: keepPreviousData });
export const useAdminTemplates = (params = {}) => useQuery({ queryKey: queryKeys.adminTemplates(params), queryFn: () => adminApi.templates(params), placeholderData: keepPreviousData });
export const useAdminUsers = (params = {}) => useQuery({ queryKey: queryKeys.adminUsers(params), queryFn: () => adminApi.users(params), placeholderData: keepPreviousData });
export const useAdminAIUsage = (params = {}) => useQuery({ queryKey: queryKeys.adminAIUsage(params), queryFn: () => adminApi.aiUsage(params), placeholderData: keepPreviousData });
export const useAdminAIUsageSummary = (params = {}) => useQuery({ queryKey: ['admin-ai-usage-summary', params], queryFn: () => adminApi.aiUsageSummary(params), placeholderData: keepPreviousData });
export const useAdminJobs = (params = {}) => useQuery({ queryKey: queryKeys.adminJobs(params), queryFn: () => adminApi.jobs(params), placeholderData: keepPreviousData });
export const useAdminActivityLogs = (params = {}) => useQuery({ queryKey: queryKeys.adminActivityLogs(params), queryFn: () => adminApi.activityLogs(params), placeholderData: keepPreviousData });

export const useCreateTopic = () => useInvalidatingMutation(adminApi.createTopic, [['admin-topics'], queryKeys.adminAnalytics]);
export const useUpdateTopic = () => useInvalidatingMutation(adminApi.updateTopic, [['admin-topics']]);
export const useDeleteTopic = () => useInvalidatingMutation(adminApi.deleteTopic, [['admin-topics'], queryKeys.adminAnalytics]);

export const useCreateLesson = () => useInvalidatingMutation(adminApi.createLesson, [['admin-lessons'], queryKeys.adminAnalytics]);
export const useUpdateLesson = () => useInvalidatingMutation(adminApi.updateLesson, [['admin-lessons']]);
export const useUpdateLessonStatus = () => useInvalidatingMutation(adminApi.updateLessonStatus, [['admin-lessons'], queryKeys.adminAnalytics]);
export const useArchiveLesson = () => useInvalidatingMutation(adminApi.archiveLesson, [['admin-lessons'], queryKeys.adminAnalytics]);

export const useCreateQuestion = () => useInvalidatingMutation(adminApi.createQuestion, [['admin-questions'], queryKeys.adminAnalytics]);
export const useUpdateQuestion = () => useInvalidatingMutation(adminApi.updateQuestion, [['admin-questions']]);
export const useUpdateQuestionStatus = () => useInvalidatingMutation(adminApi.updateQuestionStatus, [['admin-questions'], queryKeys.adminAnalytics]);
export const useArchiveQuestion = () => useInvalidatingMutation(adminApi.archiveQuestion, [['admin-questions'], queryKeys.adminAnalytics]);

export const useCreateTemplate = () => useInvalidatingMutation(adminApi.createTemplate, [['admin-templates'], queryKeys.adminAnalytics]);
export const useUpdateTemplate = () => useInvalidatingMutation(adminApi.updateTemplate, [['admin-templates']]);
export const useUpdateTemplateStatus = () => useInvalidatingMutation(adminApi.updateTemplateStatus, [['admin-templates'], queryKeys.adminAnalytics]);
export const useDuplicateTemplate = () => useInvalidatingMutation(adminApi.duplicateTemplate, [['admin-templates'], queryKeys.adminAnalytics]);
export const useArchiveTemplate = () => useInvalidatingMutation(adminApi.archiveTemplate, [['admin-templates'], queryKeys.adminAnalytics]);
