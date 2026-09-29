import crypto from 'crypto';
import { getDatabase } from '../../database/index.js';
import { AppError } from '../../common/middleware/error-handler.js';
import {
  CreateBannerDto,
  UpdateBannerDto,
  UpdateBannerStatusDto,
} from './banners.dto.js';

export class BannersService {
  async listPublic() {
    const db = getDatabase();
    const now = new Date();

    const banners = await db('hero_banners')
      .where({ is_active: true, status: 'PUBLISHED' })
      .where((builder) => {
        builder.whereNull('start_date').orWhere('start_date', '<=', now);
      })
      .where((builder) => {
        builder.whereNull('end_date').orWhere('end_date', '>=', now);
      })
      .orderBy('display_order', 'asc')
      .orderBy('created_at', 'desc');

    return banners.map((b) => ({
      id: b.id,
      headline: b.title,
      subtext: b.subtitle,
      buttonText: b.button_text || 'Shop now',
      imageUrl: b.image_url,
      imageAlt: b.image_alt || 'Promotional banner',
      badgeText: b.tag || 'Featured Campaign',
      targetCategory: b.destination_category || 'vegetables',
      destinationLink: b.destination_link || null,
      displayOrder: b.display_order,
      startDate: b.start_date,
      endDate: b.end_date,
      status: b.status,
    }));
  }

  async listAdmin() {
    const db = getDatabase();
    const banners = await db('hero_banners')
      .leftJoin('users', 'hero_banners.created_by', 'users.id')
      .select(
        'hero_banners.*',
        'users.full_name as created_by_name'
      )
      .orderBy('display_order', 'asc')
      .orderBy('created_at', 'desc');

    return banners;
  }

  async getById(id: string) {
    const db = getDatabase();
    const banner = await db('hero_banners').where({ id }).first();
    if (!banner) {
      throw new AppError('Banner not found', 404, 'BANNER_NOT_FOUND');
    }
    return banner;
  }

  async create(dto: CreateBannerDto, adminId?: string, ip?: string) {
    const db = getDatabase();
    const bannerId = crypto.randomUUID();

    await db.transaction(async (trx) => {
      await trx('hero_banners').insert({
        id: bannerId,
        title: dto.title,
        subtitle: dto.subtitle || null,
        tag: dto.tag || null,
        button_text: dto.buttonText || 'Shop now',
        image_url: dto.imageUrl,
        image_alt: dto.imageAlt || 'Promotional banner',
        destination_link: dto.destinationLink || null,
        destination_category: dto.destinationCategory || null,
        display_order: dto.displayOrder || 1,
        start_date: dto.startDate ? new Date(dto.startDate) : null,
        end_date: dto.endDate ? new Date(dto.endDate) : null,
        status: dto.status || 'PUBLISHED',
        is_active: dto.isActive !== undefined ? dto.isActive : true,
        created_by: adminId || null,
      });

      await trx('audit_logs').insert({
        id: crypto.randomUUID(),
        user_id: adminId || null,
        action: 'BANNER_CREATE',
        entity_name: 'hero_banners',
        entity_id: bannerId,
        new_value: JSON.stringify({
          title: dto.title,
          status: dto.status,
          displayOrder: dto.displayOrder,
        }),
        ip_address: ip || null,
      });
    });

    return this.getById(bannerId);
  }

  async update(id: string, dto: UpdateBannerDto, adminId?: string, ip?: string) {
    const db = getDatabase();
    const existing = await this.getById(id);

    const updateData: any = { updated_at: db.fn.now() };
    if (dto.title) updateData.title = dto.title;
    if (dto.subtitle !== undefined) updateData.subtitle = dto.subtitle;
    if (dto.tag !== undefined) updateData.tag = dto.tag;
    if (dto.buttonText) updateData.button_text = dto.buttonText;
    if (dto.imageUrl) updateData.image_url = dto.imageUrl;
    if (dto.imageAlt !== undefined) updateData.image_alt = dto.imageAlt;
    if (dto.destinationLink !== undefined) updateData.destination_link = dto.destinationLink;
    if (dto.destinationCategory !== undefined) updateData.destination_category = dto.destinationCategory;
    if (dto.displayOrder !== undefined) updateData.display_order = dto.displayOrder;
    if (dto.startDate !== undefined) updateData.start_date = dto.startDate ? new Date(dto.startDate) : null;
    if (dto.endDate !== undefined) updateData.end_date = dto.endDate ? new Date(dto.endDate) : null;
    if (dto.status) updateData.status = dto.status;
    if (dto.isActive !== undefined) updateData.is_active = dto.isActive;

    await db.transaction(async (trx) => {
      await trx('hero_banners').where({ id }).update(updateData);

      const cleanUpdateData = { ...updateData };
      delete cleanUpdateData.updated_at;

      await trx('audit_logs').insert({
        id: crypto.randomUUID(),
        user_id: adminId || null,
        action: 'BANNER_UPDATE',
        entity_name: 'hero_banners',
        entity_id: id,
        old_value: JSON.stringify({ title: existing.title, status: existing.status }),
        new_value: JSON.stringify(cleanUpdateData),
        ip_address: ip || null,
      });
    });

    return this.getById(id);
  }

  async updateStatus(id: string, dto: UpdateBannerStatusDto, adminId?: string, ip?: string) {
    const db = getDatabase();
    const existing = await this.getById(id);

    const updateData: any = { updated_at: db.fn.now() };
    if (dto.status) updateData.status = dto.status;
    if (dto.isActive !== undefined) updateData.is_active = dto.isActive;

    await db.transaction(async (trx) => {
      await trx('hero_banners').where({ id }).update(updateData);

      const cleanUpdateData = { ...updateData };
      delete cleanUpdateData.updated_at;

      await trx('audit_logs').insert({
        id: crypto.randomUUID(),
        user_id: adminId || null,
        action: 'BANNER_STATUS_CHANGE',
        entity_name: 'hero_banners',
        entity_id: id,
        old_value: JSON.stringify({ status: existing.status, isActive: existing.is_active }),
        new_value: JSON.stringify(cleanUpdateData),
        ip_address: ip || null,
      });
    });

    return this.getById(id);
  }

  async delete(id: string, adminId?: string, ip?: string) {
    const db = getDatabase();
    const existing = await this.getById(id);

    await db.transaction(async (trx) => {
      await trx('hero_banners').where({ id }).delete();

      await trx('audit_logs').insert({
        id: crypto.randomUUID(),
        user_id: adminId || null,
        action: 'BANNER_DELETE',
        entity_name: 'hero_banners',
        entity_id: id,
        old_value: JSON.stringify({ title: existing.title, id }),
        ip_address: ip || null,
      });
    });

    return { success: true, id };
  }
}
