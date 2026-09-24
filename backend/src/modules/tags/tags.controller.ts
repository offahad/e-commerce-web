import { Request, Response, NextFunction } from 'express';
import { TagsService } from './tags.service.js';
import { ApiResponse } from '../../common/utils/api-response.js';
import { createTagSchema } from './tags.dto.js';

export class TagsController {
  private tagsService: TagsService;

  constructor() {
    this.tagsService = new TagsService();
  }

  list = async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const tags = await this.tagsService.list();
      return ApiResponse.success(res, tags, 'Tags retrieved');
    } catch (err) {
      next(err);
    }
  };

  create = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const validated = createTagSchema.parse(req.body);
      const created = await this.tagsService.create(validated);
      return ApiResponse.success(res, created, 'Tag created successfully', 201);
    } catch (err) {
      next(err);
    }
  };
}
