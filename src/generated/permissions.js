/**
 * @file src/generated/permissions.js
 * @description Build-time permission assembly for installed apps and features.
 *
 * Rules:
 * - Each app/feature exports a default object from permissions.js
 * - Registry merges installed modules only
 * - Roles resolve to permission keys through merged roleTemplates
 */

const permissionModuleImports = import.meta.glob(
  [
    '../apps/*/permissions.js',
    '../apps/*/permissions/index.js',
    '../features/*/permissions.js',
    '../features/*/permissions/index.js',
  ],
  { eager: true },
)

function normalizePermissionEntry(entry, moduleName) {
  if (!entry || typeof entry !== 'object') return null
  if (!entry.key || typeof entry.key !== 'string') return null

  return {
    module: moduleName,
    key: entry.key,
    resource: entry.resource || '',
    action: entry.action || '',
    description: entry.description || '',
  }
}

function normalizeRoleTemplateMap(value) {
  if (!value || typeof value !== 'object') return {}

  return Object.entries(value).reduce((acc, [roleKey, permissionKeys]) => {
    acc[roleKey] = Array.isArray(permissionKeys)
      ? [...new Set(permissionKeys.filter(Boolean))]
      : []
    return acc
  }, {})
}

function extractPermissionContribution(mod) {
  const candidate = mod?.default || mod
  if (!candidate || typeof candidate !== 'object') return null

  const moduleName = candidate.module || ''
  const permissions = Array.isArray(candidate.permissions)
    ? candidate.permissions
        .map((entry) => normalizePermissionEntry(entry, moduleName))
        .filter(Boolean)
    : []

  const roleTemplates = normalizeRoleTemplateMap(candidate.roleTemplates)

  return {
    module: moduleName,
    permissions,
    roleTemplates,
  }
}

export function createGeneratedPermissions() {
  const permissions = []
  const seenPermissionKeys = new Set()
  const mergedRoleTemplates = {}

  for (const mod of Object.values(permissionModuleImports)) {
    const contribution = extractPermissionContribution(mod)
    if (!contribution) continue

    for (const permission of contribution.permissions) {
      if (seenPermissionKeys.has(permission.key)) continue
      seenPermissionKeys.add(permission.key)
      permissions.push(permission)
    }

    for (const [roleKey, permissionKeys] of Object.entries(contribution.roleTemplates)) {
      if (!mergedRoleTemplates[roleKey]) {
        mergedRoleTemplates[roleKey] = []
      }

      mergedRoleTemplates[roleKey].push(...permissionKeys)
    }
  }

  const roleTemplates = Object.entries(mergedRoleTemplates).reduce((acc, [roleKey, keys]) => {
    acc[roleKey] = [...new Set(keys.filter(Boolean))].sort()
    return acc
  }, {})

  return {
    permissions: permissions.sort((a, b) => a.key.localeCompare(b.key)),
    roleTemplates,
  }
}

export const generatedPermissionsRegistry = createGeneratedPermissions()
export const generatedPermissions = generatedPermissionsRegistry.permissions
export const generatedRoleTemplates = generatedPermissionsRegistry.roleTemplates

export function getGeneratedPermissionMap() {
  return generatedPermissions.reduce((acc, permission) => {
    acc[permission.key] = permission
    return acc
  }, {})
}

export function getPermissionsForRole(roleKey) {
  return [...(generatedRoleTemplates[roleKey] || [])]
}

export function getPermissionsForRoles(roleKeys = []) {
  const resolved = new Set()

  for (const roleKey of Array.isArray(roleKeys) ? roleKeys : []) {
    for (const permissionKey of getPermissionsForRole(roleKey)) {
      resolved.add(permissionKey)
    }
  }

  return [...resolved].sort()
}