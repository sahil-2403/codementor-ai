import rateLimit from 'express-rate-limit';
import { env } from '../config/env.js';

const baseOptions = {
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests. Please try again later.' }
};

export const apiLimiter = rateLimit({ ...baseOptions, windowMs: 15 * 60 * 1000, max: env.rateLimits.api });
export const authLimiter = rateLimit({ ...baseOptions, windowMs: 15 * 60 * 1000, max: env.rateLimits.auth, message: { success: false, message: 'Too many auth attempts. Please try again after 15 minutes.' } });
export const registerLimiter = rateLimit({ ...baseOptions, windowMs: 60 * 60 * 1000, max: env.rateLimits.register, message: { success: false, message: 'Too many registration attempts. Please try again later.' } });
export const passwordResetLimiter = rateLimit({ ...baseOptions, windowMs: 60 * 60 * 1000, max: env.rateLimits.passwordReset, message: { success: false, message: 'Too many password reset attempts. Please try again later.' } });
export const aiRouteLimiter = rateLimit({ ...baseOptions, windowMs: 15 * 60 * 1000, max: env.rateLimits.aiRoute, message: { success: false, message: 'Too many AI requests. Please slow down.' } });
export const adminWriteLimiter = rateLimit({ ...baseOptions, windowMs: 15 * 60 * 1000, max: env.rateLimits.adminWrite, message: { success: false, message: 'Too many admin changes. Please slow down.' } });
