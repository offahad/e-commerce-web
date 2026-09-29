import crypto from 'crypto';
import { getDb } from '../../database/index.js';
import { CreateFlashDealInput, UpdateFlashDealStatusInput } from './deals.dto.js';

export class DealsService {
  /**
   * Get currently active Friday Flash Deal campaign with countdown timer & live inventory
   */
  async getActiveFridayFlashDeal() {
    const db = getDb();
    const now = new Date();

    const campaign = await db('flash_deals')
      .where('is_active', true)
      .where('status', 'ACTIVE')
      .where('start_time', '<=', now)
      .where('end_time', '>=', now)
      .orderBy('start_time', 'desc')
      .first();

    if (!campaign) {
      return null;
    }

    const items = await db('flash_deal_items')
      .join('products', 'flash_deal_items.product_id', 'products.id')
      .join('product_variants', 'flash_deal_items.variant_id', 'product_variants.id')
      .leftJoin('brands', 'products.brand_id', 'brands.id')
      .where({ 'flash_deal_items.flash_deal_id': campaign.id })
      .select(
        'flash_deal_items.id as deal_item_id',
        'flash_deal_items.deal_price',
        'flash_deal_items.allocated_stock',
        'flash_deal_items.sold_stock',
        'flash_deal_items.max_per_customer',
        'products.id as product_id',
        'products.name as product_name',
        'products.slug as product_slug',
        'products.base_price',
        'brands.name as brand_name',
        'product_variants.id as variant_id',
        'product_variants.display_name as variant_name',
        'product_variants.sku',
        'product_variants.price as original_price',
        'product_variants.stock_quantity as warehouse_stock'
      );

    const formattedItems = [];
    for (const item of items) {
      const primaryImage = await db('product_images')
        .where({ product_id: item.product_id, is_thumbnail: true })
        .first();

      const originalPrice = Number(item.original_price);
      const dealPrice = Number(item.deal_price);
      const discountPercentage = Math.round(((originalPrice - dealPrice) / originalPrice) * 100);
      const remainingStock = Math.max(0, item.allocated_stock - item.sold_stock);
      const soldPercentage = Math.min(100, Math.round((item.sold_stock / item.allocated_stock) * 100));

      formattedItems.push({
        dealItemId: item.deal_item_id,
        productId: item.product_id,
        productName: item.product_name,
        productSlug: item.product_slug,
        brandName: item.brand_name,
        variantId: item.variant_id,
        variantName: item.variant_name,
        sku: item.sku,
        originalPrice,
        dealPrice,
        discountPercentage,
        allocatedStock: item.allocatedStock,
        soldStock: item.sold_stock,
        remainingStock,
        soldPercentage,
        maxPerCustomer: item.max_per_customer,
        isSoldOut: remainingStock <= 0,
        imageUrl: primaryImage?.image_url || null,
      });
    }

    const endTime = new Date(campaign.end_time);
    const secondsRemaining = Math.max(0, Math.floor((endTime.getTime() - now.getTime()) / 1000));

    return {
      campaign: {
        id: campaign.id,
        title: campaign.title,
        slug: campaign.slug,
        description: campaign.description,
        bannerImage: campaign.banner_image,
        startTime: campaign.start_time,
        endTime: campaign.end_time,
        serverTime: now.toISOString(),
        secondsRemaining,
        status: campaign.status,
      },
      items: formattedItems,
    };
  }

  /**
   * Get Deals of the Day (regular products with sale discounts)
   */
  async getDealsOfTheDay(limit: number = 8) {
    const db = getDb();

    const variants = await db('product_variants')
      .join('products', 'product_variants.product_id', 'products.id')
      .leftJoin('brands', 'products.brand_id', 'brands.id')
      .where('products.status', 'ACTIVE')
      .where('product_variants.is_active', true)
      .whereNotNull('product_variants.sale_price')
      .whereRaw('product_variants.sale_price < product_variants.price')
      .where('product_variants.stock_quantity', '>', 0)
      .select(
        'product_variants.id as variant_id',
        'product_variants.display_name as variant_name',
        'product_variants.sku',
        'product_variants.price as original_price',
        'product_variants.sale_price',
        'product_variants.stock_quantity',
        'products.id as product_id',
        'products.name as product_name',
        'products.slug as product_slug',
        'brands.name as brand_name'
      )
      .orderByRaw('(product_variants.price - product_variants.sale_price) DESC')
      .limit(limit);

    const deals = [];
    for (const v of variants) {
      const primaryImage = await db('product_images')
        .where({ product_id: v.product_id, is_thumbnail: true })
        .first();

      const originalPrice = Number(v.original_price);
      const salePrice = Number(v.sale_price);
      const discountPercentage = Math.round(((originalPrice - salePrice) / originalPrice) * 100);

      deals.push({
        variantId: v.variant_id,
        productId: v.product_id,
        productName: v.product_name,
        productSlug: v.product_slug,
        variantName: v.variant_name,
        sku: v.sku,
        brandName: v.brand_name,
        originalPrice,
        salePrice,
        discountPercentage,
        stockQuantity: v.stock_quantity,
        imageUrl: primaryImage?.image_url || null,
      });
    }

    return deals;
  }

