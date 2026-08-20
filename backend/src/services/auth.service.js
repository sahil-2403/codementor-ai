import { User } from '../models/User.js';
import { Course } from '../models/Course.js';
import { Enrollment } from '../models/Enrollment.js';
import { ONBOARDING_STATES } from '../constants/onboardingStates.js';
import { ApiError } from '../utils/ApiError.js';
import { createAccessToken, createRefreshToken, verifyRefreshToken } from './token.service.js';
import { randomToken, sha256 } from '../utils/hash.js';
import { sendVerificationEmail, sendPasswordResetEmail } from './email.service.js';
import { getPublishedTemplate } from './templateRoadmap.service.js';
import { createCourseFromTemplate } from './roadmap.service.js';

const normalizeEmail = (email) => String(email || '').trim().toLowerCase();

const cleanUserById = (id) => User.findById(id).select(
  '-password -tokenVersion -emailVerificationToken -emailVerificationExpires -passwordResetToken -passwordResetExpires'
);

const createEmailVerificationToken = async (user) => {
  const verificationToken = randomToken(24);
  user.emailVerificationToken = sha256(verificationToken);
  user.emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);
  await user.save();
  return verificationToken;
};

const registrationMessage = (delivery) => {
  if (delivery.sent) {
    return 'Account created. Check your email to verify your account before logging in.';
  }
  if (delivery.mode === 'development_link') {
    return 'Account created. Email delivery is disabled, so a development verification link was written to the server log.';
  }
  return 'Account created, but the verification email could not be delivered. Use Resend verification to try again.';
};

export const registerUser = async ({ name, email, password }) => {
  const normalizedEmail = normalizeEmail(email);
  const existing = await User.findOne({ email: normalizedEmail });
  if (existing) throw new ApiError(409, 'Email already registered', [], 'EMAIL_ALREADY_REGISTERED');

  const user = await User.create({
    name,
    email: normalizedEmail,
    password,
    isEmailVerified: false
  });

  const verificationToken = await createEmailVerificationToken(user);
  const delivery = await sendVerificationEmail({
    email: user.email,
    token: verificationToken,
    name: user.name
  });
  const cleanUser = await cleanUserById(user._id);

  return {
    user: cleanUser,
    verificationRequired: true,
    emailSent: delivery.sent,
    deliveryMode: delivery.mode,
    message: registrationMessage(delivery)
  };
};

export const createDemoAccount = async () => {
  const starterCourse = await Course.findOne({ slug: 'complete-javascript', status: 'published' })
    .select('_id availableLevels');

  if (!starterCourse || !(starterCourse.availableLevels || []).includes('beginner')) {
    throw new ApiError(503, 'Demo course is not available right now', [], 'DEMO_COURSE_UNAVAILABLE');
  }

  await getPublishedTemplate({ courseId: starterCourse._id, level: 'beginner' });

  const uniquePart = `${Date.now().toString(36)}-${randomToken(3)}`;
  const email = `demo-${uniquePart}@demo.codementor.ai`;
  const password = `Demo@${randomToken(6)}`;

  const user = await User.create({
    name: 'Demo Learner',
    email,
    password,
    isEmailVerified: true,
    isDemo: true
  });

  const enrollment = await Enrollment.create({
    user: user._id,
    type: 'course',
    course: starterCourse._id,
    currentCourse: starterCourse._id,
    level: 'beginner',
    assessmentPreference: 'not_applicable',
    onboardingState: ONBOARDING_STATES.ROADMAP_PENDING,
    status: 'draft'
  });

  await createCourseFromTemplate({
    userId: user._id,
    enrollmentId: enrollment._id
  });

  return { email, password };
};

