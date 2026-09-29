import crypto from 'crypto';
import { getDatabase } from '../../database/index.js';
import { AppError } from '../../common/middleware/error-handler.js';
import { CreateProductDto, UpdateProductDto, ProductQueryDto } from './products.dto.js';

export class ProductsService {
  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  async list(query: ProductQueryDto) {
    const db = getDatabase();
    const {
      q,
      category,
      brand,
      tag,
      minPrice,
      maxPrice,
      inStock,
      unit,
      featured,
      bestSeller,
      newArrival,
      sortBy,
      page,
      limit,
    } = query;

    const offset = (page - 1) * limit;

    let baseQuery = db('products')
      .leftJoin('brands', 'products.brand_id', 'brands.id')
      .leftJoin('categories', 'products.primary_category_id', 'categories.id')
      .where('products.status', 'ACTIVE')
      .whereNull('products.deleted_at');

    // Search keyword across product name, description, SKU, brand name, category name
    if (q) {
      const term = `%${q}%`;
      baseQuery = baseQuery.where((builder) => {
        builder
          .whereILike('products.name', term)
          .orWhereILike('products.description', term)
          .orWhereILike('products.sku', term)
          .orWhereILike('brands.name', term)
          .orWhereILike('categories.name', term);
      });
    }

    const isUuid = (val: string) =>
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val);

    // Category filter (slug or UUID)
    if (category) {
      baseQuery = baseQuery.where((builder) => {
        if (isUuid(category)) {
          builder.where('products.primary_category_id', category).orWhere('categories.slug', category);
        } else {
          builder.where('categories.slug', category);
        }
      });
    }

    // Brand filter (slug or UUID)
    if (brand) {
      baseQuery = baseQuery.where((builder) => {
        if (isUuid(brand)) {
          builder.where('products.brand_id', brand).orWhere('brands.slug', brand);
        } else {
          builder.where('brands.slug', brand);
        }
      });
    }

    // Tag filter
    if (tag) {
      baseQuery = baseQuery.whereIn('products.id', function () {
        this.select('product_tags.product_id')
          .from('product_tags')
          .join('tags', 'product_tags.tag_id', 'tags.id')
          .where('tags.slug', tag)
          .orWhereILike('tags.name', tag);
      });
    }

    // Price range filters
    if (minPrice !== undefined) {
      baseQuery = baseQuery.where('products.sale_price', '>=', minPrice);
    }
    if (maxPrice !== undefined) {
      baseQuery = baseQuery.where('products.sale_price', '<=', maxPrice);
    }

    // Stock availability filter
    if (inStock !== undefined) {
      if (inStock) {
        baseQuery = baseQuery.where('products.stock_quantity', '>', 0);
      } else {
        baseQuery = baseQuery.where('products.stock_quantity', '<=', 0);
      }
    }

    // Unit filter
    if (unit) {
      baseQuery = baseQuery.whereILike('products.unit', unit);
    }

    // Featured, Best Seller, New Arrival flags
    if (featured !== undefined) baseQuery = baseQuery.where('products.is_featured', featured);
    if (bestSeller !== undefined) baseQuery = baseQuery.where('products.is_best_seller', bestSeller);
    if (newArrival !== undefined) baseQuery = baseQuery.where('products.is_new_arrival', newArrival);

    // Count total matches
    const countResult = await baseQuery.clone().count<{ count: string | number }>('products.id as count').first();
    const total = Number(countResult?.count || 0);

