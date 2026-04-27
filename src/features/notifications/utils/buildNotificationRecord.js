/**
 * @file src/features/notifications/utils/buildNotificationRecord.js
 * @description Canonical notification payload normalizer.
 */

/**
 * Return the first non-empty value.
 *
 * @param {...any} values
 * @returns {any}
 */
function firstDefined(...values) {
  for (const value of values) {
    if (value !== undefined && value !== null && value !== '') return value
  }
  return null
}

/**
 * Normalize a notification payload into one runtime contract before it reaches
 * shard-provider. This prevents services from inventing ad hoc payload shapes.
 *
 * The recipient field name is configurable so the feature can align with the
 * active collection definition without rewriting every caller.
 *
 * @param {Record<string, any>} [payload={}]
 * @param {{ recipientField?: string, now?: () => Date }} [options={}]
 * @returns {Record<string, any>}
 */
export function buildNotificationRecord(payload = {}, options = {}) {
  const recipientField = options.recipientField || 'user_id'
  const now = typeof options.now === 'function' ? options.now : () => new Date()
  const timestamp = now()
  const recipientId = firstDefined(
    payload.recipientId,
    payload.user_id,
    payload.user_id,
    payload.uid,
    payload.id,
  )

  return {
    id: firstDefined(payload.id, null),
    [recipientField]: recipientId,
    title: String(payload.title || '').trim(),
    message: String(payload.message || '').trim(),
    event: String(payload.event || 'system.alert').trim(),
    type: String(payload.type || payload.domain || 'system').trim(),
    domain: String(payload.domain || payload.type || 'system').trim(),
    sourceModule: String(payload.sourceModule || payload.domain || payload.type || 'system').trim(),
    channel: firstDefined(payload.channel, 'in_app'),
    channels: Array.isArray(payload.channels) ? payload.channels.filter(Boolean) : undefined,
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
    roleScope: firstDefined(payload.roleScope, null),
    meta: payload.meta && typeof payload.meta === 'object' ? payload.meta : null,
    readAt: firstDefined(payload.readAt, null),
    archivedAt: firstDefined(payload.archivedAt, null),
    sentAt: firstDefined(payload.sentAt, null),
    createdAt: payload.createdAt || timestamp.toISOString(),
    updatedAt: payload.updatedAt || timestamp.toISOString(),
  }
}

/**
 * Normalize notification preference rows.
 *
 * @param {string} recipientId
 * @param {Record<string, any>} [payload={}]
 * @param {{ recipientField?: string, now?: () => Date }} [options={}]
 * @returns {Record<string, any>}
 */
export function buildNotificationPreferences(recipientId, payload = {}, options = {}) {
  const recipientField = options.recipientField || 'user_id'
  const now = typeof options.now === 'function' ? options.now : () => new Date()
  return {
    [recipientField]: recipientId,
    enabled: payload.enabled !== false,
    channels: Array.isArray(payload.channels) ? payload.channels.filter(Boolean) : ['in_app'],
    quietHours: payload.quietHours || null,
    categorySettings: payload.categorySettings || null,
    updatedAt: payload.updatedAt || now().toISOString(),
    createdAt: payload.createdAt || now().toISOString(),
  }
}

/**
 * Normalize notification log rows.
 *
 * @param {Record<string, any>} [payload={}]
 * @param {{ recipientField?: string, now?: () => Date }} [options={}]
 * @returns {Record<string, any>}
 */
export function buildNotificationLog(payload = {}, options = {}) {
  const recipientField = options.recipientField || 'user_id'
  const now = typeof options.now === 'function' ? options.now : () => new Date()
  const recipientId = firstDefined(
    payload.recipientId,
    payload.user_id,
    payload.user_id,
    payload.uid,
    payload.id,
  )

  return {
    notificationId: firstDefined(payload.notificationId, null),
    [recipientField]: recipientId,
    channel: String(payload.channel || 'in_app').trim(),
    provider: String(payload.provider || payload.channel || 'database').trim(),
    status: String(payload.status || 'queued').trim(),
    error: firstDefined(payload.error, null),
    payload: payload.payload || null,
    response: payload.response || null,
    sentAt: firstDefined(payload.sentAt, null),
    createdAt: payload.createdAt || now().toISOString(),
  }
}

export default buildNotificationRecord
