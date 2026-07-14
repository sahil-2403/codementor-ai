import rateLimit from 'express-rate-limit';

const baseOptions = {
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests. Please try again later.'
  }
};

export const apiLimiter = rateLimit({
  ...baseOptions,
  windowMs: 15 * 60 * 1000,
  max: Number(process.env.API_RATE_LIMIT || 300)
});

export const authLimiter = rateLimit({
  ...baseOptions,
  windowMs: 15 * 60 * 1000,
  max: Number(process.env.AUTH_RATE_LIMIT || 8),
  message: { success: false, message: 'Too many auth attempts. Please try again after 15 minutes.' }
});

export const registerLimiter = rateLimit({
  ...baseOptions,
  windowMs: 60 * 60 * 1000,
  max: Number(process.env.REGISTER_RATE_LIMIT || 10),
  message: { success: false, message: 'Too many registration attempts. Please try again later.' }
});

export const passwordResetLimiter = rateLimit({
  ...baseOptions,
  windowMs: 60 * 60 * 1000,
  max: Number(process.env.PASSWORD_RESET_RATE_LIMIT || 5),
  message: { success: false, message: 'Too many password reset attempts. Please try again later.' }
});

export const aiRouteLimiter = rateLimit({
  ...baseOptions,
  windowMs: 15 * 60 * 1000,
  max: Number(process.env.AI_ROUTE_RATE_LIMIT || 40),
  message: { success: false, message: 'Too many AI requests. Please slow down.' }
});

export const adminWriteLimiter = rateLimit({
  ...baseOptions,
  windowMs: 15 * 60 * 1000,
  max: Number(process.env.ADMIN_WRITE_RATE_LIMIT || 80),
  message: { success: false, message: 'Too many admin changes. Please slow down.' }
});
