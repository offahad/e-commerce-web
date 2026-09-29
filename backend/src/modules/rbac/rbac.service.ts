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

  async listAuditLogs(page = 1, limit = 20, filter?: { action?: string; entityName?: string }) {
    const db = getDatabase();
    const offset = (page - 1) * limit;

    let baseQuery = db('audit_logs')
      .leftJoin('users', 'audit_logs.user_id', 'users.id');

    if (filter?.action) {
      baseQuery = baseQuery.whereILike('audit_logs.action', `%${filter.action}%`);
    }
    if (filter?.entityName) {
      baseQuery = baseQuery.where('audit_logs.entity_name', filter.entityName);
    }

    const countResult = await baseQuery.clone().count<{ count: string | number }>('audit_logs.id as count').first();
    const total = Number(countResult?.count || 0);

    const logs = await baseQuery
      .clone()
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

    // Sanitize any credentials or sensitive tokens from values
    const sanitizedLogs = logs.map((log: any) => {
      let oldValue = log.old_value;
      let newValue = log.new_value;
      try {
        if (oldValue) {
          const parsed = JSON.parse(oldValue);
          delete parsed.password;
          delete parsed.password_hash;
          delete parsed.mfa_secret;
          delete parsed.refresh_token_hash;
          oldValue = JSON.stringify(parsed);
        }
      } catch {}
      try {
        if (newValue) {
          const parsed = JSON.parse(newValue);
          delete parsed.password;
          delete parsed.password_hash;
          delete parsed.mfa_secret;
          delete parsed.refresh_token_hash;
          newValue = JSON.stringify(parsed);
        }
      } catch {}

      return {
        ...log,
        old_value: oldValue,
        new_value: newValue,
      };
    });

    return {
      logs: sanitizedLogs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }
}
