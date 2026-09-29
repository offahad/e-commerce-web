import { Request, Response, NextFunction } from 'express';
import { BrandsService } from './brands.service.js';
import { ApiResponse } from '../../common/utils/api-response.js';
import { createBrandSchema, updateBrandSchema } from './brands.dto.js';

export class BrandsController {
  private brandsService: BrandsService;

  constructor() {
    this.brandsService = new BrandsService();
  }

  list = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const activeOnly = req.query.all !== 'true';
      const brands = await this.brandsService.list(activeOnly);
      return ApiResponse.success(res, brands, 'Brands retrieved');
    } catch (err) {
      next(err);
    }
  };

  getBySlug = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const brand = await this.brandsService.getBySlug(req.params.slug as string);
      return ApiResponse.success(res, brand, 'Brand retrieved');
    } catch (err) {
      next(err);
    }
  };

  create = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const validated = createBrandSchema.parse(req.body);
      const created = await this.brandsService.create(validated);
      return ApiResponse.success(res, created, 'Brand created successfully', 201);
    } catch (err) {
      next(err);
    }
  };

  update = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const validated = updateBrandSchema.parse(req.body);
      const updated = await this.brandsService.update(req.params.id as string, validated);
      return ApiResponse.success(res, updated, 'Brand updated successfully');
    } catch (err) {
      next(err);
    }
  };

  delete = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await this.brandsService.delete(req.params.id as string);
      return ApiResponse.success(res, result, 'Brand deleted successfully');
    } catch (err) {
      next(err);
    }
  };
}
