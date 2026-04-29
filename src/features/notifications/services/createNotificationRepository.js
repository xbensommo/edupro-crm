/** @file src/features/notifications/services/createNotificationRepository.js */

import { useAppStore } from '@app/stores/appStore'
import {
  buildNotificationDeliveryQueueItem,
  buildNotificationLog,
  buildNotificationPreferences,
  buildNotificationRecord,
} from '../utils/buildNotificationRecord.js'
import { normalizeStoreRow } from '../utils/notification.helpers.js'

function rowsFromActions(actions, fallbackRows = []) {
  const rows = actions?.state?.items || fallbackRows || []
  return Array.isArray(rows) ? rows.map(normalizeStoreRow).filter(Boolean) : []
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
  }

  function requireActions(key) {
    const target = actions[key]
    if (!target) throw new Error(`Notification repository missing collection actions for '${key}'.`)
    return target
  }

  /*async function listNotifications(params = {}) {
    const notifications = requireActions('notifications')
    const filters = []
    const recipientId = params.recipientId || params[recipientField] || params.user_id || null
    if (recipientId) filters.push({ field: recipientField, op: '==', value: recipientId })
    if (params.status) filters.push({ field: 'status', op: '==', value: params.status })
    if (params.event) filters.push({ field: 'event', op: '==', value: params.event })
    await notifications.fetchByFilters?.({ filters, pageSize: params.pageSize || 50 })
    return rowsFromActions(notifications, store.notifications?.items)
  }*/

  async function listNotifications(params = {}) {
    const notifications = requireActions('notifications')
    const filters = []

    const recipientId = params.recipientId || params[recipientField] || params.user_id || null

    if (recipientId) {
      filters.push({ field: recipientField, op: '==', value: recipientId })
    }

    if (params.roleScope) {
      filters.push({ field: 'roleScope', op: 'array-contains', value: params.roleScope })
    }

    if (params.status) {
      filters.push({ field: 'status', op: '==', value: params.status })
    }

    if (params.event) {
      filters.push({ field: 'event', op: '==', value: params.event })
    }

    if (!filters.length && !params.allowGlobalRead) {
      return []
    }

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
    return notifications.add(buildNotificationRecord(payload, { recipientField, now }))
  }

  async function saveLog(payload) {
    const logs = requireActions('notificationLogs')
    return logs.add(buildNotificationLog(payload, { recipientField, now }))
  }

  async function queueDelivery(payload) {
    const queue = requireActions('notificationDeliveryQueue')
    const record = buildNotificationDeliveryQueueItem(payload, { recipientField, now })
    return queue.add(record)
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
    markRead,
    archiveNotification,
  }
}

export default createNotificationRepository
