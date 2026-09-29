import crypto from 'crypto';
import { getDatabase } from '../../database/index.js';
import { AppError } from '../../common/middleware/error-handler.js';
import { CreateCategoryDto, UpdateCategoryDto } from './categories.dto.js';

export class CategoriesService {
  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  async listTree() {
    const db = getDatabase();
    const categories = await db('categories')
      .where({ is_active: true })
      .orderBy('sort_order', 'asc')
      .orderBy('name', 'asc');

    // Group hierarchical categories
    const parentCategories = categories.filter((c) => !c.parent_id);
    const result = parentCategories.map((parent) => {
      const children = categories.filter((c) => c.parent_id === parent.id);
      return {
        id: parent.id,
        name: parent.name,
        slug: parent.slug,
        imageUrl: parent.image_url,
        description: parent.description,
        sortOrder: parent.sort_order,
        children: children.map((ch) => ({
          id: ch.id,
          name: ch.name,
          slug: ch.slug,
          imageUrl: ch.image_url,
          description: ch.description,
          sortOrder: ch.sort_order,
        })),
      };
    });

    return result;
  }

  async getBySlug(slug: string) {
    const db = getDatabase();
    const category = await db('categories').where({ slug }).first();

    if (!category) {
      throw new AppError('Category not found', 404, 'CATEGORY_NOT_FOUND');
    }

    const children = await db('categories')
      .where({ parent_id: category.id, is_active: true })
      .orderBy('sort_order', 'asc');

    let parent = null;
    if (category.parent_id) {
      parent = await db('categories').where({ id: category.parent_id }).first();
    }

    // Count products
    const productCountRes = await db('products')
      .where({ primary_category_id: category.id, status: 'ACTIVE' })
      .whereNull('deleted_at')
      .count<{ count: string | number }>('id as count')
      .first();

    return {
      ...category,
      parent,
      children,
      productCount: Number(productCountRes?.count || 0),
    };
  }

  async create(dto: CreateCategoryDto) {
    const db = getDatabase();
    const slug = dto.slug || this.generateSlug(dto.name);

    const existing = await db('categories').where({ slug }).first();
    if (existing) {
      throw new AppError('A category with this name/slug already exists', 409, 'CATEGORY_EXISTS');
    }

    if (dto.parentId) {
      const parent = await db('categories').where({ id: dto.parentId }).first();
      if (!parent) {
        throw new AppError('Parent category not found', 404, 'PARENT_CATEGORY_NOT_FOUND');
      }
    }

    const id = crypto.randomUUID();
    await db('categories').insert({
      id,
      name: dto.name,
      slug,
      parent_id: dto.parentId || null,
      image_url: dto.imageUrl || null,
      description: dto.description || null,
      sort_order: dto.sortOrder,
      is_active: dto.isActive,
    });

    return db('categories').where({ id }).first();
  }

  async update(id: string, dto: UpdateCategoryDto) {
    const db = getDatabase();
    const existing = await db('categories').where({ id }).first();
    if (!existing) {
      throw new AppError('Category not found', 404, 'CATEGORY_NOT_FOUND');
    }

    const updateData: any = { updated_at: db.fn.now() };
    if (dto.name) updateData.name = dto.name;
    if (dto.slug) updateData.slug = dto.slug;
    if (dto.parentId !== undefined) updateData.parent_id = dto.parentId;
    if (dto.imageUrl !== undefined) updateData.image_url = dto.imageUrl;
    if (dto.description !== undefined) updateData.description = dto.description;
    if (dto.sortOrder !== undefined) updateData.sort_order = dto.sortOrder;
    if (dto.isActive !== undefined) updateData.is_active = dto.isActive;

    await db('categories').where({ id }).update(updateData);
    return db('categories').where({ id }).first();
  }

  async delete(id: string) {
    const db = getDatabase();
    const existing = await db('categories').where({ id }).first();
    if (!existing) {
      throw new AppError('Category not found', 404, 'CATEGORY_NOT_FOUND');
    }

    // Check if any product is using this category
    const productUsing = await db('products').where({ primary_category_id: id }).first();
    if (productUsing) {
      throw new AppError('Cannot delete category: products are assigned to it', 400, 'CATEGORY_IN_USE');
    }

    await db('categories').where({ id }).delete();
    return { deleted: true };
  }
}
