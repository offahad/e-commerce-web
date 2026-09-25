import { getDb } from '../../database/index.js';
import { cartService } from '../cart/cart.service.js';
import { couponsService } from '../coupons/coupons.service.js';
import { CheckoutPreviewInput } from './checkout.dto.js';
import { CheckoutPreviewDto, CartItemDto, CouponDiscountType } from '../../common/types.js';

export class CheckoutService {
  /**
   * Server-Side Price Authority: Calculate exact payable amount and line-item breakdown
   */
  async calculatePreview(
    input: CheckoutPreviewInput,
    userId?: string,
    sessionId?: string
  ): Promise<CheckoutPreviewDto> {
    const db = getDb();
    const now = new Date();

    let lineItems: CartItemDto[] = [];
    let subtotal = 0;

    // 1. Resolve Items: from explicit items list or from current Cart
    if (input.items && input.items.length > 0) {
      // Active Flash Deals Map
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

      for (const item of input.items) {
        const variant = await db('product_variants')
          .join('products', 'product_variants.product_id', 'products.id')
          .where({ 'product_variants.id': item.variantId, 'products.status': 'ACTIVE' })
          .select(
            'product_variants.id as variant_id',
            'product_variants.display_name as variant_name',
            'product_variants.sku',
            'product_variants.price',
            'product_variants.sale_price',
            'product_variants.stock_quantity',
            'products.id as product_id',
            'products.name as product_name',
            'products.slug as product_slug'
          )
          .first();

        if (!variant) {
          throw new Error(`Product variant ${item.variantId} not found or inactive`);
        }

        const originalPrice = Number(variant.price);
        let unitPrice = variant.sale_price != null ? Number(variant.sale_price) : originalPrice;

        const flashInfo = flashMap.get(variant.variant_id);
        if (flashInfo && flashInfo.remainingStock > 0) {
          unitPrice = Math.min(unitPrice, flashInfo.dealPrice);
        }

        const availableStock = Number(variant.stock_quantity);
        if (availableStock < item.quantity) {
          throw new Error(
            `Insufficient stock for ${variant.product_name} (${variant.variant_name}). Only ${availableStock} in stock`
          );
        }

        const totalPrice = Math.round(unitPrice * item.quantity * 100) / 100;
        const savings = Math.max(0, Math.round((originalPrice - unitPrice) * item.quantity * 100) / 100);

        const primaryImage = await db('product_images')
          .where({ product_id: variant.product_id, is_thumbnail: true })
          .first();

        lineItems.push({
          id: variant.variant_id,
          variantId: variant.variant_id,
          productId: variant.product_id,
          productName: variant.product_name,
          productSlug: variant.product_slug,
          variantName: variant.variant_name,
          sku: variant.sku,
          quantity: item.quantity,
          unitPrice,
          originalPrice,
          totalPrice,
          savings,
          availableStock,
          isOutOfStock: false,
          imageUrl: primaryImage?.image_url || null,
        });

        subtotal += totalPrice;
      }
    } else {
      // Fetch user's or session's cart
      const cartId = await cartService.getOrCreateCart(userId, input.sessionId || sessionId);
      const cart = await cartService.getCart(cartId);

      if (cart.items.length === 0) {
        throw new Error('Your shopping cart is empty');
      }

      if (cart.hasOutOfStockItems) {
        throw new Error('Your cart contains out-of-stock items. Please remove them before checkout');
      }

      lineItems = cart.items;
      subtotal = cart.subtotal;
    }

    subtotal = Math.round(subtotal * 100) / 100;

    // 2. Business Settings: Delivery fee & thresholds
    const settingsRows = await db('business_settings').whereIn('key', [
      'delivery_fee_standard',
      'free_shipping_threshold',
      'tax_percentage',
      'currency',
    ]);

    const settingsMap = new Map<string, string>();
    for (const row of settingsRows) {
      settingsMap.set(row.key, row.value);
    }

    const standardDeliveryFee = Number(settingsMap.get('delivery_fee_standard') || 60);
    const freeShippingThreshold = Number(settingsMap.get('free_shipping_threshold') || 1000);
    const taxPercentage = Number(settingsMap.get('tax_percentage') || 0);
    const currency = settingsMap.get('currency') || 'BDT';

    let deliveryFee = subtotal >= freeShippingThreshold ? 0 : standardDeliveryFee;

    // 3. Coupon Discount Calculation
    let discountAmount = 0;
    let appliedCoupon: string | null = null;

    if (input.couponCode) {
      const couponValidation = await couponsService.validateCoupon(
        input.couponCode,
        subtotal,
        userId,
        standardDeliveryFee
      );

      if (couponValidation.discountType === CouponDiscountType.FREE_SHIPPING) {
        deliveryFee = 0;
        discountAmount = standardDeliveryFee;
      } else {
        discountAmount = couponValidation.discountAmount;
      }

      appliedCoupon = couponValidation.code;
    }

    // 4. Tax Calculation
    const taxableAmount = Math.max(0, subtotal - discountAmount);
    const taxAmount = Math.round(((taxableAmount * taxPercentage) / 100) * 100) / 100;

    // 5. Grand Total (Non-negotiable server authority)
    const grandTotal = Math.max(0, Math.round((subtotal - discountAmount + deliveryFee + taxAmount) * 100) / 100);

    // Estimated delivery (Next day in Dhaka)
    const estimatedDate = new Date();
    estimatedDate.setDate(estimatedDate.getDate() + 1);

    return {
      items: lineItems,
      subtotal,
      discountAmount,
      couponCode: appliedCoupon,
      deliveryFee,
      taxAmount,
      grandTotal,
      estimatedDeliveryDate: estimatedDate.toISOString().split('T')[0],
      currency,
    };
  }
}

export const checkoutService = new CheckoutService();
