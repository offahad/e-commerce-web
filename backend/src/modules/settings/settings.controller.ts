import { Request, Response, NextFunction } from 'express';
import { settingsService } from './settings.service.js';
import { UpdateSettingSchema, UpdateMultipleSettingsSchema } from './settings.dto.js';
import { ApiResponse } from '../../common/utils/api-response.js';

export class SettingsController {
  getAll = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const settings = await settingsService.getAllSettings();
      ApiResponse.success(res, settings, 'Business settings retrieved');
    } catch (err) {
      next(err);
    }
  };

  updateSingle = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const validated = UpdateSettingSchema.parse(req.body);
      const result = await settingsService.updateSetting(validated.key, validated.value, validated.description);
      ApiResponse.success(res, result, `Setting '${validated.key}' updated successfully`);
    } catch (err) {
      next(err);
    }
  };

  updateMultiple = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const validated = UpdateMultipleSettingsSchema.parse(req.body);
      const result = await settingsService.updateMultipleSettings(validated.settings);
      ApiResponse.success(res, result, 'Settings updated successfully');
    } catch (err) {
      next(err);
    }
  };
}

export const settingsController = new SettingsController();
