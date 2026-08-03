import { ApiError } from '../utils/ApiError.js';

export const normalizeEmail = (email) => String(email || '').trim().toLowerCase();

export const assertEmailVerified = (user) => {
  if (!user?.isEmailVerified) {
    throw new ApiError(403, 'Please verify your email before logging in', [], 'EMAIL_NOT_VERIFIED');
  }
  return user;
};

export const assertVerificationTokenUsable = (user, now = new Date()) => {
  if (!user) {
    throw new ApiError(400, 'Invalid verification link', [], 'VERIFICATION_TOKEN_INVALID');
  }
  if (!user.emailVerificationExpires || user.emailVerificationExpires <= now) {
    throw new ApiError(400, 'Verification link has expired', [], 'VERIFICATION_TOKEN_EXPIRED');
  }
  return user;
};

export const assertResetTokenUsable = (user, now = new Date()) => {
  if (!user || !user.passwordResetExpires || user.passwordResetExpires <= now) {
    throw new ApiError(400, 'Invalid or expired reset token', [], 'RESET_TOKEN_INVALID');
  }
  return user;
};
