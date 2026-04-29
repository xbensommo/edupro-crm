/** @file src/features/notifications/services/createNotificationBridge.js */

import notificationEventRegistry from '../constants/notification.events.js'
import { createNotificationDispatcher } from './createNotificationDispatcher.js'
import { createNotificationOrchestrator } from './createNotificationOrchestrator.js'
import { createNotificationRecipientsService } from './createNotificationRecipientsService.js'
import { createNotificationRepository } from './createNotificationRepository.js'
import { createNotificationTemplateService } from './createNotificationTemplateService.js'

/**
 * Builds the application notification bridge used by CRM, finance, auth,
 * and client-records. This is intentionally linear: repository -> recipients
 * -> templates -> dispatcher -> orchestrator.
 *
 * @param {{ store?: any, currentUser?: () => any, recipientField?: string }} options
 */
export function createNotificationBridge(options = {}) {
  const recipientField = options.recipientField || 'user_id'
  const repository = createNotificationRepository({ store: options.store, recipientField })
  const recipientsService = createNotificationRecipientsService({
    store: options.store,
    currentUser: options.currentUser,
    recipientField,
  })
  const templateService = createNotificationTemplateService({ eventRegistry: notificationEventRegistry })
  const dispatcher = createNotificationDispatcher({ repository, recipientField })
  const orchestrator = createNotificationOrchestrator({
    dispatcher,
    templateService,
    recipientsService,
    repository,
    eventRegistry: notificationEventRegistry,
    recipientField,
  })

  return {
    emit: orchestrator.handleEvent,
    repository,
    recipientsService,
    templateService,
    dispatcher,
    orchestrator,
  }
}

export default createNotificationBridge
