import crypto from 'crypto';
import { getDatabase } from '../../database/index.js';
import { AppError } from '../../common/middleware/error-handler.js';
import { StockAdjustmentDto, InventoryQueryDto, AcknowledgeAlertDto } from './inventory.dto.js';

export class InventoryService {
  async adjustStock(dto: StockAdjustmentDto, adminId?: string) {
    const db = getDatabase();

    const product = await db('products').where({ id: dto.productId }).first();
    if (!product) {
      throw new AppError('Product not found', 404, 'PRODUCT_NOT_FOUND');
    }

    let variant = null;
    if (dto.variantId) {
      variant = await db('product_variants')
        .where({ id: dto.variantId, product_id: dto.productId })
        .first();
      if (!variant) {
        throw new AppError('Product variant not found', 404, 'VARIANT_NOT_FOUND');
      }
    }

    const previousStock = variant ? Number(variant.stock_quantity) : Number(product.stock_quantity);
    let newStock = previousStock;

    if (dto.transactionType === 'STOCK_IN') {
      newStock = previousStock + dto.quantity;
    } else if (dto.transactionType === 'STOCK_OUT') {
      if (previousStock < dto.quantity) {
        throw new AppError(
          `Insufficient stock to remove ${dto.quantity}. Current stock is ${previousStock}`,
          400,
          'INSUFFICIENT_STOCK'
        );
      }
      newStock = previousStock - dto.quantity;
    } else if (dto.transactionType === 'ADJUSTMENT') {
      newStock = dto.quantity;
    }

    const transactionId = crypto.randomUUID();

    await db.transaction(async (trx) => {
      // 1. Update variant if specified
      if (variant) {
        await trx('product_variants')
          .where({ id: variant.id })
          .update({ stock_quantity: newStock, updated_at: db.fn.now() });

        // Update overall product stock as sum of active variants
        const sumResult = await trx('product_variants')
          .where({ product_id: dto.productId, is_active: true })
          .sum<{ total: string | number }>('stock_quantity as total')
          .first();

        const totalStock = Number(sumResult?.total || 0);
        await trx('products')
          .where({ id: dto.productId })
          .update({ stock_quantity: totalStock, updated_at: db.fn.now() });
      } else {
        await trx('products')
          .where({ id: dto.productId })
          .update({ stock_quantity: newStock, updated_at: db.fn.now() });
      }

      // 2. Insert into immutable inventory_transactions ledger
      await trx('inventory_transactions').insert({
        id: transactionId,
        product_id: dto.productId,
        variant_id: dto.variantId || null,
        transaction_type: dto.transactionType,
        quantity_changed: dto.quantity,
        previous_stock: previousStock,
        new_stock: newStock,
        reason: dto.reason,
        reference_id: dto.referenceId || null,
        performed_by: adminId || null,
      });

      // 3. Record Audit Log
      await trx('audit_logs').insert({
        id: crypto.randomUUID(),
        user_id: adminId || null,
        action: `INVENTORY_${dto.transactionType}`,
        entity_name: 'inventory_transactions',
        entity_id: transactionId,
        old_value: JSON.stringify({ stock: previousStock }),
        new_value: JSON.stringify({ stock: newStock, reason: dto.reason }),
      });
    });

    return db('inventory_transactions').where({ id: transactionId }).first();
  }

