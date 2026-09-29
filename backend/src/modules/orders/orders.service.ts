import crypto from 'crypto';
import { getDb } from '../../database/index.js';
import { cartService } from '../cart/cart.service.js';
import { couponsService } from '../coupons/coupons.service.js';
import { PaymentGatewayFactory } from '../payments/payment-gateway.factory.js';
import { CreateOrderInput } from './orders.dto.js';
import {
  OrderStatus,
  PaymentStatus,
  PaymentMethod,
  CouponDiscountType,
  OrderTrackingDto,
} from '../../common/types.js';

export class OrdersService {
  /**
   * ACID Transactional Order Placement with Server-Side Price Authority & Concurrency Stock Deduction
   */
  async createOrder(userId: string, input: CreateOrderInput) {
    const db = getDb();
    const now = new Date();

    // 1. Resolve Shipping Address
    let addressSnapshot: any = null;
    let shippingAddressId: string | null = null;

    if (input.shippingAddressId) {
      const savedAddr = await db('customer_addresses')
        .where({ id: input.shippingAddressId, user_id: userId })
        .first();
      if (!savedAddr) {
        throw new Error('Specified delivery address not found');
      }
      shippingAddressId = savedAddr.id;
      addressSnapshot = {
        fullName: savedAddr.full_name,
        phone: savedAddr.phone,
        address: savedAddr.address_line,
        division: savedAddr.division,
        district: savedAddr.district,
      };
    } else if (input.shippingAddress) {
      addressSnapshot = input.shippingAddress;
    } else {
      // Look for default address
      const defaultAddr = await db('customer_addresses')
        .where({ user_id: userId, is_default: true })
        .first();
      if (defaultAddr) {
        shippingAddressId = defaultAddr.id;
        addressSnapshot = {
          fullName: defaultAddr.full_name,
          phone: defaultAddr.phone,
          address: defaultAddr.address_line,
          division: defaultAddr.division,
          district: defaultAddr.district,
        };
      } else {
        const anyAddr = await db('customer_addresses').where({ user_id: userId }).first();
        if (anyAddr) {
          shippingAddressId = anyAddr.id;
          addressSnapshot = {
            fullName: anyAddr.full_name,
            phone: anyAddr.phone,
            address: anyAddr.address_line,
            division: anyAddr.division,
            district: anyAddr.district,
          };
        } else {
          throw new Error('Delivery address is required to place an order');
        }
      }
    }

    // 2. Resolve Items: from explicit items list or from active cart
    let requestedItems: { variantId: string; quantity: number }[] = [];
    let isFromCart = false;
    let cartIdToClear: string | null = null;

    if (input.items && input.items.length > 0) {
      requestedItems = input.items;
    } else {
      const userCartId = await cartService.getOrCreateCart(userId, input.sessionId);
      const cartSummary = await cartService.getCart(userCartId);

      if (cartSummary.items.length === 0) {
        throw new Error('Your shopping cart is empty');
      }
      if (cartSummary.hasOutOfStockItems) {
        throw new Error('Your cart contains out-of-stock items. Please remove them before checkout');
      }

      requestedItems = cartSummary.items.map((i) => ({ variantId: i.variantId, quantity: i.quantity }));
      isFromCart = true;
      cartIdToClear = userCartId;
    }

    // Generate Order Numbers
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
    const randPart = crypto.randomBytes(3).toString('hex').toUpperCase();
    const orderNumber = `LB-${dateStr}-${randPart}`;
    const trackingNumber = `TRK-${dateStr}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
    const orderId = crypto.randomUUID();

    // 3. Execute ACID Transaction
    return await db.transaction(async (trx: any) => {
      // Step A: Lock Variants with FOR UPDATE to prevent race conditions
      const variantIds = requestedItems.map((i) => i.variantId);
      const lockedVariants = await trx('product_variants')
        .join('products', 'product_variants.product_id', 'products.id')
        .whereIn('product_variants.id', variantIds)
        .where('products.status', 'ACTIVE')
        .where('product_variants.is_active', true)
        .select(
          'product_variants.id as variant_id',
          'product_variants.product_id',
          'product_variants.display_name as variant_name',
          'product_variants.sku',
          'product_variants.price',
          'product_variants.sale_price',
          'product_variants.stock_quantity',
          'products.name as product_name',
          'products.slug as product_slug'
        )
        .forUpdate();

      const variantMap = new Map<string, any>();
      for (const v of lockedVariants) {
        variantMap.set(v.variant_id, v);
      }

      // Step B: Active Friday Flash Deals with Lock
      const activeFlashDeals = await trx('flash_deals')
        .join('flash_deal_items', 'flash_deals.id', 'flash_deal_items.flash_deal_id')
        .where('flash_deals.is_active', true)
        .where('flash_deals.status', 'ACTIVE')
        .where('flash_deals.start_time', '<=', now)
        .where('flash_deals.end_time', '>=', now)
        .whereIn('flash_deal_items.variant_id', variantIds)
        .select(
          'flash_deal_items.id as flash_item_id',
          'flash_deal_items.variant_id',
          'flash_deal_items.deal_price',
          'flash_deal_items.allocated_stock',
          'flash_deal_items.sold_stock',
          'flash_deal_items.max_per_customer'
        )
        .forUpdate();

      const flashMap = new Map<string, any>();
      for (const fd of activeFlashDeals) {
        flashMap.set(fd.variant_id, fd);
      }

      // Step C: Validate Stock and Compute Subtotal
      let subtotal = 0;
      const verifiedLineItems: any[] = [];

      for (const item of requestedItems) {
        const variant = variantMap.get(item.variantId);
        if (!variant) {
          throw new Error(`Variant ${item.variantId} is invalid, inactive, or discontinued`);
        }

        const availableStock = Number(variant.stock_quantity);
        if (availableStock < item.quantity) {
          throw new Error(
            `Insufficient stock for '${variant.product_name} (${variant.variant_name})'. Available: ${availableStock}, Requested: ${item.quantity}`
          );
        }

        const originalPrice = Number(variant.price);
        let unitPrice = variant.sale_price != null ? Number(variant.sale_price) : originalPrice;

        // Flash Deal Check
        const flashItem = flashMap.get(variant.variant_id);
        if (flashItem) {
          const remainingFlash = flashItem.allocated_stock - flashItem.sold_stock;
          if (remainingFlash >= item.quantity) {
            unitPrice = Math.min(unitPrice, Number(flashItem.deal_price));
            // Increment sold stock on flash deal
            await trx('flash_deal_items')
              .where({ id: flashItem.flash_item_id })
              .update({
                sold_stock: flashItem.sold_stock + item.quantity,
                updated_at: trx.fn.now(),
              });
          }
        }

        const totalPrice = Math.round(unitPrice * item.quantity * 100) / 100;
        subtotal += totalPrice;

        verifiedLineItems.push({
          id: crypto.randomUUID(),
          order_id: orderId,
          product_id: variant.product_id,
          variant_id: variant.variant_id,
          product_name: variant.product_name,
          variant_name: variant.variant_name,
          sku: variant.sku,
          unit_price: unitPrice,
          quantity: item.quantity,
          total_price: totalPrice,
          previous_stock: availableStock,
          new_stock: availableStock - item.quantity,
        });
      }

      subtotal = Math.round(subtotal * 100) / 100;

      // Step D: Delivery Fee & Free Shipping Settings
      const settingsRows = await trx('business_settings').whereIn('key', [
        'delivery_fee_standard',
        'free_shipping_threshold',
        'tax_percentage',
        'currency',
      ]);
      const settingsMap = new Map<string, string>();
      for (const s of settingsRows) {
        settingsMap.set(s.key, s.value);
      }

      const standardDeliveryFee = Number(settingsMap.get('delivery_fee_standard') || 60);
      const freeShippingThreshold = Number(settingsMap.get('free_shipping_threshold') || 1000);
      const taxPercentage = Number(settingsMap.get('tax_percentage') || 0);
      const currency = settingsMap.get('currency') || 'BDT';

      let deliveryFee = subtotal >= freeShippingThreshold ? 0 : standardDeliveryFee;

      // Step E: Coupon Validation
      let discountAmount = 0;
      let couponId: string | null = null;
      let couponCode: string | null = null;

      if (input.couponCode) {
        const coupon = await trx('coupons').where({ code: input.couponCode.toUpperCase() }).forUpdate().first();
        if (!coupon || !coupon.is_active) {
          throw new Error(`Coupon '${input.couponCode}' is invalid or expired`);
        }

        if (subtotal < Number(coupon.min_order_amount)) {
          throw new Error(
            `Coupon '${coupon.code}' requires minimum order amount of ৳${coupon.min_order_amount}`
          );
        }

        const userUsages = (await trx('coupon_usages')
          .where({ coupon_id: coupon.id, user_id: userId })
          .count('id as count')
          .first()) as any;
        if (Number(userUsages?.count || 0) >= coupon.usage_limit_per_user) {
          throw new Error(`You have reached the limit for coupon '${coupon.code}'`);
        }

        const discType = coupon.discount_type as CouponDiscountType;
        const discVal = Number(coupon.discount_value);

        if (discType === CouponDiscountType.PERCENTAGE) {
          discountAmount = (subtotal * discVal) / 100;
          if (coupon.max_discount_amount != null) {
            discountAmount = Math.min(discountAmount, Number(coupon.max_discount_amount));
          }
        } else if (discType === CouponDiscountType.FIXED_AMOUNT) {
          discountAmount = Math.min(discVal, subtotal);
        } else if (discType === CouponDiscountType.FREE_SHIPPING) {
          discountAmount = deliveryFee;
          deliveryFee = 0;
        }

        discountAmount = Math.round(discountAmount * 100) / 100;
        couponId = coupon.id;
        couponCode = coupon.code;

        // Increment coupon count
        await trx('coupons').where({ id: coupon.id }).increment('used_count', 1);

        // Record coupon usage
        await trx('coupon_usages').insert({
          id: crypto.randomUUID(),
          coupon_id: coupon.id,
          user_id: userId,
          order_id: orderId,
          discount_amount: discountAmount,
          used_at: trx.fn.now(),
        });
      }

      // Step F: Tax & Grand Total
      const taxableAmount = Math.max(0, subtotal - discountAmount);
      const taxAmount = Math.round(((taxableAmount * taxPercentage) / 100) * 100) / 100;
      const grandTotal = Math.max(0, Math.round((subtotal - discountAmount + deliveryFee + taxAmount) * 100) / 100);

      // Estimated delivery date (Next day in Dhaka)
      const deliveryDate = new Date();
      deliveryDate.setDate(deliveryDate.getDate() + 1);

      // Step G: Insert Order Record
      const [order] = await trx('orders')
        .insert({
          id: orderId,
          order_number: orderNumber,
          tracking_number: trackingNumber,
          user_id: userId,
          status: OrderStatus.PENDING,
          payment_status: PaymentStatus.PENDING,
          payment_method: input.paymentMethod || PaymentMethod.COD,
          subtotal,
          discount_amount: discountAmount,
          coupon_id: couponId,
          coupon_code: couponCode,
          delivery_fee: deliveryFee,
          tax_amount: taxAmount,
          grand_total: grandTotal,
          currency,
          shipping_address_id: shippingAddressId,
          shipping_address_snapshot: JSON.stringify(addressSnapshot),
          customer_notes: input.customerNotes || null,
          delivery_slot: input.deliverySlot || 'Standard Delivery (9 AM - 6 PM)',
          delivery_date: deliveryDate.toISOString().split('T')[0],
        })
        .returning('*');

      // Step H: Insert Order Items
      for (const item of verifiedLineItems) {
        await trx('order_items').insert({
          id: item.id,
          order_id: item.order_id,
          product_id: item.product_id,
          variant_id: item.variant_id,
          product_name: item.product_name,
          variant_name: item.variant_name,
          sku: item.sku,
          unit_price: item.unit_price,
          quantity: item.quantity,
          total_price: item.total_price,
        });

        // Step I: Deduct Variant Stock & Record Immutable Ledger
        await trx('product_variants')
          .where({ id: item.variant_id })
          .update({
            stock_quantity: item.new_stock,
            updated_at: trx.fn.now(),
          });

        await trx('inventory_transactions').insert({
          id: crypto.randomUUID(),
          product_id: item.product_id,
          variant_id: item.variant_id,
          transaction_type: 'STOCK_OUT',
          quantity_changed: -item.quantity,
          previous_stock: item.previous_stock,
          new_stock: item.new_stock,
          reason: `Customer Order Placement: ${orderNumber}`,
          reference_id: orderNumber,
          performed_by: userId,
          created_at: trx.fn.now(),
        });
      }

      // Step J: Record Status History
      await trx('order_status_history').insert({
        id: crypto.randomUUID(),
        order_id: orderId,
        status: OrderStatus.PENDING,
        comment: 'Order placed by customer via Liton Brothers portal',
        changed_by: userId,
        created_at: trx.fn.now(),
      });

      // Step K: Payment Gateway Strategy
      const gateway = PaymentGatewayFactory.getGateway(input.paymentMethod || PaymentMethod.COD);
      const paymentResult = await gateway.initiatePayment(order || { order_number: orderNumber, grand_total: grandTotal, currency });

      await trx('payments').insert({
        id: paymentResult.paymentId,
        order_id: orderId,
        payment_method: input.paymentMethod || PaymentMethod.COD,
        amount: grandTotal,
        currency,
        status: paymentResult.status,
        transaction_id: paymentResult.transactionId || null,
        gateway_response: JSON.stringify(paymentResult),
      });

      // Step L: Clear Cart if placed from cart
      if (isFromCart && cartIdToClear) {
        await trx('cart_items').where({ cart_id: cartIdToClear }).delete();
      }

      return {
        order: {
          id: orderId,
          orderNumber,
          trackingNumber,
          status: OrderStatus.PENDING,
          paymentStatus: paymentResult.status,
          paymentMethod: input.paymentMethod || PaymentMethod.COD,
          subtotal,
          discountAmount,
          deliveryFee,
          grandTotal,
          currency,
          shippingAddress: addressSnapshot,
          itemCount: verifiedLineItems.length,
          estimatedDeliveryDate: deliveryDate.toISOString().split('T')[0],
          createdAt: now.toISOString(),
        },
        payment: paymentResult,
        items: verifiedLineItems.map((i) => ({
          productName: i.product_name,
          variantName: i.variant_name,
          sku: i.sku,
          unitPrice: i.unit_price,
          quantity: i.quantity,
          totalPrice: i.total_price,
        })),
      };
    });
  }

  /**
   * Customer: Order History
   */
  async listCustomerOrders(userId: string, page: number = 1, limit: number = 10) {
    const db = getDb();
    const offset = (page - 1) * limit;

    const countResult = await db('orders')
      .where({ user_id: userId })
      .count<{ count: string | number }>('id as count')
      .first();
    const total = Number(countResult?.count || 0);

    const orders = await db('orders')
      .where({ user_id: userId })
      .orderBy('created_at', 'desc')
      .limit(limit)
      .offset(offset);

    const formattedOrders = [];
    for (const o of orders) {
      const items = await db('order_items').where({ order_id: o.id });
      let address = null;
      try {
        address = JSON.parse(o.shipping_address_snapshot);
      } catch {
        address = o.shipping_address_snapshot;
      }

      formattedOrders.push({
        id: o.id,
        orderNumber: o.order_number,
        trackingNumber: o.tracking_number,
        status: o.status,
        paymentStatus: o.payment_status,
        paymentMethod: o.payment_method,
        subtotal: Number(o.subtotal),
        discountAmount: Number(o.discount_amount),
        deliveryFee: Number(o.delivery_fee),
        grandTotal: Number(o.grand_total),
        currency: o.currency,
        itemCount: items.length,
        shippingAddress: address,
        deliveryDate: o.delivery_date,
        createdAt: o.created_at,
      });
    }

    return {
      orders: formattedOrders,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Customer / Admin: Order Detail
   */
  async getOrderById(orderId: string, userId?: string) {
    const db = getDb();
    let query = db('orders').where({ id: orderId });
    if (userId) {
      query = query.where({ user_id: userId });
    }

    const order = await query.first();
    if (!order) {
      throw new Error('Order not found');
    }

    const items = await db('order_items').where({ order_id: order.id });
    const history = await db('order_status_history')
      .where({ order_id: order.id })
      .orderBy('created_at', 'asc');
    const payments = await db('payments').where({ order_id: order.id }).orderBy('created_at', 'desc');

    let address = null;
    try {
      address = JSON.parse(order.shipping_address_snapshot);
    } catch {
      address = order.shipping_address_snapshot;
    }

    return {
      id: order.id,
      orderNumber: order.order_number,
      trackingNumber: order.tracking_number,
      userId: order.user_id,
      status: order.status,
      paymentStatus: order.payment_status,
      paymentMethod: order.payment_method,
      subtotal: Number(order.subtotal),
      discountAmount: Number(order.discount_amount),
      couponCode: order.coupon_code,
      deliveryFee: Number(order.delivery_fee),
      taxAmount: Number(order.tax_amount),
      grandTotal: Number(order.grand_total),
      currency: order.currency,
      shippingAddress: address,
      customerNotes: order.customer_notes,
      adminNotes: order.admin_notes,
      deliverySlot: order.delivery_slot,
      deliveryDate: order.delivery_date,
      cancelledReason: order.cancelled_reason,
      items: items.map((i) => ({
        id: i.id,
        productId: i.product_id,
        variantId: i.variant_id,
        productName: i.product_name,
        variantName: i.variant_name,
        sku: i.sku,
        unitPrice: Number(i.unit_price),
        quantity: Number(i.quantity),
        totalPrice: Number(i.total_price),
      })),
      statusHistory: history,
      payments,
      createdAt: order.created_at,
      updatedAt: order.updated_at,
    };
  }

  /**
   * Cancel Order & Atomic Stock Restock
   */
  async cancelOrder(orderId: string, userId: string, reason: string, isAdmin: boolean = false) {
    const db = getDb();

    return await db.transaction(async (trx: any) => {
      let query = trx('orders').where({ id: orderId }).forUpdate();
      if (!isAdmin) {
        query = query.where({ user_id: userId });
      }

      const order = await query.first();
      if (!order) {
        throw new Error('Order not found');
      }

      if (order.status === OrderStatus.CANCELLED) {
        throw new Error('Order is already cancelled');
      }

      // Customers can only cancel PENDING or CONFIRMED orders
      if (!isAdmin && ![OrderStatus.PENDING, OrderStatus.CONFIRMED].includes(order.status)) {
        throw new Error(
          `Cannot cancel order in status '${order.status}'. Please contact customer support.`
        );
      }

      const orderItems = await trx('order_items').where({ order_id: order.id });

      // Revert variant stock
      for (const item of orderItems) {
        const variant = await trx('product_variants').where({ id: item.variant_id }).forUpdate().first();
        if (variant) {
          const previousStock = Number(variant.stock_quantity);
          const newStock = previousStock + Number(item.quantity);

          await trx('product_variants')
            .where({ id: variant.id })
            .update({
              stock_quantity: newStock,
              updated_at: trx.fn.now(),
            });

          await trx('inventory_transactions').insert({
            id: crypto.randomUUID(),
            product_id: item.product_id,
            variant_id: item.variant_id,
            transaction_type: 'STOCK_IN',
            quantity_changed: item.quantity,
            previous_stock: previousStock,
            new_stock: newStock,
            reason: `Order Cancellation Restock: ${order.order_number}`,
            reference_id: order.order_number,
            performed_by: userId,
            created_at: trx.fn.now(),
          });
        }
      }

      // Update Order Status
      await trx('orders')
        .where({ id: order.id })
        .update({
          status: OrderStatus.CANCELLED,
          cancelled_reason: reason,
          cancelled_at: trx.fn.now(),
          updated_at: trx.fn.now(),
        });

      // Record in status history
      await trx('order_status_history').insert({
        id: crypto.randomUUID(),
        order_id: order.id,
        status: OrderStatus.CANCELLED,
        comment: `Order cancelled by ${isAdmin ? 'Admin' : 'Customer'}: ${reason}`,
        changed_by: userId,
        created_at: trx.fn.now(),
      });

      return {
        success: true,
        orderNumber: order.order_number,
        status: OrderStatus.CANCELLED,
        message: 'Order cancelled successfully and inventory returned to warehouse.',
      };
    });
  }

  /**
   * Public Order Tracking Progress
   */
  async trackOrderByNumber(trackingNumber: string): Promise<OrderTrackingDto> {
    const db = getDb();

    const order = await db('orders')
      .where({ tracking_number: trackingNumber.trim() })
      .orWhere({ order_number: trackingNumber.trim() })
      .first();

    if (!order) {
      throw new Error(`Order with tracking number '${trackingNumber}' not found`);
    }

    const history = await db('order_status_history')
      .where({ order_id: order.id })
      .orderBy('created_at', 'asc');

    const historyMap = new Map<string, string>();
    for (const h of history) {
      historyMap.set(h.status, h.created_at);
    }

    const flow: { status: OrderStatus; title: string; description: string }[] = [
      { status: OrderStatus.PENDING, title: 'Order Placed', description: 'Order submitted and registered in system' },
      { status: OrderStatus.CONFIRMED, title: 'Order Confirmed', description: 'Order verified by Liton Brothers store operations' },
      { status: OrderStatus.PROCESSING, title: 'Packaging & Quality Check', description: 'Items sorted and packed from Dhaka central warehouse' },
      { status: OrderStatus.SHIPPED, title: 'Dispatched for Delivery', description: 'Handed over to delivery courier / rider team' },
      { status: OrderStatus.OUT_FOR_DELIVERY, title: 'Out for Doorstep Delivery', description: 'Courier rider is en route to your address' },
      { status: OrderStatus.DELIVERED, title: 'Delivered', description: 'Order package successfully handed over' },
    ];

    const currentStatusIndex = flow.findIndex((f) => f.status === order.status);

    const timeline = flow.map((step, idx) => {
      const isCompleted = order.status === OrderStatus.CANCELLED
        ? step.status === OrderStatus.PENDING
        : currentStatusIndex >= idx;

      return {
        status: step.status,
        title: step.title,
        description: step.description,
        completed: isCompleted,
        timestamp: historyMap.get(step.status) || null,
      };
    });

    let deliveryAddress = null;
    try {
      deliveryAddress = JSON.parse(order.shipping_address_snapshot || '{}');
    } catch {
      deliveryAddress = null;
    }

    return {
      orderNumber: order.order_number,
      trackingNumber: order.tracking_number,
      status: order.status as OrderStatus,
      statusLabel: order.status.replace(/_/g, ' '),
      paymentMethod: order.payment_method,
      paymentStatus: order.payment_status,
      grandTotal: Number(order.grand_total),
      currency: order.currency,
      estimatedDeliveryDate: order.delivery_date,
      deliverySlot: order.delivery_slot,
      deliveryAddress,
      timeline,
      statusHistory: history.map((h: any) => ({
        status: h.status,
        comment: h.comment,
        createdAt: h.created_at,
      })),
    };
  }

  /**
   * Admin: List All Orders with Filters
   */
  async listAdminOrders(query: {
    search?: string;
    status?: string;
    paymentStatus?: string;
    page?: number;
    limit?: number;
  }) {
    const db = getDb();
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 20;
    const offset = (page - 1) * limit;

    let baseQuery = db('orders')
      .join('users', 'orders.user_id', 'users.id');

    if (query.search) {
      baseQuery = baseQuery.where((builder: any) => {
        builder
          .whereILike('orders.order_number', `%${query.search}%`)
          .orWhereILike('orders.tracking_number', `%${query.search}%`)
          .orWhereILike('users.phone', `%${query.search}%`)
          .orWhereILike('users.full_name', `%${query.search}%`);
      });
    }

    if (query.status) {
      baseQuery = baseQuery.where('orders.status', query.status);
    }

    if (query.paymentStatus) {
      baseQuery = baseQuery.where('orders.payment_status', query.paymentStatus);
    }

    const countResult = (await baseQuery.clone().count('orders.id as count').first()) as any;
    const total = Number(countResult?.count || 0);

    const orders = await baseQuery
      .clone()
      .select('orders.*', 'users.full_name as customer_name', 'users.phone as customer_phone')
      .orderBy('orders.created_at', 'desc')
      .limit(limit)
      .offset(offset);

    const formatted = [];
    for (const o of orders) {
      const itemsCount = await db('order_items')
        .where({ order_id: o.id })
        .count<{ count: string | number }>('id as count')
        .first();

      formatted.push({
        id: o.id,
        orderNumber: o.order_number,
        trackingNumber: o.tracking_number,
        customerName: o.customer_name,
        customerPhone: o.customer_phone,
        status: o.status,
        paymentStatus: o.payment_status,
        paymentMethod: o.payment_method,
        subtotal: Number(o.subtotal),
        discountAmount: Number(o.discount_amount),
        deliveryFee: Number(o.delivery_fee),
        grandTotal: Number(o.grand_total),
        itemCount: Number(itemsCount?.count || 0),
        deliverySlot: o.delivery_slot,
        deliveryDate: o.delivery_date,
        createdAt: o.created_at,
      });
    }

    return {
      orders: formatted,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Admin: Transition Order Status
   */
  async updateOrderStatus(orderId: string, newStatus: OrderStatus, changedBy: string, comment?: string) {
    const db = getDb();

    const order = await db('orders').where({ id: orderId }).first();
    if (!order) {
      throw new Error('Order not found');
    }

    const updateData: any = {
      status: newStatus,
      updated_at: db.fn.now(),
    };

    if (newStatus === OrderStatus.DELIVERED) {
      updateData.delivered_at = db.fn.now();
      // If payment was COD, automatically mark as PAID
      if (order.payment_method === PaymentMethod.COD && order.payment_status !== PaymentStatus.PAID) {
        updateData.payment_status = PaymentStatus.PAID;
        await db('payments').where({ order_id: order.id }).update({
          status: PaymentStatus.PAID,
          paid_at: db.fn.now(),
          updated_at: db.fn.now(),
        });
      }
    }

    await db('orders').where({ id: orderId }).update(updateData);

    await db('order_status_history').insert({
      id: crypto.randomUUID(),
      order_id: orderId,
      status: newStatus,
      comment: comment || `Order status transitioned to ${newStatus}`,
      changed_by: changedBy,
      created_at: db.fn.now(),
    });

    return this.getOrderById(orderId);
  }

  /**
   * Admin: Update Payment Status
   */
  async updatePaymentStatus(
    orderId: string,
    paymentStatus: PaymentStatus,
    transactionId?: string,
    comment?: string
  ) {
    const db = getDb();

    const order = await db('orders').where({ id: orderId }).first();
    if (!order) {
      throw new Error('Order not found');
    }

    await db('orders').where({ id: orderId }).update({
      payment_status: paymentStatus,
      updated_at: db.fn.now(),
    });

    const paymentUpdate: any = {
      status: paymentStatus,
      updated_at: db.fn.now(),
    };
    if (transactionId) {
      paymentUpdate.transaction_id = transactionId;
    }
    if (paymentStatus === PaymentStatus.PAID) {
      paymentUpdate.paid_at = db.fn.now();
    }

    await db('payments').where({ order_id: orderId }).update(paymentUpdate);

    return this.getOrderById(orderId);
  }

  /**
   * Admin / Customer: Printable Invoice Data
   */
  async getOrderInvoice(orderId: string) {
    const db = getDb();
    const order = await db('orders')
      .join('users', 'orders.user_id', 'users.id')
      .where({ 'orders.id': orderId })
      .select('orders.*', 'users.full_name as customer_name', 'users.phone as customer_phone', 'users.email as customer_email')
      .first();

    if (!order) {
      throw new Error('Order not found');
    }

    const items = await db('order_items').where({ order_id: order.id });
    let address = null;
    try {
      address = JSON.parse(order.shipping_address_snapshot);
    } catch {
      address = order.shipping_address_snapshot;
    }

    const settings = await db('business_settings').select('*');
    const settingsMap = new Map<string, string>();
    for (const s of settings) {
      settingsMap.set(s.key, s.value);
    }

    return {
      company: {
        name: settingsMap.get('site_name') || 'Liton Brothers Grocery & FMCG',
        address: 'Kawran Bazar, Dhaka-1215, Bangladesh',
        phone: '+880 1700-000000',
        email: 'support@litonbrothers.com',
        bin: 'BIN-1234567890',
      },
      invoice: {
        invoiceNumber: `INV-${order.order_number}`,
        orderNumber: order.order_number,
        trackingNumber: order.tracking_number,
        date: order.created_at,
        status: order.status,
        paymentStatus: order.payment_status,
        paymentMethod: order.payment_method,
      },
      customer: {
        name: order.customer_name,
        phone: order.customer_phone,
        email: order.customer_email,
        shippingAddress: address,
      },
      items: items.map((i) => ({
        productName: i.product_name,
        variantName: i.variant_name,
        sku: i.sku,
        unitPrice: Number(i.unit_price),
        quantity: Number(i.quantity),
        totalPrice: Number(i.total_price),
      })),
      totals: {
        subtotal: Number(order.subtotal),
        discountAmount: Number(order.discount_amount),
        couponCode: order.coupon_code,
        deliveryFee: Number(order.delivery_fee),
        taxAmount: Number(order.tax_amount),
        grandTotal: Number(order.grand_total),
        currency: order.currency,
      },
    };
  }
}

export const ordersService = new OrdersService();
