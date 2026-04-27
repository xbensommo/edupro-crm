/**
 * @file src/core/services/audit/audit.fields.js
 * @description Audit field helpers for shared service-layer writes.
 */

/**
 * Build create-time audit fields.
 *
 * @param {object} [options={}]
 * @param {() => Date} [options.now]
 * @param {string|null} [options.user_id =null]
 * @param {boolean} [options.includeUpdatedAt=false]
 * @returns {{ createdAt: Date, createdBy: string|null, updatedAt?: Date, updatedBy?: string|null }}
 */
export function buildCreatedAuditFields(options = {}) {
  const now = typeof options.now === 'function' ? options.now : () => new Date()
  const timestamp = now()
  const  user_id  = options.user_id  ?? null
  const payload = {
    createdAt: timestamp,
    createdBy:  user_id ,
  }

  if (options.includeUpdatedAt) {
    payload.updatedAt = timestamp
    payload.updatedBy =  user_id 
  }

  return payload
}

/**
 * Build update-time audit fields.
 *
 * @param {object} [options={}]
 * @param {() => Date} [options.now]
 * @param {string|null} [options. user_id =null]
 * @returns {{ updatedAt: Date, updatedBy: string|null }}
 */
export function buildUpdatedAuditFields(options = {}) {
  const now = typeof options.now === 'function' ? options.now : () => new Date()
  return {
    updatedAt: now(),
    updatedBy: options. user_id  ?? null,
  }
}

/**
 * Merge create-time audit fields into a payload.
 *
 * @template T extends Record<string, any>
 * @param {T} payload
 * @param {object} [options={}]
 * @returns {T & { createdAt: Date, createdBy: string|null, updatedAt?: Date, updatedBy?: string|null }}
 */
export function withCreatedAuditFields(payload, options = {}) {
  return {
    ...(payload || {}),
    ...buildCreatedAuditFields(options),
  }
}

/**
 * Merge update-time audit fields into a payload.
 *
 * @template T extends Record<string, any>
 * @param {T} payload
 * @param {object} [options={}]
 * @returns {T & { updatedAt: Date, updatedBy: string|null }}
 */
export function withUpdatedAuditFields(payload, options = {}) {
  return {
    ...(payload || {}),
    ...buildUpdatedAuditFields(options),
  }
}