  /**
   * Admin: Create Flash Deal campaign
   */
  async createFlashDeal(input: CreateFlashDealInput) {
    const db = getDb();

    const slug =
      input.slug ||
      input.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');

    const existingSlug = await db('flash_deals').where({ slug }).first();
    if (existingSlug) {
      throw new Error(`Flash deal campaign with slug '${slug}' already exists`);
    }

    const campaignId = crypto.randomUUID();

    return await db.transaction(async (trx: any) => {
      const [campaign] = await trx('flash_deals')
        .insert({
          id: campaignId,
          title: input.title,
          slug,
          description: input.description || null,
          banner_image: input.bannerImage || null,
          start_time: new Date(input.startTime),
          end_time: new Date(input.endTime),
          status: 'ACTIVE',
          is_active: true,
        })
        .returning('*');

      for (const item of input.items) {
        const variant = await trx('product_variants').where({ id: item.variantId }).first();
        if (!variant) {
          throw new Error(`Variant ${item.variantId} not found`);
        }
        if (item.allocatedStock > variant.stock_quantity) {
          throw new Error(
            `Allocated stock (${item.allocatedStock}) cannot exceed warehouse stock (${variant.stock_quantity}) for ${variant.display_name}`
          );
        }

        await trx('flash_deal_items').insert({
          id: crypto.randomUUID(),
          flash_deal_id: campaignId,
          product_id: item.productId,
          variant_id: item.variantId,
          deal_price: item.dealPrice,
          allocated_stock: item.allocatedStock,
          sold_stock: 0,
          max_per_customer: item.maxPerCustomer || 2,
        });
      }

      return campaign || (await trx('flash_deals').where({ id: campaignId }).first());
    });
  }

  /**
   * Admin: List all Flash Deal campaigns
   */
  async listFlashDeals(page: number = 1, limit: number = 20) {
    const db = getDb();
    const offset = (page - 1) * limit;

    const countResult = await db('flash_deals').count<{ count: string | number }>('id as count').first();
    const total = Number(countResult?.count || 0);

    const campaigns = await db('flash_deals')
      .select('*')
      .orderBy('start_time', 'desc')
      .limit(limit)
      .offset(offset);

    return {
      campaigns,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Admin: Get Flash Deal campaign with all participating items
   */
  async getFlashDealById(id: string) {
    const db = getDb();
    const campaign = await db('flash_deals').where({ id }).first();
    if (!campaign) {
      throw new Error('Flash deal campaign not found');
    }

    const items = await db('flash_deal_items')
      .join('products', 'flash_deal_items.product_id', 'products.id')
      .join('product_variants', 'flash_deal_items.variant_id', 'product_variants.id')
      .where({ 'flash_deal_items.flash_deal_id': campaign.id })
      .select(
        'flash_deal_items.*',
        'products.name as product_name',
        'product_variants.display_name as variant_name',
        'product_variants.price as original_price'
      );

    return { ...campaign, items };
  }

  /**
   * Admin: Update Flash Deal status
   */
  async updateFlashDealStatus(id: string, input: UpdateFlashDealStatusInput) {
    const db = getDb();

    const campaign = await db('flash_deals').where({ id }).first();
    if (!campaign) {
      throw new Error('Flash deal campaign not found');
    }

    const updateData: any = {
      status: input.status,
      updated_at: db.fn.now(),
    };
    if (input.isActive !== undefined) {
      updateData.is_active = input.isActive;
    }

    await db('flash_deals').where({ id }).update(updateData);
    return this.getFlashDealById(id);
  }
}

export const dealsService = new DealsService();
