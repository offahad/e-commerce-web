import { Router } from 'express';
import { cartController } from './cart.controller.js';
import { optionalAuthGuard } from '../../common/middleware/auth-guard.js';

const router = Router();

// All cart endpoints support both authenticated customers and guest shoppers
router.use(optionalAuthGuard);

router.get('/', cartController.getCart);
router.post('/items', cartController.addItem);
router.put('/items/:id', cartController.updateItem);
router.delete('/items/:id', cartController.removeItem);
router.delete('/', cartController.clearCart);

export default router;
