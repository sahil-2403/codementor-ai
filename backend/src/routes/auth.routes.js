import { Router } from 'express';
import {
  register,
  googleRegister,
  demoAccount,
  login,
  googleLogin,
  logout,
  logoutAll,
  refresh,
  me,
  forgotPassword,
  resetPassword,
  csrfToken,
  verifyEmail,
  resendVerification
} from '../controllers/auth.controller.js';
import { requireAuth } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import {
  registerSchema,
  googleAuthSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  verifyEmailSchema,
  resendVerificationSchema
} from '../validations/auth.validation.js';
import { authLimiter, registerLimiter, passwordResetLimiter } from '../middlewares/rateLimit.middleware.js';

const router = Router();
router.get('/csrf-token', csrfToken);
router.post('/register', registerLimiter, validate(registerSchema), register);
router.post('/google/register', registerLimiter, validate(googleAuthSchema), googleRegister);
router.post('/demo-account', registerLimiter, demoAccount);
router.post('/verify-email', validate(verifyEmailSchema), verifyEmail);
router.post('/resend-verification', passwordResetLimiter, validate(resendVerificationSchema), resendVerification);
router.post('/login', authLimiter, validate(loginSchema), login);
router.post('/google/login', authLimiter, validate(googleAuthSchema), googleLogin);
router.post('/logout', logout);
router.post('/refresh-token', refresh);
router.post('/logout-all', requireAuth, logoutAll);
router.post('/forgot-password', passwordResetLimiter, validate(forgotPasswordSchema), forgotPassword);
router.post('/reset-password', passwordResetLimiter, validate(resetPasswordSchema), resetPassword);
router.get('/me', requireAuth, me);
export default router;