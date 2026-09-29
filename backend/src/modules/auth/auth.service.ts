import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { getDatabase } from '../../database/index.js';
import { config } from '../../config/index.js';
import { AppError } from '../../common/middleware/error-handler.js';
import { RegisterDto, LoginDto, RefreshTokenDto, ChangePasswordDto } from './auth.dto.js';

export class AuthService {
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

  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  private generateTokens(userId: string, role: string, rememberMe = false) {
    const accessToken = jwt.sign(
      { userId, role, jti: crypto.randomUUID() },
      config.JWT_SECRET,
      { expiresIn: config.JWT_EXPIRES_IN as any }
    );

    const refreshExpiry = rememberMe ? '30d' : config.JWT_REFRESH_EXPIRES_IN;
    const refreshToken = jwt.sign(
      { userId, role, type: 'refresh', jti: crypto.randomUUID() },
      config.JWT_REFRESH_SECRET,
      { expiresIn: refreshExpiry as any }
    );

    return { accessToken, refreshToken };
  }

  async register(dto: RegisterDto) {
    const db = getDatabase();
    const phone = this.normalizePhone(dto.phone);

    // 1. Check if phone is already registered
    const existing = await db('users').where({ phone }).first();
    if (existing) {
      throw new AppError('An account with this phone number already exists', 409, 'PHONE_ALREADY_EXISTS');
    }

    if (dto.email) {
      const existingEmail = await db('users').where({ email: dto.email }).first();
      if (existingEmail) {
        throw new AppError('An account with this email address already exists', 409, 'EMAIL_ALREADY_EXISTS');
      }
    }

    // 2. Hash password
    const passwordHash = await bcrypt.hash(dto.password, config.BCRYPT_ROUNDS);
    const userId = crypto.randomUUID();

    // 3. Create user in PENDING_APPROVAL status
    await db.transaction(async (trx) => {
      await trx('users').insert({
        id: userId,
        full_name: dto.fullName,
        phone,
        password_hash: passwordHash,
        email: dto.email || null,
        address: dto.address,
        status: 'PENDING_APPROVAL',
        role: 'CUSTOMER',
      });

      // Create primary default address
      await trx('customer_addresses').insert({
        id: crypto.randomUUID(),
        user_id: userId,
        full_name: dto.fullName,
        phone,
        address: dto.address,
        division: 'Dhaka',
        district: 'Dhaka',
        address_type: 'HOME',
        is_default: true,
      });

      // Create audit log
      await trx('audit_logs').insert({
        id: crypto.randomUUID(),
        user_id: userId,
        action: 'CUSTOMER_REGISTER',
        entity_name: 'users',
        entity_id: userId,
        new_value: JSON.stringify({ phone, fullName: dto.fullName, status: 'PENDING_APPROVAL' }),
      });
    });

    const user = await db('users')
      .where({ id: userId })
      .select('id', 'full_name', 'phone', 'email', 'address', 'status', 'role', 'created_at')
      .first();

    return {
      user,
      statusMessage: 'Registration successful. Your account is pending administrator approval before shopping.',
    };
  }

