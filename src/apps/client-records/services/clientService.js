/**
 * @file src/apps/client-records/services/clientService.js
 * @description Patched client service excerpt: route notifications through one domain service.
 *
 * Replace the old direct store.notificationsActions.add(...) path with this pattern.
 */

import {
  createActivityLogger,
  createCollectionAdapter,
  createMonthlyNumber,
  createServiceContext,
  generateStableId,
  asStringArray,
  asNumber,
  asText,
  asMoney,
  getRecordId,
  withActivityLog,
} from '@core_services/index.js'

import { useAppStore } from '@app/stores/appStore'

const DEFAULT_LIST_OPTIONS = Object.freeze({
  pageSize: 50,
  sortBy: 'updatedAt',
  sortDirection: 'desc',
})

function normalizeClientError(error, fallbackMessage, context) {
  return context.normalizeError(error, fallbackMessage, {
    code: error?.code || 'CLIENT_SERVICE_ERROR',
    domain: 'client-records',
  })
}

function normalizeRecord(entry) {
  if (!entry || typeof entry !== 'object') return null
  const data = entry.data && typeof entry.data === 'object' ? entry.data : entry
  return { id: getRecordId(entry), ...data }
}

function summarizeWork(items = []) {
  return items.reduce(
    (summary, item) => {
      summary.total += 1
      summary.quotedAmount += asMoney(item?.quotedAmount || item?.netAmount || 0)
      summary.amountPaid += asMoney(item?.amountPaidCached || 0)
      summary.amountDue += asMoney(item?.amountDueCached || 0)
      summary.consultantCommission += asMoney(item?.consultantShareAmountCached || item?.consultantShareCached || 0)
      if (['completed', 'delivered', 'submitted'].includes(String(item?.deliveryStatus || '').toLowerCase())) {
        summary.completed += 1
      }
      return summary
    },
    { total: 0, completed: 0, quotedAmount: 0, amountPaid: 0, amountDue: 0, consultantCommission: 0 },
  )
}

function buildClientRecord(payload = {}, context) {
  return {
    clientNumber: asText(payload.clientNumber) || createMonthlyNumber('CLT', { now: context.now }),
    type: asText(payload.type) || 'individual',
    institutionName: asText(payload.institutionName),
    fieldOfStudy: asText(payload.fieldOfStudy),
    studyLevel: asText(payload.studyLevel),
    city: asText(payload.city),
    firstName: asText(payload.firstName),
    lastName: asText(payload.lastName),
    email: asText(payload.email),
    phone: asText(payload.phone),
    status: asText(payload.status) || 'lead',
    lifecycleStage: asText(payload.lifecycleStage) || 'intake',
    leadSource: asText(payload.leadSource),
    leadScore: asNumber(payload.leadScore),
    tags: asStringArray(payload.tags),
    communicationPreferences: {
      email: true,
      sms: false,
      push: false,
      marketing: false,
      language: 'en',
      ...(payload.communicationPreferences || {}),
    },
    customFields: payload.customFields || {},
    metadata: {
      version: 1,
      source: 'client-records',
      app: 'eduprolic',
      ...(payload.metadata || {}),
    },
    financeSummary: payload.financeSummary || { amountPaid: 0, amountDue: 0 },
    workSummary: payload.workSummary || { total: 0, completed: 0 },
    lastActivityAt: payload.lastActivityAt || context.getNow(),
    ...context.buildCreatedAudit(),
  }
}

