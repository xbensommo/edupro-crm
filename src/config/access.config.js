/**
 * @file access.config.js
 * @description Authentication and access control configuration.
 *
 * This file allows projects to keep authentication enabled while switching RBAC
 * enforcement on or off without rewriting feature code.
 */

export default {
  enabled: true,
  persistence: 'local',
  profileCollection: 'users',
  sessionCollection: 'sessions',
  cacheTtlMs: 24 * 60 * 60 * 1000,
  tokenRefreshIntervalMs: 60 * 60 * 1000,
  allowRegistration: true,
  socialProviders: {
    google: true,
    github: false,
    microsoft: false,
    facebook: false,
  },
  routes: {
    login: '/auth',
    logoutRedirect: '/auth',
    forbidden: '/403',
    defaultAuthenticated: '/a',
  },
  /**
 * RBAC mode:
 * - enabled: turns on role-based route protection
 * - permissionsEnabled: adds permission enforcement on top of roles
 */
  rbac: {
    enabled: true,
    permissionsEnabled: false,
    defaultRole: 'receptionist',
    superRoles: ['admin', 'sys_admin'],
    assignmentsCollection: 'userRoles',
    rolesCollection: 'roles',
    permissionsCollection: 'permissions',
  },
};
