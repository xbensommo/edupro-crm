/** @file src/features/notifications/services/createNotificationRepository.js */

import { useAppStore } from '@app/stores/appStore'
import {
  buildNotificationDeliveryQueueItem,
  buildNotificationLog,
  buildNotificationPreferences,
  buildNotificationPushToken,
  buildNotificationRecord,
} from '../utils/buildNotificationRecord.js'
import { buildDedupeDocId, normalizeStoreRow, safeKeyPart } from '../utils/notification.helpers.js'

function rowsFromActions(actions, fallbackRows = []) {
  const rows = actions?.state?.items || fallbackRows || []
  return Array.isArray(rows) ? rows.map(normalizeStoreRow).filter(Boolean) : []
}

function exactDedupeMatch(rows = [], dedupeKey) {
  if (!dedupeKey) return null
  return rows.find((row) => row?.dedupeKey === dedupeKey) || null
}

async function fetchBySingleField(actions, fallbackRows, field, value, pageSize = 1) {
  if (!value || typeof actions?.fetchByFilters !== 'function') return null

  await actions.fetchByFilters({
    filters: [{ field, op: '==', value }],
    pageSize,
  })

  const rows = rowsFromActions(actions, fallbackRows)
  return rows.find((row) => row?.[field] === value) || null
}

async function setDeterministic(actions, id, record) {
  if (typeof actions?.setById === 'function') {
    await actions.setById(id, record, { merge: false })
    return { id, ...record }
  }

  if (typeof actions?.set === 'function') {
    await actions.set(id, record)
    return { id, ...record }
  }

  return null
}

/**
 * Writes a deduped document.
 *
 * This is the database-level duplicate guard. It prevents duplicate records when:
 * - the same UI action is fired twice,
 * - CRM and page-level code both emit the same event,
 * - Firebase retries a write path,
 * - the same recipient is resolved through direct user and role routes.
 */
async function createOnceByDedupe({ actions, fallbackRows, record, prefix }) {
  if (!record?.dedupeKey) return actions.add(record)

  const existing = exactDedupeMatch(rowsFromActions(actions, fallbackRows), record.dedupeKey)
    || await fetchBySingleField(actions, fallbackRows, 'dedupeKey', record.dedupeKey, 1)

  if (existing?.id) {
    return { ...existing, _deduped: true }
  }

  const id = buildDedupeDocId(prefix, record.dedupeKey)
  const deterministic = await setDeterministic(actions, id, record)

  if (deterministic) return deterministic

  /**
   * Fallback for older shard-provider action objects that expose only add().
   * This is not concurrency-perfect, but the pre-fetch still removes normal duplicates.
   */
  return actions.add(record)
}

/**
 * @param {{ store?: any, recipientField?: string, now?: () => Date }} options
 */
