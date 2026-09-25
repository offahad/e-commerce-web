import { Request, Response, NextFunction } from 'express';
import { checkoutService } from './checkout.service.js';
import { CheckoutPreviewSchema } from './checkout.dto.js';
import { ApiResponse } from '../../common/utils/api-response.js';

export class CheckoutController {
  preview = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const validated = CheckoutPreviewSchema.parse(req.body);
      const userId = req.user?.id;
      const sessionId = (req.headers['x-session-id'] as string) || (req.query.sessionId as string);

      const preview = await checkoutService.calculatePreview(validated, userId, sessionId);
      ApiResponse.success(res, preview, 'Checkout calculation preview computed');
    } catch (err) {
      next(err);
    }
  };
}

export const checkoutController = new CheckoutController();
