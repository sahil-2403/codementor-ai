import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { adminApi } from '../api/adminApi.js';
import { queryKeys } from '../constants/queryKeys.js';
import { useInvalidatingMutation } from './queryUtils.js';

export const useAdminTopics = (params = {}) => useQuery({ queryKey: queryKeys.adminTopics(params), queryFn: () => adminApi.topics(params), placeholderData: keepPreviousData });
export const useAdminLessons = (params = {}) => useQuery({ queryKey: queryKeys.adminLessons(params), queryFn: () => adminApi.lessons(params), placeholderData: keepPreviousData });
export const useAdminQuestions = (params = {}) => useQuery({ queryKey: queryKeys.adminQuestions(params), queryFn: () => adminApi.questions(params), placeholderData: keepPreviousData });
export const useAdminInterviewQuestions = (params = {}) => useQuery({ queryKey: queryKeys.adminInterviewQuestions(params), queryFn: () => adminApi.interviewQuestions(params), placeholderData: keepPreviousData });
export const useAdminTemplates = (params = {}) => useQuery({ queryKey: queryKeys.adminTemplates(params), queryFn: () => adminApi.templates(params), placeholderData: keepPreviousData });

export const useCreateTopic = () => useInvalidatingMutation(adminApi.createTopic, [['admin-topics']]);
export const useUpdateTopic = () => useInvalidatingMutation(adminApi.updateTopic, [['admin-topics']]);
export const useDeleteTopic = () => useInvalidatingMutation(adminApi.deleteTopic, [['admin-topics']]);

export const useCreateLesson = () => useInvalidatingMutation(adminApi.createLesson, [['admin-lessons']]);
export const useUpdateLesson = () => useInvalidatingMutation(adminApi.updateLesson, [['admin-lessons']]);
export const useUpdateLessonStatus = () => useInvalidatingMutation(adminApi.updateLessonStatus, [['admin-lessons']]);
export const useArchiveLesson = () => useInvalidatingMutation(adminApi.archiveLesson, [['admin-lessons']]);

export const useCreateQuestion = () => useInvalidatingMutation(adminApi.createQuestion, [['admin-questions']]);
export const useUpdateQuestion = () => useInvalidatingMutation(adminApi.updateQuestion, [['admin-questions']]);
export const useUpdateQuestionStatus = () => useInvalidatingMutation(adminApi.updateQuestionStatus, [['admin-questions']]);
export const useArchiveQuestion = () => useInvalidatingMutation(adminApi.archiveQuestion, [['admin-questions']]);

export const useCreateInterviewQuestion = () => useInvalidatingMutation(adminApi.createInterviewQuestion, [['admin-interview-questions']]);
export const useUpdateInterviewQuestion = () => useInvalidatingMutation(adminApi.updateInterviewQuestion, [['admin-interview-questions']]);
export const useUpdateInterviewQuestionStatus = () => useInvalidatingMutation(adminApi.updateInterviewQuestionStatus, [['admin-interview-questions']]);
export const useArchiveInterviewQuestion = () => useInvalidatingMutation(adminApi.archiveInterviewQuestion, [['admin-interview-questions']]);

export const useCreateTemplate = () => useInvalidatingMutation(adminApi.createTemplate, [['admin-templates']]);
export const useUpdateTemplate = () => useInvalidatingMutation(adminApi.updateTemplate, [['admin-templates']]);
export const useUpdateTemplateStatus = () => useInvalidatingMutation(adminApi.updateTemplateStatus, [['admin-templates']]);
export const useDuplicateTemplate = () => useInvalidatingMutation(adminApi.duplicateTemplate, [['admin-templates']]);
export const useArchiveTemplate = () => useInvalidatingMutation(adminApi.archiveTemplate, [['admin-templates']]);
