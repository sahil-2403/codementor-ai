import { z } from 'zod';

const strongPassword = z.string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Add one uppercase letter')
  .regex(/[a-z]/, 'Add one lowercase letter')
  .regex(/[0-9]/, 'Add one number')
  .regex(/[^A-Za-z0-9]/, 'Add one special character');

export const registerFormSchema = z.object({
  name: z.string().trim().min(2, 'Name is required').max(80),
  email: z.string().trim().email('Enter a valid email'),
  password: strongPassword,
  confirmPassword: z.string().min(1, 'Confirm your password')
}).refine((data) => data.password === data.confirmPassword, {
  path: ['confirmPassword'],
  message: 'Passwords do not match'
});

export const loginFormSchema = z.object({
  email: z.string().trim().email('Enter a valid email'),
  password: z.string().min(1, 'Password is required')
});

export const verifyEmailFormSchema = z.object({
  token: z.string().trim().min(20, 'Verification token is required')
});

export const forgotPasswordSchema = z.object({
  email: z.string().trim().email('Enter a valid email')
});

export const resetPasswordFormSchema = z.object({
  password: strongPassword,
  confirmPassword: z.string().min(1, 'Confirm your password')
}).refine((data) => data.password === data.confirmPassword, {
  path: ['confirmPassword'],
  message: 'Passwords do not match'
});
