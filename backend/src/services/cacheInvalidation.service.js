import { deleteCacheByPrefix, deleteCacheByPrefixes } from './cache.service.js';
import { cachePrefixes } from './cacheKeys.service.js';

export const invalidateUserLearningCache = async (userId) => {
  if (!userId) return true;
  return deleteCacheByPrefix(cachePrefixes.dashboard(userId));
};

export const invalidateContentCache = async () => deleteCacheByPrefixes([
  cachePrefixes.lesson,
  cachePrefixes.roadmapTemplate,
  cachePrefixes.resolvedTemplate,
  cachePrefixes.projectTasks,
  cachePrefixes.interviewQuestions
]);
