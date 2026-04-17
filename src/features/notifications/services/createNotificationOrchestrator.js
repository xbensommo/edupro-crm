/** @file src/features/notifications/services/createNotificationOrchestrator.js */

import notificationEventRegistry from '../constants/notification.events.js';
import { NOTIFICATION_PRIORITIES } from '../constants/notification.statuses.js';
import { createNotificationId } from '../utils/notification.helpers.js';

/**
 * Create the main event-driven notifications orchestrator.
 *
 * @param {{
 *   dispatcher: { dispatch: (payload: Record<string, any>) => Promise<Array<Record<string, any>>> },
 *   templateService: { renderTemplate: (event: string, variables?: Record<string, unknown>) => { title: string, body: string, definition: Record<string, any> } },
 *   recipientsService: { resolveRecipients: (event: string, payload?: Record<string, any>) => Promise<Array<Record<string, any>>> },
 *   repository?: { getPreferences?: (userId: string) => Promise<Record<string, any>|null> },
 *   eventRegistry?: Record<string, Record<string, any>>,
 * }} options
 * @returns {{
 *   handleEvent: (event: string, payload?: Record<string, any>) => Promise<Array<Record<string, any>>>,
 *   getEventDefinition: (event: string) => Record<string, any> | undefined,
 * }}
 */
export function createNotificationOrchestrator(options) {
  const dispatcher = options.dispatcher;
  const templateService = options.templateService;
  const recipientsService = options.recipientsService;
  const repository = options.repository || {};
  const eventRegistry = options.eventRegistry || notificationEventRegistry;

  function getEventDefinition(event) {
    return eventRegistry[event];
  }

  async function handleEvent(event, payload = {}) {
    const definition = getEventDefinition(event);

    if (!definition) return [];

    const recipients = await recipientsService.resolveRecipients(event, payload);
    if (!recipients.length) return [];

    const results = [];

    for (const recipient of recipients) {
      const userId = recipient.userId || recipient.id;
      if (!userId) continue;

      const preferences =
        typeof repository.getPreferences === 'function'
          ? await repository.getPreferences(userId)
          : null;

      if (preferences?.enabled === false) continue;

      const permittedChannels = (definition.channels || []).filter((channel) => {
        if (!preferences?.channels?.length) return true;
        return preferences.channels.includes(channel);
      });

      if (!permittedChannels.length) continue;

      const variables = {
        ...payload,
        userId,
        actorName: payload.actorName || recipient.actorName || 'System',
        entityLabel: payload.entityLabel || payload.entityName || payload.entityId || 'record',
        message: payload.message || '',
      };

      const rendered = templateService.renderTemplate(event, variables);

      const deliveries = await dispatcher.dispatch({
        id: createNotificationId(),
        userId,
        title: rendered.title,
        message: rendered.body,
        event,
        type: definition.type,
        priority: payload.priority || definition.priority || NOTIFICATION_PRIORITIES.NORMAL,
        actionUrl: payload.actionUrl || null,
        entityType: payload.entityType || null,
        entityId: payload.entityId || null,
        actorId: payload.actorId || null,
        actorName: payload.actorName || 'System',
        channels: payload.channels?.length ? payload.channels : permittedChannels,
        meta: payload.meta || null,
        createdAt: new Date().toISOString(),
      });

      results.push(...deliveries);
    }

    return results;
  }

  return {
    handleEvent,
    getEventDefinition,
  };
}

export default createNotificationOrchestrator;
