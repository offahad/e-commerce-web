import { getDatabase } from '../../database/index.js';

export class RbacService {
  async listRoles() {
    const db = getDatabase();
    const roles = await db('roles').select('*').orderBy('created_at', 'asc');

    const result = [];
    for (const role of roles) {
      const perms = await db('role_permissions')
        .join('permissions', 'role_permissions.permission_id', 'permissions.id')
        .where({ 'role_permissions.role_id': role.id })
        .select('permissions.id', 'permissions.code', 'permissions.description');

      result.push({
        id: role.id,
        name: role.name,
        description: role.description,
        permissions: perms,
      });
    }

    return result;
  }

  async listPermissions() {
    const db = getDatabase();
    return db('permissions').select('*').orderBy('code', 'asc');
  }

  async listAuditLogs(page = 1, limit = 20) {
    const db = getDatabase();
    const offset = (page - 1) * limit;

    const countResult = await db('audit_logs').count<{ count: string | number }>('id as count').first();
    const total = Number(countResult?.count || 0);

    const logs = await db('audit_logs')
      .leftJoin('users', 'audit_logs.user_id', 'users.id')
      .select(
        'audit_logs.id',
        'audit_logs.action',
        'audit_logs.entity_name',
        'audit_logs.entity_id',
        'audit_logs.old_value',
        'audit_logs.new_value',
        'audit_logs.ip_address',
        'audit_logs.user_agent',
        'audit_logs.created_at',
        'users.full_name as actor_name',
        'users.role as actor_role'
      )
      .orderBy('audit_logs.created_at', 'desc')
      .limit(limit)
      .offset(offset);

    return {
      logs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }
}
