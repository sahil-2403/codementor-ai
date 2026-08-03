import test from 'node:test';
import assert from 'node:assert/strict';
import {
  assertEmailVerified,
  assertResetTokenUsable,
  assertVerificationTokenUsable,
  normalizeEmail
} from '../../src/domain/authPolicy.js';

test('auth policy normalizes email addresses before lookup', () => {
  assert.equal(normalizeEmail(' USER@Example.COM '), 'user@example.com');
});

test('auth policy returns EMAIL_NOT_VERIFIED for unverified accounts', () => {
  assert.throws(
    () => assertEmailVerified({ isEmailVerified: false }),
    (error) => error.statusCode === 403 && error.code === 'EMAIL_NOT_VERIFIED'
  );
});

test('verification policy distinguishes expired links', () => {
  const now = new Date('2026-08-03T12:00:00.000Z');
  assert.throws(
    () => assertVerificationTokenUsable({ emailVerificationExpires: new Date('2026-08-03T11:59:59.000Z') }, now),
    (error) => error.code === 'VERIFICATION_TOKEN_EXPIRED'
  );
});

test('reset policy rejects missing and expired reset tokens consistently', () => {
  const now = new Date('2026-08-03T12:00:00.000Z');
  assert.throws(() => assertResetTokenUsable(null, now), (error) => error.code === 'RESET_TOKEN_INVALID');
  assert.throws(
    () => assertResetTokenUsable({ passwordResetExpires: new Date('2026-08-03T11:00:00.000Z') }, now),
    (error) => error.code === 'RESET_TOKEN_INVALID'
  );
});
