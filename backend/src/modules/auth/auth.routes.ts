import { Router } from 'express';
import { AuthController } from './auth.controller.js';
import { authGuard } from '../../common/middleware/auth-guard.js';
import { authRateLimiter } from '../../common/middleware/rate-limiter.js';

const router = Router();
const controller = new AuthController();

router.post('/register', authRateLimiter, controller.register);
router.post('/login', authRateLimiter, controller.login);
router.post('/refresh', authRateLimiter, controller.refreshToken);
router.post('/logout', authGuard, controller.logout);
router.post('/change-password', authGuard, controller.changePassword);
router.get('/me', authGuard, controller.getMe);

export default router;
