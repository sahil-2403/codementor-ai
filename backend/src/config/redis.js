import IORedis from 'ioredis';
import { env } from './env.js';

let redisConnection = null;

export const getRedisConnection = () => {
  const redisRequired = env.enableQueue || (env.enableCache && env.cacheDriver === 'redis');
  if (!redisRequired) return null;
  if (!redisConnection) {
    redisConnection = new IORedis(env.redisUrl, { maxRetriesPerRequest: null });
  }
  return redisConnection;
};
