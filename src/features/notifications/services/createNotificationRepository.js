/** @file src/features/notifications/services/createNotificationRepository.js */

import { createShardedActions } from '@xbensommo/shard-provider';

/**
 * Build a repository around shard-provider collection actions.
 *
 * @param {{
 *   provider?: any,
 *   createActions?: typeof createShardedActions,
 *   actions?: Record<string, any>,
 *   states?: Record<string, any>,
 * }} [options={}]
 * @returns {{
 *   listNotifications: (params?: Record<string, any>) => Promise<Array<Record<string, any>>>,
 *   listTemplates: () => Promise<Array<Record<string, any>>>,
 *   listLogs: (params?: Record<string, any>) => Promise<Array<Record<string, any>>>,
 *   getPreferences: (userId: string) => Promise<Record<string, any>|null>,
 *   saveNotification: (payload: Record<string, any>) => Promise<Record<string, any>>,
 *   saveLog: (payload: Record<string, any>) => Promise<Record<string, any>>,
 *   upsertPreferences: (userId: string, payload: Record<string, any>) => Promise<Record<string, any>>,
 *   markRead: (notificationId: string, payload?: Record<string, any>) => Promise<any>,
 *   markAllRead: (userId: string, ids?: string[]) => Promise<Array<any>>,
 *   archiveNotification: (notificationId: string) => Promise<any>,
 *   actions: Record<string, any>,
 *   states: Record<string, any>,
 * }}
 */
export function createNotificationRepository(options = {}) {
  const provider = options.provider;
  const createActions = options.createActions || createShardedActions;
  const states = options.states || {
    notifications: { items: [], loading: false, error: null },
    notification_preferences: { items: [], loading: false, error: null },
    notification_templates: { items: [], loading: false, error: null },
    notification_logs: { items: [], loading: false, error: null },
  };

  const actions = {
    notifications:
      options.actions?.notifications || createActions('notifications', states.notifications, provider),
    notification_preferences:
      options.actions?.notification_preferences ||
      createActions('notification_preferences', states.notification_preferences, provider),
    notification_templates:
      options.actions?.notification_templates ||
      createActions('notification_templates', states.notification_templates, provider),
    notification_logs:
      options.actions?.notification_logs || createActions('notification_logs', states.notification_logs, provider),
  };

  async function listNotifications(params = {}) {
    const { userId, filters = [], limit = 50 } = params;
    const mergedFilters = [...filters];

    if (userId) {
      mergedFilters.push({ field: 'userId', op: '==', value: userId });
    }

    await actions.notifications.fetchInitialPage({
      filters: mergedFilters,
      limit,
      orderBy: [{ field: 'createdAt', direction: 'desc' }],
    });

    return states.notifications.items || [];
  }

  async function listTemplates() {
    await actions.notification_templates.fetchInitialPage({
      limit: 100,
      orderBy: [{ field: 'createdAt', direction: 'desc' }],
    });

    return states.notification_templates.items || [];
  }

  async function listLogs(params = {}) {
    const { notificationId, limit = 100 } = params;
    const filters = [];

    if (notificationId) {
      filters.push({ field: 'notificationId', op: '==', value: notificationId });
    }

    await actions.notification_logs.fetchInitialPage({
      filters,
      limit,
      orderBy: [{ field: 'createdAt', direction: 'desc' }],
    });

    return states.notification_logs.items || [];
  }

  async function getPreferences(userId) {
    await actions.notification_preferences.fetchInitialPage({
      filters: [{ field: 'userId', op: '==', value: userId }],
      limit: 1,
      orderBy: [{ field: 'updatedAt', direction: 'desc' }],
    });

    return states.notification_preferences.items?.[0] || null;
  }

  async function saveNotification(payload) {
    const saved = await actions.notifications.add(payload);
    return saved;
  }

  async function saveLog(payload) {
    const saved = await actions.notification_logs.add(payload);
    return saved;
  }

  async function upsertPreferences(userId, payload) {
    const current = await getPreferences(userId);

    if (current?.id) {
      await actions.notification_preferences.update(current.id, payload);
      return { ...current, ...payload };
    }

    return actions.notification_preferences.add({
      userId,
      ...payload,
    });
  }

  async function markRead(notificationId, payload = {}) {
    return actions.notifications.update(notificationId, {
      readAt: payload.readAt || new Date().toISOString(),
      status: payload.status || 'read',
      updatedAt: new Date().toISOString(),
    });
  }

  async function markAllRead(userId, ids = []) {
    const targetIds = ids.length ? ids : (await listNotifications({ userId, limit: 200 }))
      .filter((item) => !item.readAt)
      .map((item) => item.id);

    return Promise.all(targetIds.map((id) => markRead(id)));
  }

  async function archiveNotification(notificationId) {
    return actions.notifications.update(notificationId, {
      archivedAt: new Date().toISOString(),
      status: 'archived',
      updatedAt: new Date().toISOString(),
    });
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
    states,
  };
}

export default createNotificationRepository;
