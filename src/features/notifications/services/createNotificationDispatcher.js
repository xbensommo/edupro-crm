/** @file src/features/notifications/services/createNotificationDispatcher.js */

import { NOTIFICATION_CHANNELS } from '../constants/notification.channels.js';
import { NOTIFICATION_STATUSES } from '../constants/notification.statuses.js';

/**
 * Create a multi-channel notification dispatcher.
 *
 * @param {{
 *   repository: {
 *     saveNotification: (payload: Record<string, any>) => Promise<Record<string, any>>,
 *     saveLog: (payload: Record<string, any>) => Promise<Record<string, any>>,
 *   },
 *   channels?: Partial<Record<string, { send: (payload: Record<string, any>) => Promise<Record<string, any>> }>>,
 * }} options
 * @returns {{
 *   dispatch: (payload: Record<string, any>) => Promise<Array<Record<string, any>>>
 * }}
 */
export function createNotificationDispatcher(options) {
  const repository = options?.repository;
  const channels = {
    [NOTIFICATION_CHANNELS.IN_APP]: {
      async send(payload) {
        return { ok: true, provider: 'database', payload };
      },
    },
    [NOTIFICATION_CHANNELS.EMAIL]: {
      async send(payload) {
        if (!options?.channels?.email?.send) return { ok: false, provider: 'email', error: 'EMAIL_ADAPTER_NOT_CONFIGURED' };
        return options.channels.email.send(payload);
      },
    },
    [NOTIFICATION_CHANNELS.WHATSAPP]: {
      async send(payload) {
        if (!options?.channels?.whatsapp?.send) return { ok: false, provider: 'whatsapp', error: 'WHATSAPP_ADAPTER_NOT_CONFIGURED' };
        return options.channels.whatsapp.send(payload);
      },
    },
    ...options?.channels,
  };

  async function dispatch(payload) {
    const deliveries = [];

    const channelsToUse = payload.channels?.length ? payload.channels : [NOTIFICATION_CHANNELS.IN_APP];

    for (const channelName of channelsToUse) {
      const notificationRecord = await repository.saveNotification({
        ...payload,
        channel: channelName,
        status: NOTIFICATION_STATUSES.PENDING,
        createdAt: payload.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      const adapter = channels[channelName];

      if (!adapter?.send) {
        const failedResult = {
          ok: false,
          notificationId: notificationRecord?.id,
          provider: channelName,
          error: 'CHANNEL_ADAPTER_NOT_FOUND',
        };

        await repository.saveLog({
          notificationId: notificationRecord?.id,
          userId: payload.userId,
          channel: channelName,
          provider: channelName,
          status: NOTIFICATION_STATUSES.FAILED,
          error: failedResult.error,
          payload,
          response: failedResult,
          createdAt: new Date().toISOString(),
        });

        deliveries.push(failedResult);
        continue;
      }

      const result = await adapter.send({
        ...payload,
        channel: channelName,
        notificationId: notificationRecord?.id,
      });

      const status = result?.ok ? NOTIFICATION_STATUSES.SENT : NOTIFICATION_STATUSES.FAILED;

      if (status === NOTIFICATION_STATUSES.SENT && channelName === NOTIFICATION_CHANNELS.IN_APP) {
        // in-app notification already exists as the saved notification row
      }

      await repository.saveLog({
        notificationId: notificationRecord?.id,
        userId: payload.userId,
        channel: channelName,
        provider: result?.provider || channelName,
        status,
        error: result?.error || null,
        payload,
        response: result || null,
        sentAt: result?.ok ? new Date().toISOString() : null,
        createdAt: new Date().toISOString(),
      });

      deliveries.push({
        ...result,
        notificationId: notificationRecord?.id,
        channel: channelName,
        status,
      });
    }

    return deliveries;
  }

  return {
    dispatch,
  };
}

export default createNotificationDispatcher;
