import { z } from 'zod';

export const createCategorySchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  slug: z.string().min(2).max(100).optional(),
  parentId: z.string().uuid().optional().nullable(),
  imageUrl: z.string().url().optional().nullable(),
  description: z.string().optional().nullable(),
  sortOrder: z.coerce.number().default(0),
  isActive: z.boolean().default(true),
});

export type CreateCategoryDto = z.infer<typeof createCategorySchema>;

export const updateCategorySchema = createCategorySchema.partial();
export type UpdateCategoryDto = z.infer<typeof updateCategorySchema>;
