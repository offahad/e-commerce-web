import { z } from 'zod';
import { FlashDealStatus } from '../../common/types.js';

export const CreateFlashDealItemSchema = z.object({
  productId: z.string().uuid('Invalid product ID'),
  variantId: z.string().uuid('Invalid variant ID'),
  dealPrice: z.number().positive('Deal price must be greater than zero'),
  allocatedStock: z.number().int().positive('Allocated stock must be at least 1'),
  maxPerCustomer: z.number().int().positive().default(2),
});

export const CreateFlashDealSchema = z.object({
  title: z.string().min(3).max(150),
  slug: z.string().min(3).max(150).optional(),
  description: z.string().optional(),
  bannerImage: z.string().url().optional().nullable(),
  startTime: z.string().datetime().or(z.string().date()),
  endTime: z.string().datetime().or(z.string().date()),
  items: z.array(CreateFlashDealItemSchema).min(1, 'At least one deal item must be included'),
});

export const UpdateFlashDealStatusSchema = z.object({
  status: z.nativeEnum(FlashDealStatus),
  isActive: z.boolean().optional(),
});

export type CreateFlashDealInput = z.infer<typeof CreateFlashDealSchema>;
export type UpdateFlashDealStatusInput = z.infer<typeof UpdateFlashDealStatusSchema>;
