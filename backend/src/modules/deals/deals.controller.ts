import { Request, Response, NextFunction } from 'express';
import { dealsService } from './deals.service.js';
import { CreateFlashDealSchema, UpdateFlashDealStatusSchema } from './deals.dto.js';
import { ApiResponse } from '../../common/utils/api-response.js';

export class DealsController {
  // Public customer endpoints
  getFridayFlashDeal = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const deal = await dealsService.getActiveFridayFlashDeal();
      ApiResponse.success(res, deal, 'Active Friday Flash Deal retrieved');
    } catch (err) {
      next(err);
    }
  };

  getDealsOfTheDay = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const limit = req.query.limit ? Number(req.query.limit) : 8;
      const deals = await dealsService.getDealsOfTheDay(limit);
      ApiResponse.success(res, deals, 'Deals of the day retrieved');
    } catch (err) {
      next(err);
    }
  };

  // Admin endpoints
  createFlashDeal = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const validated = CreateFlashDealSchema.parse(req.body);
      const campaign = await dealsService.createFlashDeal(validated);
      ApiResponse.success(res, campaign, 'Flash deal campaign created successfully', 201);
    } catch (err) {
      next(err);
    }
  };

  listFlashDeals = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const page = req.query.page ? Number(req.query.page) : 1;
      const limit = req.query.limit ? Number(req.query.limit) : 20;
      const result = await dealsService.listFlashDeals(page, limit);
      ApiResponse.paginated(res, result.campaigns, result.pagination, 'Flash deal campaigns listed');
    } catch (err) {
      next(err);
    }
  };

  getFlashDealById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const campaign = await dealsService.getFlashDealById(req.params.id as string);
      ApiResponse.success(res, campaign, 'Flash deal campaign retrieved');
    } catch (err) {
      next(err);
    }
  };

  updateFlashDealStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const validated = UpdateFlashDealStatusSchema.parse(req.body);
      const campaign = await dealsService.updateFlashDealStatus(req.params.id as string, validated);
      ApiResponse.success(res, campaign, 'Flash deal status updated successfully');
    } catch (err) {
      next(err);
    }
  };
}

export const dealsController = new DealsController();
