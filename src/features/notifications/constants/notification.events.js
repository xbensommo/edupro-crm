/** @file src/features/notifications/constants/notification.events.js */

import { NOTIFICATION_CHANNELS } from './notification.channels.js';
import { NOTIFICATION_PRIORITIES } from './notification.statuses.js';
import { NOTIFICATION_TYPES } from './notification.types.js';

/**
 * EduProLIC-focused event registry.
 *
 * Other Totistack features should emit these domain events instead of talking
 * directly to email, WhatsApp, or in-app delivery code.
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
    channels: [NOTIFICATION_CHANNELS.IN_APP, NOTIFICATION_CHANNELS.EMAIL],
    priority: NOTIFICATION_PRIORITIES.HIGH,
    templateKey: 'crm.work.assigned',
  },
  'crm.assignment.accepted': {
    type: NOTIFICATION_TYPES.WORKFLOW,
    channels: [NOTIFICATION_CHANNELS.IN_APP],
    priority: NOTIFICATION_PRIORITIES.HIGH,
    templateKey: 'crm.assignment.accepted',
  },
  'crm.assignment.denied': {
    type: NOTIFICATION_TYPES.WORKFLOW,
    channels: [NOTIFICATION_CHANNELS.IN_APP, NOTIFICATION_CHANNELS.EMAIL],
    priority: NOTIFICATION_PRIORITIES.HIGH,
    templateKey: 'crm.assignment.denied',
  },
  'crm.final_delivery.submitted': {
    type: NOTIFICATION_TYPES.WORKFLOW,
    channels: [NOTIFICATION_CHANNELS.IN_APP, NOTIFICATION_CHANNELS.EMAIL],
    priority: NOTIFICATION_PRIORITIES.HIGH,
    templateKey: 'crm.final_delivery.submitted',
  },
  'crm.review.approved': {
    type: NOTIFICATION_TYPES.WORKFLOW,
    channels: [NOTIFICATION_CHANNELS.IN_APP],
    priority: NOTIFICATION_PRIORITIES.HIGH,
    templateKey: 'crm.review.approved',
  },
  'crm.review.denied': {
    type: NOTIFICATION_TYPES.WORKFLOW,
    channels: [NOTIFICATION_CHANNELS.IN_APP, NOTIFICATION_CHANNELS.EMAIL],
    priority: NOTIFICATION_PRIORITIES.CRITICAL,
    templateKey: 'crm.review.denied',
  },
  'finance.payment.logged': {
    type: NOTIFICATION_TYPES.FINANCE,
    channels: [NOTIFICATION_CHANNELS.IN_APP],
    priority: NOTIFICATION_PRIORITIES.HIGH,
    templateKey: 'finance.payment.logged',
  },
  'finance.commission.ready': {
    type: NOTIFICATION_TYPES.FINANCE,
    channels: [NOTIFICATION_CHANNELS.IN_APP, NOTIFICATION_CHANNELS.EMAIL],
    priority: NOTIFICATION_PRIORITIES.HIGH,
    templateKey: 'finance.commission.ready',
  },
  'finance.commission.deducted': {
    type: NOTIFICATION_TYPES.FINANCE,
    channels: [NOTIFICATION_CHANNELS.IN_APP, NOTIFICATION_CHANNELS.EMAIL],
    priority: NOTIFICATION_PRIORITIES.CRITICAL,
    templateKey: 'finance.commission.deducted',
  },
  'finance.commission.paid': {
    type: NOTIFICATION_TYPES.FINANCE,
    channels: [NOTIFICATION_CHANNELS.IN_APP, NOTIFICATION_CHANNELS.EMAIL, NOTIFICATION_CHANNELS.WHATSAPP],
    priority: NOTIFICATION_PRIORITIES.HIGH,
    templateKey: 'finance.commission.paid',
  },
  'auth.user.invited': {
    type: NOTIFICATION_TYPES.AUTH,
    channels: [NOTIFICATION_CHANNELS.IN_APP, NOTIFICATION_CHANNELS.EMAIL],
    priority: NOTIFICATION_PRIORITIES.HIGH,
    templateKey: 'auth.user.invited',
  },
  'auth.user.suspended': {
    type: NOTIFICATION_TYPES.AUTH,
    channels: [NOTIFICATION_CHANNELS.IN_APP, NOTIFICATION_CHANNELS.EMAIL],
    priority: NOTIFICATION_PRIORITIES.CRITICAL,
    templateKey: 'auth.user.suspended',
  },
  'auth.role.changed': {
    type: NOTIFICATION_TYPES.AUTH,
    channels: [NOTIFICATION_CHANNELS.IN_APP, NOTIFICATION_CHANNELS.EMAIL],
    priority: NOTIFICATION_PRIORITIES.HIGH,
    templateKey: 'auth.role.changed',
  },
  'system.alert': {
    type: NOTIFICATION_TYPES.SYSTEM,
    channels: [NOTIFICATION_CHANNELS.IN_APP],
    priority: NOTIFICATION_PRIORITIES.CRITICAL,
    templateKey: 'system.alert',
  },
});

export default notificationEventRegistry;
