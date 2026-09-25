import crypto from 'crypto';
import { getDb } from '../../database/index.js';
import { CartItemDto, CartSummaryDto } from '../../common/types.js';

export class CartService {
  /**
   * Find or create active cart for user or session
   */
  async getOrCreateCart(userId?: string, sessionId?: string): Promise<string> {
    const db = getDb();

    if (userId) {
      let userCart = await db('carts').where({ user_id: userId }).first();
      if (!userCart) {
        const id = crypto.randomUUID();
        await db('carts').insert({
          id,
          user_id: userId,
          session_id: sessionId || null,
        });
        return id;
      }

      // If user also passed a guest sessionId, merge any guest cart items into user cart
      if (sessionId && sessionId !== userCart.session_id) {
        const guestCart = await db('carts').where({ session_id: sessionId }).whereNull('user_id').first();
        if (guestCart) {
          const guestItems = await db('cart_items').where({ cart_id: guestCart.id });
          for (const item of guestItems) {
            const existing = await db('cart_items')
              .where({ cart_id: userCart.id, product_variant_id: item.product_variant_id })
              .first();
            if (existing) {
              await db('cart_items')
                .where({ id: existing.id })
                .update({
                  quantity: existing.quantity + item.quantity,
                  updated_at: db.fn.now(),
                });
            } else {
              await db('cart_items').insert({
                id: crypto.randomUUID(),
                cart_id: userCart.id,
                product_variant_id: item.product_variant_id,
                quantity: item.quantity,
              });
            }
          }
          await db('cart_items').where({ cart_id: guestCart.id }).delete();
          await db('carts').where({ id: guestCart.id }).delete();
        }
      }

      return userCart.id;
    }

    if (sessionId) {
      let sessionCart = await db('carts').where({ session_id: sessionId }).first();
      if (!sessionCart) {
        const id = crypto.randomUUID();
        await db('carts').insert({
          id,
          user_id: null,
          session_id: sessionId,
        });
        return id;
      }
      return sessionCart.id;
    }

    // Neither userId nor sessionId provided - generate temporary session
    const tempSessionId = crypto.randomUUID();
    const id = crypto.randomUUID();
    await db('carts').insert({
      id,
      user_id: null,
      session_id: tempSessionId,
    });
    return id;
  }

  /**
   * Get formatted cart with live validated prices and stock
   */
  async getCart(cartId: string): Promise<CartSummaryDto> {
    const db = getDb();
    const now = new Date();

    const rawItems = await db('cart_items')
      .join('product_variants', 'cart_items.product_variant_id', 'product_variants.id')
      .join('products', 'product_variants.product_id', 'products.id')
      .where({ 'cart_items.cart_id': cartId })
      .select(
        'cart_items.id as item_id',
        'cart_items.quantity',
        'product_variants.id as variant_id',
        'product_variants.display_name as variant_name',
        'product_variants.sku',
        'product_variants.price',
        'product_variants.sale_price',
        'product_variants.stock_quantity',
        'products.id as product_id',
        'products.name as product_name',
        'products.slug as product_slug',
        'products.status as product_status'
      )
      .orderBy('cart_items.created_at', 'asc');

    // Fetch active flash deals to check if any variant is on flash deal
    const activeFlashDeals = await db('flash_deals')
      .join('flash_deal_items', 'flash_deals.id', 'flash_deal_items.flash_deal_id')
      .where('flash_deals.is_active', true)
      .where('flash_deals.status', 'ACTIVE')
      .where('flash_deals.start_time', '<=', now)
      .where('flash_deals.end_time', '>=', now)
      .select(
        'flash_deal_items.variant_id',
        'flash_deal_items.deal_price',
        'flash_deal_items.allocated_stock',
        'flash_deal_items.sold_stock'
      );

    const flashMap = new Map<string, { dealPrice: number; remainingStock: number }>();
    for (const fd of activeFlashDeals) {
      flashMap.set(fd.variant_id, {
        dealPrice: Number(fd.deal_price),
        remainingStock: Math.max(0, fd.allocated_stock - fd.sold_stock),
      });
    }

    const items: CartItemDto[] = [];
    let subtotal = 0;
    let totalSavings = 0;
    let totalQuantity = 0;
    let hasOutOfStockItems = false;

    for (const raw of rawItems) {
      const originalPrice = Number(raw.price);
      let unitPrice = raw.sale_price != null ? Number(raw.sale_price) : originalPrice;

      // Check if flash deal applies and stock is available
      const flashInfo = flashMap.get(raw.variant_id);
      if (flashInfo && flashInfo.remainingStock > 0) {
        unitPrice = Math.min(unitPrice, flashInfo.dealPrice);
      }

      const availableStock = Number(raw.stock_quantity);
      const isOutOfStock = availableStock <= 0 || raw.product_status !== 'ACTIVE';
      if (isOutOfStock) {
        hasOutOfStockItems = true;
      }

      const quantity = Number(raw.quantity);
      const totalPrice = Math.round(unitPrice * quantity * 100) / 100;
      const savings = Math.max(0, Math.round((originalPrice - unitPrice) * quantity * 100) / 100);

      // Fetch primary product image
      const primaryImage = await db('product_images')
        .where({ product_id: raw.product_id, is_thumbnail: true })
        .first();

      items.push({
        id: raw.item_id,
        variantId: raw.variant_id,
        productId: raw.product_id,
        productName: raw.product_name,
        productSlug: raw.product_slug,
        variantName: raw.variant_name,
        sku: raw.sku,
        quantity,
        unitPrice,
        originalPrice,
        totalPrice,
        savings,
        availableStock,
        isOutOfStock,
        imageUrl: primaryImage?.image_url || null,
      });

      subtotal += totalPrice;
      totalSavings += savings;
      totalQuantity += quantity;
    }

    return {
      items,
      itemCount: items.length,
      totalQuantity,
      subtotal: Math.round(subtotal * 100) / 100,
      totalSavings: Math.round(totalSavings * 100) / 100,
      hasOutOfStockItems,
    };
  }

