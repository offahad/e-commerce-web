import knex, { Knex } from 'knex';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { config } from '../config/index.js';

let dbInstance: Knex;

export function getDatabase(): Knex {
  if (dbInstance) {
    return dbInstance;
  }

  if (config.DATABASE_URL) {
    dbInstance = knex({
      client: 'pg',
      connection: config.DATABASE_URL,
      pool: { min: 2, max: 20 },
    });
  } else {
    const { newDb } = require('pg-mem');
    const memDb = newDb();

    memDb.public.registerFunction({
      name: 'gen_random_uuid',
      implementation: () => crypto.randomUUID(),
    });

    dbInstance = memDb.adapters.createKnex();
  }

  return dbInstance;
}

export const db = getDatabase();

export function getDb(): Knex {
  return getDatabase();
}

export async function initDatabase(): Promise<void> {
  const database = getDatabase();

  // 1. Roles table
  const hasRoles = await database.schema.hasTable('roles');
  if (!hasRoles) {
    await database.schema.createTable('roles', (table) => {
      table.uuid('id').primary().defaultTo(database.fn.uuid());
      table.string('name', 50).unique().notNullable();
      table.string('description', 255);
      table.timestamps(true, true);
    });
  }

  // 2. Permissions table
  const hasPermissions = await database.schema.hasTable('permissions');
  if (!hasPermissions) {
    await database.schema.createTable('permissions', (table) => {
      table.uuid('id').primary().defaultTo(database.fn.uuid());
      table.string('code', 100).unique().notNullable();
      table.string('description', 255);
      table.timestamp('created_at').defaultTo(database.fn.now());
    });
  }

  // 3. Role Permissions table
  const hasRolePermissions = await database.schema.hasTable('role_permissions');
  if (!hasRolePermissions) {
    await database.schema.createTable('role_permissions', (table) => {
      table.uuid('id').primary().defaultTo(database.fn.uuid());
      table.uuid('role_id').references('id').inTable('roles').onDelete('CASCADE').notNullable();
      table.uuid('permission_id').references('id').inTable('permissions').onDelete('CASCADE').notNullable();
      table.unique(['role_id', 'permission_id']);
    });
  }

  // 4. Users table
  const hasUsers = await database.schema.hasTable('users');
  if (!hasUsers) {
    await database.schema.createTable('users', (table) => {
      table.uuid('id').primary().defaultTo(database.fn.uuid());
      table.string('full_name', 255).notNullable();
      table.string('phone', 20).unique().notNullable();
      table.string('password_hash', 255).notNullable();
      table.string('email', 255).unique().nullable();
      table.text('address').notNullable();
      table.string('status', 30).defaultTo('PENDING_APPROVAL').notNullable();
      table.string('role', 30).defaultTo('CUSTOMER').notNullable();
      table.string('refresh_token_hash', 255).nullable();
      table.timestamp('approved_at').nullable();
      table.uuid('approved_by').nullable();
      table.string('rejection_reason', 255).nullable();
      table.timestamp('last_login_at').nullable();
      table.timestamps(true, true);
      table.timestamp('deleted_at').nullable();
    });
  }

  // 5. Customer Addresses table
  const hasAddresses = await database.schema.hasTable('customer_addresses');
  if (!hasAddresses) {
    await database.schema.createTable('customer_addresses', (table) => {
      table.uuid('id').primary().defaultTo(database.fn.uuid());
      table.uuid('user_id').references('id').inTable('users').onDelete('CASCADE').notNullable();
      table.string('full_name', 255).notNullable();
      table.string('phone', 20).notNullable();
      table.text('address').notNullable();
      table.string('division', 100).defaultTo('Dhaka');
      table.string('district', 100).defaultTo('Dhaka');
      table.string('area', 100).nullable();
      table.string('postal_code', 20).nullable();
      table.string('address_type', 30).defaultTo('HOME');
      table.boolean('is_default').defaultTo(false);
      table.text('instructions').nullable();
      table.timestamps(true, true);
    });
  }

  // 6. Audit Logs table
  const hasAuditLogs = await database.schema.hasTable('audit_logs');
  if (!hasAuditLogs) {
    await database.schema.createTable('audit_logs', (table) => {
      table.uuid('id').primary().defaultTo(database.fn.uuid());
      table.uuid('user_id').nullable();
      table.string('action', 100).notNullable();
      table.string('entity_name', 100).notNullable();
      table.string('entity_id', 100).nullable();
      table.text('old_value').nullable();
      table.text('new_value').nullable();
      table.string('ip_address', 50).nullable();
      table.string('user_agent', 255).nullable();
      table.timestamp('created_at').defaultTo(database.fn.now());
    });
  }

  // 7. Categories table
  const hasCategories = await database.schema.hasTable('categories');
  if (!hasCategories) {
    await database.schema.createTable('categories', (table) => {
      table.uuid('id').primary().defaultTo(database.fn.uuid());
      table.string('name', 255).notNullable();
      table.string('slug', 255).unique().notNullable();
      table.uuid('parent_id').references('id').inTable('categories').onDelete('SET NULL').nullable();
      table.text('image_url').nullable();
      table.text('description').nullable();
      table.integer('sort_order').defaultTo(0);
      table.boolean('is_active').defaultTo(true);
      table.timestamps(true, true);
    });
  }

  // 8. Brands table
  const hasBrands = await database.schema.hasTable('brands');
  if (!hasBrands) {
    await database.schema.createTable('brands', (table) => {
      table.uuid('id').primary().defaultTo(database.fn.uuid());
      table.string('name', 255).unique().notNullable();
      table.string('slug', 255).unique().notNullable();
      table.text('logo_url').nullable();
      table.text('description').nullable();
      table.boolean('is_active').defaultTo(true);
      table.timestamps(true, true);
    });
  }

  // 9. Tags table
  const hasTags = await database.schema.hasTable('tags');
  if (!hasTags) {
    await database.schema.createTable('tags', (table) => {
      table.uuid('id').primary().defaultTo(database.fn.uuid());
      table.string('name', 100).unique().notNullable();
      table.string('slug', 100).unique().notNullable();
      table.text('description').nullable();
      table.timestamp('created_at').defaultTo(database.fn.now());
    });
  }

  // 10. Products table
  const hasProducts = await database.schema.hasTable('products');
  if (!hasProducts) {
    await database.schema.createTable('products', (table) => {
      table.uuid('id').primary().defaultTo(database.fn.uuid());
      table.string('sku', 100).unique().notNullable();
      table.string('name', 255).notNullable();
      table.string('slug', 255).unique().notNullable();
      table.text('description').nullable();
      table.text('short_description').nullable();
      table.uuid('brand_id').references('id').inTable('brands').onDelete('SET NULL').nullable();
      table.uuid('primary_category_id').references('id').inTable('categories').onDelete('RESTRICT').nullable();
      table.double('cost_price').defaultTo(0);
      table.double('base_price').notNullable();
      table.double('sale_price').notNullable();
      table.double('discount_percentage').defaultTo(0);
      table.double('discount_amount').defaultTo(0);
      table.integer('stock_quantity').defaultTo(0);
      table.integer('low_stock_threshold').defaultTo(5);
      table.string('status', 30).defaultTo('ACTIVE').notNullable(); // ACTIVE, DRAFT, ARCHIVED
      table.boolean('is_featured').defaultTo(false);
      table.boolean('is_new_arrival').defaultTo(true);
      table.boolean('is_best_seller').defaultTo(false);
      table.double('rating_avg').defaultTo(0);
      table.integer('review_count').defaultTo(0);
      table.double('weight').nullable();
      table.string('unit', 50).defaultTo('piece');
      table.double('vat_percentage').defaultTo(0);
      table.text('specifications').nullable();
      table.text('thumbnail_url').nullable();
      table.timestamps(true, true);
      table.timestamp('deleted_at').nullable();
    });
  }

  // 11. Product Categories (Many-to-Many)
  const hasProductCategories = await database.schema.hasTable('product_categories');
  if (!hasProductCategories) {
    await database.schema.createTable('product_categories', (table) => {
      table.uuid('id').primary().defaultTo(database.fn.uuid());
      table.uuid('product_id').references('id').inTable('products').onDelete('CASCADE').notNullable();
      table.uuid('category_id').references('id').inTable('categories').onDelete('CASCADE').notNullable();
      table.unique(['product_id', 'category_id']);
    });
  }

  // 12. Product Tags (Many-to-Many)
  const hasProductTags = await database.schema.hasTable('product_tags');
  if (!hasProductTags) {
    await database.schema.createTable('product_tags', (table) => {
      table.uuid('id').primary().defaultTo(database.fn.uuid());
      table.uuid('product_id').references('id').inTable('products').onDelete('CASCADE').notNullable();
      table.uuid('tag_id').references('id').inTable('tags').onDelete('CASCADE').notNullable();
      table.unique(['product_id', 'tag_id']);
    });
  }

  // 13. Product Variants (Multi-quantity purchasables)
  const hasProductVariants = await database.schema.hasTable('product_variants');
  if (!hasProductVariants) {
    await database.schema.createTable('product_variants', (table) => {
      table.uuid('id').primary().defaultTo(database.fn.uuid());
      table.uuid('product_id').references('id').inTable('products').onDelete('CASCADE').notNullable();
      table.string('sku', 100).unique().notNullable();
      table.string('display_name', 100).notNullable(); // e.g. "500 ML", "1 Liter", "5 Liter"
      table.string('unit', 50).notNullable(); // ML, Liter, KG, Gram, Piece
      table.double('quantity').notNullable();
      table.double('price').notNullable();
      table.double('sale_price').notNullable();
      table.integer('stock_quantity').defaultTo(0);
      table.string('barcode', 100).nullable();
      table.boolean('is_active').defaultTo(true);
      table.timestamps(true, true);
    });
  }

  // 14. Product Images
  const hasProductImages = await database.schema.hasTable('product_images');
  if (!hasProductImages) {
    await database.schema.createTable('product_images', (table) => {
      table.uuid('id').primary().defaultTo(database.fn.uuid());
      table.uuid('product_id').references('id').inTable('products').onDelete('CASCADE').notNullable();
      table.text('image_url').notNullable();
      table.boolean('is_thumbnail').defaultTo(false);
      table.integer('sort_order').defaultTo(0);
      table.timestamp('created_at').defaultTo(database.fn.now());
    });
  }

  // 15. Price History
  const hasPriceHistory = await database.schema.hasTable('price_history');
  if (!hasPriceHistory) {
    await database.schema.createTable('price_history', (table) => {
      table.uuid('id').primary().defaultTo(database.fn.uuid());
      table.uuid('product_id').references('id').inTable('products').onDelete('CASCADE').notNullable();
      table.uuid('variant_id').references('id').inTable('product_variants').onDelete('CASCADE').nullable();
      table.double('old_price').notNullable();
      table.double('new_price').notNullable();
      table.double('old_sale_price').nullable();
      table.double('new_sale_price').nullable();
      table.uuid('changed_by').references('id').inTable('users').onDelete('SET NULL').nullable();
      table.timestamp('created_at').defaultTo(database.fn.now());
    });
  }

  // 16. Inventory Transactions (Immutable Stock Movement Ledger)
  const hasInventoryTransactions = await database.schema.hasTable('inventory_transactions');
  if (!hasInventoryTransactions) {
    await database.schema.createTable('inventory_transactions', (table) => {
      table.uuid('id').primary().defaultTo(database.fn.uuid());
      table.uuid('product_id').references('id').inTable('products').onDelete('CASCADE').notNullable();
      table.uuid('variant_id').references('id').inTable('product_variants').onDelete('CASCADE').nullable();
      table.string('transaction_type', 50).notNullable(); // STOCK_IN, STOCK_OUT, ADJUSTMENT, RESERVATION, RELEASE
      table.integer('quantity_changed').notNullable();
      table.integer('previous_stock').notNullable();
      table.integer('new_stock').notNullable();
      table.text('reason').nullable();
      table.string('reference_id', 100).nullable();
      table.uuid('performed_by').references('id').inTable('users').onDelete('SET NULL').nullable();
      table.timestamp('created_at').defaultTo(database.fn.now());
    });
  }

  // 17. Carts Table (Customer active shopping session)
  const hasCarts = await database.schema.hasTable('carts');
  if (!hasCarts) {
    await database.schema.createTable('carts', (table) => {
      table.uuid('id').primary().defaultTo(database.fn.uuid());
      table.uuid('user_id').references('id').inTable('users').onDelete('CASCADE').nullable();
      table.string('session_id', 100).nullable();
      table.timestamp('created_at').defaultTo(database.fn.now());
      table.timestamp('updated_at').defaultTo(database.fn.now());
    });
  }

  // 18. Cart Items Table
  const hasCartItems = await database.schema.hasTable('cart_items');
  if (!hasCartItems) {
    await database.schema.createTable('cart_items', (table) => {
      table.uuid('id').primary().defaultTo(database.fn.uuid());
      table.uuid('cart_id').references('id').inTable('carts').onDelete('CASCADE').notNullable();
      table.uuid('product_variant_id').references('id').inTable('product_variants').onDelete('CASCADE').notNullable();
      table.integer('quantity').notNullable().defaultTo(1);
      table.timestamp('created_at').defaultTo(database.fn.now());
      table.timestamp('updated_at').defaultTo(database.fn.now());
    });
  }

  // 19. Wishlist Table
  const hasWishlists = await database.schema.hasTable('wishlists');
  if (!hasWishlists) {
    await database.schema.createTable('wishlists', (table) => {
      table.uuid('id').primary().defaultTo(database.fn.uuid());
      table.uuid('user_id').references('id').inTable('users').onDelete('CASCADE').notNullable();
      table.uuid('product_id').references('id').inTable('products').onDelete('CASCADE').notNullable();
      table.timestamp('created_at').defaultTo(database.fn.now());
    });
  }

  // 20. Coupons Table
  const hasCoupons = await database.schema.hasTable('coupons');
  if (!hasCoupons) {
    await database.schema.createTable('coupons', (table) => {
      table.uuid('id').primary().defaultTo(database.fn.uuid());
      table.string('code', 50).unique().notNullable();
      table.string('title', 150).notNullable();
      table.text('description').nullable();
      table.string('discount_type', 30).notNullable(); // PERCENTAGE, FIXED_AMOUNT, FREE_SHIPPING
      table.double('discount_value').notNullable();
      table.double('min_order_amount').notNullable().defaultTo(0);
      table.double('max_discount_amount').nullable();
      table.timestamp('start_date').notNullable();
      table.timestamp('end_date').notNullable();
      table.integer('usage_limit_total').nullable();
      table.integer('usage_limit_per_user').notNullable().defaultTo(1);
      table.integer('used_count').notNullable().defaultTo(0);
      table.boolean('is_active').notNullable().defaultTo(true);
      table.timestamp('created_at').defaultTo(database.fn.now());
      table.timestamp('updated_at').defaultTo(database.fn.now());
    });
  }

  // 21. Coupon Usages Table
  const hasCouponUsages = await database.schema.hasTable('coupon_usages');
  if (!hasCouponUsages) {
    await database.schema.createTable('coupon_usages', (table) => {
      table.uuid('id').primary().defaultTo(database.fn.uuid());
      table.uuid('coupon_id').references('id').inTable('coupons').onDelete('CASCADE').notNullable();
      table.uuid('user_id').references('id').inTable('users').onDelete('CASCADE').notNullable();
      table.uuid('order_id').nullable();
      table.double('discount_amount').notNullable();
      table.timestamp('used_at').defaultTo(database.fn.now());
    });
  }

  // 22. Flash Deals Table
  const hasFlashDeals = await database.schema.hasTable('flash_deals');
  if (!hasFlashDeals) {
    await database.schema.createTable('flash_deals', (table) => {
      table.uuid('id').primary().defaultTo(database.fn.uuid());
      table.string('title', 150).notNullable();
      table.string('slug', 150).unique().notNullable();
      table.text('description').nullable();
      table.string('banner_image', 255).nullable();
      table.timestamp('start_time').notNullable();
      table.timestamp('end_time').notNullable();
      table.string('status', 30).notNullable().defaultTo('ACTIVE'); // UPCOMING, ACTIVE, EXPIRED, DISABLED
      table.boolean('is_active').notNullable().defaultTo(true);
      table.timestamp('created_at').defaultTo(database.fn.now());
      table.timestamp('updated_at').defaultTo(database.fn.now());
    });
  }

  // 23. Flash Deal Items Table
  const hasFlashDealItems = await database.schema.hasTable('flash_deal_items');
  if (!hasFlashDealItems) {
    await database.schema.createTable('flash_deal_items', (table) => {
      table.uuid('id').primary().defaultTo(database.fn.uuid());
      table.uuid('flash_deal_id').references('id').inTable('flash_deals').onDelete('CASCADE').notNullable();
      table.uuid('product_id').references('id').inTable('products').onDelete('CASCADE').notNullable();
      table.uuid('variant_id').references('id').inTable('product_variants').onDelete('CASCADE').notNullable();
      table.double('deal_price').notNullable();
      table.integer('allocated_stock').notNullable();
      table.integer('sold_stock').notNullable().defaultTo(0);
      table.integer('max_per_customer').notNullable().defaultTo(2);
      table.timestamp('created_at').defaultTo(database.fn.now());
      table.timestamp('updated_at').defaultTo(database.fn.now());
    });
  }

  // 24. Business Settings Table
  const hasBusinessSettings = await database.schema.hasTable('business_settings');
  if (!hasBusinessSettings) {
    await database.schema.createTable('business_settings', (table) => {
      table.uuid('id').primary().defaultTo(database.fn.uuid());
      table.string('key', 100).unique().notNullable();
      table.text('value').notNullable();
      table.string('description', 255).nullable();
      table.timestamp('created_at').defaultTo(database.fn.now());
      table.timestamp('updated_at').defaultTo(database.fn.now());
    });
  }

  // Seed default roles, super admin, and sample catalog if not present
  await seedDatabase(database);
}

