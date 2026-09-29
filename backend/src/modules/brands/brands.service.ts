import crypto from 'crypto';
import { getDatabase } from '../../database/index.js';
import { AppError } from '../../common/middleware/error-handler.js';
import { CreateBrandDto, UpdateBrandDto } from './brands.dto.js';

export class BrandsService {
  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  async list(activeOnly = true) {
    const db = getDatabase();
    let query = db('brands').orderBy('name', 'asc');
    if (activeOnly) {
      query = query.where({ is_active: true });
    }
    return query;
  }

  async getBySlug(slug: string) {
    const db = getDatabase();
    const brand = await db('brands').where({ slug }).first();
    if (!brand) {
      throw new AppError('Brand not found', 404, 'BRAND_NOT_FOUND');
    }

    const countRes = await db('products')
      .where({ brand_id: brand.id, status: 'ACTIVE' })
      .whereNull('deleted_at')
      .count<{ count: string | number }>('id as count')
      .first();

    return {
      ...brand,
      productCount: Number(countRes?.count || 0),
    };
  }

  async create(dto: CreateBrandDto) {
    const db = getDatabase();
    const slug = dto.slug || this.generateSlug(dto.name);

    const existing = await db('brands').where({ slug }).first();
    if (existing) {
      throw new AppError('A brand with this name or slug already exists', 409, 'BRAND_EXISTS');
    }

    const id = crypto.randomUUID();
    await db('brands').insert({
      id,
      name: dto.name,
      slug,
      logo_url: dto.logoUrl || null,
      description: dto.description || null,
      is_active: dto.isActive,
    });

    return db('brands').where({ id }).first();
  }

  async update(id: string, dto: UpdateBrandDto) {
    const db = getDatabase();
    const existing = await db('brands').where({ id }).first();
    if (!existing) {
      throw new AppError('Brand not found', 404, 'BRAND_NOT_FOUND');
    }

    const updateData: any = { updated_at: db.fn.now() };
    if (dto.name) updateData.name = dto.name;
    if (dto.slug) updateData.slug = dto.slug;
    if (dto.logoUrl !== undefined) updateData.logo_url = dto.logoUrl;
    if (dto.description !== undefined) updateData.description = dto.description;
    if (dto.isActive !== undefined) updateData.is_active = dto.isActive;

    await db('brands').where({ id }).update(updateData);
    return db('brands').where({ id }).first();
  }

  async delete(id: string) {
    const db = getDatabase();
    const existing = await db('brands').where({ id }).first();
    if (!existing) {
      throw new AppError('Brand not found', 404, 'BRAND_NOT_FOUND');
    }

    const productUsing = await db('products').where({ brand_id: id }).first();
    if (productUsing) {
      throw new AppError('Cannot delete brand: products are assigned to it', 400, 'BRAND_IN_USE');
    }

    await db('brands').where({ id }).delete();
    return { deleted: true };
  }
}