  async login(dto: LoginDto) {
    const db = getDatabase();
    const phone = this.normalizePhone(dto.phone);

    const user = await db('users')
      .where({ phone })
      .whereNull('deleted_at')
      .first();

    if (!user) {
      throw new AppError('Invalid phone number or password', 401, 'INVALID_CREDENTIALS');
    }

    // Check account status
    if (user.status === 'BLOCKED') {
      throw new AppError('Your account has been blocked. Please contact customer support.', 403, 'ACCOUNT_BLOCKED');
    }

    if (user.status === 'SUSPENDED') {
      throw new AppError('Your account has been temporarily suspended.', 403, 'ACCOUNT_SUSPENDED');
    }

    if (user.status === 'REJECTED') {
      throw new AppError('Your account registration has been rejected by administration.', 403, 'ACCOUNT_REJECTED');
    }

    const isMatch = await bcrypt.compare(dto.password, user.password_hash);
    if (!isMatch) {
      throw new AppError('Invalid phone number or password', 401, 'INVALID_CREDENTIALS');
    }

    // Generate tokens
    const { accessToken, refreshToken } = this.generateTokens(user.id, user.role, dto.rememberMe);
    const refreshTokenHash = this.hashToken(refreshToken);

    // Save rotated refresh token hash and update last login
    await db('users')
      .where({ id: user.id })
      .update({
        refresh_token_hash: refreshTokenHash,
        last_login_at: db.fn.now(),
        updated_at: db.fn.now(),
      });

    // Fetch permissions
    let permissions: string[] = [];
    const roleRecord = await db('roles').where({ name: user.role }).first();
    if (roleRecord) {
      const perms = await db('role_permissions')
        .join('permissions', 'role_permissions.permission_id', 'permissions.id')
        .where({ 'role_permissions.role_id': roleRecord.id })
        .select('permissions.code');
      permissions = perms.map((p) => p.code);
    }

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        fullName: user.full_name,
        phone: user.phone,
        email: user.email,
        address: user.address,
        status: user.status,
        role: user.role,
        permissions,
        isApproved: user.status === 'APPROVED',
      },
    };
  }

  async refreshToken(dto: RefreshTokenDto) {
    const db = getDatabase();

    let decoded: any;
    try {
      decoded = jwt.verify(dto.refreshToken, config.JWT_REFRESH_SECRET);
    } catch {
      throw new AppError('Invalid or expired refresh token', 401, 'INVALID_REFRESH_TOKEN');
    }

    const incomingHash = this.hashToken(dto.refreshToken);

    const user = await db('users')
      .where({ id: decoded.userId })
      .whereNull('deleted_at')
      .first();

    if (!user || user.refresh_token_hash !== incomingHash) {
      // Possible token reuse attack detected! Revoke all tokens for safety
      if (user) {
        await db('users').where({ id: user.id }).update({ refresh_token_hash: null });
      }
      throw new AppError('Invalid refresh token session. Please log in again.', 401, 'REFRESH_TOKEN_REUSED');
    }

    if (user.status === 'BLOCKED' || user.status === 'SUSPENDED') {
      throw new AppError('Account is not allowed to access this service', 403, 'ACCOUNT_RESTRICTED');
    }

    // Token Rotation: issue brand new pair and update hash
    const { accessToken, refreshToken: newRefreshToken } = this.generateTokens(user.id, user.role);
    const newHash = this.hashToken(newRefreshToken);

    await db('users').where({ id: user.id }).update({
      refresh_token_hash: newHash,
      updated_at: db.fn.now(),
    });

    return {
      accessToken,
      refreshToken: newRefreshToken,
    };
  }

  async logout(userId: string) {
    const db = getDatabase();
    await db('users').where({ id: userId }).update({
      refresh_token_hash: null,
      updated_at: db.fn.now(),
    });
    return { success: true };
  }

  async changePassword(userId: string, dto: ChangePasswordDto) {
    const db = getDatabase();
    const user = await db('users').where({ id: userId }).first();

    if (!user) {
      throw new AppError('User not found', 404, 'USER_NOT_FOUND');
    }

    const isMatch = await bcrypt.compare(dto.currentPassword, user.password_hash);
    if (!isMatch) {
      throw new AppError('Current password is incorrect', 400, 'INCORRECT_CURRENT_PASSWORD');
    }

    const newHash = await bcrypt.hash(dto.newPassword, config.BCRYPT_ROUNDS);

    // Update password and invalidate active refresh tokens
    await db('users').where({ id: userId }).update({
      password_hash: newHash,
      refresh_token_hash: null,
      updated_at: db.fn.now(),
    });

    return { success: true };
  }

  async getMe(userId: string) {
    const db = getDatabase();
    const user = await db('users')
      .where({ id: userId })
      .whereNull('deleted_at')
      .first();

    if (!user) {
      throw new AppError('User not found', 404, 'USER_NOT_FOUND');
    }

    let permissions: string[] = [];
    const roleRecord = await db('roles').where({ name: user.role }).first();
    if (roleRecord) {
      const perms = await db('role_permissions')
        .join('permissions', 'role_permissions.permission_id', 'permissions.id')
        .where({ 'role_permissions.role_id': roleRecord.id })
        .select('permissions.code');
      permissions = perms.map((p) => p.code);
    }

    const defaultAddress = await db('customer_addresses')
      .where({ user_id: userId, is_default: true })
      .first();

    return {
      id: user.id,
      fullName: user.full_name,
      phone: user.phone,
      email: user.email,
      address: user.address,
      status: user.status,
      role: user.role,
      permissions,
      defaultAddress: defaultAddress || null,
      createdAt: user.created_at,
    };
  }
}
