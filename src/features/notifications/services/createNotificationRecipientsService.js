/** @file src/features/notifications/services/createNotificationRecipientsService.js */

import { normalizeStoreRow } from '../utils/notification.helpers.js'

function normalizeRole(value) {
  return String(value || '').trim().toLowerCase().replace(/-/g, '_')
}

function userMatchesRole(user, role) {
  const target = normalizeRole(role)
  if (!target) return false
  const userRole = normalizeRole(user?.role)
  const roles = Array.isArray(user?.roles) ? user.roles.map(normalizeRole) : []
  return userRole === target || roles.includes(target)
}

/**
 * @param {{ store?: any, currentUser?: () => any, recipientField?: string }} options
 */
export function createNotificationRecipientsService(options = {}) {
  const store = options.store || null
  const currentUser = typeof options.currentUser === 'function' ? options.currentUser : () => null
  const recipientField = options.recipientField || 'user_id'

  function fromUser(user) {
    if (!user) return null
    const row = normalizeStoreRow(user)
    const id = row?.id || row?.uid || row?.[recipientField]
    if (!id) return null
    return {
      recipientId: id,
      [recipientField]: id,
      recipientEmail: row.email || row.emailAddress || null,
      recipientName: row.displayName || row.fullName || [row.firstName, row.lastName].filter(Boolean).join(' ') || row.email || id,
      role: row.role || null,
      roles: Array.isArray(row.roles) ? row.roles : [],
      raw: row,
    }
  }

  async function listLoadedUsers() {
    const rows = store?.users?.items || store?.users || []
    return Array.isArray(rows) ? rows.map(normalizeStoreRow).filter(Boolean) : []
  }

  async function listUsersByRole(role) {
    const loaded = await listLoadedUsers()
    const matches = loaded.filter((user) => userMatchesRole(user, role))
    if (matches.length) return matches

    const usersActions = store?.getCollectionActions?.('users') || store?.usersActions
    if (!usersActions?.fetchByFilters) return []

    await usersActions.fetchByFilters({
      filters: [{ field: 'role', op: '==', value: role }],
      pageSize: 50,
    })
    const fetchedRows = usersActions.state?.items || store?.users?.items || []
    return fetchedRows.map(normalizeStoreRow).filter((user) => userMatchesRole(user, role))
  }

  async function resolveRecipients(event, payload = {}) {
    const direct = []

    if (payload.recipient) direct.push(payload.recipient)
    if (payload.recipientId || payload[recipientField]) {
      direct.push({
        recipientId: payload.recipientId || payload[recipientField],
        [recipientField]: payload.recipientId || payload[recipientField],
        recipientEmail: payload.recipientEmail || payload.email || null,
        recipientName: payload.recipientName || payload.fullName || null,
      })
    }

    if (Array.isArray(payload.recipientIds)) {
      for (const id of payload.recipientIds) direct.push({ recipientId: id, [recipientField]: id })
    }

    if (Array.isArray(payload.recipients)) direct.push(...payload.recipients)

    const roleNames = [
      ...(Array.isArray(payload.roles) ? payload.roles : []),
      ...(Array.isArray(payload.roleScope) ? payload.roleScope : payload.roleScope ? [payload.roleScope] : []),
    ].filter(Boolean)

    for (const role of roleNames) {
      const users = await listUsersByRole(role)
      direct.push(...users)
    }

    if (payload.notifyCurrentUser === true) {
      const user = currentUser()
      if (user) direct.push(user)
    }

    const deduped = new Map()
    for (const item of direct) {
      const recipient = fromUser(item)
      if (!recipient?.recipientId) continue
      deduped.set(recipient.recipientId, { ...deduped.get(recipient.recipientId), ...recipient })
    }

    return [...deduped.values()]
  }

  return { resolveRecipients, listUsersByRole }
}

export default createNotificationRecipientsService
