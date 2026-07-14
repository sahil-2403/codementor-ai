import { createQueue } from './queues.js';
export const embeddingQueue = createQueue('embedding-generation');
export const addEmbeddingJob = async (payload) => {
  if (!embeddingQueue) return null;
  return embeddingQueue.add('generate-embedding', payload, { attempts: 2 });
};
