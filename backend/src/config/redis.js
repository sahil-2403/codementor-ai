import IORedis from 'ioredis';

let redisConnection = null;

export const getRedisConnection = () => {
  if (process.env.ENABLE_QUEUE !== 'true') return null;
  if (!redisConnection) {
    redisConnection = new IORedis(process.env.REDIS_URL || 'redis://localhost:6379', {
      maxRetriesPerRequest: null
    });
  }
  return redisConnection;
};
