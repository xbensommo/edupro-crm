/**
 * @file src/features/notifications/services/createNotificationOrchestrator.js
 * @description Event orchestrator that resolves recipients and dispatches canonical rows.
 */

/**
 * @param {{
 *   dispatcher: { dispatch: (payload: Record<string, any>) => Promise<any[]> },
 *   templateService: { renderTemplate: (event: string, variables?: Record<string, any>) => { title: string, body: string } },
 *   recipientsService: { resolveRecipients: (event: string, payload?: Record<string, any>) => Promise<any[]> },
 *   repository?: { getPreferences?: (recipientId: string) => Promise<Record<string, any>|null> },
 *   eventRegistry?: Record<string, any>,
 *   recipientField?: string,
 *   createId?: () => string,
 *   now?: () => Date,
 * }} options
 */
export function createNotificationOrchestrator(options = {}) {
  const dispatcher = options.dispatcher
  const templateService = options.templateService
  const recipientsService = options.recipientsService
  const repository = options.repository || {}
  const eventRegistry = options.eventRegistry || {}
  const recipientField = options.recipientField || 'user_id'
  const createId = typeof options.createId === 'function' ? options.createId : () => `notif_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
  const now = typeof options.now === 'function' ? options.now : () => new Date()

  function getEventDefinition(event) {
    return eventRegistry[event] || null
  }

  async function handleEvent(event, payload = {}) {
    const definition = getEventDefinition(event)
    const recipients = await recipientsService.resolveRecipients(event, payload)
    if (!recipients.length) return []

    const results = []

    for (const recipient of recipients) {
      const recipientId = recipient?.recipientId || recipient?.[recipientField] || recipient?.user_id || recipient?.user_id || recipient?.uid || recipient?.id
      if (!recipientId) continue

      const preferences = typeof repository.getPreferences === 'function'
        ? await repository.getPreferences(recipientId)
        : null

      if (preferences?.enabled === false) continue

      const permittedChannels = (payload.channels?.length ? payload.channels : definition?.channels || ['in_app']).filter((channel) => {
        if (!preferences?.channels?.length) return true
        return preferences.channels.includes(channel)
      })
      if (!permittedChannels.length) continue

      const variables = {
        ...payload,
        recipientId,
        actorName: payload.actorName || recipient.actorName || 'System',
        entityLabel: payload.entityLabel || payload.entityName || payload.engagementCode || payload.entityId || 'record',
        clientName: payload.clientName || 'client',
        dueDate: payload.dueDate || 'not set',
        roleName: payload.roleName || payload.role || recipient.role || 'user',
        amountPaid: payload.amountPaid || payload.amount || '0',
        amountDue: payload.amountDue || payload.consultantShare || '0',
        deductionLabel: payload.deductionLabel || payload.deductionAmount || '10%',
        message: payload.message || '',
      }

      const rendered = templateService.renderTemplate(event, variables)
      const deliveries = await dispatcher.dispatch({
        id: createId(),
        recipientId,
        [recipientField]: recipientId,
        title: rendered.title,
        message: rendered.body,
        event,
        type: payload.type || definition?.type || payload.domain || 'system',
        domain: payload.domain || definition?.type || 'system',
        sourceModule: payload.sourceModule || definition?.type || payload.domain || 'system',
        priority: payload.priority || definition?.priority || 'normal',
        actionUrl: payload.actionUrl || null,
        actionLabel: payload.actionLabel || null,
        isActionRequired: Boolean(payload.isActionRequired),
        entityType: payload.entityType || null,
        entityId: payload.entityId || null,
        entityLabel: variables.entityLabel,
        actorId: payload.actorId || null,
        actorName: payload.actorName || 'System',
        channels: permittedChannels,
        roleScope: payload.roleScope || recipient.role || null,
        meta: payload.meta || null,
        createdAt: now().toISOString(),
      })

      results.push(...deliveries)
    }

    return results
  }

  return {
    handleEvent,
    getEventDefinition,
  }
}

export default createNotificationOrchestrator
