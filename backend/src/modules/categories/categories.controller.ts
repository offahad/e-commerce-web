import { Request, Response, NextFunction } from 'express';
import { CategoriesService } from './categories.service.js';
import { ApiResponse } from '../../common/utils/api-response.js';
import { createCategorySchema, updateCategorySchema } from './categories.dto.js';

export class CategoriesController {
  private categoriesService: CategoriesService;

  constructor() {
    this.categoriesService = new CategoriesService();
  }

  listTree = async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const tree = await this.categoriesService.listTree();
      return ApiResponse.success(res, tree, 'Categories tree retrieved');
    } catch (err) {
      next(err);
    }
  };

  getBySlug = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const category = await this.categoriesService.getBySlug(req.params.slug as string);
      return ApiResponse.success(res, category, 'Category retrieved');
    } catch (err) {
      next(err);
    }
  };

  create = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const validated = createCategorySchema.parse(req.body);
      const created = await this.categoriesService.create(validated);
      return ApiResponse.success(res, created, 'Category created successfully', 201);
    } catch (err) {
      next(err);
    }
  };

  update = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const validated = updateCategorySchema.parse(req.body);
      const updated = await this.categoriesService.update(req.params.id as string, validated);
      return ApiResponse.success(res, updated, 'Category updated successfully');
    } catch (err) {
      next(err);
    }
  };

  delete = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await this.categoriesService.delete(req.params.id as string);
      return ApiResponse.success(res, result, 'Category deleted successfully');
    } catch (err) {
      next(err);
    }
  };
}
