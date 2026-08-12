import { env } from './env.js';

const DURATION_UNITS_MS = {
  ms: 1,
  s: 1000,
  m: 60 * 1000,
  h: 60 * 60 * 1000,
  d: 24 * 60 * 60 * 1000
};

export const durationToMs = (value, fallbackMs) => {
  const match = String(value || '').trim().match(/^(\d+)\s*(ms|s|m|h|d)$/i);
  if (!match) return fallbackMs;
  return Number(match[1]) * DURATION_UNITS_MS[match[2].toLowerCase()];
};

const accessMaxAgeMs = durationToMs(env.jwtAccessExpiresIn, 15 * 60 * 1000);
const refreshMaxAgeMs = durationToMs(env.jwtRefreshExpiresIn, 7 * 24 * 60 * 60 * 1000);
const csrfMaxAgeMs = 60 * 60 * 1000;

const baseCookieOptions = (path, httpOnly = true) => ({
  httpOnly,
  sameSite: env.cookieSameSite,
  secure: env.cookieSecure,
  path,
  ...(env.cookieDomain ? { domain: env.cookieDomain } : {})
});

export const accessCookieOptions = () => ({
  ...baseCookieOptions('/api'),
  maxAge: accessMaxAgeMs
});

export const refreshCookieOptions = () => ({
  ...baseCookieOptions('/api/auth'),
  maxAge: refreshMaxAgeMs
});

export const csrfCookieOptions = () => ({
  ...baseCookieOptions('/api'),
  maxAge: csrfMaxAgeMs
});

export const clearAccessCookieOptions = () => baseCookieOptions('/api');
export const clearRefreshCookieOptions = () => baseCookieOptions('/api/auth');
