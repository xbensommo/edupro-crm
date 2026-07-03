/** @file src/features/notifications/services/createNotificationOrchestrator.js */

import notificationEventRegistry, { resolveNotificationEvent } from '../constants/notification.events.js'
import { buildDedupeKey, cleanArray } from '../utils/notification.helpers.js'

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

  function getRecipientId(recipient = {}) {
    return String(
      recipient?.recipientId ||
      recipient?.[recipientField] ||
      recipient?.user_id ||
      recipient?.uid ||
      recipient?.id ||
      '',
    ).trim() || null
  }

  /**
   * Dedupes recipients before any write is attempted.
   * Database-level dedupe still happens later in the repository.
   */
  function dedupeRecipients(recipients = []) {
    const map = new Map()

    for (const recipient of recipients || []) {
      if (!recipient || typeof recipient !== 'object') continue

      const recipientId = getRecipientId(recipient)
      const email = String(recipient.recipientEmail || recipient.email || '').trim().toLowerCase()
      const key = recipientId ? `uid:${recipientId}` : email ? `email:${email}` : null
      if (!key) continue

      const existing = map.get(key)
      if (!existing) {
        map.set(key, {
          ...recipient,
          recipientId,
          [recipientField]: recipientId,
          roles: cleanArray([...(recipient.roles || []), recipient.role]),
        })
        continue
      }

      map.set(key, {
        ...existing,
        ...recipient,
        recipientId: existing.recipientId || recipientId,
        [recipientField]: existing[recipientField] || recipientId,
        recipientEmail: existing.recipientEmail || recipient.recipientEmail || recipient.email || null,
        recipientName: existing.recipientName || recipient.recipientName || recipient.displayName || recipient.name || null,
        roles: cleanArray([...(existing.roles || []), existing.role, ...(recipient.roles || []), recipient.role]),
      })
    }

    return [...map.values()]
  }

  async function handleEvent(event, payload = {}) {
    const canonicalEvent = resolveNotificationEvent(event)
    const definition = getEventDefinition(canonicalEvent)
    const rawRecipients = await recipientsService.resolveRecipients(canonicalEvent, payload)
    const recipients = dedupeRecipients(rawRecipients)

    if (!recipients.length) return []

    const results = []

    for (const recipient of recipients) {
      const recipientId = getRecipientId(recipient)
      if (!recipientId) continue

      const preferences = typeof repository.getPreferences === 'function'
        ? await repository.getPreferences(recipientId)
        : null

      if (preferences?.enabled === false) continue

      const allowedByEvent = Array.isArray(payload.channels) && payload.channels.length
        ? payload.channels
        : definition.channels || ['in_app']

      const permittedChannels = [...new Set(allowedByEvent)].filter((channel) => {
        if (!preferences?.channels?.length) return true
        return preferences.channels.includes(channel)
      })

      if (!permittedChannels.length) continue

      const recipientEmail = recipient.recipientEmail || recipient.email || payload.recipientEmail || null
      const recipientName = recipient.recipientName || recipient.displayName || recipient.name || payload.recipientName || null
      const entityId = payload.entityId || payload.engagementId || payload.id || payload.engagementCode || null
      const entityLabel = payload.entityLabel || payload.entityName || payload.engagementCode || payload.title || entityId || 'record'

      const variables = {
        ...payload,
        recipientId,
        recipientEmail,
        recipientName,
        actorName: payload.actorName || 'System',
        entityLabel,
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
       * roleScope is only for role-broadcast visibility.
       * Direct user notifications should keep roleScope empty to avoid user + role duplication.
       */
      const roleScope = cleanArray(payload.roleScope)

      const dedupeKey = payload.dedupeKey || buildDedupeKey({
        ...payload,
        event: canonicalEvent,
        entityType: payload.entityType || 'entity',
        entityId,
        entityLabel,
        recipientId,
        channel: 'record',
      })

      const deliveries = await dispatcher.dispatch({
        recipientId,
        [recipientField]: recipientId,
        recipientEmail,
        recipientName,
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
        entityId,
        entityLabel,
        actorId: payload.actorId || null,
        actorName: variables.actorName,
        channels: permittedChannels,
        roleScope,
        dedupeKey,
        meta: {
          ...(payload.meta || {}),
          dedupeKey,
          recipientRoles: cleanArray(recipient.roles),
        },
        createdAt: now().toISOString(),
      })

      results.push(...deliveries)
    }

    return results
  }

  return { handleEvent }
}

export default createNotificationOrchestrator
