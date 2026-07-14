import { z } from 'zod';

const passwordSchema = z.string()
  .min(8, 'Password must be at least 8 characters')
  .max(72, 'Password is too long')
  .regex(/[A-Z]/, 'Password must contain one uppercase letter')
  .regex(/[a-z]/, 'Password must contain one lowercase letter')
  .regex(/[0-9]/, 'Password must contain one number')
  .regex(/[^A-Za-z0-9]/, 'Password must contain one special character');

export const registerSchema = z.object({
  body: z.object({
    name: z.string().trim().min(2).max(80),
    email: z.string().trim().toLowerCase().email(),
    password: passwordSchema,
    confirmPassword: z.string().min(1, 'Confirm password is required')
  }).refine((data) => data.password === data.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Passwords do not match'
  }).transform(({ confirmPassword, ...data }) => data)
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().trim().toLowerCase().email(),
    password: z.string().min(1).max(72)
  })
});

export const forgotPasswordSchema = z.object({
  body: z.object({ email: z.string().trim().toLowerCase().email() })
});

export const resetPasswordSchema = z.object({
  body: z.object({
    token: z.string().trim().min(20).max(200),
    password: passwordSchema,
    confirmPassword: z.string().min(1, 'Confirm password is required')
  }).refine((data) => data.password === data.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Passwords do not match'
  }).transform(({ confirmPassword, ...data }) => data)
});

export const verifyEmailSchema = z.object({
  body: z.object({
    token: z.string().trim().min(20).max(200)
  })
});

export const resendVerificationSchema = z.object({
  body: z.object({ email: z.string().trim().toLowerCase().email() })
});
