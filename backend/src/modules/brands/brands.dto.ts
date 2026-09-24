import { z } from 'zod';

export const createBrandSchema = z.object({
  name: z.string().min(2, 'Brand name must be at least 2 characters').max(100),
  slug: z.string().min(2).max(100).optional(),
  logoUrl: z.string().url().optional().nullable(),
  description: z.string().optional().nullable(),
  isActive: z.boolean().default(true),
});

export type CreateBrandDto = z.infer<typeof createBrandSchema>;

export const updateBrandSchema = createBrandSchema.partial();
export type UpdateBrandDto = z.infer<typeof updateBrandSchema>;
