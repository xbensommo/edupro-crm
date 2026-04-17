/**
 * @file src/core/services/errors/ServiceError.js
 * @description Stable service-layer error used by shared Totistack services.
 */

/**
 * Shared error shape for service-layer failures.
 */
export class ServiceError extends Error {
  /**
   * @param {string} message
   * @param {object} [options={}]
   * @param {string} [options.code='SERVICE_ERROR']
   * @param {string|null} [options.domain='service']
   * @param {unknown} [options.cause=null]
   * @param {Record<string, any>|null} [options.meta=null]
   */
  constructor(message, options = {}) {
    super(message || 'Service request failed.')
    this.name = 'ServiceError'
    this.code = options.code || 'SERVICE_ERROR'
    this.domain = options.domain || 'service'
    this.cause = options.cause ?? null
    this.meta = options.meta ?? null
  }
}

/**
 * Create a stable service error instance.
 *
 * @param {string} message
 * @param {object} [options={}]
 * @returns {ServiceError}
 */
export function createServiceError(message, options = {}) {
  return new ServiceError(message, options)
}

export default ServiceError