export async function seedDatabase(database: Knex): Promise<void> {
  // 1. Insert standard permissions
  const permissionsList = [
    { code: 'USER_VIEW', description: 'View user accounts' },
    { code: 'USER_APPROVE', description: 'Approve or reject customer accounts' },
    { code: 'USER_BLOCK', description: 'Block or unblock user accounts' },
    { code: 'USER_DELETE', description: 'Delete user accounts' },
    { code: 'PRODUCT_CREATE', description: 'Create products, variants and media' },
    { code: 'PRODUCT_UPDATE', description: 'Update products, prices and stock' },
    { code: 'PRODUCT_DELETE', description: 'Delete products' },
    { code: 'PRODUCT_VIEW', description: 'View catalog management' },
    { code: 'ORDER_VIEW', description: 'View customer orders' },
    { code: 'ORDER_UPDATE', description: 'Update order status and fulfillment' },
    { code: 'ORDER_CANCEL', description: 'Cancel customer orders' },
    { code: 'INVENTORY_MANAGE', description: 'Adjust stock and record movements' },
    { code: 'DISCOUNT_MANAGE', description: 'Manage flash deals and coupons' },
    { code: 'REPORT_VIEW', description: 'View analytics and CRM reports' },
    { code: 'SETTINGS_MANAGE', description: 'Update business settings and branding' },
  ];

  for (const perm of permissionsList) {
    const existing = await database('permissions').where({ code: perm.code }).first();
    if (!existing) {
      await database('permissions').insert({
        id: crypto.randomUUID(),
        code: perm.code,
        description: perm.description,
      });
    }
  }

  // 2. Insert standard roles
  const rolesList = [
    { name: 'SUPER_ADMIN', description: 'Full system ownership and unrestricted access' },
    { name: 'ADMIN', description: 'Store administrator with catalog, customer and order controls' },
    { name: 'MANAGER', description: 'Store manager for daily inventory and order fulfillment' },
    { name: 'STAFF', description: 'Operational staff with limited order processing rights' },
    { name: 'CUSTOMER', description: 'Store customer with shopping capabilities' },
  ];

  for (const role of rolesList) {
    const existing = await database('roles').where({ name: role.name }).first();
    if (!existing) {
      await database('roles').insert({
        id: crypto.randomUUID(),
        name: role.name,
        description: role.description,
      });
    }
  }

  // Grant all permissions to SUPER_ADMIN role
  const superAdminRole = await database('roles').where({ name: 'SUPER_ADMIN' }).first();
  const allPermissions = await database('permissions').select('*');

  if (superAdminRole && allPermissions.length > 0) {
    for (const p of allPermissions) {
      const mapped = await database('role_permissions')
        .where({ role_id: superAdminRole.id, permission_id: p.id })
        .first();
      if (!mapped) {
        await database('role_permissions').insert({
          id: crypto.randomUUID(),
          role_id: superAdminRole.id,
          permission_id: p.id,
        });
      }
    }
  }

  // 3. Seed default Super Admin account if not existing
  const adminPhone = config.ADMIN_DEFAULT_PHONE;
  let adminUser = await database('users').where({ phone: adminPhone }).first();

  if (!adminUser) {
    const hashedPass = await bcrypt.hash(config.ADMIN_DEFAULT_PASSWORD, config.BCRYPT_ROUNDS);
    const newAdminId = crypto.randomUUID();
    await database('users').insert({
      id: newAdminId,
      full_name: 'Liton Brothers Super Admin',
      phone: adminPhone,
      password_hash: hashedPass,
      email: 'admin@litonbrothers.com',
      address: 'Liton Brothers HQ, Dhaka, Bangladesh',
      status: 'APPROVED',
      role: 'SUPER_ADMIN',
    });
    adminUser = { id: newAdminId };
  }

  // 4. Seed Hierarchical Categories
  const categorySeeds = [
    {
      name: 'Grocery',
      slug: 'grocery',
      description: 'Daily household groceries, cooking essentials, rice and spices',
      children: [
        { name: 'Cooking Oil', slug: 'cooking-oil', description: 'Soybean oil, mustard oil, sunflower oil' },
        { name: 'Rice', slug: 'rice', description: 'Miniket, Nazirshail, Basmati, Chinigura' },
        { name: 'Masala & Spices', slug: 'masala-spices', description: 'Turmeric, chilli, cumin, coriander' },
        { name: 'Flour & Atta', slug: 'flour-atta', description: 'Wheat flour, atta, maida, suji' },
        { name: 'Sugar & Salt', slug: 'sugar-salt', description: 'Refined sugar, brown sugar, iodized salt' },
      ],
    },
    {
      name: 'Fresh Food',
      slug: 'fresh-food',
      description: 'Farm-fresh vegetables, fruits, eggs and dairy items',
      children: [
        { name: 'Fresh Vegetables', slug: 'fresh-vegetables', description: 'Potatoes, onions, tomatoes, greens' },
        { name: 'Fresh Fruits', slug: 'fresh-fruits', description: 'Apples, bananas, oranges, mangoes' },
        { name: 'Eggs & Dairy', slug: 'eggs-dairy', description: 'Farm eggs, fresh milk, butter, cheese' },
      ],
    },
    {
      name: 'Drinks & Beverages',
      slug: 'drinks-beverages',
      description: 'Refreshing juices, soft drinks, tea and coffee',
      children: [
        { name: 'Juices', slug: 'juices', description: 'Mango, orange, apple juices' },
        { name: 'Soft Drinks', slug: 'soft-drinks', description: 'Carbonated beverages, mineral water' },
        { name: 'Tea & Coffee', slug: 'tea-coffee', description: 'Black tea, green tea, instant coffee' },
      ],
    },
    {
      name: 'Personal Care',
      slug: 'personal-care',
      description: 'Cosmetics, skin care, soaps and personal hygiene',
      children: [
        { name: 'Cosmetics', slug: 'cosmetics', description: 'Creams, lotions, makeup' },
        { name: 'Hair Care', slug: 'hair-care', description: 'Shampoo, hair oil, conditioner' },
      ],
    },
  ];

  for (const cat of categorySeeds) {
    let parent = await database('categories').where({ slug: cat.slug }).first();
    if (!parent) {
      const parentId = crypto.randomUUID();
      await database('categories').insert({
        id: parentId,
        name: cat.name,
        slug: cat.slug,
        description: cat.description,
        is_active: true,
      });
      parent = { id: parentId };
    }

    if (cat.children) {
      for (const child of cat.children) {
        const existingChild = await database('categories').where({ slug: child.slug }).first();
        if (!existingChild) {
          await database('categories').insert({
            id: crypto.randomUUID(),
            name: child.name,
            slug: child.slug,
            description: child.description,
            parent_id: parent.id,
            is_active: true,
          });
        }
      }
    }
  }

  // 5. Seed Brands
  const brandSeeds = [
    { name: 'Fresh', slug: 'fresh', description: 'Meghna Group of Industries premier consumer brand' },
    { name: 'Teer', slug: 'teer', description: 'City Group flagship brand for pure edible oils and flour' },
    { name: 'Radhuni', slug: 'radhuni', description: 'Square Consumer Products trusted spice and masala brand' },
    { name: 'Rupchanda', slug: 'rupchanda', description: 'Bangladesh Edible Oil Ltd fortified soybean oil' },
    { name: 'Pran', slug: 'pran', description: 'PRAN-RFL Group food and beverage products' },
    { name: 'Dano', slug: 'dano', description: 'Arla Foods premium dairy and milk powder' },
  ];

  for (const b of brandSeeds) {
    const existing = await database('brands').where({ slug: b.slug }).first();
    if (!existing) {
      await database('brands').insert({
        id: crypto.randomUUID(),
        name: b.name,
        slug: b.slug,
        description: b.description,
        is_active: true,
      });
    }
  }

  // 6. Seed Tags
  const tagSeeds = [
    { name: 'Oil', slug: 'oil' },
    { name: 'Grocery', slug: 'grocery' },
    { name: 'Cooking Oil', slug: 'cooking-oil' },
    { name: 'Popular', slug: 'popular' },
    { name: 'Fresh Vegetables', slug: 'fresh-vegetables' },
    { name: 'Masala & Spices', slug: 'masala-spices' },
    { name: 'Best Seller', slug: 'best-seller' },
    { name: 'New Arrival', slug: 'new-arrival' },
    { name: 'Friday Flash Deal', slug: 'friday-flash-deal' },
    { name: 'Deals of the Day', slug: 'deals-of-the-day' },
    { name: 'Recommended', slug: 'recommended' },
  ];

  for (const t of tagSeeds) {
    const existing = await database('tags').where({ slug: t.slug }).first();
    if (!existing) {
      await database('tags').insert({
        id: crypto.randomUUID(),
        name: t.name,
        slug: t.slug,
      });
    }
  }

  // 7. Seed Sample Products with Multi-Quantity Variants & Stock
  const oilCategory = await database('categories').where({ slug: 'cooking-oil' }).first();
  const riceCategory = await database('categories').where({ slug: 'rice' }).first();
  const spiceCategory = await database('categories').where({ slug: 'masala-spices' }).first();
  const vegCategory = await database('categories').where({ slug: 'fresh-vegetables' }).first();
  const dairyCategory = await database('categories').where({ slug: 'eggs-dairy' }).first();

  const teerBrand = await database('brands').where({ slug: 'teer' }).first();
  const rupchandaBrand = await database('brands').where({ slug: 'rupchanda' }).first();
  const radhuniBrand = await database('brands').where({ slug: 'radhuni' }).first();
  const freshBrand = await database('brands').where({ slug: 'fresh' }).first();

  const productSeeds = [
    {
      sku: 'LB-PROD-001',
      name: 'Teer Pure Soybean Oil',
      slug: 'teer-pure-soybean-oil',
      description: 'Teer Pure Soybean Oil is refined with modern technology to guarantee 100% purity and nutrition for your family.',
      short_description: 'Pure, cholesterol-free refined soybean cooking oil.',
      brand_id: teerBrand?.id,
      primary_category_id: oilCategory?.id,
      cost_price: 150,
      base_price: 180,
      sale_price: 175,
      discount_percentage: 2.78,
      discount_amount: 5,
      stock_quantity: 240,
      is_featured: true,
      is_best_seller: true,
      unit: 'Liter',
      tags: ['Oil', 'Grocery', 'Cooking Oil', 'Popular', 'Best Seller', 'Friday Flash Deal'],
      variants: [
        { sku: 'TEER-OIL-500ML', display_name: '500 ML', unit: 'ML', quantity: 500, price: 95, sale_price: 90, stock: 50 },
        { sku: 'TEER-OIL-1L', display_name: '1 Liter', unit: 'Liter', quantity: 1, price: 180, sale_price: 175, stock: 100 },
        { sku: 'TEER-OIL-2L', display_name: '2 Liter', unit: 'Liter', quantity: 2, price: 350, sale_price: 340, stock: 60 },
        { sku: 'TEER-OIL-5L', display_name: '5 Liter', unit: 'Liter', quantity: 5, price: 850, sale_price: 820, stock: 30 },
      ],
    },
    {
      sku: 'LB-PROD-002',
      name: 'Rupchanda Fortified Soybean Oil',
      slug: 'rupchanda-fortified-soybean-oil',
      description: 'Vitamin A fortified Rupchanda Soybean Oil promotes health and gives delicious taste to every meal.',
      short_description: 'Vitamin A fortified premium cooking oil.',
      brand_id: rupchandaBrand?.id,
      primary_category_id: oilCategory?.id,
      cost_price: 155,
      base_price: 185,
      sale_price: 180,
      discount_percentage: 2.7,
      discount_amount: 5,
      stock_quantity: 180,
      is_featured: true,
      is_best_seller: false,
      unit: 'Liter',
      tags: ['Oil', 'Cooking Oil', 'Grocery', 'Popular'],
      variants: [
        { sku: 'RUP-OIL-1L', display_name: '1 Liter', unit: 'Liter', quantity: 1, price: 185, sale_price: 180, stock: 80 },
        { sku: 'RUP-OIL-2L', display_name: '2 Liter', unit: 'Liter', quantity: 2, price: 360, sale_price: 350, stock: 60 },
        { sku: 'RUP-OIL-5L', display_name: '5 Liter', unit: 'Liter', quantity: 5, price: 870, sale_price: 840, stock: 40 },
      ],
    },
    {
      sku: 'LB-PROD-003',
      name: 'Miniket Premium Rice',
      slug: 'miniket-premium-rice',
      description: 'Slender, aromatic and thoroughly sorted Miniket premium quality rice for everyday dining.',
      short_description: 'Clean, long-grain Miniket rice.',
      brand_id: freshBrand?.id,
      primary_category_id: riceCategory?.id,
      cost_price: 65,
      base_price: 80,
      sale_price: 75,
      discount_percentage: 6.25,
      discount_amount: 5,
      stock_quantity: 500,
      is_featured: true,
      is_best_seller: true,
      unit: 'KG',
      tags: ['Grocery', 'Popular', 'Best Seller', 'Deals of the Day'],
      variants: [
        { sku: 'RICE-MINI-1KG', display_name: '1 KG', unit: 'KG', quantity: 1, price: 80, sale_price: 75, stock: 150 },
        { sku: 'RICE-MINI-5KG', display_name: '5 KG', unit: 'KG', quantity: 5, price: 390, sale_price: 360, stock: 200 },
        { sku: 'RICE-MINI-10KG', display_name: '10 KG', unit: 'KG', quantity: 10, price: 760, sale_price: 700, stock: 100 },
        { sku: 'RICE-MINI-25KG', display_name: '25 KG (Bag)', unit: 'KG', quantity: 25, price: 1850, sale_price: 1700, stock: 50 },
      ],
    },
    {
      sku: 'LB-PROD-004',
      name: 'Radhuni Pure Turmeric Powder (Holud)',
      slug: 'radhuni-pure-turmeric-powder',
      description: 'Made from high quality turmeric roots selected for bright yellow color and authentic aroma.',
      short_description: 'Aromatic and pure turmeric powder.',
      brand_id: radhuniBrand?.id,
      primary_category_id: spiceCategory?.id,
      cost_price: 38,
      base_price: 50,
      sale_price: 45,
      discount_percentage: 10,
      discount_amount: 5,
      stock_quantity: 300,
      is_featured: false,
      is_best_seller: true,
      unit: 'Gram',
      tags: ['Grocery', 'Masala & Spices', 'Popular'],
      variants: [
        { sku: 'RAD-HOLUD-100G', display_name: '100 Gram', unit: 'Gram', quantity: 100, price: 50, sale_price: 45, stock: 120 },
        { sku: 'RAD-HOLUD-200G', display_name: '200 Gram', unit: 'Gram', quantity: 200, price: 95, sale_price: 85, stock: 100 },
        { sku: 'RAD-HOLUD-500G', display_name: '500 Gram', unit: 'Gram', quantity: 500, price: 220, sale_price: 200, stock: 80 },
      ],
    },
    {
      sku: 'LB-PROD-005',
      name: 'Fresh Red Onion (Deshi Piyaj)',
      slug: 'fresh-red-onion-deshi-piyaj',
      description: 'Farm-fresh local Bangladeshi red onions with pungent flavor and rich crispness.',
      short_description: 'Fresh local harvest red onions.',
      brand_id: freshBrand?.id,
      primary_category_id: vegCategory?.id,
      cost_price: 70,
      base_price: 90,
      sale_price: 80,
      discount_percentage: 11.11,
      discount_amount: 10,
      stock_quantity: 400,
      is_featured: true,
      is_best_seller: true,
      unit: 'KG',
      tags: ['Fresh Vegetables', 'Popular', 'Deals of the Day'],
      variants: [
        { sku: 'ONION-DESHI-1KG', display_name: '1 KG', unit: 'KG', quantity: 1, price: 90, sale_price: 80, stock: 250 },
        { sku: 'ONION-DESHI-5KG', display_name: '5 KG', unit: 'KG', quantity: 5, price: 425, sale_price: 380, stock: 150 },
      ],
    },
    {
      sku: 'LB-PROD-006',
      name: 'Fresh Farm Eggs (Brown)',
      slug: 'fresh-farm-eggs-brown',
      description: 'Hygienically collected healthy brown poultry eggs, high in protein.',
      short_description: 'Fresh farm-collected brown eggs.',
      brand_id: freshBrand?.id,
      primary_category_id: dairyCategory?.id,
      cost_price: 130,
      base_price: 160,
      sale_price: 150,
      discount_percentage: 6.25,
      discount_amount: 10,
      stock_quantity: 350,
      is_featured: true,
      is_best_seller: true,
      unit: 'Piece',
      tags: ['Popular', 'Best Seller', 'Friday Flash Deal'],
      variants: [
        { sku: 'EGG-BROWN-4PCS', display_name: '4 Pieces (Hali)', unit: 'Piece', quantity: 4, price: 55, sale_price: 52, stock: 100 },
        { sku: 'EGG-BROWN-12PCS', display_name: '12 Pieces (Dozen)', unit: 'Piece', quantity: 12, price: 160, sale_price: 150, stock: 180 },
        { sku: 'EGG-BROWN-30PCS', display_name: '30 Pieces (Tray)', unit: 'Piece', quantity: 30, price: 395, sale_price: 370, stock: 70 },
      ],
    },
  ];

  for (const prod of productSeeds) {
    const existing = await database('products').where({ slug: prod.slug }).first();
    if (!existing) {
      const prodId = crypto.randomUUID();
      await database('products').insert({
        id: prodId,
        sku: prod.sku,
        name: prod.name,
        slug: prod.slug,
        description: prod.description,
        short_description: prod.short_description,
        brand_id: prod.brand_id || null,
        primary_category_id: prod.primary_category_id || null,
        cost_price: prod.cost_price,
        base_price: prod.base_price,
        sale_price: prod.sale_price,
        discount_percentage: prod.discount_percentage,
        discount_amount: prod.discount_amount,
        stock_quantity: prod.stock_quantity,
        is_featured: prod.is_featured,
        is_best_seller: prod.is_best_seller,
        is_new_arrival: true,
        unit: prod.unit,
        rating_avg: 4.8,
        review_count: 12,
        status: 'ACTIVE',
      });

      // Insert primary category mapping
      if (prod.primary_category_id) {
        await database('product_categories').insert({
          id: crypto.randomUUID(),
          product_id: prodId,
          category_id: prod.primary_category_id,
        });
      }

      // Insert tags
      for (const tagName of prod.tags) {
        const tag = await database('tags').where({ name: tagName }).first();
        if (tag) {
          await database('product_tags').insert({
            id: crypto.randomUUID(),
            product_id: prodId,
            tag_id: tag.id,
          });
        }
      }

      // Insert variants and initial inventory transactions
      for (const v of prod.variants) {
        const variantId = crypto.randomUUID();
        await database('product_variants').insert({
          id: variantId,
          product_id: prodId,
          sku: v.sku,
          display_name: v.display_name,
          unit: v.unit,
          quantity: v.quantity,
          price: v.price,
          sale_price: v.sale_price,
          stock_quantity: v.stock,
          is_active: true,
        });

        // Price history record
        await database('price_history').insert({
          id: crypto.randomUUID(),
          product_id: prodId,
          variant_id: variantId,
          old_price: v.price,
          new_price: v.price,
          old_sale_price: v.sale_price,
          new_sale_price: v.sale_price,
          changed_by: adminUser.id,
        });

        // Inventory transaction record
        await database('inventory_transactions').insert({
          id: crypto.randomUUID(),
          product_id: prodId,
          variant_id: variantId,
          transaction_type: 'STOCK_IN',
          quantity_changed: v.stock,
          previous_stock: 0,
          new_stock: v.stock,
          reason: 'Initial warehouse stocking',
          performed_by: adminUser.id,
        });
      }
    }
  }

  // 6. Business Settings Seeding
  const defaultSettings = [
    { key: 'site_name', value: 'Liton Brothers Grocery & FMCG', description: 'Storefront Name' },
    { key: 'site_tagline', value: 'Premium Groceries & Daily Essentials Delivered in Dhaka', description: 'Storefront Tagline' },
    { key: 'currency', value: 'BDT', description: 'Operational Currency Code' },
    { key: 'currency_symbol', value: '৳', description: 'Currency Symbol' },
    { key: 'delivery_fee_standard', value: '60', description: 'Standard City Delivery Charge (BDT)' },
    { key: 'free_shipping_threshold', value: '1000', description: 'Minimum cart total for free delivery (BDT)' },
    { key: 'tax_percentage', value: '0', description: 'VAT / Tax percentage' },
    { key: 'friday_flash_enabled', value: 'true', description: 'Whether Friday Flash Deals are actively featured' },
  ];

  for (const s of defaultSettings) {
    const existing = await database('business_settings').where({ key: s.key }).first();
    if (!existing) {
      await database('business_settings').insert({
        id: crypto.randomUUID(),
        key: s.key,
        value: s.value,
        description: s.description,
      });
    }
  }

  // 7. Seed Sample Coupons
  const sampleCoupons = [
    {
      code: 'RAMADAN20',
      title: 'Ramadan Special 20% Off',
      description: 'Get 20% off up to ৳200 on all grocery orders above ৳500',
      discount_type: 'PERCENTAGE',
      discount_value: 20,
      min_order_amount: 500,
      max_discount_amount: 200,
      start_date: new Date(Date.now() - 7 * 86400000),
      end_date: new Date(Date.now() + 30 * 86400000),
      usage_limit_total: 1000,
      usage_limit_per_user: 2,
      is_active: true,
    },
    {
      code: 'LITON100',
      title: 'Flat ৳100 Welcome Discount',
      description: 'Save ৳100 instantly on your grocery cart above ৳1,000',
      discount_type: 'FIXED_AMOUNT',
      discount_value: 100,
      min_order_amount: 1000,
      max_discount_amount: 100,
      start_date: new Date(Date.now() - 7 * 86400000),
      end_date: new Date(Date.now() + 60 * 86400000),
      usage_limit_total: 500,
      usage_limit_per_user: 1,
      is_active: true,
    },
    {
      code: 'FREEDEL',
      title: 'Free Home Delivery Coupon',
      description: 'Zero delivery fee on orders above ৳400',
      discount_type: 'FREE_SHIPPING',
      discount_value: 60,
      min_order_amount: 400,
      max_discount_amount: 60,
      start_date: new Date(Date.now() - 7 * 86400000),
      end_date: new Date(Date.now() + 30 * 86400000),
      usage_limit_total: 2000,
      usage_limit_per_user: 3,
      is_active: true,
    },
  ];

  for (const c of sampleCoupons) {
    const existing = await database('coupons').where({ code: c.code }).first();
    if (!existing) {
      await database('coupons').insert({
        id: crypto.randomUUID(),
        ...c,
      });
    }
  }

  // 8. Seed Sample Friday Flash Deal
  const existingFlash = await database('flash_deals').where({ slug: 'mega-friday-flash-bazaar' }).first();
  if (!existingFlash) {
    const flashId = crypto.randomUUID();
    await database('flash_deals').insert({
      id: flashId,
      title: 'Mega Friday Flash Bazaar',
      slug: 'mega-friday-flash-bazaar',
      description: 'Exclusive Friday mega discounts on essential oils and aromatic rice! Limited stock available.',
      banner_image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1200&q=80',
      start_time: new Date(Date.now() - 86400000), // Started yesterday
      end_time: new Date(Date.now() + 7 * 86400000), // Ends in 7 days
      status: 'ACTIVE',
      is_active: true,
    });

    // Add 5L soybean oil variant and 5kg rice variant to flash deal
    const oilVariant = await database('product_variants').where({ sku: 'TEER-OIL-5L' }).first();
    if (oilVariant) {
      await database('flash_deal_items').insert({
        id: crypto.randomUUID(),
        flash_deal_id: flashId,
        product_id: oilVariant.product_id,
        variant_id: oilVariant.id,
        deal_price: 790, // discounted from 820
        allocated_stock: 50,
        sold_stock: 12,
        max_per_customer: 2,
      });
    }

    const riceVariant = await database('product_variants').where({ sku: 'RICE-MINI-5KG' }).first();
    if (riceVariant) {
      await database('flash_deal_items').insert({
        id: crypto.randomUUID(),
        flash_deal_id: flashId,
        product_id: riceVariant.product_id,
        variant_id: riceVariant.id,
        deal_price: 330, // discounted from 360
        allocated_stock: 40,
        sold_stock: 8,
        max_per_customer: 2,
      });
    }
  }
}
