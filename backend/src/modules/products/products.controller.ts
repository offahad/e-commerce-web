import { Request, Response, NextFunction } from 'express';
import { ProductsService } from './products.service.js';
import { ApiResponse } from '../../common/utils/api-response.js';
import { createProductSchema, updateProductSchema, productQuerySchema } from './products.dto.js';

export class ProductsController {
  private productsService: ProductsService;

  constructor() {
    this.productsService = new ProductsService();
  }

  list = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const query = productQuerySchema.parse(req.query);
      const { products, pagination } = await this.productsService.list(query);
      return ApiResponse.success(res, products, 'Products retrieved successfully', 200, pagination);
    } catch (err) {
      next(err);
    }
  };

  getBySlug = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const product = await this.productsService.getBySlug(req.params.slug as string);
      return ApiResponse.success(res, product, 'Product details retrieved successfully');
    } catch (err) {
      next(err);
    }
  };

  getSuggestions = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const q = (req.query.q as string) || '';
      const suggestions = await this.productsService.getSuggestions(q);
      return ApiResponse.success(res, suggestions, 'Search suggestions retrieved');
    } catch (err) {
      next(err);
    }
  };

  getSectionProducts = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const sectionKey = req.params.sectionKey as string;
      const limit = Number(req.query.limit) || 10;
      const products = await this.productsService.getSectionProducts(sectionKey, limit);
      return ApiResponse.success(res, products, `Section ${sectionKey} products retrieved`);
    } catch (err) {
      next(err);
    }
  };

  // --- Admin Handlers ---

  create = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const validated = createProductSchema.parse(req.body);
      const product = await this.productsService.create(validated, req.user?.id);
      return ApiResponse.success(res, product, 'Product created successfully', 201);
    } catch (err) {
      next(err);
    }
  };

  update = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const validated = updateProductSchema.parse(req.body);
      const product = await this.productsService.update(req.params.id as string, validated, req.user?.id);
      return ApiResponse.success(res, product, 'Product updated successfully');
    } catch (err) {
      next(err);
    }
  };

  delete = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await this.productsService.delete(req.params.id as string, req.user?.id);
      return ApiResponse.success(res, result, 'Product soft-deleted successfully');
    } catch (err) {
      next(err);
    }
  };
}
