/** @file src/features/notifications/runtime/register-notifications.js */

import notificationEventRegistry from '../constants/notification.events.js';
import { createNotificationDispatcher } from '../services/createNotificationDispatcher.js';
import { createNotificationOrchestrator } from '../services/createNotificationOrchestrator.js';
import { createNotificationRecipientsService } from '../services/createNotificationRecipientsService.js';
import { createNotificationRepository } from '../services/createNotificationRepository.js';
import { createNotificationTemplateService } from '../services/createNotificationTemplateService.js';
import { createDomainEventBus } from './createDomainEventBus.js';
import { registerNotificationHooks } from './notification-hooks.js';

/**
 * Register the notifications feature into Totistack runtime.
 *
 * @param {{
 *   app?: any,
 *   pinia?: any,
 *   router?: any,
 *   shardProvider?: any,
 *   eventBus?: { emit: Function, on: Function },
 *   serviceRegistry?: Map<string, any> | { set?: (key: string, value: any) => void },
 *   currentUser?: (() => Record<string, any>|null)|null,
 *   userDirectory?: Record<string, any>,
 *   channels?: Record<string, any>,
 * }} [options={}]
 * @returns {{
 *   eventBus: { emit: Function, on: Function },
 *   repository: ReturnType<typeof createNotificationRepository>,
 *   orchestrator: ReturnType<typeof createNotificationOrchestrator>,
 *   dispatcher: ReturnType<typeof createNotificationDispatcher>,
 *   hooks: { dispose: () => void },
 * }}
 */
export function registerNotificationsFeature(options = {}) {
  const eventBus = options.eventBus || createDomainEventBus();
  //const repository = createNotificationRepository();
  const recipientField = 'user_id'

  const repository = createNotificationRepository({ recipientField })

  const templateService = createNotificationTemplateService();
  const recipientsService = createNotificationRecipientsService({
    currentUser: options.currentUser,
    userDirectory: options.userDirectory,
  });
  const dispatcher = createNotificationDispatcher({
    repository,
    channels: options.channels,
  });
  const orchestrator = createNotificationOrchestrator({
    dispatcher,
    templateService,
    recipientsService,
    repository,
    eventRegistry: notificationEventRegistry,
  });

  const hooks = registerNotificationHooks({
    eventBus,
    orchestrator,
    eventNames: Object.keys(notificationEventRegistry),
  });

  options.app?.provide?.('notifications:eventBus', eventBus);
  options.app?.provide?.('notifications:repository', repository);
  options.app?.provide?.('notifications:orchestrator', orchestrator);

  if (typeof options.serviceRegistry?.set === 'function') {
    options.serviceRegistry.set('notifications:eventBus', eventBus);
    options.serviceRegistry.set('notifications:repository', repository);
    options.serviceRegistry.set('notifications:orchestrator', orchestrator);
    options.serviceRegistry.set('notifications:dispatcher', dispatcher);
  }

  return {
    eventBus,
    repository,
    orchestrator,
    dispatcher,
    hooks,
  };
}

export default registerNotificationsFeature;
