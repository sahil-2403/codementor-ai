import { Worker } from 'bullmq';
import { getRedisConnection } from '../config/redis.js';
import { createEmbedding } from '../ai/rag/embedding.service.js';

export const startEmbeddingWorker = () => {
  const connection = getRedisConnection();
  if (!connection) return null;

  return new Worker('embedding-generation', async (job) => {
    return createEmbedding(job.data.text);
  }, { connection });
};
