/** @file src/features/notifications/stores/useNotificationsStore.js */

import { computed, ref, unref } from 'vue'
import { defineStore } from 'pinia'
import { useAppStore } from '@app/stores/appStore'
import { createNotificationRepository } from '../services/createNotificationRepository.js'
import { filterNotifications, isUnread, sortNotificationsByNewest } from '../utils/notification.filters.js'

const DEFAULT_PREFERENCES = Object.freeze({
  enabled: true,
  channels: ['in_app', 'email', 'push'],
  quietHours: { enabled: false, start: '22:00', end: '06:00' },
  categorySettings: {},
})

function unwrap(value) {
  return unref(value?.value ?? value)
}

function normalizeRow(row) {
  if (!row || typeof row !== 'object') return null
  return {
    id: row.id || row.docId || row._id || row.ref?.id || row.dedupeKey || null,
    ...row,
  }
}

function normalizeRows(rows) {
  return Array.isArray(rows) ? rows.map(normalizeRow).filter(Boolean) : []
}

function readActionRows(appStore, actions, collectionName) {
  const fromActions = normalizeRows(actions?.state?.items || actions?.items)
  if (fromActions.length) return fromActions

  const collectionState = appStore?.[collectionName]
  return normalizeRows(unwrap(collectionState)?.items || unwrap(collectionState) || [])
}

function getCollectionActions(appStore, collectionName) {
  return appStore.getCollectionActions?.(collectionName)
    || appStore.collectionsActions?.[collectionName]
    || appStore[`${collectionName}Actions`]
    || null
}

async function fetchActions(actions, params = {}) {
  if (!actions) return []
  if (params.filters?.length && typeof actions.fetchByFilters === 'function') {
    return actions.fetchByFilters({
      filters: params.filters,
      pageSize: params.pageSize || 50,
      sortBy: params.sortBy || 'createdAt',
      sortDirection: params.sortDirection || 'desc',
    })
  }
  if (typeof actions.fetchInitialPage === 'function') {
    return actions.fetchInitialPage({
      pageSize: params.pageSize || 50,
      sortBy: params.sortBy || 'createdAt',
      sortDirection: params.sortDirection || 'desc',
    })
  }
  if (typeof actions.fetch === 'function') return actions.fetch(params)
  return []
}

async function updateAction(actions, id, payload) {
  if (!actions || !id) throw new Error('Missing collection actions or document id.')
  if (typeof actions.update === 'function') return actions.update(id, payload)
  if (typeof actions.updateById === 'function') return actions.updateById(id, payload)
  if (typeof actions.setById === 'function') return actions.setById(id, payload, { merge: true })
  throw new Error('Collection actions do not expose update/updateById/setById.')
}

/**
 * Production notifications store.
 * Uses the Totistack root store/shard-provider actions; no demo hydration.
 */
