import { csrfCookieOptions } from '../config/cookies.js';
import { ApiError } from '../utils/ApiError.js';
import { randomToken } from '../utils/hash.js';

const CSRF_COOKIE = 'csrfToken';
const UNSAFE_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

export const issueCsrfToken = (res) => {
  const token = randomToken(24);
  res.cookie(CSRF_COOKIE, token, csrfCookieOptions());
  return token;
};

export const csrfProtection = (req, res, next) => {
  if (!UNSAFE_METHODS.has(req.method)) return next();

  const csrfCookie = req.cookies?.[CSRF_COOKIE];
  const csrfHeader = req.get('X-CSRF-Token');

  if (!csrfCookie || !csrfHeader || csrfCookie !== csrfHeader) {
    return next(new ApiError(403, 'Invalid CSRF token'));
  }

  next();
};
