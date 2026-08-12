import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = (relativePath) => readFileSync(new URL(`../../src/${relativePath}`, import.meta.url), 'utf8');

test('authentication stays within the Hireflow token-version model', () => {
  const userModel = source('models/User.js');
  const authService = source('services/auth.service.js');
  const tokenService = source('services/token.service.js');
  const authMiddleware = source('middlewares/auth.middleware.js');

  assert.match(userModel, /tokenVersion/);
  assert.doesNotMatch(userModel, /refreshTokenHash|refreshTokenVersion/);

  assert.match(authService, /trim\(\)\.toLowerCase\(\)/);
  assert.match(authService, /tokenVersion = \(user\.tokenVersion \|\| 0\) \+ 1/);
  assert.doesNotMatch(authService, /refreshTokenHash|hashToken|nextRefreshToken/);

  assert.match(tokenService, /createAccessToken/);
  assert.match(tokenService, /createRefreshToken/);
  assert.doesNotMatch(tokenService, /hashToken/);

  assert.match(authMiddleware, /decoded\.tokenVersion/);
  assert.match(authMiddleware, /user\.tokenVersion/);
});

test('csrf uses a simple cookie and header comparison', () => {
  const csrf = source('middlewares/csrf.middleware.js');
  assert.match(csrf, /csrfCookie !== csrfHeader/);
  assert.doesNotMatch(csrf, /csrfHash|timingSafeEqual|createHmac/);
});
