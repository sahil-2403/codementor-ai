import crypto from 'crypto';
import { isCacheEnabled } from '../config/env.js';

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

const memoryGet = (key) => {
  const entry = memoryCache.get(key);
  if (!entry) return null;
  if (entry.expiresAt && entry.expiresAt < now()) {
    memoryCache.delete(key);
    return null;
  }
  return entry.value;
};

export const getCache = async (key) => {
  if (!isCacheEnabled()) return null;
  return memoryGet(key);
};

export const setCache = async (key, value, ttlSeconds = CACHE_TTL.MEDIUM) => {
  if (!isCacheEnabled()) return false;
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
  memoryCache.delete(key);
  return true;
};

export const deleteCacheByPrefix = async (prefix) => {
  [...memoryCache.keys()]
    .filter((key) => key.startsWith(prefix))
    .forEach((key) => memoryCache.delete(key));
  return true;
};

export const deleteCacheByPrefixes = async (prefixes = []) =>
  Promise.all(prefixes.map((prefix) => deleteCacheByPrefix(prefix)));
