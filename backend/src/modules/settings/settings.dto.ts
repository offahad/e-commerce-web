import { z } from 'zod';

export const UpdateSettingSchema = z.object({
  key: z.string().min(1),
  value: z.string(),
  description: z.string().optional(),
});

export const UpdateMultipleSettingsSchema = z.object({
  settings: z.record(z.string()),
});
