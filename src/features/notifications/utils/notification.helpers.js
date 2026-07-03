/** @file src/features/notifications/utils/notification.helpers.js */

/**
 * Converts any value into a trimmed string.
 * @param {unknown} value
 * @returns {string}
 */
export function asCleanText(value) {
  return String(value ?? '').trim()
}

/**
 * Converts an optional text value to either trimmed text or null.
 * Firestore allows null. Firestore does not allow undefined.
 * @param {unknown} value
 * @returns {string|null}
 */
export function nullableText(value) {
  const text = asCleanText(value)
  return text || null
}

/**
 * Normalizes array-like channel/role values.
 * @param {unknown} value
 * @returns {string[]}
 */
export function cleanArray(value) {
  if (!Array.isArray(value)) return []
  return [...new Set(value.filter(Boolean).map((item) => String(item).trim()).filter(Boolean))]
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
 * Sanitizes arbitrary text for deterministic Firestore document IDs and lock IDs.
 * Firestore document IDs cannot contain slash and should stay reasonably short.
 * @param {unknown} value
 * @returns {string}
 */
export function safeKeyPart(value) {
  return String(value ?? '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-zA-Z0-9_.:-]/g, '_')
    .replace(/_+/g, '_')
    .slice(0, 180)
}

/**
 * Builds a stable dedupe key.
 *
 * Rule:
 * Same event + same entity + same recipient + same channel + same occurrence = same delivery.
 * For a repeated notification on the same entity, pass occurrenceId/revisionId/assignmentId.
 *
 * @param {Record<string, any>} payload
 * @returns {string}
 */
export function buildDedupeKey(payload = {}) {
  return [
    payload.event || 'event',
    payload.entityType || 'entity',
    payload.entityId || payload.engagementId || payload.id || payload.entityLabel || 'unknown',
    payload.recipientId || payload.user_id || payload.uid || payload.recipientEmail || 'recipient',
    payload.channel || 'channel',
    payload.occurrenceId || payload.assignmentId || payload.reviewId || payload.revisionId || 'default',
  ]
    .map(safeKeyPart)
    .filter(Boolean)
    .join(':')
    .slice(0, 900)
}

/**
 * Builds a deterministic document id from a dedupe key.
 * @param {string} prefix
 * @param {string} dedupeKey
 * @returns {string}
 */
export function buildDedupeDocId(prefix, dedupeKey) {
  return `${safeKeyPart(prefix)}_${safeKeyPart(dedupeKey)}`.slice(0, 900)
}

/**
 * Normalizes rows returned either directly from shard-provider or as { id, data }.
 * @param {unknown} value
 * @returns {Record<string, any>|null}
 */
export function normalizeStoreRow(value) {
  if (!value) return null
  const data = value?.data && typeof value.data === 'object' ? value.data : value
  const id = value?.id || value?.docId || value?._id || data?.id || data?.uid || null
  return { id, ...data }
}
