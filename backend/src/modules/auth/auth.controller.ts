import { Request, Response, NextFunction } from 'express';
import { AuthService } from './auth.service.js';
import { ApiResponse } from '../../common/utils/api-response.js';
import {
  registerSchema,
  loginSchema,
  refreshTokenSchema,
  changePasswordSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  mfaVerifySchema,
} from './auth.dto.js';

export class AuthController {
  private authService: AuthService;

  constructor() {
    this.authService = new AuthService();
  }

  register = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const validated = registerSchema.parse(req.body);
      const result = await this.authService.register(validated);
      return ApiResponse.success(res, result, 'Registration successful', 201);
    } catch (err) {
      next(err);
    }
  };

  login = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const validated = loginSchema.parse(req.body);
      const result = await this.authService.login(validated);
      return ApiResponse.success(res, result, 'Login successful');
    } catch (err) {
      next(err);
    }
  };

  verifyMfaLogin = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const validated = mfaVerifySchema.parse(req.body);
      if (!validated.tempToken) {
        return ApiResponse.error(res, 'Temporary MFA session token required', 'MISSING_TEMP_TOKEN', 400);
      }
      const result = await this.authService.verifyMfaLogin(validated.tempToken, validated.code);
      return ApiResponse.success(res, result, 'MFA login verified successfully');
    } catch (err) {
      next(err);
    }
  };

  forgotPassword = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const validated = forgotPasswordSchema.parse(req.body);
      const result = await this.authService.forgotPassword(validated);
      return ApiResponse.success(res, result, result.message);
    } catch (err) {
      next(err);
    }
  };

  resetPassword = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const validated = resetPasswordSchema.parse(req.body);
      const result = await this.authService.resetPassword(validated);
      return ApiResponse.success(res, result, result.message);
    } catch (err) {
      next(err);
    }
  };

  setupMfa = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await this.authService.setupMfa(req.user!.id);
      return ApiResponse.success(res, result, 'MFA setup initiated');
    } catch (err) {
      next(err);
    }
  };

  enableMfa = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const code = req.body.code;
      if (!code) {
        return ApiResponse.error(res, 'Verification code is required', 'MISSING_CODE', 400);
      }
      const result = await this.authService.enableMfa(req.user!.id, code);
      return ApiResponse.success(res, result, result.message);
    } catch (err) {
      next(err);
    }
  };

  disableMfa = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const code = req.body.code;
      if (!code) {
        return ApiResponse.error(res, 'Verification code is required', 'MISSING_CODE', 400);
      }
      const result = await this.authService.disableMfa(req.user!.id, code);
      return ApiResponse.success(res, result, result.message);
    } catch (err) {
      next(err);
    }
  };

  refreshToken = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const validated = refreshTokenSchema.parse(req.body);
      const result = await this.authService.refreshToken(validated);
      return ApiResponse.success(res, result, 'Token refreshed successfully');
    } catch (err) {
      next(err);
    }
  };

  logout = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (req.user) {
        await this.authService.logout(req.user.id);
      }
      return ApiResponse.success(res, { loggedOut: true }, 'Logged out successfully');
    } catch (err) {
      next(err);
    }
  };

  changePassword = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const validated = changePasswordSchema.parse(req.body);
      await this.authService.changePassword(req.user!.id, validated);
      return ApiResponse.success(res, { changed: true }, 'Password changed successfully');
    } catch (err) {
      next(err);
    }
  };

  getMe = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const me = await this.authService.getMe(req.user!.id);
      return ApiResponse.success(res, me, 'User profile retrieved successfully');
    } catch (err) {
      next(err);
    }
  };
}
