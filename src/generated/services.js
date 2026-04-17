/**
 * @file src/generated/services.js
 * @description Build-time service assembly for installed apps and features.
 */

const serviceModuleImports = import.meta.glob(
  [
    '../apps/*/services/**/*.js',
    '../features/*/services/**/*.js',
    '!../apps/*/services/**/*.test.js',
    '!../apps/*/services/**/*.spec.js',
    '!../features/*/services/**/*.test.js',
    '!../features/*/services/**/*.spec.js',
  ],
  { eager: true },
)

/**
 * Convert a discovered module path into a stable registry key.
 *
 * Examples:
 * - ../apps/booking/services/bookingService.js -> booking:bookingService
 * - ../features/search/services/search/searchService.js -> search:search.searchService
 *
 * @param {string} modulePath
 * @returns {string}
 */
function toServiceKey(modulePath) {
  return modulePath
    .replace(/^\.\.\//, '')
    .replace(/^apps\//, '')
    .replace(/^features\//, '')
    .replace(/\/services\//, ':')
    .replace(/\.js$/, '')
    .replace(/\//g, '.')
}

/**
 * Create the generated service registry.
 *
 * @returns {Record<string, any>}
 */
export function createGeneratedServiceRegistry() {
  const registry = {}
  const entries = Object.entries(serviceModuleImports).sort(([leftPath], [rightPath]) =>
    leftPath.localeCompare(rightPath),
  )

  for (const [modulePath, mod] of entries) {
    const serviceKey = toServiceKey(modulePath)
    registry[serviceKey] = mod?.default || mod
  }

  return registry
}

export const generatedServices = createGeneratedServiceRegistry()

/**
 * Read a generated service by exact registry key.
 *
 * @param {string} serviceKey
 * @returns {any | null}
 */
export function getGeneratedService(serviceKey) {
  return generatedServices[serviceKey] || null
}

/**
 * Read a generated service by trailing key match.
 *
 * @param {string} serviceKeySuffix
 * @returns {any | null}
 */
export function getGeneratedServiceBySuffix(serviceKeySuffix) {
  const match = Object.entries(generatedServices).find(([serviceKey]) =>
    serviceKey.endsWith(serviceKeySuffix),
  )

  return match?.[1] || null
}

export default generatedServices
