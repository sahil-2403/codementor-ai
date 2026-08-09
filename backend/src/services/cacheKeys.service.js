import { buildCacheKey } from './cache.service.js';

export const cacheKeys = {
  dashboard: (userId) => buildCacheKey('dashboard', userId),
  roadmapVersions: (userId) => buildCacheKey('roadmap-versions', userId),
  lesson: (lessonId) => buildCacheKey('lesson', lessonId),
  template: ({ courseId, level }) => buildCacheKey('roadmap-template', courseId, level),
  resolvedTemplate: (templateId) => buildCacheKey('resolved-template', templateId),
  projectTasks: (filter = {}) => buildCacheKey('project-tasks', filter),
  interviewQuestions: (filter = {}) => buildCacheKey('interview-questions', filter)
};

export const cachePrefixes = {
  dashboard: (userId) => `dashboard:${String(userId).toLowerCase()}`,
  lesson: 'lesson:',
  roadmapTemplate: 'roadmap-template:',
  resolvedTemplate: 'resolved-template:',
  projectTasks: 'project-tasks:',
  interviewQuestions: 'interview-questions:'
};
