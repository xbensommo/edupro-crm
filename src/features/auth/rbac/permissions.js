/**
 * @file src/features/rbac/permissions.js
 * @description Declarative permission registry for the rbac feature.
 */

export default {
  module: 'rbac',
  permissions: [
    { key: 'rbac.permissions.read', resource: 'permissions', action: 'read', description: 'View permission matrix.' },
    { key: 'rbac.permissions.assign', resource: 'permissions', action: 'assign', description: 'Assign direct permissions.' },
    { key: 'rbac.permissions.override', resource: 'permissions', action: 'override', description: 'Override default permission grants.' },
    { key: 'rbac.policies.read', resource: 'policies', action: 'read', description: 'View RBAC policies.' },
    { key: 'rbac.policies.create', resource: 'policies', action: 'create', description: 'Create RBAC policies.' },
    { key: 'rbac.policies.update', resource: 'policies', action: 'update', description: 'Update RBAC policies.' },
    { key: 'rbac.policies.delete', resource: 'policies', action: 'delete', description: 'Delete RBAC policies.' },
    { key: 'rbac.policies.manage', resource: 'policies', action: 'manage', description: 'Full control over RBAC policies.' },
  ],
  roleTemplates: {
    admin: ['rbac.permissions.read', 'rbac.permissions.assign', 'rbac.permissions.override', 'rbac.policies.manage'],
    receptionist: [],
    consultant: [],
    consultant_editor: ['rbac.policies.read'],
    sysadmin: ['rbac.permissions.read', 'rbac.permissions.assign', 'rbac.permissions.override', 'rbac.policies.manage'],
  },
}
