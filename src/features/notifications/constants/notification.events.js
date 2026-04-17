/** @file src/features/notifications/constants/notification.events.js */

import { NOTIFICATION_CHANNELS } from './notification.channels.js';
import { NOTIFICATION_PRIORITIES } from './notification.statuses.js';
import { NOTIFICATION_TYPES } from './notification.types.js';

/**
 * Event definitions consumed by the orchestrator.
 */
export const notificationEventRegistry = Object.freeze({
  'lead.created': {
    type: NOTIFICATION_TYPES.CRM,
    channels: [NOTIFICATION_CHANNELS.IN_APP],
    priority: NOTIFICATION_PRIORITIES.NORMAL,
    templateKey: 'lead.created',
  },
  'lead.assigned': {
    type: NOTIFICATION_TYPES.CRM,
    channels: [NOTIFICATION_CHANNELS.IN_APP, NOTIFICATION_CHANNELS.EMAIL],
    priority: NOTIFICATION_PRIORITIES.HIGH,
    templateKey: 'lead.assigned',
  },
  'booking.created': {
    type: NOTIFICATION_TYPES.BOOKING,
    channels: [NOTIFICATION_CHANNELS.IN_APP],
    priority: NOTIFICATION_PRIORITIES.NORMAL,
    templateKey: 'booking.created',
  },
  'booking.confirmed': {
    type: NOTIFICATION_TYPES.BOOKING,
    channels: [NOTIFICATION_CHANNELS.IN_APP, NOTIFICATION_CHANNELS.EMAIL, NOTIFICATION_CHANNELS.WHATSAPP],
    priority: NOTIFICATION_PRIORITIES.HIGH,
    templateKey: 'booking.confirmed',
  },
  'form.submitted': {
    type: NOTIFICATION_TYPES.FORMS,
    channels: [NOTIFICATION_CHANNELS.IN_APP, NOTIFICATION_CHANNELS.EMAIL],
    priority: NOTIFICATION_PRIORITIES.NORMAL,
    templateKey: 'form.submitted',
  },
  'document.generated': {
    type: NOTIFICATION_TYPES.DOCUMENTS,
    channels: [NOTIFICATION_CHANNELS.IN_APP],
    priority: NOTIFICATION_PRIORITIES.NORMAL,
    templateKey: 'document.generated',
  },
  'user.role.changed': {
    type: NOTIFICATION_TYPES.AUTH,
    channels: [NOTIFICATION_CHANNELS.IN_APP, NOTIFICATION_CHANNELS.EMAIL],
    priority: NOTIFICATION_PRIORITIES.HIGH,
    templateKey: 'user.role.changed',
  },
  'invoice.overdue': {
    type: NOTIFICATION_TYPES.FINANCE,
    channels: [NOTIFICATION_CHANNELS.IN_APP, NOTIFICATION_CHANNELS.EMAIL, NOTIFICATION_CHANNELS.WHATSAPP],
    priority: NOTIFICATION_PRIORITIES.CRITICAL,
    templateKey: 'invoice.overdue',
  },
  'system.alert': {
    type: NOTIFICATION_TYPES.SYSTEM,
    channels: [NOTIFICATION_CHANNELS.IN_APP],
    priority: NOTIFICATION_PRIORITIES.CRITICAL,
    templateKey: 'system.alert',
  },
});

export default notificationEventRegistry;
