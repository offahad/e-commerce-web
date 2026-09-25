import { z } from 'zod';
import { CouponDiscountType } from '../../common/types.js';

export const CreateCouponSchema = z.object({
  code: z.string().min(3).max(50).toUpperCase(),
  title: z.string().min(3).max(150),
  description: z.string().optional(),
  discountType: z.nativeEnum(CouponDiscountType),
  discountValue: z.number().positive('Discount value must be greater than zero'),
  minOrderAmount: z.number().min(0).default(0),
  maxDiscountAmount: z.number().positive().optional().nullable(),
  startDate: z.string().datetime().or(z.string().date()),
  endDate: z.string().datetime().or(z.string().date()),
  usageLimitTotal: z.number().int().positive().optional().nullable(),
  usageLimitPerUser: z.number().int().positive().default(1),
  isActive: z.boolean().default(true),
});

export const UpdateCouponSchema = CreateCouponSchema.partial();

export const ValidateCouponSchema = z.object({
  code: z.string().min(1, 'Coupon code is required').toUpperCase(),
  subtotal: z.number().min(0, 'Subtotal cannot be negative'),
  deliveryFee: z.number().min(0).default(60),
});

export type CreateCouponInput = z.infer<typeof CreateCouponSchema>;
export type UpdateCouponInput = z.infer<typeof UpdateCouponSchema>;
export type ValidateCouponInput = z.infer<typeof ValidateCouponSchema>;
