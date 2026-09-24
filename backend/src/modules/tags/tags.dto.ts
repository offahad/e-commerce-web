import { z } from 'zod';

export const createTagSchema = z.object({
  name: z.string().min(2, 'Tag name must be at least 2 characters').max(50),
  slug: z.string().min(2).max(50).optional(),
  description: z.string().optional().nullable(),
});

export type CreateTagDto = z.infer<typeof createTagSchema>;
