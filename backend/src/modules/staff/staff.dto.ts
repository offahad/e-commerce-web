import { z } from 'zod';

export const createStaffSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters').max(100),
  phone: z
    .string()
    .regex(/^(?:\+?880|0)?1[3-9]\d{8}$/, 'Must be a valid Bangladeshi phone number (e.g. 017XXXXXXXX)'),
  email: z.string().email('Invalid email address').optional().nullable(),
  role: z.enum(['SUPER_ADMIN', 'MODERATOR', 'ADMIN', 'MANAGER', 'STAFF'], {
    errorMap: () => ({ message: 'Role must be one of SUPER_ADMIN, MODERATOR, ADMIN, MANAGER, STAFF' }),
  }),
  password: z.string().min(6, 'Password must be at least 6 characters').max(100),
  notes: z.string().optional(),
});

export type CreateStaffDto = z.infer<typeof createStaffSchema>;

export const updateStaffRoleSchema = z.object({
  role: z.enum(['SUPER_ADMIN', 'MODERATOR', 'ADMIN', 'MANAGER', 'STAFF']),
  reason: z.string().min(3, 'Reason for role update is required'),
});

export type UpdateStaffRoleDto = z.infer<typeof updateStaffRoleSchema>;

export const updateStaffStatusSchema = z.object({
  status: z.enum(['APPROVED', 'SUSPENDED', 'BLOCKED']),
  reason: z.string().min(3, 'Reason for status update is required'),
});

export type UpdateStaffStatusDto = z.infer<typeof updateStaffStatusSchema>;
