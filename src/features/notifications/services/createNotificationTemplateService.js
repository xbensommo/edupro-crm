/** @file src/features/notifications/services/createNotificationTemplateService.js */

import notificationEventRegistry from '../constants/notification.events.js';
import { interpolateTemplate } from '../utils/notification.helpers.js';

const BUILT_IN_TEMPLATES = Object.freeze({
  'lead.created': {
    key: 'lead.created',
    title: 'New lead created',
    body: '{{ actorName }} created lead {{ entityLabel }}.',
  },
  'lead.assigned': {
    key: 'lead.assigned',
    title: 'Lead assigned to you',
    body: '{{ actorName }} assigned {{ entityLabel }} to you.',
  },
  'booking.created': {
    key: 'booking.created',
    title: 'Booking received',
    body: 'A new booking for {{ entityLabel }} was created.',
  },
  'booking.confirmed': {
    key: 'booking.confirmed',
    title: 'Booking confirmed',
    body: '{{ entityLabel }} has been confirmed for {{ customerName }}.',
  },
  'form.submitted': {
    key: 'form.submitted',
    title: 'New form submission',
    body: '{{ entityLabel }} received a new submission.',
  },
  'document.generated': {
    key: 'document.generated',
    title: 'Document generated',
    body: '{{ entityLabel }} was generated successfully.',
  },
  'user.role.changed': {
    key: 'user.role.changed',
    title: 'Role updated',
    body: 'Your role was changed to {{ roleName }}.',
  },
  'invoice.overdue': {
    key: 'invoice.overdue',
    title: 'Invoice overdue',
    body: '{{ entityLabel }} is overdue. Amount due: {{ amountDue }}.',
  },
  'system.alert': {
    key: 'system.alert',
    title: 'System alert',
    body: '{{ message }}',
  },
});

/**
 * Create a notification template resolver.
 *
 * @param {{
 *   templates?: Array<Record<string, any>>,
 *   eventRegistry?: Record<string, Record<string, any>>,
 * }} [options={}]
 * @returns {{
 *   getTemplate: (event: string) => Record<string, any>,
 *   renderTemplate: (event: string, variables?: Record<string, unknown>) => { title: string, body: string, definition: Record<string, any> },
 * }}
 */
export function createNotificationTemplateService(options = {}) {
  const templates = options.templates || [];
  const eventRegistry = options.eventRegistry || notificationEventRegistry;

  function getTemplate(event) {
    const custom = templates.find((item) => item.event === event || item.key === event);
    if (custom && custom.active !== false) return custom;

    return BUILT_IN_TEMPLATES[event] || {
      key: event,
      title: eventRegistry[event]?.templateKey || event,
      body: '{{ message }}',
    };
  }

  function renderTemplate(event, variables = {}) {
    const definition = getTemplate(event);
    return {
      title: interpolateTemplate(definition.title || event, variables),
      body: interpolateTemplate(definition.body || '', variables),
      definition,
    };
  }

  return {
    getTemplate,
    renderTemplate,
  };
}

export default createNotificationTemplateService;
