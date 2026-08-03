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

export const getRedisStatus = () => ({
  enabled: isQueueEnabled() || isRedisCacheEnabled(),
  ready: redisConnection?.status === 'ready',
  status: redisConnection?.status || 'disabled'
});

export const closeRedisConnection = async () => {
  if (!redisConnection) return;
  try {
    await redisConnection.quit();
  } finally {
    redisConnection = null;
  }
};
