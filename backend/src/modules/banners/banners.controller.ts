import { Request, Response, NextFunction } from 'express';
import { BannersService } from './banners.service.js';
import { ApiResponse } from '../../common/utils/api-response.js';
import {
  createBannerSchema,
  updateBannerSchema,
  updateBannerStatusSchema,
} from './banners.dto.js';

export class BannersController {
  private bannersService: BannersService;

  constructor() {
    this.bannersService = new BannersService();
  }

  listPublic = async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const banners = await this.bannersService.listPublic();
      return ApiResponse.success(res, banners, 'Hero banners retrieved');
    } catch (err) {
      next(err);
    }
  };

  listAdmin = async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const banners = await this.bannersService.listAdmin();
      return ApiResponse.success(res, banners, 'Hero banners retrieved for admin');
    } catch (err) {
      next(err);
    }
  };

  getById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const banner = await this.bannersService.getById(req.params.id as string);
      return ApiResponse.success(res, banner, 'Hero banner retrieved');
    } catch (err) {
      next(err);
    }
  };

  create = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const validated = createBannerSchema.parse(req.body);
      const banner = await this.bannersService.create(validated, req.user?.id, req.ip);
      return ApiResponse.success(res, banner, 'Hero banner created successfully', 201);
    } catch (err) {
      next(err);
    }
  };

  update = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const validated = updateBannerSchema.parse(req.body);
      const banner = await this.bannersService.update(req.params.id as string, validated, req.user?.id, req.ip);
      return ApiResponse.success(res, banner, 'Hero banner updated successfully');
    } catch (err) {
      next(err);
    }
  };

  updateStatus = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const validated = updateBannerStatusSchema.parse(req.body);
      const banner = await this.bannersService.updateStatus(req.params.id as string, validated, req.user?.id, req.ip);
      return ApiResponse.success(res, banner, 'Hero banner status updated successfully');
    } catch (err) {
      next(err);
    }
  };

  delete = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await this.bannersService.delete(req.params.id as string, req.user?.id, req.ip);
      return ApiResponse.success(res, result, 'Hero banner deleted successfully');
    } catch (err) {
      next(err);
    }
  };
}
