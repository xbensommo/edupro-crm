/** @file src/features/notifications/services/createNotificationDispatcher.js */

import { NOTIFICATION_CHANNELS } from '../constants/notification.channels.js'
import { NOTIFICATION_STATUSES } from '../constants/notification.statuses.js'
import { shouldQueueEmailForEvent } from '../constants/notification.events.js'
import { buildDedupeKey } from '../utils/notification.helpers.js'

/**
 * Persists one in-app notification row and queues external delivery rows.
 * External providers are never called from the browser.
 *
 * Duplicate protection is enforced by repository.saveNotification() and
 * repository.queueDelivery() using deterministic dedupe keys.
 *
 * @param {{ repository: any, recipientField?: string, now?: () => Date }} options
 */
export function createNotificationDispatcher(options = {}) {
  const repository = options.repository
  const recipientField = options.recipientField || 'user_id'
  const now = typeof options.now === 'function' ? options.now : () => new Date()

  async function dispatch(payload = {}) {
    if (!repository?.saveNotification || !repository?.saveLog) {
      throw new Error('Notification dispatcher requires saveNotification and saveLog repository methods.')
    }

    const channels = Array.isArray(payload.channels) && payload.channels.length
      ? [...new Set(payload.channels.filter(Boolean))]
      : [NOTIFICATION_CHANNELS.IN_APP]

    const recipientId = payload.recipientId || payload[recipientField] || payload.user_id || null
    const baseDedupeKey = payload.dedupeKey || buildDedupeKey({
      ...payload,
      recipientId,
      channel: 'record',
    })

    const notificationRecord = await repository.saveNotification({
      ...payload,
      dedupeKey: baseDedupeKey,
      channel: NOTIFICATION_CHANNELS.IN_APP,
      channels,
      status: channels.includes(NOTIFICATION_CHANNELS.IN_APP)
        ? NOTIFICATION_STATUSES.SENT
        : NOTIFICATION_STATUSES.QUEUED,
      sentAt: channels.includes(NOTIFICATION_CHANNELS.IN_APP) ? now().toISOString() : null,
    })

    const notificationId = notificationRecord?.id || notificationRecord?.docId || notificationRecord?._id || null

    /**
     * If the notification row already existed, stop here.
     * This prevents duplicate log rows and duplicate email/push queue rows after
     * double-clicks, repeated service calls, or repeated CRM hooks.
     */
    if (notificationRecord?._deduped) {
      return [{
        ok: true,
        skipped: true,
        reason: 'DUPLICATE_NOTIFICATION',
        channel: 'all',
        notificationId,
      }]
    }

    const deliveries = []

    if (channels.includes(NOTIFICATION_CHANNELS.IN_APP)) {
      const dedupeKey = buildDedupeKey({ ...payload, recipientId, channel: NOTIFICATION_CHANNELS.IN_APP })
      await repository.saveLog({
        notificationId,
        dedupeKey,
        recipientId,
        [recipientField]: recipientId,
        recipientEmail: payload.recipientEmail || null,
        event: payload.event,
        channel: NOTIFICATION_CHANNELS.IN_APP,
        provider: 'firestore',
        status: NOTIFICATION_STATUSES.SENT,
        domain: payload.domain,
        payload,
        response: { ok: true },
        sentAt: now().toISOString(),
      })
      deliveries.push({ ok: true, provider: 'firestore', channel: NOTIFICATION_CHANNELS.IN_APP, notificationId })
    }

    for (const channel of channels.filter((item) => item !== NOTIFICATION_CHANNELS.IN_APP)) {
      if (channel === NOTIFICATION_CHANNELS.EMAIL && !shouldQueueEmailForEvent(payload.event)) {
        await repository.saveLog({
          notificationId,
          recipientId,
          [recipientField]: recipientId,
          recipientEmail: payload.recipientEmail || null,
          event: payload.event,
          channel,
          provider: 'policy',
          status: NOTIFICATION_STATUSES.SKIPPED,
          domain: payload.domain,
          error: 'EMAIL_NOT_ALLOWED_FOR_EVENT',
          payload,
        })
        deliveries.push({ ok: true, skipped: true, channel, reason: 'EMAIL_NOT_ALLOWED_FOR_EVENT', notificationId })
        continue
      }

      if (!repository?.queueDelivery) {
        await repository.saveLog({
          notificationId,
          recipientId,
          [recipientField]: recipientId,
          recipientEmail: payload.recipientEmail || null,
          event: payload.event,
          channel,
          provider: 'queue',
          status: NOTIFICATION_STATUSES.FAILED,
          domain: payload.domain,
          error: 'DELIVERY_QUEUE_NOT_CONFIGURED',
          payload,
        })
        deliveries.push({ ok: false, channel, error: 'DELIVERY_QUEUE_NOT_CONFIGURED', notificationId })
        continue
      }

      const dedupeKey = buildDedupeKey({ ...payload, recipientId, channel })
      const queued = await repository.queueDelivery({
        ...payload,
        notificationId,
        recipientId,
        [recipientField]: recipientId,
        channel,
        dedupeKey,
        status: 'pending',
        templateKey: payload.templateKey || payload.event,
      })

      const queueId = queued?.id || queued?.docId || queued?._id || null
      await repository.saveLog({
        notificationId,
        queueId,
        dedupeKey,
        recipientId,
        [recipientField]: recipientId,
        recipientEmail: payload.recipientEmail || null,
        event: payload.event,
        channel,
        provider: 'delivery_queue',
        status: queued?._deduped ? NOTIFICATION_STATUSES.SKIPPED : NOTIFICATION_STATUSES.QUEUED,
        domain: payload.domain,
        payload,
        response: { ok: true, queueId, deduped: Boolean(queued?._deduped) },
      })
      deliveries.push({
        ok: true,
        provider: 'delivery_queue',
        channel,
        queueId,
        notificationId,
        skipped: Boolean(queued?._deduped),
        reason: queued?._deduped ? 'DUPLICATE_QUEUE_ITEM' : null,
      })
    }

    return deliveries
  }

  return { dispatch }
}

export default createNotificationDispatcher
