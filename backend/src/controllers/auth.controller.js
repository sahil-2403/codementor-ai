import { asyncHandler } from '../utils/asyncHandler.js';
import { sendResponse } from '../utils/ApiResponse.js';
import { registerUser, loginUser, refreshAuthTokens, logoutAllDevices, requestPasswordReset, resetPasswordWithToken, verifyEmailWithToken, resendEmailVerification } from '../services/auth.service.js';
import { logActivity } from '../services/activityLog.service.js';
import { setAuthCookies, clearAuthCookies } from '../services/token.service.js';
import { issueCsrfToken } from '../middlewares/csrf.middleware.js';

export const csrfToken = asyncHandler(async (req, res) => {
  const token = issueCsrfToken(res);
  sendResponse(res, 200, 'CSRF token issued', { csrfToken: token });
});

export const register = asyncHandler(async (req, res) => {
  const result = await registerUser(req.body);
  await logActivity({ user: result.user._id, action: 'auth_registered', entityType: 'User', entityId: result.user._id, message: 'User registered and email verification is pending', req });
  sendResponse(res, 201, result.message, {
    user: result.user,
    verificationRequired: result.verificationRequired,
    emailSent: result.emailSent,
    deliveryMode: result.deliveryMode
  });
});

export const verifyEmail = asyncHandler(async (req, res) => {
  const user = await verifyEmailWithToken(req.body);
  await logActivity({ user: user._id, action: 'auth_email_verified', entityType: 'User', entityId: user._id, message: 'User verified email', req });
  sendResponse(res, 200, 'Email verified successfully. You can now log in.', { user });
});

export const resendVerification = asyncHandler(async (req, res) => {
  const result = await resendEmailVerification(req.body);
  sendResponse(res, 200, result.message);
});

export const login = asyncHandler(async (req, res) => {
  const result = await loginUser(req.body);
  setAuthCookies(res, result.accessToken, result.refreshToken);
  issueCsrfToken(res);
  await logActivity({ user: result.user._id, action: 'auth_login', entityType: 'User', entityId: result.user._id, message: 'User logged in', req });
  sendResponse(res, 200, 'Logged in successfully', { user: result.user });
});

export const logout = asyncHandler(async (req, res) => {
  clearAuthCookies(res);
  issueCsrfToken(res);
  sendResponse(res, 200, 'Logged out successfully');
});

export const refresh = asyncHandler(async (req, res) => {
  const result = await refreshAuthTokens(req.cookies?.refreshToken);
  setAuthCookies(res, result.accessToken, result.refreshToken);
  issueCsrfToken(res);
  sendResponse(res, 200, 'Token refreshed successfully', { user: result.user });
});

export const logoutAll = asyncHandler(async (req, res) => {
  await logoutAllDevices(req.user._id);
  clearAuthCookies(res);
  issueCsrfToken(res);
  await logActivity({ user: req.user._id, action: 'auth_logout_all', entityType: 'User', entityId: req.user._id, message: 'User logged out from all devices', req });
  sendResponse(res, 200, 'Logged out from all devices successfully');
});

export const forgotPassword = asyncHandler(async (req, res) => {
  const result = await requestPasswordReset(req.body.email);
  sendResponse(res, 200, result.message);
});

export const resetPassword = asyncHandler(async (req, res) => {
  await resetPasswordWithToken(req.body);
  sendResponse(res, 200, 'Password reset successfully');
});

export const me = asyncHandler(async (req, res) => {
  sendResponse(res, 200, 'Current user', { user: req.user });
});
