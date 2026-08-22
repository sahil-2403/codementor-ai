vi.mock('../../src/services/googleAuth.service.js', () => ({
  verifyGoogleCredential: vi.fn()
}));

import { User } from '../../src/models/User.js';
import { verifyGoogleCredential } from '../../src/services/googleAuth.service.js';
import { createTestAgent, postWithCsrf } from '../helpers/auth.helpers.js';

const googleIdentity = (overrides = {}) => ({
  googleId: 'google-user-123',
  email: 'google@example.com',
  name: 'Google Learner',
  avatar: 'https://example.com/avatar.png',
  ...overrides
});

describe('Google authentication API', () => {
  beforeEach(() => {
    verifyGoogleCredential.mockReset();
  });

  test('registers a verified learner and returns auth cookies', async () => {
    verifyGoogleCredential.mockResolvedValue(googleIdentity());
    const response = await postWithCsrf(
      createTestAgent(),
      '/api/auth/google/register',
      { credential: 'google-id-token' },
      201
    );

    expect(response.body.data.user.email).toBe('google@example.com');
    expect(response.body.data.user.role).toBe('learner');
    expect(response.body.data.user.authProvider).toBe('google');

    const user = await User.findOne({ email: 'google@example.com' });
    expect(user.isEmailVerified).toBe(true);
    expect(user.googleId).toBe('google-user-123');
    expect(user.avatar).toBe('https://example.com/avatar.png');

    const cookies = response.headers['set-cookie'] || [];
    expect(cookies.some((cookie) => cookie.startsWith('accessToken='))).toBe(true);
    expect(cookies.some((cookie) => cookie.startsWith('refreshToken='))).toBe(true);
  });

  test('rejects duplicate Google registration', async () => {
    const identity = googleIdentity();
    verifyGoogleCredential.mockResolvedValue(identity);
    await postWithCsrf(createTestAgent(), '/api/auth/google/register', { credential: 'first' }, 201);
    await postWithCsrf(createTestAgent(), '/api/auth/google/register', { credential: 'second' }, 409);
  });

  test('does not silently link a Google identity to an existing local email', async () => {
    await User.create({
      name: 'Local Learner',
      email: 'same@example.com',
      password: 'Password123!',
      isEmailVerified: true
    });
    verifyGoogleCredential.mockResolvedValue(googleIdentity({ email: 'same@example.com' }));

    await postWithCsrf(createTestAgent(), '/api/auth/google/register', { credential: 'google-id-token' }, 409);
    const user = await User.findOne({ email: 'same@example.com' });
    expect(user.authProvider).toBe('local');
    expect(user.googleId).toBeUndefined();
  });

  test('logs in a registered Google learner', async () => {
    const identity = googleIdentity();
    verifyGoogleCredential.mockResolvedValue(identity);
    await postWithCsrf(createTestAgent(), '/api/auth/google/register', { credential: 'register-token' }, 201);

    const response = await postWithCsrf(
      createTestAgent(),
      '/api/auth/google/login',
      { credential: 'login-token' },
      200
    );

    expect(response.body.data.user.email).toBe(identity.email);
    const cookies = response.headers['set-cookie'] || [];
    expect(cookies.some((cookie) => cookie.startsWith('accessToken='))).toBe(true);
  });

  test('rejects Google login when the Google account is not registered', async () => {
    verifyGoogleCredential.mockResolvedValue(googleIdentity());
    const response = await postWithCsrf(
      createTestAgent(),
      '/api/auth/google/login',
      { credential: 'unknown-token' },
      401
    );

    expect(response.body.code).toBe('GOOGLE_ACCOUNT_NOT_REGISTERED');
  });

  test('directs Google-only users away from password login', async () => {
    const identity = googleIdentity();
    verifyGoogleCredential.mockResolvedValue(identity);
    await postWithCsrf(createTestAgent(), '/api/auth/google/register', { credential: 'register-token' }, 201);

    const response = await postWithCsrf(createTestAgent(), '/api/auth/login', {
      email: identity.email,
      password: 'Password123!'
    }, 401);

    expect(response.body.code).toBe('GOOGLE_LOGIN_REQUIRED');
  });

  test('does not create password reset data for a Google-only account', async () => {
    const identity = googleIdentity();
    verifyGoogleCredential.mockResolvedValue(identity);
    await postWithCsrf(createTestAgent(), '/api/auth/google/register', { credential: 'register-token' }, 201);

    await postWithCsrf(createTestAgent(), '/api/auth/forgot-password', { email: identity.email }, 200);
    const user = await User.findOne({ email: identity.email })
      .select('+passwordResetToken +passwordResetExpires');

    expect(user.passwordResetToken).toBe('');
    expect(user.passwordResetExpires).toBeNull();
  });
});
