import { Router } from 'express';
import { checkoutController } from './checkout.controller.js';
import { optionalAuthGuard } from '../../common/middleware/auth-guard.js';

const router = Router();

// Preview calculation allows authenticated or guest session
router.post('/preview', optionalAuthGuard, checkoutController.preview);

export default router;