export const useNotificationsStore = defineStore('notifications', () => {
  const appStore = useAppStore()
  const repository = createNotificationRepository({ store: appStore, recipientField: 'user_id' })

  const items = ref([])
  const templates = ref([])
  const logs = ref([])
  const deliveryQueue = ref([])
  const preferences = ref({ ...DEFAULT_PREFERENCES })
  const filters = ref({ search: '', type: '', channel: '', status: '', priority: '', event: '', unreadOnly: false })
  const drawerOpen = ref(false)
  const loading = ref(false)
  const saving = ref(false)
  const error = ref(null)
  const lastLoadedAt = ref(null)

  const currentUser = computed(() => {
    return unwrap(appStore.currentUser)
      || unwrap(appStore.authUser)
      || unwrap(appStore.user)
      || unwrap(appStore.profile)
      || null
  })

  const currentUserId = computed(() => {
    const user = currentUser.value || {}
    return user.uid || user.id || user.user_id || user.userId || null
  })

  const currentRole = computed(() => {
    const user = currentUser.value || {}
    return user.role || user.primaryRole || user.claims?.role || null
  })

  const currentRoles = computed(() => {
  const user = currentUser.value || {}
  return [
    user.role,
    user.primaryRole,
    user.claims?.role,
    ...(Array.isArray(user.roles) ? user.roles : []),
  ]
    .filter(Boolean)
    .map(String)
})

function belongsToCurrentUser(item) {
  if (!item) return false

  const uid = currentUserId.value
  const roles = new Set(currentRoles.value)

  const recipientId =
    item.user_id ||
    item.recipientId ||
    item.uid ||
    item.userId ||
    null

  if (uid && recipientId && String(recipientId) === String(uid)) {
    return true
  }

  const roleScope = Array.isArray(item.roleScope)
    ? item.roleScope.map(String)
    : []

  if (roleScope.length && roleScope.some((role) => roles.has(role))) {
    return true
  }

  return false
}

  const canReadAdminLogs = computed(() => {
    const roles = new Set([currentRole.value, ...(currentUser.value?.roles || [])].filter(Boolean))
    return ['admin', 'sys_admin', 'sysadmin'].some((role) => roles.has(role))
  })

  /*const visibleItems = computed(() => sortNotificationsByNewest(filterNotifications(items.value, filters.value)))
  const unreadCount = computed(() => items.value.filter((item) => isUnread(item)).length)
  const recentItems = computed(() => visibleItems.value.slice(0, 10))*/

  const scopedItems = computed(() => {
    return items.value.filter((item) => belongsToCurrentUser(item))
  })

  const visibleItems = computed(() => {
    return sortNotificationsByNewest(filterNotifications(scopedItems.value, filters.value))
  })

  const unreadCount = computed(() => {
    return scopedItems.value.filter((item) => isUnread(item)).length
  })

  const recentItems = computed(() => visibleItems.value.slice(0, 10));

  const failedDeliveries = computed(() => deliveryQueue.value.filter((item) => item.status === 'failed'))
  const pendingDeliveries = computed(() => deliveryQueue.value.filter((item) => item.status === 'pending'))

  function setError(value) {
    error.value = value ? String(value?.message || value) : null
  }

  function setFilters(payload = {}) {
    filters.value = { ...filters.value, ...payload }
  }

  function setDrawerOpen(value) {
    drawerOpen.value = Boolean(value)
  }

  function findNotification(notificationId) {
    return items.value.find((item) => item.id === notificationId) || null
  }

  /*async function fetchNotifications(options = {}) {
    loading.value = true
    setError(null)
    try {
      const recipientId = options.recipientId || currentUserId.value
      if (!recipientId && !options.allowGlobalRead) {
        items.value = []
        return []
      }
      const rows = await repository.listNotifications({
        recipientId: options.allowGlobalRead ? null : recipientId,
        pageSize: options.pageSize || 75,
        status: options.status || null,
        event: options.event || null,
      })
      items.value = sortNotificationsByNewest(normalizeRows(rows))
      lastLoadedAt.value = new Date().toISOString()
      return items.value
    } catch (err) {
      setError(err)
      throw err
    } finally {
      loading.value = false
    }
  }*/

  async function fetchNotifications(options = {}) {
  loading.value = true
  setError(null)

  try {
    const recipientId = options.recipientId || currentUserId.value
    const role = options.role || currentRole.value

    if (!recipientId && !role && !options.allowGlobalRead) {
      items.value = []
      return []
    }

    if (options.allowGlobalRead) {
      const rows = await repository.listNotifications({
        allowGlobalRead: true,
        pageSize: options.pageSize || 75,
        status: options.status || null,
        event: options.event || null,
      })

      items.value = sortNotificationsByNewest(normalizeRows(rows))
      lastLoadedAt.value = new Date().toISOString()
      return visibleItems.value
    }

    const requests = []

    if (recipientId) {
      requests.push(
        repository.listNotifications({
          recipientId,
          pageSize: options.pageSize || 75,
          status: options.status || null,
          event: options.event || null,
        }),
      )
    }

    if (role) {
      requests.push(
        repository.listNotifications({
          roleScope: role,
          pageSize: options.pageSize || 75,
          status: options.status || null,
          event: options.event || null,
        }),
      )
    }

    const results = await Promise.allSettled(requests)

    const merged = new Map()

    for (const result of results) {
      if (result.status !== 'fulfilled') continue

      for (const row of normalizeRows(result.value)) {
        const id = row.id || row.docId || row._id || row.dedupeKey
        if (!id) continue
        merged.set(id, row)
      }
    }

    items.value = sortNotificationsByNewest(
      [...merged.values()].filter((item) => belongsToCurrentUser(item)),
    )

    lastLoadedAt.value = new Date().toISOString()
    return items.value
  } catch (err) {
    setError(err)
    throw err
  } finally {
    loading.value = false
  }
}

  async function fetchPreferences(options = {}) {
    const recipientId = options.recipientId || currentUserId.value
    if (!recipientId) return preferences.value
    try {
      const row = await repository.getPreferences(recipientId)
      preferences.value = { ...DEFAULT_PREFERENCES, ...(row || {}) }
      return preferences.value
    } catch (err) {
      setError(err)
      throw err
    }
  }

  async function savePreferences(payload = {}) {
    const recipientId = currentUserId.value
    if (!recipientId) throw new Error('Cannot save notification preferences without a signed-in user id.')
    saving.value = true
    setError(null)
    try {
      const saved = await repository.upsertPreferences(recipientId, { ...preferences.value, ...payload })
      preferences.value = { ...DEFAULT_PREFERENCES, ...(saved || payload) }
      return preferences.value
    } catch (err) {
      setError(err)
      throw err
    } finally {
      saving.value = false
    }
  }

  function setPreferences(payload = {}) {
    preferences.value = { ...preferences.value, ...payload }
  }

  async function fetchTemplates(options = {}) {
    setError(null)
    try {
      const actions = getCollectionActions(appStore, 'notification_templates')
      await fetchActions(actions, { pageSize: options.pageSize || 100 })
      templates.value = readActionRows(appStore, actions, 'notification_templates')
      return templates.value
    } catch (err) {
      setError(err)
      throw err
    }
  }

  async function fetchDeliveryLogs(options = {}) {
    if (!canReadAdminLogs.value && !options.force) return { logs: [], deliveryQueue: [] }
    loading.value = true
    setError(null)
    try {
      const logActions = getCollectionActions(appStore, 'notification_logs')
      const queueActions = getCollectionActions(appStore, 'notification_delivery_queue')
      const logFilters = []
      const queueFilters = []
      if (options.status) {
        logFilters.push({ field: 'status', op: '==', value: options.status })
        queueFilters.push({ field: 'status', op: '==', value: options.status })
      }
      if (options.channel) {
        logFilters.push({ field: 'channel', op: '==', value: options.channel })
        queueFilters.push({ field: 'channel', op: '==', value: options.channel })
      }
      if (options.event) {
        logFilters.push({ field: 'event', op: '==', value: options.event })
        queueFilters.push({ field: 'event', op: '==', value: options.event })
      }

      await Promise.all([
        fetchActions(logActions, { filters: logFilters, pageSize: options.pageSize || 100 }),
        fetchActions(queueActions, { filters: queueFilters, pageSize: options.pageSize || 100 }),
      ])

      logs.value = readActionRows(appStore, logActions, 'notification_logs')
      deliveryQueue.value = readActionRows(appStore, queueActions, 'notification_delivery_queue')
      return { logs: logs.value, deliveryQueue: deliveryQueue.value }
    } catch (err) {
      setError(err)
      throw err
    } finally {
      loading.value = false
    }
  }

  async function markRead(notificationId) {
    if (!notificationId) return null
    const now = new Date().toISOString()
    items.value = items.value.map((item) => (
      item.id === notificationId ? { ...item, readAt: item.readAt || now, status: 'read', updatedAt: now } : item
    ))
    return updateAction(getCollectionActions(appStore, 'notifications'), notificationId, { readAt: now, status: 'read', updatedAt: now })
  }

  async function markAllRead() {
    const targets = items.value.filter((item) => isUnread(item))
    const now = new Date().toISOString()
    items.value = items.value.map((item) => (
      isUnread(item) ? { ...item, readAt: now, status: 'read', updatedAt: now } : item
    ))
    await Promise.allSettled(targets.map((item) => updateAction(getCollectionActions(appStore, 'notifications'), item.id, { readAt: now, status: 'read', updatedAt: now })))
  }

  async function archive(notificationId) {
    if (!notificationId) return null
    const now = new Date().toISOString()
    items.value = items.value.map((item) => (
      item.id === notificationId ? { ...item, archivedAt: now, status: 'archived', updatedAt: now } : item
    ))
    return updateAction(getCollectionActions(appStore, 'notifications'), notificationId, { archivedAt: now, status: 'archived', updatedAt: now })
  }

  async function retryQueueItem(item) {
    const queueId = item?.id
    if (!queueId) throw new Error('Missing queue item id.')
    const actions = getCollectionActions(appStore, 'notification_delivery_queue')
    const payload = {
      status: 'pending',
      lockedAt: null,
      lockedBy: null,
      lastError: null,
      processAfter: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    await updateAction(actions, queueId, payload)
    deliveryQueue.value = deliveryQueue.value.map((row) => (row.id === queueId ? { ...row, ...payload } : row))
  }

  async function ensureReady(options = {}) {
    await Promise.all([
      fetchNotifications(options),
      fetchPreferences(options).catch(() => null),
    ])
  }

  return {
    items,
    templates,
    logs,
    deliveryQueue,
    preferences,
    filters,
    drawerOpen,
    loading,
    saving,
    error,
    lastLoadedAt,
    currentUser,
    currentUserId,
    currentRole,
    canReadAdminLogs,
    visibleItems,
    unreadCount,
    recentItems,
    scopedItems,
    currentRoles,
    failedDeliveries,
    pendingDeliveries,
    setFilters,
    setDrawerOpen,
    findNotification,
    fetchNotifications,
    fetchPreferences,
    savePreferences,
    setPreferences,
    fetchTemplates,
    fetchDeliveryLogs,
    markRead,
    markAllRead,
    archive,
    retryQueueItem,
    ensureReady,
  }
})

export default useNotificationsStore
