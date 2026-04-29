/** @file src/features/notifications/composables/useNotifications.js */

import { storeToRefs } from 'pinia'
import { useNotificationsStore } from '../stores/useNotificationsStore.js'

/**
 * Shared UI composable for notification pages and shell widgets.
 * @returns {Record<string, any>}
 */
export function useNotifications() {
  const store = useNotificationsStore()
  const refs = storeToRefs(store)

  return {
    store,
    ...refs,
    ensureReady: store.ensureReady,
    fetchNotifications: store.fetchNotifications,
    fetchPreferences: store.fetchPreferences,
    savePreferences: store.savePreferences,
    fetchDeliveryLogs: store.fetchDeliveryLogs,
    fetchTemplates: store.fetchTemplates,
    markRead: store.markRead,
    markAllRead: store.markAllRead,
    archive: store.archive,
    retryQueueItem: store.retryQueueItem,
  }
}

export default useNotifications
