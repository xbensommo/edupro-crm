/** @file src/features/notifications/constants/notification.channels.js */

/**
 * Supported delivery channels.
 * Frontend never sends external mail directly. EMAIL and PUSH are queued.
 */
export const NOTIFICATION_CHANNELS = Object.freeze({
  IN_APP: 'in_app',
  EMAIL: 'email',
  PUSH: 'push',
  WHATSAPP: 'whatsapp',
  SMS: 'sms',
})

export const DEFAULT_NOTIFICATION_CHANNELS = Object.freeze([
  NOTIFICATION_CHANNELS.IN_APP,
])

export const EXTERNAL_NOTIFICATION_CHANNELS = Object.freeze([
  NOTIFICATION_CHANNELS.EMAIL,
  NOTIFICATION_CHANNELS.PUSH,
  NOTIFICATION_CHANNELS.WHATSAPP,
  NOTIFICATION_CHANNELS.SMS,
])

export default NOTIFICATION_CHANNELS
