import { z } from 'zod';

export const registerSchema = z
  .object({
    fullName: z.string().min(2, 'Full name must be at least 2 characters').max(100),
    phone: z
      .string()
      .regex(/^(?:\+?880|0)?1[3-9]\d{8}$/, 'Must be a valid Bangladeshi phone number (e.g. 017XXXXXXXX)'),
    password: z.string().min(6, 'Password must be at least 6 characters').max(100),
    confirmPassword: z.string().min(6),
    address: z.string().min(5, 'Address must be at least 5 characters'),
    email: z.string().email('Invalid email address').optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export type RegisterDto = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  phone: z.string().min(10, 'Valid phone number required'),
  password: z.string().min(1, 'Password is required'),
  rememberMe: z.boolean().optional().default(false),
  mfaCode: z.string().optional(),
});

export type LoginDto = z.infer<typeof loginSchema>;

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

export type RefreshTokenDto = z.infer<typeof refreshTokenSchema>;

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z.string().min(6, 'New password must be at least 6 characters'),
    confirmPassword: z.string().min(6),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'New passwords do not match',
    path: ['confirmPassword'],
  });

export type ChangePasswordDto = z.infer<typeof changePasswordSchema>;

export const forgotPasswordSchema = z.object({
  phone: z
    .string()
    .regex(/^(?:\+?880|0)?1[3-9]\d{8}$/, 'Must be a valid Bangladeshi phone number (e.g. 017XXXXXXXX)'),
});

export type ForgotPasswordDto = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z
  .object({
    phone: z
      .string()
      .regex(/^(?:\+?880|0)?1[3-9]\d{8}$/, 'Must be a valid Bangladeshi phone number (e.g. 017XXXXXXXX)'),
    resetCode: z.string().min(4, 'Reset code is required'),
    newPassword: z.string().min(6, 'New password must be at least 6 characters').max(100),
    confirmPassword: z.string().min(6),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export type ResetPasswordDto = z.infer<typeof resetPasswordSchema>;

export const mfaVerifySchema = z.object({
  code: z.string().min(4, 'MFA code is required').max(10),
  tempToken: z.string().optional(),
});

export type MfaVerifyDto = z.infer<typeof mfaVerifySchema>;