export function createNotificationRepository(options = {}) {
  const store = options.store || useAppStore()
  const recipientField = options.recipientField || 'user_id'
  const now = typeof options.now === 'function' ? options.now : () => new Date()

  const actions = {
    notifications: store.getCollectionActions?.('notifications') || store.notificationsActions,
    notificationPreferences: store.getCollectionActions?.('notification_preferences') || store.notification_preferencesActions,
    notificationTemplates: store.getCollectionActions?.('notification_templates') || store.notification_templatesActions,
    notificationLogs: store.getCollectionActions?.('notification_logs') || store.notification_logsActions,
    notificationDeliveryQueue: store.getCollectionActions?.('notification_delivery_queue') || store.notification_delivery_queueActions,
    notificationPushTokens: store.getCollectionActions?.('notification_push_tokens') || store.notification_push_tokensActions,
  }

  function requireActions(key) {
    const target = actions[key]
    if (!target) throw new Error(`Notification repository missing collection actions for '${key}'.`)
    return target
  }

  async function listNotifications(params = {}) {
    const notifications = requireActions('notifications')
    const filters = []
    const recipientId = params.recipientId || params[recipientField] || params.user_id || null

    if (recipientId) filters.push({ field: recipientField, op: '==', value: recipientId })
    if (params.roleScope) filters.push({ field: 'roleScope', op: 'array-contains', value: params.roleScope })
    if (params.status) filters.push({ field: 'status', op: '==', value: params.status })
    if (params.event) filters.push({ field: 'event', op: '==', value: params.event })

    if (!filters.length && !params.allowGlobalRead) return []

    await notifications.fetchByFilters?.({
      filters,
      pageSize: params.pageSize || 50,
      sortBy: params.sortBy || 'createdAt',
      sortDirection: params.sortDirection || 'desc',
    })

    return rowsFromActions(notifications, store.notifications?.items)
  }

  async function listLogs(params = {}) {
    const logs = requireActions('notificationLogs')
    const filters = []
    if (params.notificationId) filters.push({ field: 'notificationId', op: '==', value: params.notificationId })
    if (params.dedupeKey) filters.push({ field: 'dedupeKey', op: '==', value: params.dedupeKey })
    await logs.fetchByFilters?.({ filters, pageSize: params.pageSize || 50 })
    return rowsFromActions(logs, store.notification_logs?.items)
  }

  async function listTemplates() {
    const templates = requireActions('notificationTemplates')
    await templates.fetchInitialPage?.({ pageSize: 100, sortBy: 'createdAt', sortDirection: 'desc' })
    return rowsFromActions(templates, store.notification_templates?.items)
  }

  async function getPreferences(recipientId) {
    if (!recipientId) return null
    const preferences = requireActions('notificationPreferences')
    await preferences.fetchByFilters?.({ filters: [{ field: recipientField, op: '==', value: recipientId }], pageSize: 1 })
    return rowsFromActions(preferences, store.notification_preferences?.items)[0] || null
  }

  async function saveNotification(payload) {
    const notifications = requireActions('notifications')
    const record = buildNotificationRecord(payload, { recipientField, now })
    return createOnceByDedupe({
      actions: notifications,
      fallbackRows: store.notifications?.items,
      record,
      prefix: 'ntf',
    })
  }

  async function saveLog(payload) {
    const logs = requireActions('notificationLogs')
    const record = buildNotificationLog(payload, { recipientField, now })

    /**
     * Logs are deduped only for successful/queued/skipped state markers.
     * Failed logs may be overwritten by the same deterministic id instead of flooding Firestore.
     */
    if (record.dedupeKey) {
      const id = buildDedupeDocId(
        'nlog',
        `${record.dedupeKey}:${record.channel}:${record.provider}:${record.status}`,
      )
      const deterministic = await setDeterministic(logs, id, record)
      if (deterministic) return deterministic
    }

    return logs.add(record)
  }

  async function queueDelivery(payload) {
    const queue = requireActions('notificationDeliveryQueue')
    const record = buildNotificationDeliveryQueueItem(payload, { recipientField, now })
    return createOnceByDedupe({
      actions: queue,
      fallbackRows: store.notification_delivery_queue?.items,
      record,
      prefix: 'ndq',
    })
  }

  async function upsertPreferences(recipientId, payload = {}) {
    const preferences = requireActions('notificationPreferences')
    const current = await getPreferences(recipientId)
    const normalized = buildNotificationPreferences(recipientId, payload, { recipientField, now })
    if (current?.id) {
      await preferences.update(current.id, { ...normalized, createdAt: current.createdAt || normalized.createdAt })
      return { ...current, ...normalized }
    }
    return preferences.add(normalized)
  }

  async function savePushToken(recipientId, payload = {}) {
    if (!recipientId) throw new Error('Cannot save push token without a user id.')
    if (!payload.token) throw new Error('Cannot save empty push token.')

    const pushTokens = requireActions('notificationPushTokens')
    const normalized = buildNotificationPushToken(recipientId, payload, { recipientField, now })
    const tokenHash = normalized.tokenHash || safeKeyPart(normalized.token).slice(0, 180)
    const existing = await fetchBySingleField(pushTokens, store.notification_push_tokens?.items, 'tokenHash', tokenHash, 1)

    if (existing?.id) {
      await pushTokens.update(existing.id, {
        ...normalized,
        tokenHash,
        createdAt: existing.createdAt || normalized.createdAt,
        updatedAt: now().toISOString(),
      })
      return { ...existing, ...normalized, tokenHash }
    }

    if (typeof pushTokens.setById === 'function') {
      const id = buildDedupeDocId('fcm', `${recipientId}:${tokenHash}`)
      await pushTokens.setById(id, { ...normalized, tokenHash }, { merge: false })
      return { id, ...normalized, tokenHash }
    }

    return pushTokens.add({ ...normalized, tokenHash })
  }

  async function revokePushToken(tokenHashOrId, payload = {}) {
    const pushTokens = requireActions('notificationPushTokens')
    const id = tokenHashOrId
    if (!id) return null
    return pushTokens.update(id, {
      status: 'revoked',
      permission: payload.permission || 'denied',
      updatedAt: now().toISOString(),
    })
  }

  async function markRead(notificationId, payload = {}) {
    const notifications = requireActions('notifications')
    return notifications.update(notificationId, {
      readAt: payload.readAt || now().toISOString(),
      status: payload.status || 'read',
      updatedAt: now().toISOString(),
    })
  }

  async function archiveNotification(notificationId) {
    const notifications = requireActions('notifications')
    return notifications.update(notificationId, {
      archivedAt: now().toISOString(),
      status: 'archived',
      updatedAt: now().toISOString(),
    })
  }

  return {
    actions,
    listNotifications,
    listLogs,
    listTemplates,
    getPreferences,
    saveNotification,
    saveLog,
    queueDelivery,
    upsertPreferences,
    savePushToken,
    revokePushToken,
    markRead,
    archiveNotification,
  }
}

export default createNotificationRepository
