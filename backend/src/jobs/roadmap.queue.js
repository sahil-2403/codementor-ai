import { createQueue } from './queues.js';
export const roadmapQueue = createQueue('roadmap-generation');
export const addRoadmapJob = async (payload) => {
  if (!roadmapQueue) return null;
  return roadmapQueue.add('generate-roadmap', payload, { attempts: 2, backoff: { type: 'exponential', delay: 3000 } });
};