  async listTransactions(query: InventoryQueryDto) {
    const db = getDatabase();
    const { productId, transactionType, page, limit } = query;
    const offset = (page - 1) * limit;

    let baseQuery = db('inventory_transactions')
      .leftJoin('products', 'inventory_transactions.product_id', 'products.id')
      .leftJoin('product_variants', 'inventory_transactions.variant_id', 'product_variants.id')
      .leftJoin('users', 'inventory_transactions.performed_by', 'users.id');

    if (productId) {
      baseQuery = baseQuery.where('inventory_transactions.product_id', productId);
    }

    if (transactionType) {
      baseQuery = baseQuery.where('inventory_transactions.transaction_type', transactionType);
    }

    const countRes = await baseQuery
      .clone()
      .count<{ count: string | number }>('inventory_transactions.id as count')
      .first();
    const total = Number(countRes?.count || 0);

    const transactions = await baseQuery
      .clone()
      .select(
        'inventory_transactions.*',
        'products.name as product_name',
        'products.sku as product_sku',
        'product_variants.display_name as variant_name',
        'product_variants.sku as variant_sku',
        'users.full_name as performed_by_name'
      )
      .orderBy('inventory_transactions.created_at', 'desc')
      .orderBy('inventory_transactions.id', 'desc')
      .limit(limit)
      .offset(offset);

    return {
      transactions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  async getAlerts() {
    const db = getDatabase();

    // Out of stock products
    const outOfStockProducts = await db('products')
      .where('status', 'ACTIVE')
      .whereNull('deleted_at')
      .where('stock_quantity', '<=', 0)
      .select('id', 'name', 'sku', 'stock_quantity', 'low_stock_threshold', 'thumbnail_url');

    // Low stock products (stock > 0 and stock <= low_stock_threshold)
    const lowStockProducts = await db('products')
      .where('status', 'ACTIVE')
      .whereNull('deleted_at')
      .where('stock_quantity', '>', 0)
      .whereRaw('stock_quantity <= low_stock_threshold')
      .select('id', 'name', 'sku', 'stock_quantity', 'low_stock_threshold', 'thumbnail_url');

    // Variants with zero or low stock
    const lowStockVariants = await db('product_variants')
      .join('products', 'product_variants.product_id', 'products.id')
      .where('product_variants.is_active', true)
      .where('products.status', 'ACTIVE')
      .where('product_variants.stock_quantity', '<=', 5)
      .select(
        'product_variants.id as variant_id',
        'product_variants.display_name',
        'product_variants.sku as variant_sku',
        'product_variants.stock_quantity',
        'products.name as product_name',
        'products.id as product_id'
      );

    // Fetch acknowledgments
    const acks = await db('inventory_alert_acknowledgments')
      .leftJoin('users', 'inventory_alert_acknowledgments.acknowledged_by', 'users.id')
      .select(
        'inventory_alert_acknowledgments.*',
        'users.full_name as acknowledged_by_name'
      );

    const ackMap = new Map<string, any>();
    for (const ack of acks) {
      const key = `${ack.product_id}_${ack.variant_id || 'base'}_${ack.alert_type}`;
      ackMap.set(key, ack);
    }

    const decorateProduct = (p: any, alertType: 'LOW_STOCK' | 'OUT_OF_STOCK') => {
      const ack = ackMap.get(`${p.id}_base_${alertType}`);
      return {
        ...p,
        alertType,
        acknowledged: !!ack,
        acknowledgedAt: ack?.acknowledged_at || null,
        acknowledgedNote: ack?.note || null,
        acknowledgedByName: ack?.acknowledged_by_name || null,
      };
    };

    const decoratedOutOfStock = outOfStockProducts.map((p) => decorateProduct(p, 'OUT_OF_STOCK'));
    const decoratedLowStock = lowStockProducts.map((p) => decorateProduct(p, 'LOW_STOCK'));

    const decoratedVariants = lowStockVariants.map((v) => {
      const alertType = v.stock_quantity <= 0 ? 'OUT_OF_STOCK' : 'LOW_STOCK';
      const ack = ackMap.get(`${v.product_id}_${v.variant_id}_${alertType}`);
      return {
        ...v,
        alertType,
        acknowledged: !!ack,
        acknowledgedAt: ack?.acknowledged_at || null,
        acknowledgedNote: ack?.note || null,
        acknowledgedByName: ack?.acknowledged_by_name || null,
      };
    });

    return {
      outOfStockCount: outOfStockProducts.length,
      lowStockCount: lowStockProducts.length,
      outOfStockProducts: decoratedOutOfStock,
      lowStockProducts: decoratedLowStock,
      lowStockVariants: decoratedVariants,
    };
  }

  async acknowledgeAlert(dto: AcknowledgeAlertDto, adminId?: string) {
    const db = getDatabase();
    const ackId = crypto.randomUUID();

    await db.transaction(async (trx) => {
      // Remove any previous acknowledgement for same item & type if re-acknowledging
      let deleteQuery = trx('inventory_alert_acknowledgments')
        .where({ product_id: dto.productId, alert_type: dto.alertType });
      if (dto.variantId) {
        deleteQuery = deleteQuery.where({ variant_id: dto.variantId });
      } else {
        deleteQuery = deleteQuery.whereNull('variant_id');
      }
      await deleteQuery.delete();

      await trx('inventory_alert_acknowledgments').insert({
        id: ackId,
        product_id: dto.productId,
        variant_id: dto.variantId || null,
        alert_type: dto.alertType,
        note: dto.note || 'Alert reviewed and acknowledged by store staff',
        acknowledged_by: adminId || null,
        acknowledged_at: db.fn.now(),
      });

      await trx('audit_logs').insert({
        id: crypto.randomUUID(),
        user_id: adminId || null,
        action: 'INVENTORY_ALERT_ACKNOWLEDGED',
        entity_name: 'inventory_alert_acknowledgments',
        entity_id: ackId,
        new_value: JSON.stringify({
          productId: dto.productId,
          variantId: dto.variantId || null,
          alertType: dto.alertType,
          note: dto.note || null,
        }),
      });
    });

    return { success: true, acknowledgmentId: ackId };
  }
}
