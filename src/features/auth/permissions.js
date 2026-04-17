/**
 * @file src/features/auth/permissions.js
 * @description Declarative permission registry for the auth feature.
 *
 * Rules:
 * - Use <module>.<resource>.<action>
 * - Keep actions standard across Totistack
 * - roleTemplates are defaults only; final user permissions are resolved by generated access registries
 */

export default {
  module: 'auth',
  permissions: [
    { key: 'auth.users.read', resource: 'users', action: 'read', description: 'View users.' },
    { key: 'auth.users.create', resource: 'users', action: 'create', description: 'Create user records.' },
    { key: 'auth.users.update', resource: 'users', action: 'update', description: 'Edit user profiles and settings.' },
    { key: 'auth.users.delete', resource: 'users', action: 'delete', description: 'Delete user records.' },
    { key: 'auth.users.suspend', resource: 'users', action: 'suspend', description: 'Suspend users from access.' },
    { key: 'auth.users.activate', resource: 'users', action: 'activate', description: 'Re-activate suspended users.' },
    { key: 'auth.users.invite', resource: 'users', action: 'invite', description: 'Invite users to register.' },
    { key: 'auth.users.assign_roles', resource: 'users', action: 'assign_roles', description: 'Assign roles to users.' },
    { key: 'auth.users.reset_password', resource: 'users', action: 'reset_password', description: 'Trigger password reset flows.' },
    { key: 'auth.users.manage', resource: 'users', action: 'manage', description: 'Full control over users.' },

    { key: 'auth.roles.read', resource: 'roles', action: 'read', description: 'View roles.' },
    { key: 'auth.roles.create', resource: 'roles', action: 'create', description: 'Create roles.' },
    { key: 'auth.roles.update', resource: 'roles', action: 'update', description: 'Update roles.' },
    { key: 'auth.roles.delete', resource: 'roles', action: 'delete', description: 'Delete roles.' },
    { key: 'auth.roles.assign', resource: 'roles', action: 'assign', description: 'Assign roles in the system.' },
    { key: 'auth.roles.manage', resource: 'roles', action: 'manage', description: 'Full control over roles.' },

    { key: 'auth.sessions.read', resource: 'sessions', action: 'read', description: 'View session and access history.' },
    { key: 'auth.sessions.revoke', resource: 'sessions', action: 'revoke', description: 'Revoke active sessions.' },
    { key: 'auth.access.manage', resource: 'access', action: 'manage', description: 'Manage platform access control.' },
  ],
  roleTemplates: {
    admin: ['auth.users.manage', 'auth.roles.manage', 'auth.sessions.read', 'auth.sessions.revoke', 'auth.access.manage'],
    receptionist: ['auth.users.read', 'auth.users.invite'],
    consultant: [],
    finance_officer: ['auth.users.read'],
    viewer: ['auth.users.read'],
  },
}