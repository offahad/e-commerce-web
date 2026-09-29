import { Request, Response, NextFunction } from 'express';
import { wishlistService } from './wishlist.service.js';
import { ApiResponse } from '../../common/utils/api-response.js';

export class WishlistController {
  getWishlist = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.id;
      const items = await wishlistService.getWishlist(userId);
      ApiResponse.success(res, items, 'Wishlist retrieved successfully');
    } catch (err) {
      next(err);
    }
  };

  toggleWishlist = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.id;
      const productId = req.params.productId as string;
      const result = await wishlistService.toggleWishlist(userId, productId);
      ApiResponse.success(res, result, result.message);
    } catch (err) {
      next(err);
    }
  };

  removeItem = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.id;
      const productId = req.params.productId as string;
      const result = await wishlistService.removeFromWishlist(userId, productId);
      ApiResponse.success(res, result, result.message);
    } catch (err) {
      next(err);
    }
  };
}

export const wishlistController = new WishlistController();
