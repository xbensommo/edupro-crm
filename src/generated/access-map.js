/**
 * @file src/generated/access-map.js
 * @description Group generated permissions by module and resource.
 */

import { generatedPermissions } from './permissions.js'

export function createGeneratedAccessMap() {
  return generatedPermissions.reduce((acc, permission) => {
    const moduleKey = permission.module || 'unknown'
    const resourceKey = permission.resource || 'general'

    if (!acc[moduleKey]) acc[moduleKey] = {}
    if (!acc[moduleKey][resourceKey]) acc[moduleKey][resourceKey] = []

    acc[moduleKey][resourceKey].push(permission)
    return acc
  }, {})
}

const generatedAccessMap = createGeneratedAccessMap()

export default generatedAccessMap