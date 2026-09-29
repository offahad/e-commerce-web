import { z } from 'zod';

export const updateProfileSchema = z.object({
  fullName: z.string().min(2).max(100).optional(),
  email: z.string().email().optional().nullable(),
  address: z.string().min(5).optional(),
});

export type UpdateProfileDto = z.infer<typeof updateProfileSchema>;

export const addressSchema = z.object({
  fullName: z.string().min(2).max(100),
  phone: z.string().regex(/^(?:\+?880|0)?1[3-9]\d{8}$/, 'Valid Bangladeshi phone required'),
  address: z.string().min(5),
  division: z.string().default('Dhaka'),
  district: z.string().default('Dhaka'),
  area: z.string().optional(),
  postalCode: z.string().optional(),
  addressType: z.enum(['HOME', 'OFFICE', 'OTHER']).default('HOME'),
  isDefault: z.boolean().default(false),
  instructions: z.string().optional(),
});

export type AddressDto = z.infer<typeof addressSchema>;

export const adminCustomerStatusSchema = z.object({
  status: z.enum(['APPROVED', 'REJECTED', 'BLOCKED', 'SUSPENDED']),
  reason: z.string().optional(),
});

export type AdminCustomerStatusDto = z.infer<typeof adminCustomerStatusSchema>;

export const adminCustomerQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  status: z.enum(['PENDING_APPROVAL', 'APPROVED', 'REJECTED', 'BLOCKED', 'SUSPENDED', 'DELETED']).optional(),
  q: z.string().optional(),
});

export type AdminCustomerQueryDto = z.infer<typeof adminCustomerQuerySchema>;
