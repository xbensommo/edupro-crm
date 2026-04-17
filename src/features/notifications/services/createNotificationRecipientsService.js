/** @file src/features/notifications/services/createNotificationRecipientsService.js */

/**
 * Create recipient resolution logic for domain events.
 *
 * @param {{
 *   currentUser?: (() => Record<string, any>|null) | null,
 *   userDirectory?: { getById?: (id: string) => Promise<Record<string, any>|null>, listByRole?: (role: string) => Promise<Array<Record<string, any>>> } | null,
 * }} [options={}]
 * @returns {{
 *   resolveRecipients: (event: string, payload?: Record<string, any>) => Promise<Array<Record<string, any>>>
 * }}
 */
export function createNotificationRecipientsService(options = {}) {
  const currentUser = typeof options.currentUser === 'function' ? options.currentUser : () => null;
  const userDirectory = options.userDirectory || {};

  async function resolveRecipients(event, payload = {}) {
    const recipients = new Map();

    for (const target of payload.recipientIds || []) {
      recipients.set(target, { userId: target });
    }

    if (payload.assigneeId) {
      recipients.set(payload.assigneeId, { userId: payload.assigneeId });
    }

    if (payload.userId) {
      recipients.set(payload.userId, { userId: payload.userId });
    }

    if ((payload.notifyAdmins || event === 'system.alert') && typeof userDirectory.listByRole === 'function') {
      const admins = await userDirectory.listByRole('admin');
      for (const admin of admins || []) {
        recipients.set(admin.id || admin.userId, admin);
      }
    }

    const actor = currentUser();
    if (payload.includeActor && actor?.id) {
      recipients.set(actor.id, actor);
    }

    return [...recipients.values()].filter((item) => item?.userId || item?.id);
  }

  return {
    resolveRecipients,
  };
}

export default createNotificationRecipientsService;
