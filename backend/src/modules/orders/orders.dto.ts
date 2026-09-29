import { z } from 'zod';
import { OrderStatus, PaymentStatus, PaymentMethod } from '../../common/types.js';

export const CreateOrderItemSchema = z.object({
  variantId: z.string().uuid('Invalid variant ID'),
  quantity: z.number().int().positive('Quantity must be at least 1'),
});

export const CustomShippingAddressSchema = z.object({
  fullName: z.string().min(2),
  phone: z.string().min(10),
  address: z.string().min(5),
  division: z.string().default('Dhaka'),
  district: z.string().default('Dhaka'),
});

export const CreateOrderSchema = z.object({
  items: z.array(CreateOrderItemSchema).optional(),
  shippingAddressId: z.string().uuid().optional(),
  shippingAddress: CustomShippingAddressSchema.optional(),
  couponCode: z.string().optional(),
  paymentMethod: z.nativeEnum(PaymentMethod).default(PaymentMethod.COD),
  customerNotes: z.string().optional(),
  deliverySlot: z.string().optional(),
  deliveryDate: z.string().optional(),
  sessionId: z.string().optional(),
});

export const UpdateOrderStatusSchema = z.object({
  status: z.nativeEnum(OrderStatus),
  comment: z.string().optional(),
});

export const UpdateOrderPaymentStatusSchema = z.object({
  paymentStatus: z.nativeEnum(PaymentStatus),
  transactionId: z.string().optional(),
  comment: z.string().optional(),
});

export const CancelOrderSchema = z.object({
  reason: z.string().min(3, 'Cancellation reason is required'),
});

export type CreateOrderInput = z.infer<typeof CreateOrderSchema>;
export type UpdateOrderStatusInput = z.infer<typeof UpdateOrderStatusSchema>;
export type UpdateOrderPaymentStatusInput = z.infer<typeof UpdateOrderPaymentStatusSchema>;
export type CancelOrderInput = z.infer<typeof CancelOrderSchema>;
