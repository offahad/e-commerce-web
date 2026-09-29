import { z } from 'zod';

export const CheckoutPreviewItemSchema = z.object({
  variantId: z.string().uuid('Invalid variant ID'),
  quantity: z.number().int().positive('Quantity must be at least 1'),
});

export const CheckoutPreviewSchema = z.object({
  items: z.array(CheckoutPreviewItemSchema).optional(),
  couponCode: z.string().optional(),
  deliveryAddressId: z.string().uuid().optional(),
  sessionId: z.string().optional(),
});

export type CheckoutPreviewInput = z.infer<typeof CheckoutPreviewSchema>;
