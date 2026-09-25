import crypto from 'crypto';
import { getDb } from '../../database/index.js';
import { CreateCouponInput, UpdateCouponInput } from './coupons.dto.js';
import { CouponDiscountType } from '../../common/types.js';

export interface CouponValidationResult {
  valid: boolean;
  code: string;
  discountType: CouponDiscountType;
  discountValue: number;
  discountAmount: number;
  message: string;
}

export class CouponsService {
  async listCoupons(query: { search?: string; isActive?: boolean; page?: number; limit?: number }) {
    const db = getDb();
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 20;
    const offset = (page - 1) * limit;

    let baseQuery = db('coupons');

    if (query.search) {
      baseQuery = baseQuery.where((builder: any) => {
        builder.whereILike('code', `%${query.search}%`).orWhereILike('title', `%${query.search}%`);
      });
    }

    if (query.isActive !== undefined) {
      baseQuery = baseQuery.where('is_active', query.isActive);
    }

    const countResult = await baseQuery.clone().count<{ count: string | number }>('id as count').first();
    const total = Number(countResult?.count || 0);

    const coupons = await baseQuery
      .clone()
      .select('*')
      .orderBy('created_at', 'desc')
      .limit(limit)
      .offset(offset);

    return {
      coupons,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getCouponById(id: string) {
    const db = getDb();
    const coupon = await db('coupons').where({ id }).first();
    if (!coupon) {
      throw new Error('Coupon not found');
    }
    return coupon;
  }

  async createCoupon(input: CreateCouponInput) {
    const db = getDb();

    const existing = await db('coupons').where({ code: input.code }).first();
    if (existing) {
      throw new Error(`Coupon with code '${input.code}' already exists`);
    }

    const id = crypto.randomUUID();
    const [coupon] = await db('coupons')
      .insert({
        id,
        code: input.code,
        title: input.title,
        description: input.description || null,
        discount_type: input.discountType,
        discount_value: input.discountValue,
        min_order_amount: input.minOrderAmount || 0,
        max_discount_amount: input.maxDiscountAmount || null,
        start_date: new Date(input.startDate),
        end_date: new Date(input.endDate),
        usage_limit_total: input.usageLimitTotal || null,
        usage_limit_per_user: input.usageLimitPerUser || 1,
        is_active: input.isActive ?? true,
      })
      .returning('*');

    return coupon || this.getCouponById(id);
  }

  async updateCoupon(id: string, input: UpdateCouponInput) {
    const db = getDb();

    const existing = await db('coupons').where({ id }).first();
    if (!existing) {
      throw new Error('Coupon not found');
    }

    if (input.code && input.code !== existing.code) {
      const duplicate = await db('coupons').where({ code: input.code }).whereNot({ id }).first();
      if (duplicate) {
        throw new Error(`Coupon with code '${input.code}' already exists`);
      }
    }

    const updateData: any = {
      updated_at: db.fn.now(),
    };

    if (input.code !== undefined) updateData.code = input.code;
    if (input.title !== undefined) updateData.title = input.title;
    if (input.description !== undefined) updateData.description = input.description;
    if (input.discountType !== undefined) updateData.discount_type = input.discountType;
    if (input.discountValue !== undefined) updateData.discount_value = input.discountValue;
    if (input.minOrderAmount !== undefined) updateData.min_order_amount = input.minOrderAmount;
    if (input.maxDiscountAmount !== undefined) updateData.max_discount_amount = input.maxDiscountAmount;
    if (input.startDate !== undefined) updateData.start_date = new Date(input.startDate);
    if (input.endDate !== undefined) updateData.end_date = new Date(input.endDate);
    if (input.usageLimitTotal !== undefined) updateData.usage_limit_total = input.usageLimitTotal;
    if (input.usageLimitPerUser !== undefined) updateData.usage_limit_per_user = input.usageLimitPerUser;
    if (input.isActive !== undefined) updateData.is_active = input.isActive;

    await db('coupons').where({ id }).update(updateData);
    return this.getCouponById(id);
  }

  async deleteCoupon(id: string) {
    const db = getDb();
    const count = await db('coupons').where({ id }).delete();
    if (!count) {
      throw new Error('Coupon not found');
    }
    return { success: true, message: 'Coupon deleted successfully' };
  }

  /**
   * Validate coupon code against subtotal and user eligibility
   */
  async validateCoupon(
    code: string,
    subtotal: number,
    userId?: string,
    deliveryFee: number = 60
  ): Promise<CouponValidationResult> {
    const db = getDb();
    const now = new Date();

    const coupon = await db('coupons').where({ code: code.toUpperCase() }).first();
    if (!coupon) {
      throw new Error(`Coupon code '${code}' is invalid`);
    }

    if (!coupon.is_active) {
      throw new Error(`Coupon code '${code}' is no longer active`);
    }

    const startDate = new Date(coupon.start_date);
    const endDate = new Date(coupon.end_date);

    if (now < startDate) {
      throw new Error(`Coupon code '${code}' is not yet valid`);
    }

    if (now > endDate) {
      throw new Error(`Coupon code '${code}' has expired`);
    }

    // Check total usage limit
    if (coupon.usage_limit_total && coupon.used_count >= coupon.usage_limit_total) {
      throw new Error(`Coupon code '${code}' has reached its maximum total usage limit`);
    }

    // Check per-user usage limit if user is authenticated
    if (userId) {
      const userUsageCount = await db('coupon_usages')
        .where({ coupon_id: coupon.id, user_id: userId })
        .count<{ count: string | number }>('id as count')
        .first();

      const userUsages = Number(userUsageCount?.count || 0);
      if (userUsages >= coupon.usage_limit_per_user) {
        throw new Error(`You have reached the usage limit for coupon '${code}' (${coupon.usage_limit_per_user} time(s))`);
      }
    }

    // Check minimum order amount
    if (subtotal < Number(coupon.min_order_amount)) {
      throw new Error(
        `Coupon '${code}' requires a minimum order amount of ৳${coupon.min_order_amount}. Current subtotal: ৳${subtotal}`
      );
    }

    // Calculate discount amount
    let discountAmount = 0;
    const discountType = coupon.discount_type as CouponDiscountType;
    const discountValue = Number(coupon.discount_value);

    if (discountType === CouponDiscountType.PERCENTAGE) {
      discountAmount = (subtotal * discountValue) / 100;
      if (coupon.max_discount_amount != null) {
        discountAmount = Math.min(discountAmount, Number(coupon.max_discount_amount));
      }
    } else if (discountType === CouponDiscountType.FIXED_AMOUNT) {
      discountAmount = Math.min(discountValue, subtotal);
    } else if (discountType === CouponDiscountType.FREE_SHIPPING) {
      discountAmount = deliveryFee;
    }

    discountAmount = Math.round(discountAmount * 100) / 100;

    return {
      valid: true,
      code: coupon.code,
      discountType,
      discountValue,
      discountAmount,
      message: `Coupon '${coupon.code}' applied: ৳${discountAmount} discount`,
    };
  }
}

export const couponsService = new CouponsService();
