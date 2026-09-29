import crypto from 'crypto';
import { getDatabase } from '../../database/index.js';
import { AppError } from '../../common/middleware/error-handler.js';
import {
  UpdateProfileDto,
  AddressDto,
  AdminCustomerStatusDto,
  AdminCustomerQueryDto,
} from './users.dto.js';

export class UsersService {
  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const db = getDatabase();
    const updateData: any = { updated_at: db.fn.now() };

    if (dto.fullName) updateData.full_name = dto.fullName;
    if (dto.address) updateData.address = dto.address;
    if (dto.email !== undefined) {
      if (dto.email) {
        const existing = await db('users')
          .where({ email: dto.email })
          .whereNot({ id: userId })
          .first();
        if (existing) {
          throw new AppError('Email already taken by another account', 409, 'EMAIL_EXISTS');
        }
      }
      updateData.email = dto.email;
    }

    await db('users').where({ id: userId }).update(updateData);

    return db('users')
      .where({ id: userId })
      .select('id', 'full_name', 'phone', 'email', 'address', 'status', 'role', 'updated_at')
      .first();
  }

  async listAddresses(userId: string) {
    const db = getDatabase();
    return db('customer_addresses')
      .where({ user_id: userId })
      .orderBy('is_default', 'desc')
      .orderBy('created_at', 'desc');
  }

  async addAddress(userId: string, dto: AddressDto) {
    const db = getDatabase();
    const addressId = crypto.randomUUID();

    await db.transaction(async (trx) => {
      if (dto.isDefault) {
        await trx('customer_addresses').where({ user_id: userId }).update({ is_default: false });
      }

      await trx('customer_addresses').insert({
        id: addressId,
        user_id: userId,
        full_name: dto.fullName,
        phone: dto.phone,
        address: dto.address,
        division: dto.division,
        district: dto.district,
        area: dto.area || null,
        postal_code: dto.postalCode || null,
        address_type: dto.addressType,
        is_default: dto.isDefault,
        instructions: dto.instructions || null,
      });
    });

    return db('customer_addresses').where({ id: addressId }).first();
  }

  async updateAddress(userId: string, addressId: string, dto: Partial<AddressDto>) {
    const db = getDatabase();
    const existing = await db('customer_addresses')
      .where({ id: addressId, user_id: userId })
      .first();

    if (!existing) {
      throw new AppError('Address not found', 404, 'ADDRESS_NOT_FOUND');
    }

    await db.transaction(async (trx) => {
      if (dto.isDefault) {
        await trx('customer_addresses').where({ user_id: userId }).update({ is_default: false });
      }

      const updateData: any = { updated_at: db.fn.now() };
      if (dto.fullName) updateData.full_name = dto.fullName;
      if (dto.phone) updateData.phone = dto.phone;
      if (dto.address) updateData.address = dto.address;
      if (dto.division) updateData.division = dto.division;
      if (dto.district) updateData.district = dto.district;
      if (dto.area !== undefined) updateData.area = dto.area;
      if (dto.postalCode !== undefined) updateData.postal_code = dto.postalCode;
      if (dto.addressType) updateData.address_type = dto.addressType;
      if (dto.isDefault !== undefined) updateData.is_default = dto.isDefault;
      if (dto.instructions !== undefined) updateData.instructions = dto.instructions;

      await trx('customer_addresses').where({ id: addressId }).update(updateData);
    });

    return db('customer_addresses').where({ id: addressId }).first();
  }

  async deleteAddress(userId: string, addressId: string) {
    const db = getDatabase();
    const deleted = await db('customer_addresses')
      .where({ id: addressId, user_id: userId })
      .delete();

    if (!deleted) {
      throw new AppError('Address not found', 404, 'ADDRESS_NOT_FOUND');
    }

    return { deleted: true };
  }

  async setDefaultAddress(userId: string, addressId: string) {
    const db = getDatabase();
    const existing = await db('customer_addresses')
      .where({ id: addressId, user_id: userId })
      .first();

    if (!existing) {
      throw new AppError('Address not found', 404, 'ADDRESS_NOT_FOUND');
    }

    await db.transaction(async (trx) => {
      await trx('customer_addresses').where({ user_id: userId }).update({ is_default: false });
      await trx('customer_addresses').where({ id: addressId }).update({ is_default: true, updated_at: db.fn.now() });
    });

    return { success: true, defaultAddressId: addressId };
  }

  // --- Admin Methods ---

  async listCustomers(query: AdminCustomerQueryDto) {
    const db = getDatabase();
    const { page, limit, status, q } = query;
    const offset = (page - 1) * limit;

    let baseQuery = db('users').where({ role: 'CUSTOMER' }).whereNull('deleted_at');

    if (status) {
      baseQuery = baseQuery.where({ status });
    }

    if (q) {
      baseQuery = baseQuery.where((builder) => {
        builder.whereILike('full_name', `%${q}%`).orWhere('phone', 'like', `%${q}%`);
      });
    }

    const countResult = await baseQuery.clone().count<{ count: string | number }>('id as count').first();
    const total = Number(countResult?.count || 0);

    const customers = await baseQuery
      .clone()
      .select(
        'id',
        'full_name',
        'phone',
        'email',
        'address',
        'status',
        'role',
        'approved_at',
        'rejection_reason',
        'last_login_at',
        'created_at'
      )
      .orderBy('created_at', 'desc')
      .limit(limit)
      .offset(offset);

    return {
      customers,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  async getCustomer360(customerId: string) {
    const db = getDatabase();
    const customer = await db('users')
      .where({ id: customerId, role: 'CUSTOMER' })
      .whereNull('deleted_at')
      .first();

    if (!customer) {
      throw new AppError('Customer not found', 404, 'CUSTOMER_NOT_FOUND');
    }

    const addresses = await db('customer_addresses').where({ user_id: customerId });

    return {
      customer: {
        id: customer.id,
        fullName: customer.full_name,
        phone: customer.phone,
        email: customer.email,
        address: customer.address,
        status: customer.status,
        approvedAt: customer.approved_at,
        rejectionReason: customer.rejection_reason,
        lastLoginAt: customer.last_login_at,
        createdAt: customer.created_at,
      },
      addresses,
      stats: {
        totalOrders: 0,
        totalSpent: 0,
        averageOrderValue: 0,
      },
    };
  }

  async updateCustomerStatus(
    customerId: string,
    dto: AdminCustomerStatusDto,
    adminId: string,
    ip?: string,
    userAgent?: string
  ) {
    const db = getDatabase();
    const customer = await db('users').where({ id: customerId }).first();

    if (!customer) {
      throw new AppError('Customer not found', 404, 'CUSTOMER_NOT_FOUND');
    }

    const oldStatus = customer.status;
    const updateData: any = {
      status: dto.status,
      updated_at: db.fn.now(),
    };

    if (dto.status === 'APPROVED') {
      updateData.approved_at = db.fn.now();
      updateData.approved_by = adminId;
      updateData.rejection_reason = null;
    } else if (dto.status === 'REJECTED') {
      updateData.rejection_reason = dto.reason || 'Registration rejected by administrator';
    }

    await db.transaction(async (trx) => {
      await trx('users').where({ id: customerId }).update(updateData);

      // Record audit log
      await trx('audit_logs').insert({
        id: crypto.randomUUID(),
        user_id: adminId,
        action: `CUSTOMER_STATUS_${dto.status}`,
        entity_name: 'users',
        entity_id: customerId,
        old_value: JSON.stringify({ status: oldStatus }),
        new_value: JSON.stringify({ status: dto.status, reason: dto.reason || null }),
        ip_address: ip || null,
        user_agent: userAgent || null,
      });
    });

    const updated = await db('users')
      .where({ id: customerId })
      .select('id', 'full_name', 'phone', 'status', 'approved_at', 'rejection_reason', 'updated_at')
      .first();

    return updated;
  }
}
