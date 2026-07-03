/** @file src/features/notifications/constants/notification.events.js */

import { NOTIFICATION_CHANNELS } from './notification.channels.js'
import { NOTIFICATION_PRIORITIES } from './notification.statuses.js'
import { NOTIFICATION_TYPES } from './notification.types.js'

/**
 * Legacy event names still emitted by older CRM pages/services.
 * Do not remove until every caller has moved to canonical events.
 */
export const NOTIFICATION_EVENT_ALIASES = Object.freeze({
  'work.created': 'crm.work.created',
  'work.assigned': 'crm.work.assigned',
  'work.review.assigned': 'crm.work.review_assigned',
  'work.assignment.accepted': 'crm.assignment.accepted',
  'work.assignment.denied': 'crm.assignment.denied',
  'work.final.submitted': 'crm.final_delivery.submitted',
  'work.review.approved': 'crm.review.approved',
  'work.review.denied': 'crm.review.denied',
  'work.review.changes_requested': 'crm.review.denied',
})

/**
 * Canonical EduProLIC event registry.
 * This is the cost-control policy: only events listed with EMAIL get queued mail.
 */
export const notificationEventRegistry = Object.freeze({
  'client_record.created': {
    type: NOTIFICATION_TYPES.CLIENT_RECORDS,
    channels: [NOTIFICATION_CHANNELS.IN_APP],
    priority: NOTIFICATION_PRIORITIES.NORMAL,
    templateKey: 'client_record.created',
  },
  'client_record.updated': {
    type: NOTIFICATION_TYPES.CLIENT_RECORDS,
    channels: [NOTIFICATION_CHANNELS.IN_APP],
    priority: NOTIFICATION_PRIORITIES.NORMAL,
    templateKey: 'client_record.updated',
  },
  'crm.work.created': {
    type: NOTIFICATION_TYPES.CRM,
    channels: [NOTIFICATION_CHANNELS.IN_APP],
    priority: NOTIFICATION_PRIORITIES.NORMAL,
    templateKey: 'crm.work.created',
  },
  'crm.work.assigned': {
    type: NOTIFICATION_TYPES.WORKFLOW,
    channels: [NOTIFICATION_CHANNELS.IN_APP, NOTIFICATION_CHANNELS.PUSH, NOTIFICATION_CHANNELS.EMAIL],
    priority: NOTIFICATION_PRIORITIES.HIGH,
    templateKey: 'crm.work.assigned',
    actionRequired: true,
  },
  'crm.work.review_assigned': {
    type: NOTIFICATION_TYPES.WORKFLOW,
    channels: [NOTIFICATION_CHANNELS.IN_APP, NOTIFICATION_CHANNELS.PUSH],
    priority: NOTIFICATION_PRIORITIES.NORMAL,
    templateKey: 'crm.work.review_assigned',
  },
  'crm.assignment.accepted': {
    type: NOTIFICATION_TYPES.WORKFLOW,
    channels: [NOTIFICATION_CHANNELS.IN_APP, NOTIFICATION_CHANNELS.PUSH],
    priority: NOTIFICATION_PRIORITIES.NORMAL,
    templateKey: 'crm.assignment.accepted',
  },
  'crm.assignment.denied': {
    type: NOTIFICATION_TYPES.WORKFLOW,
    channels: [NOTIFICATION_CHANNELS.IN_APP, NOTIFICATION_CHANNELS.PUSH, NOTIFICATION_CHANNELS.EMAIL],
    priority: NOTIFICATION_PRIORITIES.HIGH,
    templateKey: 'crm.assignment.denied',
    actionRequired: true,
  },
  'crm.final_delivery.submitted': {
    type: NOTIFICATION_TYPES.WORKFLOW,
    channels: [NOTIFICATION_CHANNELS.IN_APP, NOTIFICATION_CHANNELS.PUSH, NOTIFICATION_CHANNELS.EMAIL],
    priority: NOTIFICATION_PRIORITIES.HIGH,
    templateKey: 'crm.final_delivery.submitted',
    actionRequired: true,
  },
  'crm.review.approved': {
    type: NOTIFICATION_TYPES.WORKFLOW,
    channels: [NOTIFICATION_CHANNELS.IN_APP, NOTIFICATION_CHANNELS.PUSH],
    priority: NOTIFICATION_PRIORITIES.NORMAL,
    templateKey: 'crm.review.approved',
  },
  'crm.review.denied': {
    type: NOTIFICATION_TYPES.WORKFLOW,
    channels: [NOTIFICATION_CHANNELS.IN_APP, NOTIFICATION_CHANNELS.PUSH, NOTIFICATION_CHANNELS.EMAIL],
    priority: NOTIFICATION_PRIORITIES.CRITICAL,
    templateKey: 'crm.review.denied',
    actionRequired: true,
  },
  'finance.payment.logged': {
    type: NOTIFICATION_TYPES.FINANCE,
    channels: [NOTIFICATION_CHANNELS.IN_APP],
    priority: NOTIFICATION_PRIORITIES.NORMAL,
    templateKey: 'finance.payment.logged',
  },
  'finance.commission.ready': {
    type: NOTIFICATION_TYPES.FINANCE,
    channels: [NOTIFICATION_CHANNELS.IN_APP],
    priority: NOTIFICATION_PRIORITIES.HIGH,
    templateKey: 'finance.commission.ready',
  },
  'finance.commission.deducted': {
    type: NOTIFICATION_TYPES.FINANCE,
    channels: [NOTIFICATION_CHANNELS.IN_APP, NOTIFICATION_CHANNELS.PUSH, NOTIFICATION_CHANNELS.EMAIL],
    priority: NOTIFICATION_PRIORITIES.CRITICAL,
    templateKey: 'finance.commission.deducted',
    actionRequired: true,
  },
  'finance.commission.paid': {
    type: NOTIFICATION_TYPES.FINANCE,
    channels: [NOTIFICATION_CHANNELS.IN_APP, NOTIFICATION_CHANNELS.PUSH, NOTIFICATION_CHANNELS.EMAIL],
    priority: NOTIFICATION_PRIORITIES.HIGH,
    templateKey: 'finance.commission.paid',
  },
  'auth.user.invited': {
    type: NOTIFICATION_TYPES.AUTH,
    channels: [NOTIFICATION_CHANNELS.EMAIL],
    priority: NOTIFICATION_PRIORITIES.HIGH,
    templateKey: 'auth.user.invited',
    actionRequired: true,
  },
  'auth.user.suspended': {
    type: NOTIFICATION_TYPES.AUTH,
    channels: [NOTIFICATION_CHANNELS.IN_APP, NOTIFICATION_CHANNELS.EMAIL],
    priority: NOTIFICATION_PRIORITIES.CRITICAL,
    templateKey: 'auth.user.suspended',
    actionRequired: true,
  },
  'auth.role.changed': {
    type: NOTIFICATION_TYPES.AUTH,
    channels: [NOTIFICATION_CHANNELS.IN_APP],
    priority: NOTIFICATION_PRIORITIES.NORMAL,
    templateKey: 'auth.role.changed',
  },
  'system.alert': {
    type: NOTIFICATION_TYPES.SYSTEM,
    channels: [NOTIFICATION_CHANNELS.IN_APP],
    priority: NOTIFICATION_PRIORITIES.CRITICAL,
    templateKey: 'system.alert',
  },
})

export const EMAIL_NOTIFICATION_EVENTS = Object.freeze(
  Object.entries(notificationEventRegistry)
    .filter(([, definition]) => definition.channels.includes(NOTIFICATION_CHANNELS.EMAIL))
    .map(([event]) => event),
)

/**
 * @param {string} event
 * @returns {string}
 */
export function resolveNotificationEvent(event = 'system.alert') {
  const normalized = String(event || 'system.alert').trim()
  return NOTIFICATION_EVENT_ALIASES[normalized] || normalized
}

/**
 * @param {string} event
 * @returns {Record<string, any>}
 */
export function getNotificationEventDefinition(event = 'system.alert') {
  return notificationEventRegistry[resolveNotificationEvent(event)] || notificationEventRegistry['system.alert']
}

/**
 * @param {string} event
 * @returns {boolean}
 */
export function shouldQueueEmailForEvent(event) {
  return EMAIL_NOTIFICATION_EVENTS.includes(resolveNotificationEvent(event))
}

export default notificationEventRegistry
