/**
 * Patch your notifications/feature.manifest.js collections list:
 *
 * collections: [
 *   'notifications',
 *   'notification_delivery_queue',
 *   'notification_logs',
 *   'notification_templates',
 *   'notification_preferences',
 * ],
 */

export const NOTIFICATIONS_COLLECTIONS_PATCH = Object.freeze([
  'notifications',
  'notification_delivery_queue',
  'notification_logs',
  'notification_templates',
  'notification_preferences',
])
