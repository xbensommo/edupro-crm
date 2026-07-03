/** @file src/features/notifications/utils/buildNotificationRecord.js */

import { buildDedupeKey, cleanArray, nullableText } from './notification.helpers.js'

function firstDefined(...values) {
  for (const value of values) {
    if (value !== undefined && value !== null && value !== '') return value
  }
  return values.some((value) => value === null) ? null : undefined
}

function timestamp(now) {
  const value = typeof now === 'function' ? now() : new Date()
  return value instanceof Date ? value.toISOString() : String(value)
}

function isPlainObject(value) {
  return Object.prototype.toString.call(value) === '[object Object]'
}

/**
 * Firestore rejects undefined anywhere in an object tree.
 * This is the last line of defence before shard-provider writes.
 * @param {unknown} value
 * @returns {unknown}
 */
export function stripUndefined(value) {
  if (Array.isArray(value)) {
    return value
      .filter((item) => item !== undefined)
      .map((item) => stripUndefined(item))
  }

  if (value && isPlainObject(value)) {
    return Object.fromEntries(
      Object.entries(value)
        .filter(([, childValue]) => childValue !== undefined)
        .map(([key, childValue]) => [key, stripUndefined(childValue)]),
    )
  }

  return value
}

/**
 * @param {Record<string, any>} payload
 * @param {{ recipientField?: string, now?: () => Date }} options
 * @returns {Record<string, any>}
 */
export function buildNotificationRecord(payload = {}, options = {}) {
  const recipientField = options.recipientField || 'user_id'
  const createdAt = payload.createdAt || timestamp(options.now)
  const recipientId = firstDefined(payload.recipientId, payload[recipientField], payload.user_id, payload.uid)
  const channel = String(payload.channel || 'in_app').trim()
  const dedupeKey = payload.dedupeKey || buildDedupeKey({ ...payload, recipientId, channel })

  return stripUndefined({
    [recipientField]: recipientId,
    title: String(payload.title || '').trim(),
    message: String(payload.message || '').trim(),
    event: String(payload.event || 'system.alert').trim(),
    type: String(payload.type || payload.domain || 'system').trim(),
    domain: String(payload.domain || payload.type || 'system').trim(),
    sourceModule: String(payload.sourceModule || payload.domain || payload.type || 'system').trim(),
    channel,
    channels: cleanArray(payload.channels).length ? cleanArray(payload.channels) : ['in_app'],
    status: String(payload.status || 'queued').trim(),
    priority: String(payload.priority || 'normal').trim(),
    actionUrl: firstDefined(payload.actionUrl, null),
    actionLabel: firstDefined(payload.actionLabel, null),
    isActionRequired: Boolean(payload.isActionRequired),
    entityType: firstDefined(payload.entityType, null),
    entityId: firstDefined(payload.entityId, null),
    entityLabel: firstDefined(payload.entityLabel, null),
    actorId: firstDefined(payload.actorId, null),
    actorName: String(payload.actorName || 'System').trim(),
    roleScope: cleanArray(payload.roleScope),
    dedupeKey,
    meta: payload.meta && typeof payload.meta === 'object' ? payload.meta : null,
    readAt: firstDefined(payload.readAt, null),
    archivedAt: firstDefined(payload.archivedAt, null),
    sentAt: firstDefined(payload.sentAt, null),
    createdAt,
    updatedAt: payload.updatedAt || createdAt,
  })
}

/**
 * @param {Record<string, any>} payload
 * @param {{ recipientField?: string, now?: () => Date }} options
 * @returns {Record<string, any>}
 */
export function buildNotificationLog(payload = {}, options = {}) {
  const recipientField = options.recipientField || 'user_id'
  const createdAt = payload.createdAt || timestamp(options.now)
  const recipientId = firstDefined(payload.recipientId, payload[recipientField], payload.user_id, payload.uid)
  const channel = String(payload.channel || 'in_app').trim()
  const dedupeKey = firstDefined(payload.dedupeKey, buildDedupeKey({ ...payload, recipientId, channel }), null)

  return stripUndefined({
    notificationId: firstDefined(payload.notificationId, null),
    queueId: firstDefined(payload.queueId, null),
    dedupeKey,
    [recipientField]: recipientId,
    recipientEmail: nullableText(payload.recipientEmail),
    event: String(payload.event || 'system.alert').trim(),
    channel,
    provider: String(payload.provider || payload.channel || 'database').trim(),
    status: String(payload.status || 'queued').trim(),
    domain: String(payload.domain || 'system').trim(),
    error: firstDefined(payload.error, null),
    payload: payload.payload || null,
    response: payload.response || null,
    sentAt: firstDefined(payload.sentAt, null),
    createdAt,
  })
}

