import { Express } from 'express';
import swaggerUi from 'swagger-ui-express';

export const openApiSpec = {
  openapi: '3.0.3',
  info: {
    title: 'Liton Brothers E-Commerce REST API',
    version: '1.0.0',
    description: `
## Liton Brothers — Production REST API Documentation

This API serves the **Liton Brothers** multi-channel platform (Customer Web, Admin Dashboard, Mobile Apps, and Delivery Services).

### Key Architectural Guidelines for Client & Mobile Developers (Flutter / React Native / iOS / Android):
1. **API Versioning**: All production endpoints are strictly routed under \`/api/v1\`.
2. **Standard Response Envelope**:
   - Success: \`{ "success": true, "message": "...", "data": {...} }\`
   - Error: \`{ "success": false, "message": "...", "code": "ERROR_CODE", "errors": [] }\`
3. **Authentication**:
   - Obtain tokens via \`POST /api/v1/auth/login\`.
   - Pass the \`accessToken\` in headers: \`Authorization: Bearer <accessToken>\`.
   - When token expires (HTTP 401 \`TOKEN_EXPIRED\`), call \`POST /api/v1/auth/refresh\` with \`{ "refreshToken": "..." }\` to get a fresh pair.
4. **Customer Approval System**:
   - Newly registered customers are assigned status \`PENDING_APPROVAL\`.
   - Shopping/order operations will return HTTP 403 \`ACCOUNT_PENDING_APPROVAL\` until reviewed and approved by an administrator.
5. **Product Variants & Multi-Quantity Architecture**:
   - Products (e.g. "Teer Soybean Oil") contain multiple purchasable variants (e.g. 500 ML, 1 Liter, 2 Liter, 5 Liter).
   - Customers select a specific variant ID before adding to cart or purchasing.
6. **Currency**: All monetary values are in **BDT (৳)**.
    `,
    contact: {
      name: 'Liton Brothers Engineering Team',
      email: 'tech@litonbrothers.com',
    },
  },
  servers: [
    {
      url: '/api/v1',
      description: 'API v1 Gateway',
    },
  ],
  components: {
    securitySchemes: {
      BearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Provide your JWT access token as `Bearer <token>`',
      },
    },
    schemas: {
      StandardResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          message: { type: 'string', example: 'Operation successful' },
          data: { type: 'object' },
        },
      },
      ErrorResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          message: { type: 'string', example: 'Validation failed' },
          code: { type: 'string', example: 'VALIDATION_ERROR' },
          errors: {
            type: 'array',
            items: { type: 'string' },
            example: ['Phone number already exists'],
          },
        },
      },
      VariantInput: {
        type: 'object',
        required: ['sku', 'displayName', 'unit', 'quantity', 'price', 'salePrice'],
        properties: {
          sku: { type: 'string', example: 'TEER-OIL-1L' },
          displayName: { type: 'string', example: '1 Liter' },
          unit: { type: 'string', example: 'Liter' },
          quantity: { type: 'number', example: 1 },
          price: { type: 'number', example: 180 },
          salePrice: { type: 'number', example: 175 },
          stockQuantity: { type: 'integer', example: 100 },
          barcode: { type: 'string', example: '8941234567890' },
        },
      },
      CreateProductRequest: {
        type: 'object',
        required: ['name', 'sku', 'basePrice', 'salePrice'],
        properties: {
          name: { type: 'string', example: 'Teer Pure Soybean Oil' },
          sku: { type: 'string', example: 'LB-PROD-001' },
          slug: { type: 'string', example: 'teer-pure-soybean-oil' },
          description: { type: 'string', example: '100% pure refined cooking oil.' },
          shortDescription: { type: 'string', example: 'Cholesterol-free edible oil.' },
          brandId: { type: 'string', format: 'uuid' },
          primaryCategoryId: { type: 'string', format: 'uuid' },
          basePrice: { type: 'number', example: 180 },
          salePrice: { type: 'number', example: 175 },
          discountPercentage: { type: 'number', example: 2.78 },
          stockQuantity: { type: 'integer', example: 240 },
          unit: { type: 'string', example: 'Liter' },
          variants: {
            type: 'array',
            items: { $ref: '#/components/schemas/VariantInput' },
          },
          tags: {
            type: 'array',
            items: { type: 'string' },
            example: ['Oil', 'Grocery', 'Cooking Oil', 'Popular'],
          },
        },
      },
      StockAdjustmentRequest: {
        type: 'object',
        required: ['productId', 'transactionType', 'quantity', 'reason'],
        properties: {
          productId: { type: 'string', format: 'uuid' },
          variantId: { type: 'string', format: 'uuid', nullable: true },
          transactionType: {
            type: 'string',
            enum: ['STOCK_IN', 'STOCK_OUT', 'ADJUSTMENT'],
            example: 'STOCK_IN',
          },
          quantity: { type: 'integer', example: 50 },
          reason: { type: 'string', example: 'Received supplier shipment' },
          referenceId: { type: 'string', example: 'PO-2026-09-001' },
        },
      },
    },
  },
  paths: {
    '/health': {
      get: {
        tags: ['System'],
        summary: 'Service Health Check',
        responses: { '200': { description: 'System health metrics' } },
      },
    },
    '/auth/register': {
      post: {
        tags: ['Authentication'],
        summary: 'Customer Registration',
        responses: { '201': { description: 'Account registered (PENDING_APPROVAL)' } },
      },
    },
    '/auth/login': {
      post: {
        tags: ['Authentication'],
        summary: 'User Login',
        responses: { '200': { description: 'Login successful' } },
      },
    },
    '/auth/refresh': {
      post: {
        tags: ['Authentication'],
        summary: 'Refresh Access Token',
        responses: { '200': { description: 'Tokens rotated' } },
      },
    },
    '/auth/me': {
      get: {
        tags: ['Authentication'],
        summary: 'Current User Profile',
        security: [{ BearerAuth: [] }],
        responses: { '200': { description: 'Current profile' } },
      },
    },
    '/categories': {
      get: {
        tags: ['Catalog Categories'],
        summary: 'List Hierarchical Categories Tree',
        description: 'Returns parent categories with nested children (e.g. Grocery -> Rice, Oil, Spices).',
        responses: { '200': { description: 'Category tree hierarchy' } },
      },
    },
    '/categories/{slug}': {
      get: {
        tags: ['Catalog Categories'],
        summary: 'Get Category by Slug',
        parameters: [{ name: 'slug', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: 'Category details and child list' } },
      },
    },
    '/brands': {
      get: {
        tags: ['Catalog Brands'],
        summary: 'List Active Brands',
        responses: { '200': { description: 'List of brands' } },
      },
    },
    '/tags': {
      get: {
        tags: ['Catalog Tags'],
        summary: 'List Product Tags',
        responses: { '200': { description: 'List of tags' } },
      },
    },
    '/products': {
      get: {
        tags: ['Catalog Products'],
        summary: 'Search & Faceted Product Listing',
        description: 'Supports full-text search `q`, category, brand, tag, minPrice, maxPrice, inStock, and sorting.',
        parameters: [
          { name: 'q', in: 'query', schema: { type: 'string' }, description: 'Search term across name, brand, category, tags, sku' },
          { name: 'category', in: 'query', schema: { type: 'string' } },
          { name: 'brand', in: 'query', schema: { type: 'string' } },
          { name: 'tag', in: 'query', schema: { type: 'string' } },
          { name: 'minPrice', in: 'query', schema: { type: 'number' } },
          { name: 'maxPrice', in: 'query', schema: { type: 'number' } },
          { name: 'inStock', in: 'query', schema: { type: 'boolean' } },
          { name: 'sortBy', in: 'query', schema: { type: 'string', enum: ['relevance', 'price_asc', 'price_desc', 'newest', 'popular', 'rating', 'discount'] } },
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } },
        ],
        responses: { '200': { description: 'Paginated product cards list' } },
      },
    },
    '/products/suggestions': {
      get: {
        tags: ['Catalog Products'],
        summary: 'Search Suggestions Autocomplete',
        parameters: [{ name: 'q', in: 'query', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: 'Matching products, categories and brands' } },
      },
    },
    '/products/sections/{sectionKey}': {
      get: {
        tags: ['Catalog Products'],
        summary: 'Homepage Dynamic Product Sections',
        description: 'Returns products for sections such as `friday-flash-deal`, `deals-of-the-day`, `fresh-vegetables`, `masala-spices`, `best-sellers`, `new-arrivals`, `popular-products`.',
        parameters: [{ name: 'sectionKey', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: 'Section products' } },
      },
    },
    '/products/{slug}': {
      get: {
        tags: ['Catalog Products'],
        summary: 'Complete Product Details',
        description: 'Returns full product data including all purchasable variants, image gallery, specifications, and pricing history.',
        parameters: [{ name: 'slug', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: 'Product details' } },
      },
    },
    '/admin/products': {
      post: {
        tags: ['Admin Catalog'],
        summary: 'Create Product with Variants',
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/CreateProductRequest' } } },
        },
        responses: { '201': { description: 'Product created successfully' } },
      },
    },
    '/admin/inventory/adjust': {
      post: {
        tags: ['Admin Inventory'],
        summary: 'Record Stock In, Stock Out or Adjustment',
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/StockAdjustmentRequest' } } },
        },
        responses: { '201': { description: 'Stock adjusted and ledger recorded' } },
      },
    },
    '/admin/inventory/transactions': {
      get: {
        tags: ['Admin Inventory'],
        summary: 'Inventory Movement Ledger History',
        security: [{ BearerAuth: [] }],
        responses: { '200': { description: 'Paginated stock movements' } },
      },
    },
    '/admin/inventory/alerts': {
      get: {
        tags: ['Admin Inventory'],
        summary: 'Low Stock and Out of Stock Alerts',
        security: [{ BearerAuth: [] }],
        responses: { '200': { description: 'Stock alert products and variants' } },
      },
    },
    '/admin/media/upload': {
      post: {
        tags: ['Admin Media'],
        summary: 'Upload and Optimize Product Image (Sharp WebP)',
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'multipart/form-data': {
              schema: {
                type: 'object',
                properties: {
                  image: { type: 'string', format: 'binary' },
                },
              },
            },
          },
        },
        responses: { '201': { description: 'Image processed to WebP and saved' } },
      },
    },
  },
};

export function setupSwagger(app: Express): void {
  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(openApiSpec));
  app.get('/api/docs/openapi.json', (_req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(openApiSpec);
  });
}
