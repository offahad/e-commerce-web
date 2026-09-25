import { z } from 'zod';

export const AddToCartSchema = z.object({
  variantId: z.string().uuid('Invalid variant ID'),
  quantity: z.number().int().positive('Quantity must be at least 1').default(1),
  sessionId: z.string().optional(),
});

export const UpdateCartItemSchema = z.object({
  quantity: z.number().int().min(0, 'Quantity cannot be negative'),
});

export type AddToCartInput = z.infer<typeof AddToCartSchema>;
export type UpdateCartItemInput = z.infer<typeof UpdateCartItemSchema>;
