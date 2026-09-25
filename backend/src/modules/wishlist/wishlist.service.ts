import crypto from 'crypto';
import { getDb } from '../../database/index.js';

export class WishlistService {
  async getWishlist(userId: string) {
    const db = getDb();

    const items = await db('wishlists')
      .join('products', 'wishlists.product_id', 'products.id')
      .leftJoin('brands', 'products.brand_id', 'brands.id')
      .where({ 'wishlists.user_id': userId })
      .select(
        'wishlists.id as wishlist_id',
        'wishlists.created_at as added_at',
        'products.id as product_id',
        'products.name',
        'products.slug',
        'products.sku',
        'products.base_price',
        'products.status',
        'brands.name as brand_name'
      )
      .orderBy('wishlists.created_at', 'desc');

    const result = [];
    for (const item of items) {
      // Primary image
      const primaryImage = await db('product_images')
        .where({ product_id: item.product_id, is_thumbnail: true })
        .first();

      // Variants
      const variants = await db('product_variants')
        .where({ product_id: item.product_id, is_active: true })
        .select('id', 'display_name', 'price', 'sale_price', 'stock_quantity');

      result.push({
        id: item.wishlist_id,
        productId: item.product_id,
        name: item.name,
        slug: item.slug,
        sku: item.sku,
        basePrice: item.base_price,
        brandName: item.brand_name,
        imageUrl: primaryImage?.image_url || null,
        addedAt: item.added_at,
        variants,
      });
    }

    return result;
  }

  async toggleWishlist(userId: string, productId: string) {
    const db = getDb();

    const product = await db('products').where({ id: productId }).first();
    if (!product) {
      throw new Error('Product not found');
    }

    const existing = await db('wishlists')
      .where({ user_id: userId, product_id: productId })
      .first();

    if (existing) {
      await db('wishlists').where({ id: existing.id }).delete();
      return { wishlisted: false, message: 'Removed from wishlist' };
    }

    await db('wishlists').insert({
      id: crypto.randomUUID(),
      user_id: userId,
      product_id: productId,
    });

    return { wishlisted: true, message: 'Added to wishlist' };
  }

  async removeFromWishlist(userId: string, productId: string) {
    const db = getDb();
    await db('wishlists').where({ user_id: userId, product_id: productId }).delete();
    return { success: true, message: 'Removed from wishlist' };
  }
}

export const wishlistService = new WishlistService();
