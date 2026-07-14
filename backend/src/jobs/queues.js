import { Queue } from 'bullmq';
import { getRedisConnection } from '../config/redis.js';

const connection = getRedisConnection();

export const createQueue = (name) => {
  if (!connection) return null;
  return new Queue(name, { connection });
};