export function createClientService({
  store = useAppStore(),
  access = null,
  now = () => new Date(),
  notificationService = null,
} = {}) {
  const context = createServiceContext({ store, access, now, domain: 'client-records' })

  const clients = createCollectionAdapter({ context, collectionName: 'clients', stateKey: 'clients', defaultListParams: DEFAULT_LIST_OPTIONS })
  const clientContacts = createCollectionAdapter({ context, collectionName: 'clientContacts', stateKey: 'clientContacts' })
  const clientNotes = createCollectionAdapter({ context, collectionName: 'clientNotes', stateKey: 'clientNotes' })
  const clientActivities = createCollectionAdapter({ context, collectionName: 'clientActivities', stateKey: 'clientActivities' })

  const logActivityRecord = createActivityLogger({
    context,
    collectionName: 'clientActivities',
    idPrefix: 'activity',
    buildRecord(payload, runtime) {
      return {
        clientId: payload.clientId,
        userId: runtime.currentUser?.uid || context.getCurrentUserId() || null,
        type: asText(payload.type) || 'note',
        action: asText(payload.action) || 'updated',
        description: asText(payload.description),
        referenceType: payload.referenceType || null,
        referenceId: payload.referenceId || null,
        metadata: payload.metadata || {},
        duration: asNumber(payload.duration) || null,
        outcome: asText(payload.outcome) || 'completed',
        priority: asText(payload.priority) || 'medium',
        isPublic: payload.isPublic !== false,
      }
    },
  })

  function getCollectionActions(name) {
    return store.getCollectionActions?.(name) || store[`${name}Actions`] || null
  }

  async function safeFetchByFilters(name, filters) {
    const actions = getCollectionActions(name)
    if (actions?.fetchByFilters) {
      const result = await actions.fetchByFilters({ filters })
      const rows = Array.isArray(result?.items) ? result.items : Array.isArray(result) ? result : actions.state?.items || []
      return rows.map(normalizeRecord).filter(Boolean)
    }

    const stateRows = Array.isArray(actions?.state?.items)
      ? actions.state.items
      : Array.isArray(store?.[name]?.items)
        ? store[name].items
        : []

    return stateRows
      .map(normalizeRecord)
      .filter((row) => row && Object.entries(filters || {}).every(([key, value]) => row?.[key] === value))
  }

  async function safeListUsersByRoles(roles = []) {
    const users = Array.isArray(store?.users?.items) ? store.users.items : []
    return users
      .map(normalizeRecord)
      .filter((user) => roles.some((role) => user?.role === role || (Array.isArray(user?.roles) && user.roles.includes(role))))
  }

  async function notifyRoles(roles = [], buildPayload) {
    if (!notificationService?.send) return []

    const recipients = await safeListUsersByRoles(roles)
    const unique = new Map()
    for (const user of recipients) {
      const recipientId = user?.id || user?.uid || null
      if (recipientId) unique.set(recipientId, user)
    }

    const created = []
    for (const user of unique.values()) {
      const payload = buildPayload(user)
      if (!payload) continue
      const result = await notificationService.send({
        recipientId: user.id || user.uid,
        ...payload,
      })
      if (result) created.push(result)
    }
    return created
  }

  async function logActivity(clientId, payload = {}) {
    try {
      context.assertPermission('client_records.activities.create')
      context.requireAuthenticated()
      if (!clientId) throw context.createError('A client id is required.', { code: 'CLIENT_ID_REQUIRED' })
      return await logActivityRecord({ ...payload, clientId })
    } catch (error) {
      throw normalizeClientError(error, 'Failed to log the client activity.', context)
    }
  }

  async function getClient(clientId) {
    const client = normalizeRecord(await clients.getById(clientId))
    if (!client) return null

    await Promise.all([
      clientActivities.list({ pageSize: 25, sortBy: 'createdAt', sortDirection: 'desc', filters: { clientId } }),
      clientNotes.list({ pageSize: 25, sortBy: 'createdAt', sortDirection: 'desc', filters: { clientId } }),
    ])

    const workItems = await safeFetchByFilters('engagements', { clientId })
    const activities = clientActivities.readState().items.map(normalizeRecord).filter((entry) => entry?.clientId === clientId)
    const notes = clientNotes.readState().items.map(normalizeRecord).filter((entry) => entry?.clientId === clientId)
    const contacts = clientContacts.readState().items.map(normalizeRecord).filter((entry) => entry?.clientId === clientId)
    const workSummary = summarizeWork(workItems)

    return {
      ...client,
      contacts,
      activities,
      notes,
      workItems,
      workSummary,
      financeSummary: {
        amountPaid: workSummary.amountPaid,
        amountDue: workSummary.amountDue,
        quotedAmount: workSummary.quotedAmount,
      },
    }
  }

  async function createClient(payload = {}) {
    try {
      context.assertPermission('client_records.clients.create')
      context.requireAuthenticated()
      const client = buildClientRecord(payload, context)

      return await withActivityLog(
        async () => {
          const created = await clients.create(client)
          const createdId = getRecordId(created)
          return getClient(createdId)
        },
        {
          log: async (result) => {
            await logActivity(result?.id, {
              type: 'note',
              action: 'client_created',
              description: `Client ${result?.clientNumber || ''} created.`,
              priority: 'medium',
            })

            await notifyRoles(['admin', 'receptionist'], () => ({
              title: 'New client added',
              message: ((`${result?.firstName || ''} ${result?.lastName || ''}`.trim()) || result?.institutionName || 'A new client') + ' was added to Client Records.',
              event: 'client_record.created',
              type: 'client_records',
              priority: 'normal',
              actionUrl: result?.id ? `/clients/${result.id}` : '/clients',
              entityType: 'client',
              entityId: result?.id || null,
              actorId: context.getCurrentUserId() || null,
              actorName: context.getCurrentUser()?.displayName || 'System',
              meta: { clientNumber: result?.clientNumber || null },
            }))
          },
        },
      )
    } catch (error) {
      throw normalizeClientError(error, 'Failed to create the client.', context)
    }
  }

  return {
    createClient,
    getClient,
    logActivity,
    generateClientNumber: () => createMonthlyNumber('CLT', { now: context.now }),
  }
}

export default createClientService
