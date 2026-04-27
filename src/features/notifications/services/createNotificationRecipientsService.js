/**
 * @file src/features/notifications/services/createNotificationRecipientsService.js
 * @description Recipient resolution with one canonical recipient id.
 */

/**
 * Resolve recipients for notification events.
 *
 * @param {{ currentUser?: () => any, userDirectory?: { listByRole?: (role: string) => Promise<any[]> }, recipientField?: string }} [options={}]
 */
export function createNotificationRecipientsService(options = {}) {
  const currentUser = typeof options.currentUser === 'function' ? options.currentUser : () => null
  const userDirectory = options.userDirectory || {}
  const recipientField = options.recipientField || 'userId'

  async function listByRole(role) {
    if (typeof userDirectory.listByRole !== 'function') return []
    return (await userDirectory.listByRole(role)) || []
  }

  function getRecipientId(record) {
    return record?.recipientId || record?.[recipientField] || record?.userId || record?.user_id || record?.uid || record?.id || null
  }

  function addRecipient(map, record) {
    if (!record) return
    const id = getRecipientId(record)
    if (!id) return
    map.set(id, { ...record, recipientId: id, [recipientField]: id })
  }

  async function addRoleRecipients(map, roles = []) {
    for (const role of roles) {
      const rows = await listByRole(role)
      for (const row of rows) addRecipient(map, row)
    }
  }

  async function resolveRecipients(event, payload = {}) {
    const recipients = new Map()

    for (const target of payload.recipientIds || []) addRecipient(recipients, { recipientId: target })
    for (const role of payload.recipientRoles || []) await addRoleRecipients(recipients, [role])

    const directIds = [
      payload.recipientId,
      payload[recipientField],
      payload.userId,
      payload.user_id,
      payload.assigneeId,
      payload.assignedConsultantId,
      payload.consultantId,
      payload.consultantEditorId,
      payload.reviewedBy,
      payload.reviewerId,
      payload.clientOwnerId,
    ].filter(Boolean)

    for (const id of directIds) addRecipient(recipients, { recipientId: id })

    if (event.startsWith('crm.work.') || event.startsWith('crm.assignment.') || event.startsWith('crm.final_delivery.')) {
      await addRoleRecipients(recipients, ['admin', 'receptionist'])
    }

    if (event.startsWith('crm.review.')) {
      await addRoleRecipients(recipients, ['admin', 'receptionist', 'consultant_editor'])
    }

    if (event.startsWith('finance.')) {
      await addRoleRecipients(recipients, ['admin', 'receptionist'])
      if (payload.notifyConsultant !== false && payload.consultantId) {
        addRecipient(recipients, { recipientId: payload.consultantId })
      }
    }

    if (event.startsWith('client_record.')) {
      await addRoleRecipients(recipients, ['admin', 'receptionist'])
    }

    if (event.startsWith('auth.')) {
      await addRoleRecipients(recipients, ['admin'])
      if (payload.recipientId || payload[recipientField] || payload.userId || payload.user_id) {
        addRecipient(recipients, {
          recipientId: payload.recipientId || payload[recipientField] || payload.userId || payload.user_id,
        })
      }
    }

    if (payload.notifyAdmins || event === 'system.alert') {
      await addRoleRecipients(recipients, ['admin'])
    }

    if (payload.includeActor) addRecipient(recipients, currentUser())

    return [...recipients.values()].filter((item) => getRecipientId(item))
  }

  return {
    resolveRecipients,
  }
}

export default createNotificationRecipientsService
