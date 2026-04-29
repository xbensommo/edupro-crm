/** @file src/features/notifications/services/createNotificationTemplateService.js */

import notificationEventRegistry, { resolveNotificationEvent } from '../constants/notification.events.js'
import { interpolateTemplate } from '../utils/notification.helpers.js'

const BUILT_IN_TEMPLATES = Object.freeze({
  'client_record.created': {
    title: 'New client record created',
    body: '{{ actorName }} created client record for {{ entityLabel }}.',
  },
  'client_record.updated': {
    title: 'Client record updated',
    body: '{{ actorName }} updated {{ entityLabel }}.',
  },
  'crm.work.created': {
    title: 'New work created',
    body: '{{ actorName }} created {{ entityLabel }} for {{ clientName }}.',
  },
  'crm.work.assigned': {
    title: 'New work assigned to you',
    body: '{{ actorName }} assigned {{ entityLabel }}. Accept or deny the assignment. Due: {{ dueDate }}.',
  },
  'crm.work.review_assigned': {
    title: 'Work queued for editorial review',
    body: '{{ entityLabel }} has an assigned consultant and will need review after final submission.',
  },
  'crm.assignment.accepted': {
    title: 'Assignment accepted',
    body: '{{ actorName }} accepted {{ entityLabel }}.',
  },
  'crm.assignment.denied': {
    title: 'Assignment denied',
    body: '{{ actorName }} denied {{ entityLabel }}. Reassignment is required.',
  },
  'crm.final_delivery.submitted': {
    title: 'Final work submitted',
    body: '{{ actorName }} submitted final delivery for {{ entityLabel }}. Review is required.',
  },
  'crm.review.approved': {
    title: 'Work approved by editor',
    body: '{{ actorName }} approved {{ entityLabel }}.',
  },
  'crm.review.denied': {
    title: 'Work returned for revision',
    body: '{{ actorName }} returned {{ entityLabel }} for revision. Notes: {{ editorNotes }}',
  },
  'finance.payment.logged': {
    title: 'Client payment logged',
    body: '{{ actorName }} logged payment of {{ amountPaid }} for {{ entityLabel }}.',
  },
  'finance.commission.ready': {
    title: 'Commission ready',
    body: 'Your commission for {{ entityLabel }} is ready. Amount: {{ amountDue }}.',
  },
  'finance.commission.deducted': {
    title: 'Commission deduction applied',
    body: 'A deduction was applied to {{ entityLabel }}. Deduction: {{ deductionLabel }}.',
  },
  'finance.commission.paid': {
    title: 'Commission paid',
    body: 'Your commission for {{ entityLabel }} has been paid. Amount: {{ amountPaid }}.',
  },
  'auth.user.invited': {
    title: 'You were invited to EduProLIC',
    body: '{{ actorName }} invited you to join EduProLIC as {{ roleName }}.',
  },
  'auth.user.suspended': {
    title: 'Account suspended',
    body: 'Your EduProLIC access has been suspended. Contact admin if this is unexpected.',
  },
  'auth.role.changed': {
    title: 'Role updated',
    body: 'Your role was changed to {{ roleName }}.',
  },
  'system.alert': {
    title: 'System alert',
    body: '{{ message }}',
  },
})

/**
 * @param {{ templates?: any[], eventRegistry?: Record<string, any> }} options
 */
export function createNotificationTemplateService(options = {}) {
  const templates = Array.isArray(options.templates) ? options.templates : []
  const eventRegistry = options.eventRegistry || notificationEventRegistry

  function getTemplate(event) {
    const canonicalEvent = resolveNotificationEvent(event)
    const custom = templates.find((item) => item?.event === canonicalEvent || item?.key === canonicalEvent)
    if (custom && custom.active !== false) return custom
    return BUILT_IN_TEMPLATES[canonicalEvent] || {
      title: eventRegistry[canonicalEvent]?.templateKey || canonicalEvent,
      body: '{{ message }}',
    }
  }

  function renderTemplate(event, variables = {}) {
    const canonicalEvent = resolveNotificationEvent(event)
    const definition = getTemplate(canonicalEvent)
    return {
      title: interpolateTemplate(definition.title || canonicalEvent, variables),
      body: interpolateTemplate(definition.body || '', variables),
      definition,
    }
  }

  return { getTemplate, renderTemplate }
}

export default createNotificationTemplateService