    // Sorting
    let orderedQuery = baseQuery.clone();
    switch (sortBy) {
      case 'price_asc':
        orderedQuery = orderedQuery.orderBy('products.sale_price', 'asc');
        break;
      case 'price_desc':
        orderedQuery = orderedQuery.orderBy('products.sale_price', 'desc');
        break;
      case 'newest':
        orderedQuery = orderedQuery.orderBy('products.created_at', 'desc');
        break;
      case 'popular':
        orderedQuery = orderedQuery.orderBy('products.review_count', 'desc');
        break;
      case 'rating':
        orderedQuery = orderedQuery.orderBy('products.rating_avg', 'desc');
        break;
      case 'discount':
        orderedQuery = orderedQuery.orderBy('products.discount_percentage', 'desc');
        break;
      case 'relevance':
      default:
        orderedQuery = orderedQuery.orderBy('products.is_best_seller', 'desc').orderBy('products.created_at', 'desc');
        break;
    }

    const rows = await orderedQuery
      .select(
        'products.id',
        'products.sku',
        'products.name',
        'products.slug',
        'products.short_description',
        'products.base_price',
        'products.sale_price',
        'products.discount_percentage',
        'products.discount_amount',
        'products.stock_quantity',
        'products.unit',
        'products.rating_avg',
        'products.review_count',
        'products.is_featured',
        'products.is_best_seller',
        'products.is_new_arrival',
        'products.thumbnail_url',
        'brands.name as brand_name',
        'brands.slug as brand_slug',
        'categories.name as category_name',
        'categories.slug as category_slug'
      )
      .limit(limit)
      .offset(offset);

    // Attach variant summary (e.g. variants count and pricing spread)
    const productIds = rows.map((r) => r.id);
    const variants = productIds.length
      ? await db('product_variants')
          .whereIn('product_id', productIds)
          .where({ is_active: true })
          .select('id', 'product_id', 'display_name', 'unit', 'quantity', 'price', 'sale_price', 'stock_quantity')
      : [];

    const productsWithVariants = rows.map((p) => {
      const pVariants = variants.filter((v) => v.product_id === p.id);
      return {
        ...p,
        variants: pVariants,
        hasVariants: pVariants.length > 0,
        inStock: p.stock_quantity > 0,
      };
    });

