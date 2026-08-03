import { createQueue } from './queues.js';

export const roadmapQueue = createQueue('roadmap-generation');

export const addRoadmapJob = async (payload, { jobId } = {}) => {
  if (!roadmapQueue) return null;

  return roadmapQueue.add('generate-roadmap', payload, {
    jobId,
    attempts: 2,
    backoff: { type: 'exponential', delay: 3000 },
    removeOnComplete: 100,
    removeOnFail: 100
  });
};