/**
 * @param {Record<string, any>} payload
 * @param {{ recipientField?: string, now?: () => Date }} options
 * @returns {Record<string, any>}
 */
export function buildNotificationDeliveryQueueItem(payload = {}, options = {}) {
  const recipientField = options.recipientField || 'user_id'
  const createdAt = payload.createdAt || timestamp(options.now)
  const recipientId = firstDefined(payload.recipientId, payload[recipientField], payload.user_id, payload.uid)
  const channel = String(payload.channel || 'email').trim()
  const dedupeKey = payload.dedupeKey || buildDedupeKey({ ...payload, recipientId, channel })

  return stripUndefined({
    dedupeKey,
    notificationId: firstDefined(payload.notificationId, null),
    [recipientField]: recipientId,
    recipientEmail: nullableText(payload.recipientEmail),
    recipientName: nullableText(payload.recipientName),
    event: String(payload.event || 'system.alert').trim(),
    channel,
    status: String(payload.status || 'pending').trim(),
    provider: payload.provider || null,
    priority: String(payload.priority || 'normal').trim(),
    subject: nullableText(payload.subject),
    title: nullableText(payload.title),
    message: nullableText(payload.message),
    templateKey: String(payload.templateKey || payload.event || 'system.alert').trim(),
    variables: payload.variables && typeof payload.variables === 'object' ? payload.variables : {},
    entityType: nullableText(payload.entityType),
    entityId: nullableText(payload.entityId),
    entityLabel: nullableText(payload.entityLabel),
    actionUrl: nullableText(payload.actionUrl),
    actionLabel: nullableText(payload.actionLabel),
    attempts: Number(payload.attempts || 0),
    maxAttempts: Number(payload.maxAttempts || 3),
    lockedAt: firstDefined(payload.lockedAt, null),
    lockedBy: firstDefined(payload.lockedBy, null),
    lastError: firstDefined(payload.lastError, null),
    processAfter: payload.processAfter || createdAt,
    sentAt: firstDefined(payload.sentAt, null),
    createdAt,
    updatedAt: payload.updatedAt || createdAt,
  })
}

/**
 * @param {string} recipientId
 * @param {Record<string, any>} payload
 * @param {{ recipientField?: string, now?: () => Date }} options
 * @returns {Record<string, any>}
 */
export function buildNotificationPreferences(recipientId, payload = {}, options = {}) {
  const recipientField = options.recipientField || 'user_id'
  const now = timestamp(options.now)
  return stripUndefined({
    [recipientField]: recipientId,
    enabled: payload.enabled !== false,
    channels: cleanArray(payload.channels).length ? cleanArray(payload.channels) : ['in_app'],
    quietHours: payload.quietHours || null,
    categorySettings: payload.categorySettings || null,
    role: payload.role || null,
    createdAt: payload.createdAt || now,
    updatedAt: payload.updatedAt || now,
  })
}

/**
 * @param {string} recipientId
 * @param {Record<string, any>} payload
 * @param {{ recipientField?: string, now?: () => Date }} options
 * @returns {Record<string, any>}
 */
export function buildNotificationPushToken(recipientId, payload = {}, options = {}) {
  const recipientField = options.recipientField || 'user_id'
  const now = timestamp(options.now)
  return stripUndefined({
    [recipientField]: recipientId,
    token: String(payload.token || '').trim(),
    tokenHash: String(payload.tokenHash || '').trim(),
    provider: 'fcm',
    platform: payload.platform || 'web',
    permission: payload.permission || 'granted',
    status: payload.status || 'active',
    browserName: payload.browserName || null,
    userAgent: payload.userAgent || null,
    deviceLabel: payload.deviceLabel || null,
    vapidKeyHash: payload.vapidKeyHash || null,
    lastSeenAt: payload.lastSeenAt || now,
    createdAt: payload.createdAt || now,
    updatedAt: payload.updatedAt || now,
  })
}

export default buildNotificationRecord
