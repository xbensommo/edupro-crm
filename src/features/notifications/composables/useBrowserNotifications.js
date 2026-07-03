/** @file src/features/notifications/composables/useBrowserNotifications.js */

import { computed, ref, unref } from 'vue'
import { useAppStore } from '@app/stores/appStore'
import { createBrowserPushService } from '../services/createBrowserPushService.js'

export function useBrowserNotifications(options = {}) {
  const appStore = options.store || useAppStore()
  const loading = ref(false)
  const error = ref(null)
  const lastTokenRecord = ref(null)

  const currentUser = computed(() => (
    unref(appStore.currentUser) || unref(appStore.authUser) || unref(appStore.user) || null
  ))

  const service = createBrowserPushService({
    store: appStore,
    firebaseApp: options.firebaseApp,
    vapidKey: options.vapidKey,
    currentUser: () => currentUser.value,
  })

  const supported = computed(() => {
    if (typeof window === 'undefined') return false
    return 'Notification' in window && 'serviceWorker' in navigator
  })

  const permission = computed(() => {
    if (typeof window === 'undefined' || !('Notification' in window)) return 'unsupported'
    return Notification.permission
  })

  async function enableBrowserNotifications() {
    loading.value = true
    error.value = null
    try {
      lastTokenRecord.value = await service.enable()
      return lastTokenRecord.value
    } catch (err) {
      error.value = err?.message || String(err)
      throw err
    } finally {
      loading.value = false
    }
  }

  async function disableBrowserNotifications() {
    loading.value = true
    error.value = null
    try {
      return await service.disable()
    } catch (err) {
      error.value = err?.message || String(err)
      throw err
    } finally {
      loading.value = false
    }
  }

  return {
    supported,
    permission,
    loading,
    error,
    lastTokenRecord,
    enableBrowserNotifications,
    disableBrowserNotifications,
    onForegroundMessage: service.onForegroundMessage,
  }
}

export default useBrowserNotifications
