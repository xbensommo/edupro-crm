/**
 * @file src/features/notifications/services/createNotificationRepository.js
 * @description Repository with one canonical runtime contract for notifications.
 */

import { useAppStore } from '@app/stores/appStore'
import {
  buildNotificationLog,
  buildNotificationPreferences,
  buildNotificationRecord,
} from '../utils/buildNotificationRecord.js'

/**
 * Convert store rows into plain records with ids.
 *
 * @param {any[]} [rows=[]]
 * @returns {Record<string, any>[]}
 */
function normalizeRows(rows = []) {
  return rows
    .filter(Boolean)
    .map((entry) => {
      const data = entry?.data && typeof entry.data === 'object' ? entry.data : entry
      const id = entry?.id || entry?.docId || data?.id || null
      return { id, ...data }
    })
}

/**
 * Build a repository around shard-provider collection actions.
 *
 * @param {{
 *   store?: any,
 *   recipientField?: string,
 *   now?: () => Date,
 * }} [options={}]
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
  }

  function requireActions(key) {
    const target = actions[key]
    if (!target) {
      throw new Error(`Notification repository missing collection actions for '${key}'.`)
    }
    return target
  }

  async function listNotifications(params = {}) {
    const notifications = requireActions('notifications')
    const recipientId = params.recipientId || params.user_id || params.user_id || null
    const filters = []

    if (recipientId) {
      filters.push({ field: recipientField, op: '==', value: recipientId })
    }

    if (params.status) {
      filters.push({ field: 'status', op: '==', value: params.status })
    }

    await notifications.fetchByFilters?.({ filters })
    const stateRows = notifications.state?.items || store.notifications?.items || []
    return normalizeRows(stateRows)
  }

  async function listTemplates() {
    const templates = requireActions('notificationTemplates')
    await templates.fetchInitialPage?.({ pageSize: 100, sortBy: 'createdAt', sortDirection: 'desc' })
    const stateRows = templates.state?.items || store.notification_templates?.items || []
    return normalizeRows(stateRows)
  }

  async function listLogs(params = {}) {
    const logs = requireActions('notificationLogs')
    const filters = []
    if (params.notificationId) {
      filters.push({ field: 'notificationId', op: '==', value: params.notificationId })
    }
    await logs.fetchByFilters?.({ filters })
    const stateRows = logs.state?.items || store.notification_logs?.items || []
    return normalizeRows(stateRows)
  }

  async function getPreferences(recipientId) {
    const preferences = requireActions('notificationPreferences')
    await preferences.fetchByFilters?.({ filters: [{ field: recipientField, op: '==', value: recipientId }] })
    const rows = normalizeRows(preferences.state?.items || store.notification_preferences?.items || [])
    return rows[0] || null
  }

  async function saveNotification(payload) {
    const notifications = requireActions('notifications')
    return notifications.add(buildNotificationRecord(payload, { recipientField, now }))
  }

  async function saveLog(payload) {
    const logs = requireActions('notificationLogs')
    return logs.add(buildNotificationLog(payload, { recipientField, now }))
  }

  async function upsertPreferences(recipientId, payload = {}) {
    const preferences = requireActions('notificationPreferences')
    const current = await getPreferences(recipientId)
    const normalized = buildNotificationPreferences(recipientId, payload, { recipientField, now })

    if (current?.id) {
      await preferences.update(current.id, {
        ...normalized,
        createdAt: current.createdAt || normalized.createdAt,
      })
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

  async function markAllRead(recipientId, ids = []) {
    const targetIds = ids.length
      ? ids
      : (await listNotifications({ recipientId }))
          .filter((item) => !item.readAt)
          .map((item) => item.id)
          .filter(Boolean)

    return Promise.all(targetIds.map((id) => markRead(id)))
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
    listNotifications,
    listTemplates,
    listLogs,
    getPreferences,
    saveNotification,
    saveLog,
    upsertPreferences,
    markRead,
    markAllRead,
    archiveNotification,
    actions,
  }
}

export default createNotificationRepository
