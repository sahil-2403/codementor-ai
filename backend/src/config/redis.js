import IORedis from 'ioredis';
import { env, isQueueEnabled, isRedisCacheEnabled } from './env.js';

let redisConnection = null;

export const getRedisConnection = () => {
  if (!isQueueEnabled() && !isRedisCacheEnabled()) return null;

  if (!redisConnection) {
    redisConnection = new IORedis(env.redisUrl, {
      maxRetriesPerRequest: null,
      enableReadyCheck: true,
      lazyConnect: true
    });

    redisConnection.on('error', (error) => {
      console.error('Redis connection error:', error.message);
    });
  }

  return redisConnection;
};
