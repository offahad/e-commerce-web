import { z } from 'zod';

export const createBannerSchema = z.object({
  title: z.string().min(2, 'Title must be at least 2 characters').max(255),
  subtitle: z.string().max(255).optional().nullable(),
  tag: z.string().max(100).optional().nullable(),
  buttonText: z.string().max(100).default('Shop now'),
  imageUrl: z.string().min(5, 'Image URL must be provided'),
  imageAlt: z.string().max(255).default('Promotional banner'),
  destinationLink: z.string().max(255).optional().nullable(),
  destinationCategory: z.string().max(100).optional().nullable(),
  displayOrder: z.coerce.number().int().min(1).default(1),
  startDate: z.string().optional().nullable(),
  endDate: z.string().optional().nullable(),
  status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']).default('PUBLISHED'),
  isActive: z.boolean().default(true),
});

export type CreateBannerDto = z.infer<typeof createBannerSchema>;

export const updateBannerSchema = createBannerSchema.partial();
export type UpdateBannerDto = z.infer<typeof updateBannerSchema>;

export const updateBannerStatusSchema = z.object({
  status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']).optional(),
  isActive: z.boolean().optional(),
});

export type UpdateBannerStatusDto = z.infer<typeof updateBannerStatusSchema>;
