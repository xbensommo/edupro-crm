/** @file src/features/notifications/utils/notification.helpers.js */

/**
 * @param {unknown} value
 * @returns {string}
 */
export function asCleanText(value) {
  return String(value ?? '').trim()
}

/**
 * @param {unknown} value
 * @returns {string|null}
 */
export function nullableText(value) {
  const text = asCleanText(value)
  return text || null
}

/**
 * @param {unknown} value
 * @returns {string[]}
 */
export function cleanArray(value) {
  return Array.isArray(value) ? value.filter(Boolean) : []
}

/**
 * Small safe interpolation helper for internal notification templates.
 * @param {string} template
 * @param {Record<string, any>} variables
 * @returns {string}
 */
export function interpolateTemplate(template = '', variables = {}) {
  return String(template || '').replace(/{{\s*([\w.]+)\s*}}/g, (_, key) => {
    const value = key.split('.').reduce((carry, part) => carry?.[part], variables)
    return value === undefined || value === null ? '' : String(value)
  })
}

/**
 * Deterministic enough for client-created queue dedupe keys.
 * The worker enforces server-side dedupe again.
 * @param {Record<string, any>} payload
 * @returns {string}
 */
export function buildDedupeKey(payload = {}) {
  return [
    payload.entityType || 'entity',
    payload.entityId || payload.id || 'unknown',
    payload.event || 'event',
    payload.recipientId || payload.user_id || payload.recipientEmail || 'recipient',
    payload.channel || 'channel',
  ]
    .map((part) => String(part || '').trim().replace(/\s+/g, '-').replace(/[^a-zA-Z0-9_.:-]/g, ''))
    .join(':')
}

/**
 * @param {unknown} value
 * @returns {Record<string, any>|null}
 */
export function normalizeStoreRow(value) {
  if (!value) return null
  const data = value?.data && typeof value.data === 'object' ? value.data : value
  const id = value?.id || value?.docId || value?._id || data?.id || data?.uid || null
  return { id, ...data }
}