export const verifyEmailWithToken = async ({ token }) => {
  const hashed = sha256(token);
  const user = await User.findOne({ emailVerificationToken: hashed })
    .select('+emailVerificationToken +emailVerificationExpires');

  if (!user) {
    throw new ApiError(400, 'Invalid verification link', [], 'VERIFICATION_TOKEN_INVALID');
  }
  if (!user.emailVerificationExpires || user.emailVerificationExpires <= new Date()) {
    throw new ApiError(400, 'Verification link has expired', [], 'VERIFICATION_TOKEN_EXPIRED');
  }

  user.isEmailVerified = true;
  user.emailVerificationToken = '';
  user.emailVerificationExpires = null;
  await user.save();
  return cleanUserById(user._id);
};

export const resendEmailVerification = async ({ email }) => {
  const user = await User.findOne({ email: normalizeEmail(email) })
    .select('+emailVerificationToken +emailVerificationExpires');

  if (!user || user.isEmailVerified) {
    return { message: 'If the account exists and needs verification, a verification email has been requested.' };
  }

  const verificationToken = await createEmailVerificationToken(user);
  await sendVerificationEmail({ email: user.email, token: verificationToken, name: user.name });
  return { message: 'If the account exists and needs verification, a verification email has been requested.' };
};

export const loginUser = async ({ email, password }) => {
  const user = await User.findOne({ email: normalizeEmail(email) }).select('+password +tokenVersion');
  if (!user) throw new ApiError(401, 'Invalid credentials');

  const isMatch = await user.comparePassword(password);
  if (!isMatch) throw new ApiError(401, 'Invalid credentials');
  if (!user.isEmailVerified) {
    throw new ApiError(403, 'Please verify your email before logging in', [], 'EMAIL_NOT_VERIFIED');
  }

  user.lastLoginAt = new Date();
  await user.save();

  const accessToken = createAccessToken(user);
  const refreshToken = createRefreshToken(user);
  const cleanUser = await cleanUserById(user._id);

  return { user: cleanUser, accessToken, refreshToken };
};

export const refreshAuthTokens = async (refreshToken) => {
  if (!refreshToken) throw new ApiError(401, 'Refresh token required');

  let decoded;
  try {
    decoded = verifyRefreshToken(refreshToken);
  } catch {
    throw new ApiError(401, 'Invalid or expired refresh token');
  }

  const user = await User.findById(decoded.id).select('+tokenVersion');
  if (!user) throw new ApiError(401, 'Invalid refresh token');
  if ((user.tokenVersion || 0) !== (decoded.tokenVersion || 0)) {
    throw new ApiError(401, 'This session has been revoked');
  }
  if (!user.isEmailVerified) {
    throw new ApiError(403, 'Email verification required', [], 'EMAIL_NOT_VERIFIED');
  }

  return { accessToken: createAccessToken(user) };
};

export const logoutAllDevices = async (userId) => {
  const user = await User.findById(userId).select('+tokenVersion');
  if (!user) throw new ApiError(404, 'User not found');
  user.tokenVersion = (user.tokenVersion || 0) + 1;
  await user.save();
};

export const requestPasswordReset = async (email) => {
  const genericMessage = 'If the email exists, a password reset link has been requested.';
  const user = await User.findOne({ email: normalizeEmail(email) })
    .select('+passwordResetToken +passwordResetExpires');
  if (!user) return { message: genericMessage };

  const resetToken = randomToken(24);
  user.passwordResetToken = sha256(resetToken);
  user.passwordResetExpires = new Date(Date.now() + 15 * 60 * 1000);
  await user.save();
  await sendPasswordResetEmail({ email: user.email, token: resetToken, name: user.name });
  return { message: genericMessage };
};

export const resetPasswordWithToken = async ({ token, password }) => {
  const hashed = sha256(token);
  const user = await User.findOne({ passwordResetToken: hashed })
    .select('+passwordResetToken +passwordResetExpires +tokenVersion');

  if (!user || !user.passwordResetExpires || user.passwordResetExpires <= new Date()) {
    throw new ApiError(400, 'Invalid or expired reset token', [], 'RESET_TOKEN_INVALID');
  }

  user.password = password;
  user.passwordResetToken = '';
  user.passwordResetExpires = null;
  user.tokenVersion = (user.tokenVersion || 0) + 1;
  await user.save();
};
