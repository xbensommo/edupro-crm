/** @file src/features/notifications/services/createNotificationOrchestrator.js */

import notificationEventRegistry, { resolveNotificationEvent } from '../constants/notification.events.js'

/**
 * @param {{
 *   dispatcher: { dispatch: (payload: Record<string, any>) => Promise<any[]> },
 *   templateService: { renderTemplate: (event: string, variables?: Record<string, any>) => { title: string, body: string } },
 *   recipientsService: { resolveRecipients: (event: string, payload?: Record<string, any>) => Promise<any[]> },
 *   repository?: { getPreferences?: (recipientId: string) => Promise<Record<string, any>|null> },
 *   eventRegistry?: Record<string, any>,
 *   recipientField?: string,
 *   now?: () => Date,
 * }} options
 */
export function createNotificationOrchestrator(options = {}) {
  const dispatcher = options.dispatcher
  const templateService = options.templateService
  const recipientsService = options.recipientsService
  const repository = options.repository || {}
  const eventRegistry = options.eventRegistry || notificationEventRegistry
  const recipientField = options.recipientField || 'user_id'
  const now = typeof options.now === 'function' ? options.now : () => new Date()

  function getEventDefinition(event) {
    return eventRegistry[resolveNotificationEvent(event)] || eventRegistry['system.alert']
  }

  async function handleEvent(event, payload = {}) {
  const canonicalEvent = resolveNotificationEvent(event)
  const definition = getEventDefinition(canonicalEvent)

  const rawRecipients = await recipientsService.resolveRecipients(canonicalEvent, payload)
  if (!rawRecipients.length) return []

  /**
   * HARD DEDUPE:
   * One event + one entity + one recipient = one notification.
   */
  const recipientMap = new Map()

  for (const recipient of rawRecipients) {
    const recipientId =
      recipient?.recipientId ||
      recipient?.[recipientField] ||
      recipient?.uid ||
      recipient?.id ||
      null

    if (!recipientId) continue

    const dedupeKey = [
      canonicalEvent,
      payload.entityType || 'entity',
      payload.entityId || payload.engagementId || payload.id || payload.engagementCode || 'unknown',
      recipientId,
    ].join(':')

    if (!recipientMap.has(dedupeKey)) {
      recipientMap.set(dedupeKey, {
        ...recipient,
        recipientId,
        dedupeKey,
      })
      continue
    }

    /**
     * Merge duplicate recipient data.
     * Keep first recipient, but preserve missing email/name if later duplicate has it.
     */
    const existing = recipientMap.get(dedupeKey)

    recipientMap.set(dedupeKey, {
      ...existing,
      recipientEmail: existing.recipientEmail || recipient.recipientEmail || recipient.email || null,
      recipientName: existing.recipientName || recipient.recipientName || recipient.displayName || recipient.name || null,
      role: existing.role || recipient.role || null,
    })
  }

  const recipients = [...recipientMap.values()]
  if (!recipients.length) return []

  const results = []

  for (const recipient of recipients) {
    const recipientId = recipient.recipientId
    if (!recipientId) continue

    const preferences = typeof repository.getPreferences === 'function'
      ? await repository.getPreferences(recipientId)
      : null

    if (preferences?.enabled === false) continue

    const allowedByEvent = payload.channels?.length
      ? payload.channels
      : definition.channels || ['in_app']

    const permittedChannels = [...new Set(allowedByEvent)].filter((channel) => {
      if (!preferences?.channels?.length) return true
      return preferences.channels.includes(channel)
    })

    if (!permittedChannels.length) continue

    const variables = {
      ...payload,
      recipientId,
      recipientEmail: recipient.recipientEmail || recipient.email || payload.recipientEmail || null,
      recipientName: recipient.recipientName || recipient.displayName || recipient.name || payload.recipientName || null,
      actorName: payload.actorName || 'System',
      entityLabel:
        payload.entityLabel ||
        payload.entityName ||
        payload.engagementCode ||
        payload.title ||
        payload.entityId ||
        'record',
      clientName: payload.clientName || 'client',
      dueDate: payload.dueDate || 'not set',
      roleName: payload.roleName || recipient.role || payload.role || 'user',
      amountPaid: payload.amountPaid || payload.amount || '0',
      amountDue: payload.amountDue || payload.consultantShare || '0',
      deductionLabel: payload.deductionLabel || payload.deductionAmount || 'none',
      editorNotes: payload.editorNotes || payload.reviewRemarks || payload.message || '',
      message: payload.message || '',
    }

    const rendered = templateService.renderTemplate(canonicalEvent, variables)

    /**
     * IMPORTANT:
     * roleScope must only be set for role-broadcast notifications.
     * Do NOT infer roleScope from recipient.role.
     */
    const roleScope = Array.isArray(payload.roleScope)
      ? [...new Set(payload.roleScope.filter(Boolean).map(String))]
      : []

    const deliveries = await dispatcher.dispatch({
      recipientId,
      [recipientField]: recipientId,

      recipientEmail: recipient.recipientEmail || recipient.email || payload.recipientEmail || null,
      recipientName: recipient.recipientName || recipient.displayName || recipient.name || payload.recipientName || null,

      title: rendered.title,
      message: rendered.body,
      event: canonicalEvent,

      type: payload.type || definition.type || payload.domain || 'system',
      domain: payload.domain || definition.type || 'system',
      sourceModule: payload.sourceModule || payload.domain || definition.type || 'system',

      priority: payload.priority || definition.priority || 'normal',
      templateKey: definition.templateKey || canonicalEvent,
      variables,

      actionUrl: payload.actionUrl || null,
      actionLabel: payload.actionLabel || null,
      isActionRequired: Boolean(payload.isActionRequired ?? definition.actionRequired),

      entityType: payload.entityType || null,
      entityId: payload.entityId || null,
      entityLabel: variables.entityLabel,

      actorId: payload.actorId || null,
      actorName: variables.actorName,

      channels: permittedChannels,

      /**
       * Prevent duplicate user + role visibility.
       */
      roleScope,

      /**
       * Must be used by repository/dispatcher/email queue
       * to prevent duplicate writes.
       */
      dedupeKey: recipient.dedupeKey,

      meta: payload.meta || null,
      createdAt: now().toISOString(),
    })

    results.push(...deliveries)
  }

  return results
}

  /*async function handleEvent(event, payload = {}) {
    const canonicalEvent = resolveNotificationEvent(event)
    const definition = getEventDefinition(canonicalEvent)
    const recipients = await recipientsService.resolveRecipients(canonicalEvent, payload)
    if (!recipients.length) return []

    const results = []
    console.log('possible duplications')
    for (const recipient of recipients) {
      const recipientId = recipient?.recipientId || recipient?.[recipientField] || recipient?.uid || recipient?.id
      if (!recipientId) continue
        console.trace(`${recipient} and ${recipients}`)

      const preferences = typeof repository.getPreferences === 'function'
        ? await repository.getPreferences(recipientId)
        : null
      if (preferences?.enabled === false) continue

      const allowedByEvent = payload.channels?.length ? payload.channels : definition.channels || ['in_app']
      const permittedChannels = allowedByEvent.filter((channel) => {
        if (!preferences?.channels?.length) return true
        return preferences.channels.includes(channel)
      })
      if (!permittedChannels.length) continue

      const variables = {
        ...payload,
        recipientId,
        recipientEmail: recipient.recipientEmail || payload.recipientEmail || null,
        recipientName: recipient.recipientName || payload.recipientName || null,
        actorName: payload.actorName || 'System',
        entityLabel: payload.entityLabel || payload.entityName || payload.engagementCode || payload.title || payload.entityId || 'record',
        clientName: payload.clientName || 'client',
        dueDate: payload.dueDate || 'not set',
        roleName: payload.roleName || recipient.role || payload.role || 'user',
        amountPaid: payload.amountPaid || payload.amount || '0',
        amountDue: payload.amountDue || payload.consultantShare || '0',
        deductionLabel: payload.deductionLabel || payload.deductionAmount || 'none',
        editorNotes: payload.editorNotes || payload.reviewRemarks || payload.message || '',
        message: payload.message || '',
      }

      const rendered = templateService.renderTemplate(canonicalEvent, variables)
      const deliveries = await dispatcher.dispatch({
        recipientId,
        [recipientField]: recipientId,
        recipientEmail: recipient.recipientEmail || payload.recipientEmail || null,
        recipientName: recipient.recipientName || payload.recipientName || null,
        title: rendered.title,
        message: rendered.body,
        event: canonicalEvent,
        type: payload.type || definition.type || payload.domain || 'system',
        domain: payload.domain || definition.type || 'system',
        sourceModule: payload.sourceModule || payload.domain || definition.type || 'system',
        priority: payload.priority || definition.priority || 'normal',
        templateKey: definition.templateKey || canonicalEvent,
        variables,
        actionUrl: payload.actionUrl || null,
        actionLabel: payload.actionLabel || null,
        isActionRequired: Boolean(payload.isActionRequired ?? definition.actionRequired),
        entityType: payload.entityType || null,
        entityId: payload.entityId || null,
        entityLabel: variables.entityLabel,
        actorId: payload.actorId || null,
        actorName: variables.actorName,
        channels: permittedChannels,
        roleScope: payload.roleScope || recipient.role || null,
        meta: payload.meta || null,
        createdAt: now().toISOString(),
      })
      results.push(...deliveries)
    }
    return results
  }*/

  return { handleEvent, getEventDefinition }
}

export default createNotificationOrchestrator
