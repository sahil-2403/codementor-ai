import crypto from 'crypto';
import { getRedisConnection } from '../config/redis.js';
import { env, isCacheEnabled } from '../config/env.js';

const memoryCache = new Map();
const now = () => Date.now();

export const CACHE_TTL = {
  SHORT: 30,
  MEDIUM: 60,
  LONG: 10 * 60,
  VERY_LONG: 60 * 60
};

export const buildCacheKey = (...parts) => parts
  .filter((part) => part !== undefined && part !== null && part !== '')
  .map((part) => {
    if (typeof part === 'object') {
      return crypto.createHash('sha1').update(JSON.stringify(part)).digest('hex');
    }
    return String(part).replace(/\s+/g, '-').toLowerCase();
  })
  .join(':');

const parseCachedValue = (raw) => {
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

const memoryGet = (key) => {
  const entry = memoryCache.get(key);
  if (!entry) return null;
  if (entry.expiresAt && entry.expiresAt < now()) {
    memoryCache.delete(key);
    return null;
  }
  return entry.value;
};

const usesMemoryCache = () => isCacheEnabled() && env.cacheDriver === 'memory';

export const getCache = async (key) => {
  if (!isCacheEnabled()) return null;

  const redis = getRedisConnection();
  if (redis) {
    const raw = await redis.get(key);
    return parseCachedValue(raw);
  }

  return usesMemoryCache() ? memoryGet(key) : null;
};

export const setCache = async (key, value, ttlSeconds = CACHE_TTL.MEDIUM) => {
  if (!isCacheEnabled()) return false;

  const redis = getRedisConnection();
  if (redis) return redis.set(key, JSON.stringify(value), 'EX', ttlSeconds);

  if (!usesMemoryCache()) return false;
  memoryCache.set(key, { value, expiresAt: now() + ttlSeconds * 1000 });
  return true;
};

export const getOrSetCache = async (key, factory, ttlSeconds = CACHE_TTL.MEDIUM) => {
  if (!isCacheEnabled()) return factory();

  const cached = await getCache(key);
  if (cached !== null && cached !== undefined) return cached;

  const value = await factory();
  if (value !== undefined && value !== null) await setCache(key, value, ttlSeconds);
  return value;
};

export const deleteCache = async (key) => {
  if (!isCacheEnabled()) return true;

  const redis = getRedisConnection();
  if (redis) return redis.del(key);

  memoryCache.delete(key);
  return true;
};

export const deleteCacheByPrefix = async (prefix) => {
  if (!isCacheEnabled()) return true;

  const redis = getRedisConnection();
  if (redis) {
    const stream = redis.scanStream({ match: `${prefix}*`, count: 100 });
    const pipeline = redis.pipeline();
    for await (const keys of stream) keys.forEach((key) => pipeline.del(key));
    return pipeline.exec();
  }

  [...memoryCache.keys()]
    .filter((key) => key.startsWith(prefix))
    .forEach((key) => memoryCache.delete(key));
  return true;
};

export const deleteCacheByPrefixes = async (prefixes = []) =>
  Promise.all(prefixes.map((prefix) => deleteCacheByPrefix(prefix)));
