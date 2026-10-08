import { User } from '../models/User.js';
import { AUTH_PROVIDERS } from '../constants/authProviders.js';
import { ApiError } from '../utils/ApiError.js';
import { createAccessToken, createRefreshToken } from './token.service.js';
import { loginUser, requestPasswordReset } from './auth.service.js';
import { verifyGoogleCredential } from './googleAuth.service.js';

const cleanUserById = (id) => User.findById(id).select(
  '-password -tokenVersion -emailVerificationToken -emailVerificationExpires -passwordResetToken -passwordResetExpires'
);

const authenticatedResult = async (user) => {
  user.lastLoginAt = new Date();
  await user.save();

  return {
    user: await cleanUserById(user._id),
    accessToken: createAccessToken(user),
    refreshToken: createRefreshToken(user)
  };
};

export const registerWithGoogle = async ({ credential }) => {
  const identity = await verifyGoogleCredential(credential);

  const existingGoogleUser = await User.findOne({ googleId: identity.googleId });
  if (existingGoogleUser) {
    throw new ApiError(409, 'This Google account is already registered. Please log in instead.', [], 'GOOGLE_ACCOUNT_ALREADY_REGISTERED');
  }

  const existingEmailUser = await User.findOne({ email: identity.email });
  if (existingEmailUser) {
    throw new ApiError(409, 'An account already exists with this email. Please use your existing login method.', [], 'EMAIL_ALREADY_REGISTERED');
  }

  const user = await User.create({
    name: identity.name,
    email: identity.email,
    avatar: identity.avatar,
    authProvider: AUTH_PROVIDERS.GOOGLE,
    googleId: identity.googleId,
    isEmailVerified: true
  });

  return authenticatedResult(user);
};

export const loginWithGoogle = async ({ credential }) => {
  const identity = await verifyGoogleCredential(credential);
  const user = await User.findOne({
    googleId: identity.googleId,
    authProvider: AUTH_PROVIDERS.GOOGLE
  }).select('+tokenVersion');

  if (!user) {
    throw new ApiError(401, 'Google account is not registered. Please create an account first.', [], 'GOOGLE_ACCOUNT_NOT_REGISTERED');
  }

  return authenticatedResult(user);
};

export const loginWithConfiguredProvider = async ({ email, password }) => {
  const normalizedEmail = String(email || '').trim().toLowerCase();
  const user = await User.findOne({ email: normalizedEmail }).select('authProvider');

  if (user?.authProvider === AUTH_PROVIDERS.GOOGLE) {
    throw new ApiError(401, 'Please sign in with Google', [], 'GOOGLE_LOGIN_REQUIRED');
  }

  return loginUser({ email: normalizedEmail, password });
};

export const requestProviderAwarePasswordReset = async (email) => {
  const genericMessage = 'If the email exists, a password reset link has been requested.';
  const normalizedEmail = String(email || '').trim().toLowerCase();
  const user = await User.findOne({ email: normalizedEmail }).select('authProvider');

  if (user?.authProvider === AUTH_PROVIDERS.GOOGLE) {
    return { message: genericMessage };
  }

  return requestPasswordReset(normalizedEmail);
};
