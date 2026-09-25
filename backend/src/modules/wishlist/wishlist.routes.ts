import { Router } from 'express';
import { wishlistController } from './wishlist.controller.js';
import { authGuard } from '../../common/middleware/auth-guard.js';
import { customerApprovalGuard } from '../../common/middleware/customer-approval-guard.js';

const router = Router();

router.use(authGuard);
router.use(customerApprovalGuard);

router.get('/', wishlistController.getWishlist);
router.post('/:productId', wishlistController.toggleWishlist);
router.delete('/:productId', wishlistController.removeItem);

export default router;
