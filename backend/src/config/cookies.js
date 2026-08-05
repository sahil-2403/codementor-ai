import { env } from './env.js';

const baseCookieOptions = ({ httpOnly, maxAge } = {}) => ({
  httpOnly: Boolean(httpOnly),
  sameSite: env.cookieSameSite,
  secure: env.cookieSecure,
  path: '/',
  ...(env.cookieDomain ? { domain: env.cookieDomain } : {}),
  ...(Number.isFinite(maxAge) ? { maxAge } : {})
});

export const accessCookieOptions = () => baseCookieOptions({
  httpOnly: true,
  maxAge: env.accessCookieMaxAgeMs
});

export const refreshCookieOptions = () => baseCookieOptions({
  httpOnly: true,
  maxAge: env.refreshCookieMaxAgeMs
});

export const csrfCookieOptions = () => baseCookieOptions({
  httpOnly: false,
  maxAge: env.csrfCookieMaxAgeMs
});

export const csrfHashCookieOptions = () => baseCookieOptions({
  httpOnly: true,
  maxAge: env.csrfCookieMaxAgeMs
});

export const clearCookieOptions = ({ httpOnly = true } = {}) =>
  baseCookieOptions({ httpOnly });
