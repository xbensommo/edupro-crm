/** @file src/features/notifications/utils/notification.filters.js */

/**
 * Converts Firestore Timestamp, Date, or ISO-like value into milliseconds.
 * @param {unknown} value
 * @returns {number}
 */
export function toMillis(value) {
  if (!value) return 0
  if (typeof value === 'number') return value
  if (value instanceof Date) return value.getTime()
  if (typeof value === 'string') {
    const date = new Date(value)
    return Number.isNaN(date.getTime()) ? 0 : date.getTime()
  }
  if (typeof value === 'object') {
    if (typeof value.toDate === 'function') return value.toDate().getTime()
    if (typeof value.seconds === 'number') return value.seconds * 1000
    if (typeof value._seconds === 'number') return value._seconds * 1000
  }
  return 0
}

/**
 * @param {unknown} value
 * @returns {string}
 */
export function formatDateTime(value) {
  const millis = toMillis(value)
  if (!millis) return '—'
  return new Intl.DateTimeFormat('en-NA', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(millis))
}

/**
 * @param {Array<Record<string, any>>} items
 * @returns {Array<Record<string, any>>}
 */
export function sortNotificationsByNewest(items = []) {
  return [...items].sort((a, b) => toMillis(b.createdAt) - toMillis(a.createdAt))
}

/**
 * @param {Record<string, any>} item
 * @returns {boolean}
 */
export function isUnread(item = {}) {
  return !item.readAt && item.status !== 'read' && item.status !== 'archived'
}

/**
 * @param {Array<Record<string, any>>} items
 * @param {Record<string, any>} filters
 * @returns {Array<Record<string, any>>}
 */
export function filterNotifications(items = [], filters = {}) {
  const search = String(filters.search || '').trim().toLowerCase()

  return items.filter((item) => {
    if (!item || item.status === 'archived') return false
    if (filters.unreadOnly && !isUnread(item)) return false
    if (filters.type && item.type !== filters.type && item.domain !== filters.type) return false
    if (filters.channel && item.channel !== filters.channel && !(item.channels || []).includes(filters.channel)) return false
    if (filters.status && item.status !== filters.status) return false
    if (filters.priority && item.priority !== filters.priority) return false
    if (filters.event && item.event !== filters.event) return false

    if (!search) return true
    const haystack = [
      item.title,
      item.message,
      item.event,
      item.type,
      item.domain,
      item.entityType,
      item.entityId,
      item.entityLabel,
      item.actorName,
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()

    return haystack.includes(search)
  })
}

/**
 * @param {string} value
 * @returns {string}
 */
export function humanizeToken(value) {
  return String(value || '—')
    .replaceAll('_', ' ')
    .replaceAll('.', ' / ')
}

export default {
  toMillis,
  formatDateTime,
  sortNotificationsByNewest,
  filterNotifications,
  isUnread,
  humanizeToken,
}
