import { z } from 'zod';

export const stockAdjustmentSchema = z.object({
  productId: z.string().uuid('Product ID must be a valid UUID'),
  variantId: z.string().uuid('Variant ID must be a valid UUID').optional().nullable(),
  transactionType: z.enum(['STOCK_IN', 'STOCK_OUT', 'ADJUSTMENT']),
  quantity: z.coerce.number().int().positive('Quantity must be positive integer'),
  reason: z.string().min(3, 'Reason must be provided for audit tracking'),
  referenceId: z.string().optional().nullable(),
});

export type StockAdjustmentDto = z.infer<typeof stockAdjustmentSchema>;

export const inventoryQuerySchema = z.object({
  productId: z.string().uuid().optional(),
  transactionType: z.enum(['STOCK_IN', 'STOCK_OUT', 'ADJUSTMENT', 'RESERVATION', 'RELEASE']).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type InventoryQueryDto = z.infer<typeof inventoryQuerySchema>;