  /**
   * Add variant to cart
   */
  async addItem(cartId: string, variantId: string, quantity: number): Promise<CartSummaryDto> {
    const db = getDb();

    const variant = await db('product_variants').where({ id: variantId, is_active: true }).first();
    if (!variant) {
      throw new Error('Product variant not found or inactive');
    }

    if (variant.stock_quantity < quantity) {
      throw new Error(`Insufficient stock. Only ${variant.stock_quantity} available`);
    }

    const existingItem = await db('cart_items')
      .where({ cart_id: cartId, product_variant_id: variantId })
      .first();

    if (existingItem) {
      const newQty = existingItem.quantity + quantity;
      if (variant.stock_quantity < newQty) {
        throw new Error(
          `Cannot add more. You already have ${existingItem.quantity} in cart and available stock is ${variant.stock_quantity}`
        );
      }

      await db('cart_items')
        .where({ id: existingItem.id })
        .update({
          quantity: newQty,
          updated_at: db.fn.now(),
        });
    } else {
      await db('cart_items').insert({
        id: crypto.randomUUID(),
        cart_id: cartId,
        product_variant_id: variantId,
        quantity,
      });
    }

    await db('carts').where({ id: cartId }).update({ updated_at: db.fn.now() });
    return this.getCart(cartId);
  }

  /**
   * Update item quantity in cart
   */
  async updateItemQuantity(cartId: string, itemId: string, quantity: number): Promise<CartSummaryDto> {
    const db = getDb();

    const item = await db('cart_items').where({ id: itemId, cart_id: cartId }).first();
    if (!item) {
      throw new Error('Cart item not found');
    }

    if (quantity <= 0) {
      await db('cart_items').where({ id: itemId }).delete();
    } else {
      const variant = await db('product_variants').where({ id: item.product_variant_id }).first();
      if (!variant) {
        throw new Error('Product variant no longer exists');
      }

      if (variant.stock_quantity < quantity) {
        throw new Error(`Cannot update quantity. Only ${variant.stock_quantity} units available`);
      }

      await db('cart_items').where({ id: itemId }).update({
        quantity,
        updated_at: db.fn.now(),
      });
    }

    await db('carts').where({ id: cartId }).update({ updated_at: db.fn.now() });
    return this.getCart(cartId);
  }

  /**
   * Remove item from cart
   */
  async removeItem(cartId: string, itemId: string): Promise<CartSummaryDto> {
    const db = getDb();
    await db('cart_items').where({ id: itemId, cart_id: cartId }).delete();
    await db('carts').where({ id: cartId }).update({ updated_at: db.fn.now() });
    return this.getCart(cartId);
  }

  /**
   * Empty shopping cart
   */
  async clearCart(cartId: string): Promise<CartSummaryDto> {
    const db = getDb();
    await db('cart_items').where({ cart_id: cartId }).delete();
    await db('carts').where({ id: cartId }).update({ updated_at: db.fn.now() });
    return this.getCart(cartId);
  }
}

export const cartService = new CartService();
