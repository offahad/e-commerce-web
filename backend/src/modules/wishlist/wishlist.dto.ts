import { z } from 'zod';

export const WishlistToggleSchema = z.object({
  productId: z.string().uuid('Invalid product ID'),
});
