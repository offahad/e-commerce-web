import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import sharp from 'sharp';
import { AppError } from '../../common/middleware/error-handler.js';

export class MediaService {
  private uploadDir: string;

  constructor() {
    this.uploadDir = path.join(process.cwd(), 'uploads', 'products');
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  async processImage(file: Express.Multer.File) {
    if (!file || !file.buffer) {
      throw new AppError('No image file provided', 400, 'NO_FILE_PROVIDED');
    }

    // Validate MIME type
    const allowedMimes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedMimes.includes(file.mimetype)) {
      throw new AppError('Invalid image format. Supported formats: JPEG, PNG, WebP', 400, 'INVALID_MIME_TYPE');
    }

    const uniqueId = crypto.randomUUID();
    const mainFileName = `${uniqueId}.webp`;
    const thumbFileName = `${uniqueId}-thumb.webp`;

    const mainFilePath = path.join(this.uploadDir, mainFileName);
    const thumbFilePath = path.join(this.uploadDir, thumbFileName);

    try {
      // 1. Process Main Image: Max 1200x1200, WebP quality 85, strip EXIF
      const mainMetadata = await sharp(file.buffer)
        .rotate() // Auto-orient based on EXIF
        .resize({ width: 1200, height: 1200, fit: 'inside', withoutEnlargement: true })
        .webp({ quality: 85 })
        .toFile(mainFilePath);

      // 2. Process Thumbnail: 300x300, WebP quality 80
      await sharp(file.buffer)
        .rotate()
        .resize({ width: 300, height: 300, fit: 'cover' })
        .webp({ quality: 80 })
        .toFile(thumbFilePath);

      return {
        url: `/uploads/products/${mainFileName}`,
        thumbnailUrl: `/uploads/products/${thumbFileName}`,
        format: 'webp',
        width: mainMetadata.width,
        height: mainMetadata.height,
        sizeBytes: mainMetadata.size,
      };
    } catch (err: any) {
      throw new AppError(`Image processing failed: ${err.message}`, 500, 'IMAGE_PROCESSING_ERROR');
    }
  }
}
