/** @file src/features/notifications/services/createNotificationTemplateService.js */

import notificationEventRegistry from '../constants/notification.events.js';
import { interpolateTemplate } from '../utils/notification.helpers.js';

const BUILT_IN_TEMPLATES = Object.freeze({
  'client_record.created': {
    key: 'client_record.created',
    title: 'New client record created',
    body: '{{ actorName }} created client record for {{ entityLabel }}.',
  },
  'client_record.updated': {
    key: 'client_record.updated',
    title: 'Client record updated',
    body: '{{ actorName }} updated {{ entityLabel }}.',
  },
  'crm.work.created': {
    key: 'crm.work.created',
    title: 'New work created',
    body: '{{ actorName }} created work {{ entityLabel }} for {{ clientName }}.',
  },
  'crm.work.assigned': {
    key: 'crm.work.assigned',
    title: 'New work assigned to you',
    body: '{{ actorName }} assigned {{ entityLabel }} to you. Due: {{ dueDate }}.',
  },
  'crm.assignment.accepted': {
    key: 'crm.assignment.accepted',
    title: 'Assignment accepted',
    body: '{{ actorName }} accepted {{ entityLabel }}.',
  },
  'crm.assignment.denied': {
    key: 'crm.assignment.denied',
    title: 'Assignment denied',
    body: '{{ actorName }} denied {{ entityLabel }} and it needs reassignment.',
  },
  'crm.final_delivery.submitted': {
    key: 'crm.final_delivery.submitted',
    title: 'Final work submitted',
    body: '{{ actorName }} submitted final delivery for {{ entityLabel }}.',
  },
  'crm.review.approved': {
    key: 'crm.review.approved',
    title: 'Work approved by editor',
    body: '{{ actorName }} approved {{ entityLabel }}.',
  },
  'crm.review.denied': {
    key: 'crm.review.denied',
    title: 'Work returned for revision',
    body: '{{ actorName }} returned {{ entityLabel }} for revision. Deduction: {{ deductionLabel }}.',
  },
  'finance.payment.logged': {
    key: 'finance.payment.logged',
    title: 'Client payment logged',
    body: '{{ actorName }} logged payment of {{ amountPaid }} for {{ entityLabel }}.',
  },
  'finance.commission.ready': {
    key: 'finance.commission.ready',
    title: 'Commission ready',
    body: 'Your commission for {{ entityLabel }} is ready. Amount: {{ amountDue }}.',
  },
  'finance.commission.deducted': {
    key: 'finance.commission.deducted',
    title: 'Commission deduction applied',
    body: 'A deduction was applied to {{ entityLabel }}. Deduction: {{ deductionLabel }}.',
  },
  'finance.commission.paid': {
    key: 'finance.commission.paid',
    title: 'Commission paid',
    body: 'Your commission for {{ entityLabel }} has been paid. Amount: {{ amountPaid }}.',
  },
  'auth.user.invited': {
    key: 'auth.user.invited',
    title: 'You were invited to EduProLIC',
    body: '{{ actorName }} invited you to join EduProLIC as {{ roleName }}.',
  },
  'auth.user.suspended': {
    key: 'auth.user.suspended',
    title: 'Account suspended',
    body: 'Your EduProLIC access has been suspended. Contact admin if this is unexpected.',
  },
  'auth.role.changed': {
    key: 'auth.role.changed',
    title: 'Role updated',
    body: 'Your role was changed to {{ roleName }}.',
  },
  'system.alert': {
    key: 'system.alert',
    title: 'System alert',
    body: '{{ message }}',
  },
});

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
