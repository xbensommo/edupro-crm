/**
 * @file src/features/crm/services/createCrmNotificationBridge.js
 * @description CRM-specific adapter over the canonical notification bridge.
 */

import { createNotificationBridge } from '@features/notifications/services/createNotificationBridge.js' 

function actorFromUser(user) {
  return [user?.firstName, user?.lastName].filter(Boolean).join(' ') || user?.email || 'System'
}

function recordId(value) {
  return value?.id || value?.docId || value?._id || value?.engagementId || value?.engagementCode || null
}

function engagementVariables(engagement = {}, currentUser = {}) {
  const id = recordId(engagement)
  return {
    entityType: 'engagement',
    entityId: id,
    entityLabel: engagement.engagementCode || engagement.title || id || 'work item',
    engagementCode: engagement.engagementCode || id || '',
    title: engagement.title || engagement.engagementCode || 'Work item',
    clientName: engagement.clientName || engagement.clientLabel || 'client',
    dueDate: engagement.dueDate || engagement.deadline || 'not set',
    actionUrl: `/crm/work/v/${id || ''}`,
    actionLabel: 'Open work',
    actorId: currentUser?.id || currentUser?.uid || engagement.actorId || null,
    actorName: engagement.actorName || actorFromUser(currentUser),
    domain: 'crm',
    sourceModule: 'crm',
    meta: {
      engagementCode: engagement.engagementCode || null,
      clientId: engagement.clientId || null,
      assignedConsultantId: engagement.assignedConsultantId || null,
      assignedEditorId: engagement.assignedEditorId || null,
    },
  }
}

/**
 * @param {{ store: any, currentUser?: () => any }} options
 */
export function createCrmNotificationBridge(options = {}) {
  const bridge = createNotificationBridge({
    store: options.store,
    currentUser: options.currentUser,
    recipientField: 'user_id',
  })

  function getCurrentUser() {
    return typeof options.currentUser === 'function' ? options.currentUser() || {} : {}
  }

  async function notifyWorkCreated(engagement = {}) {
    return bridge.emit('crm.work.created', {
      ...engagementVariables(engagement, getCurrentUser()),
      roleScope: ['admin', 'receptionist'],
      priority: 'normal',
    })
  }

  async function notifyWorkAssignment(engagement = {}) {
    const currentUser = getCurrentUser()
    const base = engagementVariables(engagement, currentUser)
    const deliveries = []

    if (engagement.assignedConsultantId) {
      deliveries.push(...await bridge.emit('crm.work.assigned', {
        ...base,
        recipientId: engagement.assignedConsultantId,
        recipientEmail: engagement.assignedConsultantEmail || engagement.consultantEmail || null,
        recipientName: engagement.consultantName || engagement.assignedConsultantInfo || null,
        isActionRequired: true,
        priority: 'high',
      }))
    }

    if (engagement.assignedEditorId) {
      deliveries.push(...await bridge.emit('crm.work.review_assigned', {
        ...base,
        recipientId: engagement.assignedEditorId,
        recipientEmail: engagement.assignedEditorEmail || null,
        recipientName: engagement.assignedEditorName || null,
        priority: 'normal',
      }))
    }

    return deliveries
  }

  async function notifyAssignmentDecision(engagement = {}, decision = 'accepted') {
    const event = decision === 'denied' ? 'crm.assignment.denied' : 'crm.assignment.accepted'
    return bridge.emit(event, {
      ...engagementVariables(engagement, getCurrentUser()),
      roleScope: ['admin', 'receptionist'],
      consultantName: engagement.consultantName || engagement.assignmentRespondedByName || 'Consultant',
      actorName: engagement.assignmentRespondedByName || engagement.consultantName || actorFromUser(getCurrentUser()),
      priority: decision === 'denied' ? 'high' : 'normal',
      isActionRequired: decision === 'denied',
    })
  }

  async function notifyFinalSubmission(engagement = {}) {
    return bridge.emit('crm.final_delivery.submitted', {
      ...engagementVariables(engagement, getCurrentUser()),
      roleScope: ['admin', 'receptionist', 'consultant_editor'],
      consultantName: engagement.consultantName || engagement.finalSubmittedByName || 'Consultant',
      actorName: engagement.finalSubmittedByName || engagement.consultantName || actorFromUser(getCurrentUser()),
      priority: 'high',
      isActionRequired: true,
    })
  }

  async function notifyReviewDecision(engagement = {}, decision = 'approved', payload = {}) {
    const approved = decision === 'approved'
    return bridge.emit(approved ? 'crm.review.approved' : 'crm.review.denied', {
      ...engagementVariables(engagement, getCurrentUser()),
      recipientId: engagement.assignedConsultantId,
      recipientEmail: engagement.assignedConsultantEmail || engagement.consultantEmail || null,
      recipientName: engagement.consultantName || engagement.assignedConsultantInfo || null,
      actorName: payload.editorName || engagement.reviewRespondedByName || actorFromUser(getCurrentUser()),
      editorNotes: payload.editorNotes || engagement.reviewRemarks || '',
      deductionLabel: payload.deductionLabel || `${engagement.reviewDeductionPercent || 0}%`,
      priority: approved ? 'normal' : 'critical',
      isActionRequired: !approved,
    })
  }

  return {
    emit: bridge.emit,
    notifyWorkCreated,
    notifyWorkAssignment,
    notifyAssignmentDecision,
    notifyFinalSubmission,
    notifyReviewDecision,
  }
}

export default createCrmNotificationBridge
