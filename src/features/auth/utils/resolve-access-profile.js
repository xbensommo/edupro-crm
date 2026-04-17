/**
 * @file src/features/auth/utils/resolve-access-profile.js
 * @description Resolve role-based permission payloads for users and invites.
 */

import {
  getPermissionsForRoles,
  generatedRoleTemplates,
} from '@generated/permissions.js'

function asStringArray(value) {
  if (Array.isArray(value)) {
    return [...new Set(value.map((item) => String(item || '').trim()).filter(Boolean))]
  }

  if (typeof value === 'string' && value.trim()) {
    return [value.trim()]
  }

  return []
}

/**
 * Resolve normalized roles and merged permissions.
 *
 * @param {object} payload
 * @param {string|string[]} [payload.roles]
 * @param {string} [payload.role]
 * @param {string[]} [payload.permissions]
 * @param {string[]} [payload.directPermissions]
 * @param {string[]} [payload.deniedPermissions]
 * @param {string} [payload.defaultRole='user']
 * @returns {{
 *   role: string,
 *   roles: string[],
 *   permissions: string[],
 *   permissionKeys: string[],
 *   directPermissionKeys: string[],
 *   deniedPermissionKeys: string[],
 * }}
 */
export function resolveAccessProfile(payload = {}) {
  const fallbackRole = payload.defaultRole || 'user'

  const roles = asStringArray(
    payload.roles?.length ? payload.roles : payload.role || fallbackRole,
  )

  const safeRoles = roles.length > 0 ? roles : [fallbackRole]
  const role = safeRoles[0]

  const directPermissionKeys = asStringArray(
    payload.directPermissions?.length ? payload.directPermissions : payload.permissions,
  )

  const deniedPermissionKeys = asStringArray(payload.deniedPermissions)
  const rolePermissionKeys = getPermissionsForRoles(safeRoles)

  const permissionKeys = [...new Set([...rolePermissionKeys, ...directPermissionKeys])]
    .filter((permissionKey) => !deniedPermissionKeys.includes(permissionKey))
    .sort()

  return {
    role,
    roles: safeRoles,
    permissions: permissionKeys,
    permissionKeys,
    directPermissionKeys,
    deniedPermissionKeys,
  }
}

/**
 * Check whether a role exists in the merged generated role templates.
 *
 * @param {string} roleKey
 * @returns {boolean}
 */
export function isKnownRole(roleKey) {
  return Boolean(roleKey && generatedRoleTemplates[roleKey])
}

export default resolveAccessProfile