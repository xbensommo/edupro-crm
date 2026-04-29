/** @file src/features/notifications/constants/notification.statuses.js */

export const NOTIFICATION_STATUSES = Object.freeze({
  QUEUED: 'queued',
  PENDING: 'pending',
  SENT: 'sent',
  FAILED: 'failed',
  READ: 'read',
  ARCHIVED: 'archived',
  SKIPPED: 'skipped',
})

export const DELIVERY_QUEUE_STATUSES = Object.freeze({
  PENDING: 'pending',
  PROCESSING: 'processing',
  SENT: 'sent',
  FAILED: 'failed',
  SKIPPED: 'skipped',
})

export const NOTIFICATION_PRIORITIES = Object.freeze({
  LOW: 'low',
  NORMAL: 'normal',
  HIGH: 'high',
  CRITICAL: 'critical',
})

export default NOTIFICATION_STATUSES
