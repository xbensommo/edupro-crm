/**
 * @file auth/permissions.js
 * @description EduProLIC auth permission registry.
 */

export default {
  module: 'auth',
  permissions: [
    { key: 'auth.users.read', resource: 'users', action: 'read', description: 'View user accounts.' },
    { key: 'auth.users.manage', resource: 'users', action: 'manage', description: 'Create, update, suspend, reactivate, and manage users.' },
    { key: 'auth.users.invite', resource: 'users', action: 'invite', description: 'Create user invitation links.' },
    { key: 'auth.users.suspend', resource: 'users', action: 'suspend', description: 'Suspend or reactivate a user.' },
    { key: 'auth.invites.read', resource: 'invites', action: 'read', description: 'View invitations.' },
    { key: 'auth.invites.create', resource: 'invites', action: 'create', description: 'Create invitations.' },
    { key: 'auth.invites.update', resource: 'invites', action: 'update', description: 'Revoke or extend invitations.' },
    { key: 'auth.roles.manage', resource: 'roles', action: 'manage', description: 'Manage role assignments.' },
    { key: 'auth.sessions.read', resource: 'sessions', action: 'read', description: 'View sessions.' },
    { key: 'auth.sessions.revoke', resource: 'sessions', action: 'revoke', description: 'Revoke active sessions.' },
    { key: 'auth.access.manage', resource: 'access', action: 'manage', description: 'Manage platform access control.' },
  ],
  roleTemplates: {
    admin: ['auth.users.read', 'auth.users.manage', 'auth.users.invite', 'auth.users.suspend', 'auth.invites.read', 'auth.invites.create', 'auth.invites.update', 'auth.roles.manage', 'auth.sessions.read', 'auth.sessions.revoke', 'auth.access.manage'],
    receptionist: ['auth.users.read', 'auth.users.manage', 'auth.users.invite', 'auth.users.suspend', 'auth.invites.read', 'auth.invites.create', 'auth.invites.update'],
    consultant: ['auth.invites.read'],
    consultant_editor: ['auth.invites.read'],
    sysadmin: ['auth.users.read', 'auth.users.manage', 'auth.users.invite', 'auth.users.suspend', 'auth.invites.read', 'auth.invites.create', 'auth.invites.update', 'auth.roles.manage', 'auth.sessions.read', 'auth.sessions.revoke', 'auth.access.manage'],
  },
}
