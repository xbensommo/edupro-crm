/**
 * @file src/core/services/normalizers/value.normalizers.js
 * @description Reusable primitive and collection normalizers for shared services.
 */

/**
 * Determine whether a value looks like a Vue ref.
 *
 * @param {unknown} value
 * @returns {boolean}
 */
export function isRefLike(value) {
  return Boolean(
    value &&
      typeof value === 'object' &&
      'value' in value &&
      Object.prototype.hasOwnProperty.call(value, 'value'),
  )
}

/**
 * Unwrap a maybe-ref value.
 *
 * @template T
 * @param {T|{ value: T }} value
 * @returns {T}
 */
export function unwrapValue(value) {
  return isRefLike(value) ? value.value : value
}

/**
 * Convert a value into trimmed text.
 *
 * @param {unknown} value
 * @param {string} [fallback='']
 * @returns {string}
 */
export function asText(value, fallback = '') {
  const normalized = String(value ?? '').trim()
  return normalized || fallback
}


/**
 * Convert a value into nullable text.
 *
 * @param {unknown} value
 * @returns {string|null}
 */
export function asNullableText(value) {
  const normalized = asText(value)
  return normalized || null
}

/**
 * Convert a value into a string array with empty items removed.
 *
 * @param {unknown} value
 * @returns {string[]}
 */
export function asStringArray(value) {
  if (!Array.isArray(value)) return []
  return value
    .map((item) => asText(item))
    .filter(Boolean)
}

/**
 * Normalize an unknown array-like value.
 *
 * @template T
 * @param {unknown} value
 * @returns {T[]}
 */
export function asArray(value) {
  return Array.isArray(value) ? value.filter(Boolean) : []
}

/**
 * Convert a value into a finite number.
 *
 * @param {unknown} value
 * @param {number} [fallback=0]
 * @returns {number}
 */
export function asNumber(value, fallback = 0) {
  const normalized = Number(value)
  return Number.isFinite(normalized) ? normalized : fallback
}

/**
 * Convert a value into an integer.
 *
 * @param {unknown} value
 * @param {number} [fallback=0]
 * @returns {number}
 */
export function asInteger(value, fallback = 0) {
  return Math.trunc(asNumber(value, fallback))
}

/**
 * Convert a value into a money-safe number.
 *
 * @param {unknown} value
 * @param {number} [fallback=0]
 * @returns {number}
 */
export function asMoney(value, fallback = 0) {
  return asNumber(value, fallback)
}

export  function roundMoney(value) {
    return Math.round((Number(value) + Number.EPSILON) * 100) / 100
  }
/**
 * Convert a value into a boolean.
 *
 * @param {unknown} value
 * @param {boolean} [fallback=false]
 * @returns {boolean}
 */
export function asBoolean(value, fallback = false) {
  if (typeof value === 'boolean') return value
  if (value == null) return fallback

  const normalized = String(value).trim().toLowerCase()
  if (['true', '1', 'yes', 'on'].includes(normalized)) return true
  if (['false', '0', 'no', 'off'].includes(normalized)) return false
  return fallback
}

/**
 * Normalize an unknown date-like value.
 *
 * Supports Date, Firestore Timestamp-like values, ISO strings, and epoch values.
 *
 * @param {unknown} value
 * @returns {Date|null}
 */
export function normalizeDate(value) {
  if (!value) return null
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value
  }

  if (typeof value?.toDate === 'function') {
    const converted = value.toDate()
    return converted instanceof Date && !Number.isNaN(converted.getTime())
      ? converted
      : null
  }

  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

/**
 * Convert a value into a sortable timestamp.
 *
 * @param {unknown} value
 * @returns {number}
 */
export function toSortableDate(value) {
  return normalizeDate(value)?.getTime() || 0
}

/**
 * Normalize collection state items from several known shapes used across
 * Totistack root-store collections.
 *
 * @template T
 * @param {unknown} value
 * @returns {T[]}
 */
export function normalizeCollectionItems(value) {
  const unwrapped = unwrapValue(value)

  if (Array.isArray(unwrapped)) return unwrapped
  if (Array.isArray(unwrapped?.items)) return unwrapped.items
  if (Array.isArray(unwrapped?.value?.items)) return unwrapped.value.items
  if (Array.isArray(unwrapped?.value)) return unwrapped.value
  return []
}

/**
 * Normalize a collection state object.
 *
 * @param {unknown} value
 * @returns {{ items: any[], hasMore: boolean, raw: any }}
 */
export function normalizeCollectionState(value) {
  const unwrapped = unwrapValue(value)
  const items = normalizeCollectionItems(unwrapped)
  const hasMore = Boolean(unwrapped?.hasMore || unwrapped?.value?.hasMore)

  return {
    items,
    hasMore,
    raw: unwrapped,
  }
}

/**
 * Normalize a record id from common document shapes.
 *
 * @param {Record<string, any>|null|undefined} item
 * @param {string|null} [fallback=null]
 * @returns {string|null}
 */
export function getRecordId(item, fallback = null) {
  return item?.id || item?.docId || item?._id || fallback
}

/**
 * Determine whether an invite is still redeemable.
 * Handles Firestore Timestamp objects.
 */
export function formatDate(expiresAt) {
  if (!expiresAt) return false;

  let newT;
  // Check if it's a Firestore Timestamp object (has .toDate() method)
  if (typeof expiresAt.toDate === 'function') {
    newT = expiresAt.toDate();
  } 
  // Fallback if it's already a Date object
  else if (expiresAt instanceof Date) {
    newT = expiresAt;
  }
  // Fallback for raw Firestore object structure (seconds/nanoseconds)
  else if (expiresAt.seconds) {
    newT = new Date(expiresAt.seconds * 1000);
  } else {
    newT = new Date(expiresAt);
  }

  return newT.toDateString();
}
