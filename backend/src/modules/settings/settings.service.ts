import crypto from 'crypto';
import { getDb } from '../../database/index.js';

export class SettingsService {
  async getAllSettings(): Promise<Record<string, string>> {
    const db = getDb();
    const rows = await db('business_settings').select('key', 'value', 'description');
    const result: Record<string, string> = {};
    for (const row of rows) {
      result[row.key] = row.value;
    }
    return result;
  }

  async getSettingByKey(key: string): Promise<string | null> {
    const db = getDb();
    const row = await db('business_settings').where({ key }).first();
    return row ? row.value : null;
  }

  async updateSetting(key: string, value: string, description?: string) {
    const db = getDb();
    const existing = await db('business_settings').where({ key }).first();

    if (existing) {
      await db('business_settings')
        .where({ key })
        .update({
          value,
          description: description !== undefined ? description : existing.description,
          updated_at: db.fn.now(),
        });
    } else {
      await db('business_settings').insert({
        id: crypto.randomUUID(),
        key,
        value,
        description: description || null,
      });
    }

    return { key, value };
  }

  async updateMultipleSettings(settings: Record<string, string>) {
    const db = getDb();
    for (const [key, value] of Object.entries(settings)) {
      await this.updateSetting(key, value);
    }
    return this.getAllSettings();
  }
}

export const settingsService = new SettingsService();
