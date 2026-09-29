import { z } from 'zod';

export const variantInputSchema = z.object({
  sku: z.string().min(1, 'Variant SKU required'),
  displayName: z.string().min(1, 'Display name required (e.g. 1 Liter, 500 Gram)'),
  unit: z.string().min(1, 'Unit required (e.g. Liter, KG, Gram, Piece)'),
  quantity: z.coerce.number().positive('Quantity must be greater than 0'),
  price: z.coerce.number().positive('Base price must be positive'),
  salePrice: z.coerce.number().positive('Sale price must be positive'),
  stockQuantity: z.coerce.number().int().min(0, 'Stock cannot be negative').default(0),
  barcode: z.string().optional().nullable(),
});

export type VariantInputDto = z.infer<typeof variantInputSchema>;

export const createProductSchema = z.object({
  name: z.string().min(2, 'Product name must be at least 2 characters').max(255),
  sku: z.string().min(2, 'SKU must be at least 2 characters').max(100),
  slug: z.string().min(2).max(255).optional(),
  description: z.string().optional().nullable(),
  shortDescription: z.string().optional().nullable(),
  brandId: z.string().uuid().optional().nullable(),
  primaryCategoryId: z.string().uuid().optional().nullable(),
  categoryIds: z.array(z.string().uuid()).optional().default([]),
  tags: z.array(z.string()).optional().default([]),
  costPrice: z.coerce.number().min(0).optional().default(0),
  basePrice: z.coerce.number().positive('Base price must be positive'),
  salePrice: z.coerce.number().positive('Sale price must be positive'),
  discountPercentage: z.coerce.number().min(0).max(100).optional().default(0),
  discountAmount: z.coerce.number().min(0).optional().default(0),
  stockQuantity: z.coerce.number().int().min(0).optional().default(0),
  lowStockThreshold: z.coerce.number().int().min(0).optional().default(5),
  status: z.enum(['ACTIVE', 'DRAFT', 'ARCHIVED']).default('ACTIVE'),
  isFeatured: z.boolean().optional().default(false),
  isNewArrival: z.boolean().optional().default(true),
  isBestSeller: z.boolean().optional().default(false),
  unit: z.string().default('piece'),
  weight: z.coerce.number().optional().nullable(),
  vatPercentage: z.coerce.number().min(0).optional().default(0),
  specifications: z.string().optional().nullable(),
  thumbnailUrl: z.string().url().optional().nullable(),
  images: z.array(z.string().url()).optional().default([]),
  variants: z.array(variantInputSchema).optional().default([]),
});

export type CreateProductDto = z.infer<typeof createProductSchema>;

export const updateProductSchema = createProductSchema.partial();
export type UpdateProductDto = z.infer<typeof updateProductSchema>;

export const productQuerySchema = z.object({
  q: z.string().optional(),
  category: z.string().optional(),
  brand: z.string().optional(),
  tag: z.string().optional(),
  minPrice: z.coerce.number().min(0).optional(),
  maxPrice: z.coerce.number().min(0).optional(),
  inStock: z
    .enum(['true', 'false'])
    .optional()
    .transform((val) => (val === undefined ? undefined : val === 'true')),
  unit: z.string().optional(),
  featured: z
    .enum(['true', 'false'])
    .optional()
    .transform((val) => (val === undefined ? undefined : val === 'true')),
  bestSeller: z
    .enum(['true', 'false'])
    .optional()
    .transform((val) => (val === undefined ? undefined : val === 'true')),
  newArrival: z
    .enum(['true', 'false'])
    .optional()
    .transform((val) => (val === undefined ? undefined : val === 'true')),
  sortBy: z
    .enum(['relevance', 'price_asc', 'price_desc', 'newest', 'popular', 'rating', 'discount'])
    .default('relevance'),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type ProductQueryDto = z.infer<typeof productQuerySchema>;
