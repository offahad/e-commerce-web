import { Request, Response, NextFunction } from 'express';
import { cartService } from './cart.service.js';
import { AddToCartSchema, UpdateCartItemSchema } from './cart.dto.js';
import { ApiResponse } from '../../common/utils/api-response.js';

export class CartController {
  private getIdentifiers(req: Request) {
    const userId = req.user?.id;
    const sessionId = (req.headers['x-session-id'] as string) || (req.query.sessionId as string) || (req.body?.sessionId as string);
    return { userId, sessionId };
  }

  getCart = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { userId, sessionId } = this.getIdentifiers(req);
      const cartId = await cartService.getOrCreateCart(userId, sessionId);
      const cart = await cartService.getCart(cartId);

      res.setHeader('X-Cart-Id', cartId);
      ApiResponse.success(res, cart, 'Shopping cart retrieved successfully');
    } catch (err) {
      next(err);
    }
  };

  addItem = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const validated = AddToCartSchema.parse(req.body);
      const { userId, sessionId } = this.getIdentifiers(req);
      const cartId = await cartService.getOrCreateCart(userId, validated.sessionId || sessionId);
      const updatedCart = await cartService.addItem(cartId, validated.variantId, validated.quantity);

      res.setHeader('X-Cart-Id', cartId);
      ApiResponse.success(res, updatedCart, 'Item added to cart', 201);
    } catch (err) {
      next(err);
    }
  };

  updateItem = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const validated = UpdateCartItemSchema.parse(req.body);
      const { userId, sessionId } = this.getIdentifiers(req);
      const cartId = await cartService.getOrCreateCart(userId, sessionId);
      const updatedCart = await cartService.updateItemQuantity(cartId, req.params.id as string, validated.quantity);

      ApiResponse.success(res, updatedCart, 'Cart item updated successfully');
    } catch (err) {
      next(err);
    }
  };

  removeItem = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { userId, sessionId } = this.getIdentifiers(req);
      const cartId = await cartService.getOrCreateCart(userId, sessionId);
      const updatedCart = await cartService.removeItem(cartId, req.params.id as string);

      ApiResponse.success(res, updatedCart, 'Item removed from cart');
    } catch (err) {
      next(err);
    }
  };

  clearCart = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { userId, sessionId } = this.getIdentifiers(req);
      const cartId = await cartService.getOrCreateCart(userId, sessionId);
      const clearedCart = await cartService.clearCart(cartId);

      ApiResponse.success(res, clearedCart, 'Cart cleared successfully');
    } catch (err) {
      next(err);
    }
  };
}

export const cartController = new CartController();
