import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { getDatabase } from '../../database/index.js';
import { config } from '../../config/index.js';
import { AppError } from '../../common/middleware/error-handler.js';
import {
  CreateStaffDto,
  UpdateStaffRoleDto,
  UpdateStaffStatusDto,
} from './staff.dto.js';

export class StaffService {
  private normalizePhone(phone: string): string {
    const cleaned = phone.replace(/[\s\-]/g, '');
    if (cleaned.startsWith('+880')) {
      return '0' + cleaned.substring(4);
    }
    if (cleaned.startsWith('880')) {
      return '0' + cleaned.substring(3);
    }
    return cleaned;
  }

  async listStaff() {
    const db = getDatabase();
    const staff = await db('users')
      .whereNot({ role: 'CUSTOMER' })
      .whereNull('deleted_at')
      .select(
        'id',
        'full_name',
        'phone',
        'email',
        'role',
        'status',
        'mfa_enabled',
        'last_login_at',
        'created_at',
        'updated_at'
      )
      .orderBy('created_at', 'desc');

    return staff;
  }

  async createStaff(dto: CreateStaffDto, actorId: string, ip?: string) {
    const db = getDatabase();
    const phone = this.normalizePhone(dto.phone);

    // 1. Check duplicate phone
    const existing = await db('users').where({ phone }).first();
    if (existing) {
      throw new AppError('A user account with this phone number already exists', 409, 'PHONE_EXISTS');
    }

    // 2. Check duplicate email if provided
    if (dto.email) {
      const existingEmail = await db('users').where({ email: dto.email }).first();
      if (existingEmail) {
        throw new AppError('A user account with this email address already exists', 409, 'EMAIL_EXISTS');
      }
    }

    const staffId = crypto.randomUUID();
    const passwordHash = await bcrypt.hash(dto.password, config.BCRYPT_ROUNDS);

    await db.transaction(async (trx) => {
      await trx('users').insert({
        id: staffId,
        full_name: dto.fullName,
        phone,
        email: dto.email || null,
        password_hash: passwordHash,
        address: 'Liton Brothers Operations Branch',
        status: 'APPROVED',
        role: dto.role,
        approved_at: db.fn.now(),
        approved_by: actorId,
      });

      // Audit Log - NEVER log credentials/secrets
      await trx('audit_logs').insert({
        id: crypto.randomUUID(),
        user_id: actorId,
        action: 'STAFF_CREATE',
        entity_name: 'users',
        entity_id: staffId,
        new_value: JSON.stringify({
          staffId,
          fullName: dto.fullName,
          phone,
          email: dto.email || null,
          role: dto.role,
          notes: dto.notes || 'Staff member invited by Super Admin',
          outcome: 'SUCCESS',
        }),
        ip_address: ip || null,
      });
    });

    const created = await db('users')
      .where({ id: staffId })
      .select('id', 'full_name', 'phone', 'email', 'role', 'status', 'created_at')
      .first();

    return created;
  }

  async updateRole(targetId: string, dto: UpdateStaffRoleDto, actorId: string, ip?: string) {
    if (targetId === actorId) {
      throw new AppError('Super Admins cannot modify their own role to prevent system lockout', 400, 'CANNOT_CHANGE_OWN_ROLE');
    }

    const db = getDatabase();
    const staff = await db('users')
      .where({ id: targetId })
      .whereNot({ role: 'CUSTOMER' })
      .whereNull('deleted_at')
      .first();

    if (!staff) {
      throw new AppError('Staff member not found', 404, 'STAFF_NOT_FOUND');
    }

    const oldRole = staff.role;

    await db.transaction(async (trx) => {
      await trx('users').where({ id: targetId }).update({
        role: dto.role,
        updated_at: db.fn.now(),
      });

      // Audit Log
      await trx('audit_logs').insert({
        id: crypto.randomUUID(),
        user_id: actorId,
        action: 'STAFF_ROLE_CHANGE',
        entity_name: 'users',
        entity_id: targetId,
        old_value: JSON.stringify({ role: oldRole }),
        new_value: JSON.stringify({
          role: dto.role,
          reason: dto.reason,
          outcome: 'SUCCESS',
        }),
        ip_address: ip || null,
      });
    });

    return { success: true, staffId: targetId, role: dto.role };
  }

  async updateStatus(targetId: string, dto: UpdateStaffStatusDto, actorId: string, ip?: string) {
    if (targetId === actorId) {
      throw new AppError('Super Admins cannot modify their own active account status', 400, 'CANNOT_MODIFY_OWN_STATUS');
    }

    const db = getDatabase();
    const staff = await db('users')
      .where({ id: targetId })
      .whereNot({ role: 'CUSTOMER' })
      .whereNull('deleted_at')
      .first();

    if (!staff) {
      throw new AppError('Staff member not found', 404, 'STAFF_NOT_FOUND');
    }

    const oldStatus = staff.status;

    await db.transaction(async (trx) => {
      await trx('users').where({ id: targetId }).update({
        status: dto.status,
        updated_at: db.fn.now(),
      });

      // Audit Log
      await trx('audit_logs').insert({
        id: crypto.randomUUID(),
        user_id: actorId,
        action: 'STAFF_STATUS_CHANGE',
        entity_name: 'users',
        entity_id: targetId,
        old_value: JSON.stringify({ status: oldStatus }),
        new_value: JSON.stringify({
          status: dto.status,
          reason: dto.reason,
          outcome: 'SUCCESS',
        }),
        ip_address: ip || null,
      });
    });

    return { success: true, staffId: targetId, status: dto.status };
  }

  async deleteStaff(targetId: string, actorId: string, ip?: string) {
    if (targetId === actorId) {
      throw new AppError('Super Admins cannot delete their own account', 400, 'CANNOT_DELETE_SELF');
    }

    const db = getDatabase();
    const staff = await db('users')
      .where({ id: targetId })
      .whereNot({ role: 'CUSTOMER' })
      .whereNull('deleted_at')
      .first();

    if (!staff) {
      throw new AppError('Staff member not found', 404, 'STAFF_NOT_FOUND');
    }

    await db.transaction(async (trx) => {
      await trx('users').where({ id: targetId }).update({
        status: 'BLOCKED',
        deleted_at: db.fn.now(),
        updated_at: db.fn.now(),
      });

      await trx('audit_logs').insert({
        id: crypto.randomUUID(),
        user_id: actorId,
        action: 'STAFF_DELETE',
        entity_name: 'users',
        entity_id: targetId,
        old_value: JSON.stringify({ fullName: staff.full_name, role: staff.role }),
        new_value: JSON.stringify({ status: 'BLOCKED', deleted: true, outcome: 'SUCCESS' }),
        ip_address: ip || null,
      });
    });

    return { success: true, message: 'Staff member account deactivated' };
  }
}
