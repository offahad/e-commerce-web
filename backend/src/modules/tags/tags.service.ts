import crypto from 'crypto';
import { getDatabase } from '../../database/index.js';
import { AppError } from '../../common/middleware/error-handler.js';
import { CreateTagDto } from './tags.dto.js';

export class TagsService {
  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  async list() {
    const db = getDatabase();
    return db('tags').orderBy('name', 'asc');
  }

  async create(dto: CreateTagDto) {
    const db = getDatabase();
    const slug = dto.slug || this.generateSlug(dto.name);

    const existing = await db('tags').where({ slug }).first();
    if (existing) {
      throw new AppError('A tag with this name or slug already exists', 409, 'TAG_EXISTS');
    }

    const id = crypto.randomUUID();
    await db('tags').insert({
      id,
      name: dto.name,
      slug,
      description: dto.description || null,
    });

    return db('tags').where({ id }).first();
  }
}
