/** @file src/features/notifications/composables/useUnreadCount.js */

import { computed, onMounted } from 'vue'
import { useNotificationsStore } from '../stores/useNotificationsStore.js'

/**
 * Lightweight unread counter for topbars and badges.
 * @returns {{ unreadCount: import('vue').ComputedRef<number>, refreshUnreadCount: () => Promise<any> }}
 */
export function useUnreadCount() {
  const store = useNotificationsStore()
  const unreadCount = computed(() => store.unreadCount)

  async function refreshUnreadCount() {
    return store.fetchNotifications({ pageSize: 25 })
  }

  onMounted(() => {
    if (!store.items.length) refreshUnreadCount().catch(() => null)
  })

  return { unreadCount, refreshUnreadCount }
}

export default useUnreadCount
