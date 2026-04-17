/** @file src/features/notifications/stores/useNotificationsStore.js */

import { computed, ref } from 'vue';
import { defineStore } from 'pinia';
import { filterNotifications, sortNotificationsByNewest } from '../utils/notification.filters.js';

/**
 * Notifications Pinia store.
 */
export const useNotificationsStore = defineStore('notifications', () => {
  const items = ref([]);
  const templates = ref([]);
  const logs = ref([]);
  const preferences = ref({
    enabled: true,
    channels: ['in_app', 'email', 'whatsapp'],
    quietHours: { enabled: false, start: '22:00', end: '06:00' },
    categorySettings: {},
  });
  const filters = ref({
    search: '',
    type: '',
    channel: '',
    status: '',
    priority: '',
    unreadOnly: false,
  });
  const drawerOpen = ref(false);
  const loading = ref(false);
  const error = ref(null);

  const visibleItems = computed(() => sortNotificationsByNewest(filterNotifications(items.value, filters.value)));
  const unreadCount = computed(() => items.value.filter((item) => !item.readAt && item.status !== 'archived').length);
  const recentItems = computed(() => visibleItems.value.slice(0, 10));

  function hydrate(payload = {}) {
    if (Array.isArray(payload.items)) items.value = payload.items;
    if (Array.isArray(payload.templates)) templates.value = payload.templates;
    if (Array.isArray(payload.logs)) logs.value = payload.logs;
    if (payload.preferences) preferences.value = { ...preferences.value, ...payload.preferences };
  }

  function setFilters(payload = {}) {
    filters.value = { ...filters.value, ...payload };
  }

  function setDrawerOpen(value) {
    drawerOpen.value = Boolean(value);
  }

  function prependNotification(notification) {
    items.value = [notification, ...items.value.filter((item) => item.id !== notification.id)];
  }

  function markRead(notificationId) {
    items.value = items.value.map((item) =>
      item.id === notificationId ? { ...item, readAt: item.readAt || new Date().toISOString(), status: 'read' } : item,
    );
  }

  function markAllRead() {
    const now = new Date().toISOString();
    items.value = items.value.map((item) =>
      item.readAt ? item : { ...item, readAt: now, status: 'read' },
    );
  }

  function archive(notificationId) {
    items.value = items.value.map((item) =>
      item.id === notificationId ? { ...item, archivedAt: new Date().toISOString(), status: 'archived' } : item,
    );
  }

  function setPreferences(payload = {}) {
    preferences.value = { ...preferences.value, ...payload };
  }

  return {
    items,
    templates,
    logs,
    preferences,
    filters,
    drawerOpen,
    loading,
    error,
    visibleItems,
    unreadCount,
    recentItems,
    hydrate,
    setFilters,
    setDrawerOpen,
    prependNotification,
    markRead,
    markAllRead,
    archive,
    setPreferences,
  };
});

export default useNotificationsStore;
