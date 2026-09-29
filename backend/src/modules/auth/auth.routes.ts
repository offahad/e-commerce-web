import { Router } from 'express';
import { AuthController } from './auth.controller.js';
import { authGuard } from '../../common/middleware/auth-guard.js';
import { authRateLimiter } from '../../common/middleware/rate-limiter.js';

const router = Router();
const controller = new AuthController();

router.post('/register', authRateLimiter, controller.register);
router.post('/login', authRateLimiter, controller.login);
router.post('/mfa/verify-login', authRateLimiter, controller.verifyMfaLogin);
router.post('/forgot-password', authRateLimiter, controller.forgotPassword);
router.post('/reset-password', authRateLimiter, controller.resetPassword);
router.post('/refresh', authRateLimiter, controller.refreshToken);
router.post('/logout', authGuard, controller.logout);
router.post('/change-password', authGuard, controller.changePassword);
router.post('/mfa/setup', authGuard, controller.setupMfa);
router.post('/mfa/enable', authGuard, controller.enableMfa);
router.post('/mfa/disable', authGuard, controller.disableMfa);
router.get('/me', authGuard, controller.getMe);

export default router;
