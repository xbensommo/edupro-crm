/**
 * @file src/features/notifications/services/createNotificationDispatcher.js
 * @description Multi-channel dispatcher that writes only normalized records.
 */

import { buildNotificationLog, buildNotificationRecord } from '../utils/buildNotificationRecord.js'

const DEFAULT_CHANNELS = Object.freeze({
  IN_APP: 'in_app',
  EMAIL: 'email',
  WHATSAPP: 'whatsapp',
})

const DEFAULT_STATUSES = Object.freeze({
  PENDING: 'pending',
  SENT: 'sent',
  FAILED: 'failed',
})

/**
 * @param {{
 *   repository: {
 *     saveNotification: (payload: Record<string, any>) => Promise<Record<string, any>>,
 *     saveLog: (payload: Record<string, any>) => Promise<Record<string, any>>,
 *   },
 *   channels?: Record<string, { send: (payload: Record<string, any>) => Promise<Record<string, any>> }>,
 *   recipientField?: string,
 *   now?: () => Date,
 * }} options
 */
export function createNotificationDispatcher(options = {}) {
  const repository = options.repository
  const recipientField = options.recipientField || 'user_id'
  const now = typeof options.now === 'function' ? options.now : () => new Date()

  const channels = {
    [DEFAULT_CHANNELS.IN_APP]: {
      async send(payload) {
        return { ok: true, provider: 'database', payload }
      },
    },
    [DEFAULT_CHANNELS.EMAIL]: {
      async send(payload) {
        if (!options?.channels?.email?.send) return { ok: false, provider: 'email', error: 'EMAIL_ADAPTER_NOT_CONFIGURED' }
        return options.channels.email.send(payload)
      },
    },
    [DEFAULT_CHANNELS.WHATSAPP]: {
      async send(payload) {
        if (!options?.channels?.whatsapp?.send) return { ok: false, provider: 'whatsapp', error: 'WHATSAPP_ADAPTER_NOT_CONFIGURED' }
        return options.channels.whatsapp.send(payload)
      },
    },
    ...options.channels,
  }

  async function dispatch(payload = {}) {
    if (!repository?.saveNotification || !repository?.saveLog) {
      throw new Error('Notification dispatcher requires a repository with saveNotification and saveLog.')
    }

    const deliveries = []
    const channelsToUse = payload.channels?.length ? payload.channels : [DEFAULT_CHANNELS.IN_APP]

    for (const channelName of channelsToUse) {
      const notificationRecord = await repository.saveNotification(
        buildNotificationRecord(
          {
            ...payload,
            channel: channelName,
            status: DEFAULT_STATUSES.PENDING,
            updatedAt: now().toISOString(),
          },
          { recipientField, now },
        ),
      )

      const adapter = channels[channelName]
      if (!adapter?.send) {
        const failedResult = {
          ok: false,
          notificationId: notificationRecord?.id,
          provider: channelName,
          error: 'CHANNEL_ADAPTER_NOT_FOUND',
        }

        await repository.saveLog(
          buildNotificationLog(
            {
              notificationId: notificationRecord?.id,
              recipientId: payload.recipientId || payload[recipientField] || payload.user_id || payload.user_id,
              channel: channelName,
              provider: channelName,
              status: DEFAULT_STATUSES.FAILED,
              error: failedResult.error,
              payload,
              response: failedResult,
            },
            { recipientField, now },
          ),
        )

        deliveries.push(failedResult)
        continue
      }

      const result = await adapter.send({
        ...payload,
        recipientId: payload.recipientId || payload[recipientField] || payload.user_id || payload.user_id,
        [recipientField]: payload.recipientId || payload[recipientField] || payload.user_id || payload.user_id,
        channel: channelName,
        notificationId: notificationRecord?.id,
      })

      const status = result?.ok ? DEFAULT_STATUSES.SENT : DEFAULT_STATUSES.FAILED

      await repository.saveLog(
        buildNotificationLog(
          {
            notificationId: notificationRecord?.id,
            recipientId: payload.recipientId || payload[recipientField] || payload.user_id || payload.user_id,
            channel: channelName,
            provider: result?.provider || channelName,
            status,
            error: result?.error || null,
            payload,
            response: result || null,
            sentAt: result?.ok ? now().toISOString() : null,
          },
          { recipientField, now },
        ),
      )

      deliveries.push({
        ...result,
        notificationId: notificationRecord?.id,
        channel: channelName,
        status,
      })
    }

    return deliveries
  }

  return {
    dispatch,
  }
}

export default createNotificationDispatcher
