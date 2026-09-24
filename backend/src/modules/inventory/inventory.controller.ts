import { Request, Response, NextFunction } from 'express';
import { InventoryService } from './inventory.service.js';
import { ApiResponse } from '../../common/utils/api-response.js';
import { stockAdjustmentSchema, inventoryQuerySchema } from './inventory.dto.js';

export class InventoryController {
  private inventoryService: InventoryService;

  constructor() {
    this.inventoryService = new InventoryService();
  }

  adjustStock = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const validated = stockAdjustmentSchema.parse(req.body);
      const transaction = await this.inventoryService.adjustStock(validated, req.user?.id);
      return ApiResponse.success(res, transaction, 'Stock adjusted successfully', 201);
    } catch (err) {
      next(err);
    }
  };

  listTransactions = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const query = inventoryQuerySchema.parse(req.query);
      const { transactions, pagination } = await this.inventoryService.listTransactions(query);
      return ApiResponse.success(res, transactions, 'Inventory transactions retrieved', 200, pagination);
    } catch (err) {
      next(err);
    }
  };

  getAlerts = async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const alerts = await this.inventoryService.getAlerts();
      return ApiResponse.success(res, alerts, 'Inventory stock alerts retrieved');
    } catch (err) {
      next(err);
    }
  };
}
