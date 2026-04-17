/**
 * @file src/core/services/errors/normalizeServiceError.js
 * @description Normalize unknown failures into a stable ServiceError.
 */

import { ServiceError } from './ServiceError.js'

/**
 * Normalize an unknown error into a ServiceError.
 *
 * Existing ServiceError instances are returned untouched so domain and
 * metadata are preserved.
 *
 * @param {unknown} error
 * @param {string} [fallbackMessage='Service request failed.']
 * @param {object} [options={}]
 * @param {string} [options.code='SERVICE_ERROR']
 * @param {string} [options.domain='service']
 * @param {Record<string, any>|null} [options.meta=null]
 * @returns {ServiceError}
 */
export function normalizeServiceError(
  error,
  fallbackMessage = 'Service request failed.',
  options = {},
) {
  if (error instanceof ServiceError) {
    return error
  }

  const message =
    typeof error?.message === 'string' && error.message.trim()
      ? error.message.trim()
      : fallbackMessage

  return new ServiceError(message, {
    code: error?.code || options.code || 'SERVICE_ERROR',
    domain: options.domain || 'service',
    cause: error,
    meta: options.meta ?? null,
  })
}

export default normalizeServiceError