    return {
      products: productsWithVariants,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  async getBySlug(slug: string) {
    const db = getDatabase();
    const product = await db('products')
      .leftJoin('brands', 'products.brand_id', 'brands.id')
      .leftJoin('categories', 'products.primary_category_id', 'categories.id')
      .where('products.slug', slug)
      .whereNull('products.deleted_at')
      .select(
        'products.*',
        'brands.name as brand_name',
        'brands.slug as brand_slug',
        'brands.logo_url as brand_logo',
        'categories.name as category_name',
        'categories.slug as category_slug'
      )
      .first();

    if (!product) {
      throw new AppError('Product not found', 404, 'PRODUCT_NOT_FOUND');
    }

    // Fetch all variants
    const variants = await db('product_variants')
      .where({ product_id: product.id, is_active: true })
      .orderBy('price', 'asc');

    // Fetch images
    const images = await db('product_images')
      .where({ product_id: product.id })
      .orderBy('sort_order', 'asc');

    // Fetch tags
    const tags = await db('product_tags')
      .join('tags', 'product_tags.tag_id', 'tags.id')
      .where({ 'product_tags.product_id': product.id })
      .select('tags.id', 'tags.name', 'tags.slug');

    // Fetch price history
    const priceHistory = await db('price_history')
      .where({ product_id: product.id })
      .orderBy('created_at', 'desc')
      .limit(10);

    return {
      ...product,
      variants,
      images,
      tags,
      priceHistory,
    };
  }

  async getSuggestions(keyword: string) {
    const db = getDatabase();
    if (!keyword || keyword.trim().length < 2) {
      return { products: [], categories: [], brands: [] };
    }

    const term = `%${keyword.trim()}%`;

    const products = await db('products')
      .where('status', 'ACTIVE')
      .whereNull('deleted_at')
      .whereILike('name', term)
      .select('id', 'name', 'slug', 'sale_price', 'thumbnail_url', 'unit')
      .limit(6);

    const categories = await db('categories')
      .where('is_active', true)
      .whereILike('name', term)
      .select('id', 'name', 'slug')
      .limit(4);

    const brands = await db('brands')
      .where('is_active', true)
      .whereILike('name', term)
      .select('id', 'name', 'slug')
      .limit(3);

    return { products, categories, brands };
  }

  async getSectionProducts(sectionKey: string, limit = 10) {
    const db = getDatabase();
    let query = db('products')
      .leftJoin('brands', 'products.brand_id', 'brands.id')
      .leftJoin('categories', 'products.primary_category_id', 'categories.id')
      .where('products.status', 'ACTIVE')
      .whereNull('products.deleted_at');

    switch (sectionKey) {
      case 'friday-flash-deal':
        query = query.whereIn('products.id', function () {
          this.select('product_tags.product_id')
            .from('product_tags')
            .join('tags', 'product_tags.tag_id', 'tags.id')
            .where('tags.slug', 'friday-flash-deal');
        });
        break;

      case 'deals-of-the-day':
        query = query.whereIn('products.id', function () {
          this.select('product_tags.product_id')
            .from('product_tags')
            .join('tags', 'product_tags.tag_id', 'tags.id')
            .where('tags.slug', 'deals-of-the-day');
        });
        break;

      case 'fresh-vegetables':
        query = query.where('categories.slug', 'fresh-vegetables');
        break;

      case 'masala-spices':
        query = query.where('categories.slug', 'masala-spices');
        break;

      case 'best-sellers':
        query = query.where('products.is_best_seller', true);
        break;

      case 'new-arrivals':
        query = query.where('products.is_new_arrival', true).orderBy('products.created_at', 'desc');
        break;

      case 'popular-products':
      default:
        query = query.orderBy('products.review_count', 'desc');
        break;
    }

    const rows = await query
      .select(
        'products.id',
        'products.sku',
        'products.name',
        'products.slug',
        'products.base_price',
        'products.sale_price',
        'products.discount_percentage',
        'products.discount_amount',
        'products.stock_quantity',
        'products.unit',
        'products.rating_avg',
        'products.review_count',
        'products.thumbnail_url',
        'brands.name as brand_name',
        'brands.slug as brand_slug',
        'categories.name as category_name',
        'categories.slug as category_slug'
      )
      .limit(limit);

    return rows;
  }

  // --- Admin Methods ---

  async create(dto: CreateProductDto, adminId?: string) {
    const db = getDatabase();
    const slug = dto.slug || this.generateSlug(dto.name);

    const existing = await db('products').where({ slug }).first();
    if (existing) {
      throw new AppError('A product with this slug already exists', 409, 'PRODUCT_SLUG_EXISTS');
    }

    const existingSku = await db('products').where({ sku: dto.sku }).first();
    if (existingSku) {
      throw new AppError('A product with this SKU already exists', 409, 'PRODUCT_SKU_EXISTS');
    }

    const productId = crypto.randomUUID();

    // Calculate total stock from variants if variants provided
    const variantStockSum = dto.variants.reduce((acc, v) => acc + (v.stockQuantity || 0), 0);
    const totalStock = dto.variants.length > 0 ? variantStockSum : dto.stockQuantity || 0;

    await db.transaction(async (trx) => {
      // 1. Insert product
      await trx('products').insert({
        id: productId,
        sku: dto.sku,
        name: dto.name,
        slug,
        description: dto.description || null,
        short_description: dto.shortDescription || null,
        brand_id: dto.brandId || null,
        primary_category_id: dto.primaryCategoryId || null,
        cost_price: dto.costPrice || 0,
        base_price: dto.basePrice,
        sale_price: dto.salePrice,
        discount_percentage: dto.discountPercentage || 0,
        discount_amount: dto.discountAmount || 0,
        stock_quantity: totalStock,
        low_stock_threshold: dto.lowStockThreshold || 5,
        status: dto.status || 'ACTIVE',
        is_featured: dto.isFeatured || false,
        is_new_arrival: dto.isNewArrival !== undefined ? dto.isNewArrival : true,
        is_best_seller: dto.isBestSeller || false,
        unit: dto.unit || 'piece',
        weight: dto.weight || null,
        vat_percentage: dto.vatPercentage || 0,
        specifications: dto.specifications || null,
        thumbnail_url: dto.thumbnailUrl || (dto.images.length > 0 ? dto.images[0] : null),
      });

      // 2. Insert Category Mappings
      const allCategories = new Set<string>();
      if (dto.primaryCategoryId) allCategories.add(dto.primaryCategoryId);
      if (dto.categoryIds) dto.categoryIds.forEach((c) => allCategories.add(c));

      for (const catId of allCategories) {
        await trx('product_categories').insert({
          id: crypto.randomUUID(),
          product_id: productId,
          category_id: catId,
        });
      }

      // 3. Insert Tags
      if (dto.tags && dto.tags.length > 0) {
        for (const tagName of dto.tags) {
          let tag = await trx('tags')
            .whereILike('name', tagName)
            .orWhere('slug', this.generateSlug(tagName))
            .first();
          if (!tag) {
            const tagId = crypto.randomUUID();
            await trx('tags').insert({
              id: tagId,
              name: tagName,
              slug: this.generateSlug(tagName),
            });
            tag = { id: tagId };
          }
          await trx('product_tags').insert({
            id: crypto.randomUUID(),
            product_id: productId,
            tag_id: tag.id,
          });
        }
      }

      // 4. Insert Variants
      if (dto.variants && dto.variants.length > 0) {
        for (const v of dto.variants) {
          const variantId = crypto.randomUUID();
          await trx('product_variants').insert({
            id: variantId,
            product_id: productId,
            sku: v.sku,
            display_name: v.displayName,
            unit: v.unit,
            quantity: v.quantity,
            price: v.price,
            sale_price: v.salePrice,
            stock_quantity: v.stockQuantity || 0,
            barcode: v.barcode || null,
            is_active: true,
          });

          // Price history for variant
          await trx('price_history').insert({
            id: crypto.randomUUID(),
            product_id: productId,
            variant_id: variantId,
            old_price: v.price,
            new_price: v.price,
            old_sale_price: v.salePrice,
            new_sale_price: v.salePrice,
            changed_by: adminId || null,
          });

          // Initial inventory transaction
          if (v.stockQuantity && v.stockQuantity > 0) {
            await trx('inventory_transactions').insert({
              id: crypto.randomUUID(),
              product_id: productId,
              variant_id: variantId,
              transaction_type: 'STOCK_IN',
              quantity_changed: v.stockQuantity,
              previous_stock: 0,
              new_stock: v.stockQuantity,
              reason: 'Initial stock on product creation',
              performed_by: adminId || null,
            });
          }
        }
      }

      // 5. Insert Images
      if (dto.images && dto.images.length > 0) {
        for (let i = 0; i < dto.images.length; i++) {
          await trx('product_images').insert({
            id: crypto.randomUUID(),
            product_id: productId,
            image_url: dto.images[i],
            is_thumbnail: i === 0,
            sort_order: i,
          });
        }
      }

      // 6. Audit Log
      await trx('audit_logs').insert({
        id: crypto.randomUUID(),
        user_id: adminId || null,
        action: 'PRODUCT_CREATE',
        entity_name: 'products',
        entity_id: productId,
        new_value: JSON.stringify({ name: dto.name, sku: dto.sku, salePrice: dto.salePrice }),
      });
    });

    return this.getBySlug(slug);
  }

  async update(id: string, dto: UpdateProductDto, adminId?: string) {
    const db = getDatabase();
    const product = await db('products').where({ id }).first();
    if (!product) {
      throw new AppError('Product not found', 404, 'PRODUCT_NOT_FOUND');
    }

    const updateData: any = { updated_at: db.fn.now() };
    if (dto.name) updateData.name = dto.name;
    if (dto.sku) updateData.sku = dto.sku;
    if (dto.slug) updateData.slug = dto.slug;
    if (dto.description !== undefined) updateData.description = dto.description;
    if (dto.shortDescription !== undefined) updateData.short_description = dto.shortDescription;
    if (dto.brandId !== undefined) updateData.brand_id = dto.brandId;
    if (dto.primaryCategoryId !== undefined) updateData.primary_category_id = dto.primaryCategoryId;
    if (dto.costPrice !== undefined) updateData.cost_price = dto.costPrice;
    if (dto.basePrice !== undefined) updateData.base_price = dto.basePrice;
    if (dto.salePrice !== undefined) updateData.sale_price = dto.salePrice;
    if (dto.discountPercentage !== undefined) updateData.discount_percentage = dto.discountPercentage;
    if (dto.discountAmount !== undefined) updateData.discount_amount = dto.discountAmount;
    if (dto.lowStockThreshold !== undefined) updateData.low_stock_threshold = dto.lowStockThreshold;
    if (dto.status !== undefined) updateData.status = dto.status;
    if (dto.isFeatured !== undefined) updateData.is_featured = dto.isFeatured;
    if (dto.isBestSeller !== undefined) updateData.is_best_seller = dto.isBestSeller;
    if (dto.isNewArrival !== undefined) updateData.is_new_arrival = dto.isNewArrival;
    if (dto.unit !== undefined) updateData.unit = dto.unit;
    if (dto.weight !== undefined) updateData.weight = dto.weight;
    if (dto.vatPercentage !== undefined) updateData.vat_percentage = dto.vatPercentage;
    if (dto.specifications !== undefined) updateData.specifications = dto.specifications;
    if (dto.thumbnailUrl !== undefined) updateData.thumbnail_url = dto.thumbnailUrl;

    // Check if price changed -> Record Price History (Section 76)
    const isPriceChanged =
      (dto.basePrice !== undefined && dto.basePrice !== Number(product.base_price)) ||
      (dto.salePrice !== undefined && dto.salePrice !== Number(product.sale_price));

    await db.transaction(async (trx) => {
      await trx('products').where({ id }).update(updateData);

      if (isPriceChanged) {
        await trx('price_history').insert({
          id: crypto.randomUUID(),
          product_id: id,
          old_price: product.base_price,
          new_price: dto.basePrice || product.base_price,
          old_sale_price: product.sale_price,
          new_sale_price: dto.salePrice || product.sale_price,
          changed_by: adminId || null,
        });
      }

      const cleanUpdateData = { ...updateData };
      delete cleanUpdateData.updated_at;

      // Record Audit Log
      await trx('audit_logs').insert({
        id: crypto.randomUUID(),
        user_id: adminId || null,
        action: 'PRODUCT_UPDATE',
        entity_name: 'products',
        entity_id: id,
        old_value: JSON.stringify({ basePrice: product.base_price, salePrice: product.sale_price }),
        new_value: JSON.stringify(cleanUpdateData),
      });
    });

    const updated = await db('products').where({ id }).first();
    return this.getBySlug(updated.slug);
  }

  async delete(id: string, adminId?: string) {
    const db = getDatabase();
    const product = await db('products').where({ id }).first();
    if (!product) {
      throw new AppError('Product not found', 404, 'PRODUCT_NOT_FOUND');
    }

    // Soft delete: status ARCHIVED and deleted_at
    await db('products').where({ id }).update({
      status: 'ARCHIVED',
      deleted_at: db.fn.now(),
      updated_at: db.fn.now(),
    });

    // Audit log
    await db('audit_logs').insert({
      id: crypto.randomUUID(),
      user_id: adminId || null,
      action: 'PRODUCT_DELETE',
      entity_name: 'products',
      entity_id: id,
      old_value: JSON.stringify({ name: product.name, sku: product.sku }),
    });

    return { deleted: true, productId: id };
  }
}
