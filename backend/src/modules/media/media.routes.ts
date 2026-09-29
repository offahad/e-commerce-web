import { Request, Response, NextFunction } from 'express';
import multer from 'multer';
import { MediaService } from './media.service.js';
import { ApiResponse } from '../../common/utils/api-response.js';
import { authGuard } from '../../common/middleware/auth-guard.js';
import { requirePermission, requireRole } from '../../common/middleware/rbac-guard.js';

// Memory storage for Sharp processing
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
});

export class MediaController {
  private mediaService: MediaService;

  constructor() {
    this.mediaService = new MediaService();
  }

  uploadProductImage = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const file = req.file;
      if (!file) {
        return ApiResponse.error(res, 'Please provide an image file with key "image"', 'NO_FILE', 400);
      }
      const result = await this.mediaService.processImage(file);
      return ApiResponse.success(res, result, 'Image uploaded and optimized to WebP successfully', 201);
    } catch (err) {
      next(err);
    }
  };
}

import { Router } from 'express';
const router = Router();
const controller = new MediaController();

router.use(authGuard);
router.use(requireRole('SUPER_ADMIN', 'ADMIN', 'MANAGER'));
router.post('/upload', requirePermission('PRODUCT_CREATE'), upload.single('image'), controller.uploadProductImage);

export default router;
