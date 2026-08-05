import { csrfCookieOptions, csrfHashCookieOptions } from '../config/cookies.js';
import { ApiError } from '../utils/ApiError.js';
import { randomToken, sha256 } from '../utils/hash.js';

const CSRF_COOKIE = 'csrfToken';
const CSRF_HASH_COOKIE = 'csrfTokenHash';
const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);
const PUBLIC_AUTH_PATHS = new Set([
  '/api/auth/register',
  '/api/auth/login',
  '/api/auth/refresh-token',
  '/api/auth/forgot-password',
  '/api/auth/reset-password',
  '/api/auth/verify-email',
  '/api/auth/resend-verification',
  '/api/auth/csrf-token'
]);

export const issueCsrfToken = (res) => {
  const token = randomToken(24);
  res.cookie(CSRF_COOKIE, token, csrfCookieOptions());
  res.cookie(CSRF_HASH_COOKIE, sha256(token), csrfHashCookieOptions());
  return token;
};

export const csrfProtection = (req, res, next) => {
  const fullPath = (req.baseUrl || '') + req.path;
  if (SAFE_METHODS.has(req.method) || PUBLIC_AUTH_PATHS.has(fullPath)) return next();

  const csrfHeader = req.get('X-CSRF-Token');
  const csrfHash = req.cookies?.[CSRF_HASH_COOKIE];

  if (!csrfHeader || !csrfHash || sha256(csrfHeader) !== csrfHash) {
    return next(new ApiError(403, 'Invalid CSRF token'));
  }
  return next();
};
