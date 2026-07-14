import { User } from '../models/User.js';
import { ApiError } from '../utils/ApiError.js';
import { createAccessToken, createRefreshToken, hashToken, verifyRefreshToken } from './token.service.js';
import { randomToken, sha256 } from '../utils/hash.js';
import { sendVerificationEmail, sendPasswordResetEmail } from './email.service.js';

const cleanUserById = (id) => User.findById(id).select('-password -refreshTokenHash -emailVerificationToken -emailVerificationExpires -passwordResetToken -passwordResetExpires');

const createEmailVerificationToken = async (user) => {
  const verificationToken = randomToken(24);
  user.emailVerificationToken = sha256(verificationToken);
  user.emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);
  await user.save();
  return verificationToken;
};

export const registerUser = async ({ name, email, password }) => {
  const existing = await User.findOne({ email });
  if (existing) throw new ApiError(409, 'Email already registered');

  const user = await User.create({ name, email, password, isEmailVerified: false });
  const verificationToken = await createEmailVerificationToken(user);
  await sendVerificationEmail({ email: user.email, token: verificationToken });
  const cleanUser = await cleanUserById(user._id);
  return {
    user: cleanUser,
    message: 'Account created. Check your email to verify your account before logging in.'
  };
};

export const verifyEmailWithToken = async ({ token }) => {
  const hashed = sha256(token);
  const user = await User.findOne({
    emailVerificationToken: hashed,
    emailVerificationExpires: { $gt: new Date() }
  }).select('+emailVerificationToken +emailVerificationExpires');

  if (!user) throw new ApiError(400, 'Invalid or expired verification link');
  user.isEmailVerified = true;
  user.emailVerificationToken = '';
  user.emailVerificationExpires = null;
  await user.save();
  return cleanUserById(user._id);
};

export const resendEmailVerification = async ({ email }) => {
  const user = await User.findOne({ email }).select('+emailVerificationToken +emailVerificationExpires');
  if (!user || user.isEmailVerified) return { message: 'If the account exists and needs verification, a verification token was generated.' };
  const verificationToken = await createEmailVerificationToken(user);
  await sendVerificationEmail({ email: user.email, token: verificationToken });
  return { message: 'If the account exists and needs verification, a verification email has been sent.' };
};

export const loginUser = async ({ email, password }) => {
  const user = await User.findOne({ email }).select('+password +refreshTokenHash +refreshTokenVersion');
  if (!user) throw new ApiError(401, 'Invalid credentials');

  const isMatch = await user.comparePassword(password);
  if (!isMatch) throw new ApiError(401, 'Invalid credentials');
  if (!user.isEmailVerified) throw new ApiError(403, 'Please verify your email before logging in');

  user.refreshTokenVersion = (user.refreshTokenVersion || 0) + 1;
  const accessToken = createAccessToken(user);
  const refreshToken = createRefreshToken(user);
  user.refreshTokenHash = hashToken(refreshToken);
  user.lastLoginAt = new Date();
  await user.save();

  const cleanUser = await cleanUserById(user._id);
  return { user: cleanUser, accessToken, refreshToken };
};

export const refreshAuthTokens = async (refreshToken) => {
  if (!refreshToken) throw new ApiError(401, 'Refresh token required');
  const decoded = verifyRefreshToken(refreshToken);
  const user = await User.findById(decoded.id).select('+refreshTokenHash +refreshTokenVersion');

  if (!user) throw new ApiError(401, 'Invalid refresh token');
  const versionMatches = (user.refreshTokenVersion || 0) === (decoded.version || 0);
  const hashMatches = user.refreshTokenHash && user.refreshTokenHash === hashToken(refreshToken);

  if (!versionMatches || !hashMatches) {
    user.refreshTokenHash = null;
    user.refreshTokenVersion = (user.refreshTokenVersion || 0) + 1;
    await user.save();
    throw new ApiError(401, 'Invalid refresh token');
  }

  user.refreshTokenVersion = (user.refreshTokenVersion || 0) + 1;
  const accessToken = createAccessToken(user);
  const nextRefreshToken = createRefreshToken(user);
  user.refreshTokenHash = hashToken(nextRefreshToken);
  await user.save();
  const cleanUser = await cleanUserById(user._id);
  return { user: cleanUser, accessToken, refreshToken: nextRefreshToken };
};

export const logoutAllDevices = async (userId) => {
  const user = await User.findById(userId).select('+refreshTokenVersion +refreshTokenHash');
  if (!user) throw new ApiError(404, 'User not found');
  user.refreshTokenHash = null;
  user.refreshTokenVersion = (user.refreshTokenVersion || 0) + 1;
  await user.save();
};

export const requestPasswordReset = async (email) => {
  const user = await User.findOne({ email }).select('+passwordResetToken +passwordResetExpires');
  if (!user) return { message: 'If the email exists, a reset token was generated.' };
  const resetToken = randomToken(24);
  user.passwordResetToken = sha256(resetToken);
  user.passwordResetExpires = new Date(Date.now() + 15 * 60 * 1000);
  await user.save();
  await sendPasswordResetEmail({ email: user.email, token: resetToken });
  return { message: 'If the email exists, a reset link has been sent.' };
};

export const resetPasswordWithToken = async ({ token, password }) => {
  const hashed = sha256(token);
  const user = await User.findOne({ passwordResetToken: hashed, passwordResetExpires: { $gt: new Date() } }).select('+passwordResetToken +passwordResetExpires +refreshTokenVersion +refreshTokenHash');
  if (!user) throw new ApiError(400, 'Invalid or expired reset token');
  user.password = password;
  user.passwordResetToken = '';
  user.passwordResetExpires = null;
  user.refreshTokenHash = null;
  user.refreshTokenVersion = (user.refreshTokenVersion || 0) + 1;
  await user.save();
};
