/**
 * @file services/clientService.js
 * @description Root-store compatible Client Records service built on the shared Totistack service core.
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
  withActivityLog,
} from '@core_services/index.js'

const DEFAULT_LIST_OPTIONS = Object.freeze({
  pageSize: 50,
  sortBy: 'updatedAt',
  sortDirection: 'desc',
})

/**
 * @param {unknown} error
 * @param {string} fallbackMessage
 * @param {ReturnType<typeof createServiceContext>} context
 * @returns {Error}
 */
function normalizeClientError(error, fallbackMessage, context) {
  return context.normalizeError(error, fallbackMessage, {
    code: error?.code || 'CLIENT_SERVICE_ERROR',
    domain: 'client-records',
  })
}

/**
 * @param {object} payload
 * @param {ReturnType<typeof createServiceContext>} context
 * @returns {Record<string, any>}
 */
function buildClientRecord(payload = {}, context) {
  return {
    clientNumber:  asText(payload.clientNumber) || createMonthlyNumber('CLT', { now: context.now }),
    type:  asText(payload.type) || 'individual',
    institutionName:  asText(payload.institutionName),
    fieldOfStudy:  asText(payload.fieldOfStudy),
    firstName:  asText(payload.firstName),
    lastName:  asText(payload.lastName),
    email:  asText(payload.email),
    phone:  asText(payload.phone),
    status:  asText(payload.status) || 'lead',
    lifecycleStage:  asText(payload.lifecycleStage) || 'lead',
    leadSource:  asText(payload.leadSource),
    leadScore:  asNumber(payload.leadScore),
    lifetimeValue:  asNumber(payload.lifetimeValue),
    tags: asStringArray(payload.tags),
    communicationPreferences: {
      email: true,
      sms: false,
      push: false,
      marketing: true,
      language: 'en',
      ...(payload.communicationPreferences || {}),
    },
    customFields: payload.customFields || {},
    metadata: {
      version: 1,
      source: 'client-records',
      ...(payload.metadata || {}),
    },
    lastActivityAt: payload.lastActivityAt || context.getNow(),
    ...context.buildCreatedAudit(),
  }
}

/**
 * Build a Client Records service around the root Totistack app store.
 *
 * @param {object} [options={}]
 * @param {Record<string, any>|null} [options.store=null]
 * @param {{ can?: (permission: string) => boolean }|null} [options.access=null]
 * @param {() => Date} [options.now]
 * @returns {object}
 */
export function createClientService({
  store = null,
  access = null,
  now = () => new Date(),
} = {}) {
  const context = createServiceContext({
    store,
    access,
    now,
    domain: 'client-records',
  })

  const clients = createCollectionAdapter({
    context,
    collectionName: 'clients',
    stateKey: 'clients',
    defaultListParams: DEFAULT_LIST_OPTIONS,
  })

  const clientContacts = createCollectionAdapter({
    context,
    collectionName: 'clientContacts',
    stateKey: 'clientContacts',
  })

  const clientNotes = createCollectionAdapter({
    context,
    collectionName: 'clientNotes',
    stateKey: 'clientNotes',
  })

  const clientActivities = createCollectionAdapter({
    context,
    collectionName: 'clientActivities',
    stateKey: 'clientActivities',
  })

  const logActivityRecord = createActivityLogger({
    context,
    collectionName: 'clientActivities',
    idPrefix: 'activity',
    buildRecord(payload, runtime) {
      return {
        clientId: payload.clientId,
        userId: runtime.currentUser.uid,
        type:  asText(payload.type) || 'note',
        action:  asText(payload.action) || 'updated',
        description:  asText(payload.description),
        referenceType: payload.referenceType || null,
        referenceId: payload.referenceId || null,
        metadata: payload.metadata || {},
        duration:  asNumber(payload.duration) || null,
        outcome:  asText(payload.outcome) || 'completed',
        priority:  asText(payload.priority) || 'medium',
        isPublic: payload.isPublic !== false,
      }
    },
  })

  /**
   * @returns {string}
   */
  function generateClientNumber() {
    return createMonthlyNumber('CLT', { now: context.now })
  }

  /**
   * @param {Record<string, any>} [options={}]
   * @returns {Promise<{items: any[], hasMore: boolean}>}
   */
  async function fetchClients(options = {}) {
    try {
      context.assertPermission('clients.read')
      await clients.list({ ...DEFAULT_LIST_OPTIONS, ...(options || {}) })
      const state = clients.readState()
      return {
        items: state.items,
        hasMore: state.hasMore,
      }
    } catch (error) {
      throw normalizeClientError(error, 'Failed to load clients.', context)
    }
  }

  /**
   * @param {string} clientId
   * @returns {Promise<Record<string, any>|null>}
   */
  async function getClient(clientId) {
    try {
      context.assertPermission('clients.read')

      if (!clientId) {
        throw context.createError('A client id is required.', {
          code: 'CLIENT_ID_REQUIRED',
        })
      }

      const client = await clients.getById(clientId)
      if (!client) return null

      await Promise.all([
        clientActivities.list({
          pageSize: 25,
          sortBy: 'createdAt',
          sortDirection: 'desc',
          filters: { clientId },
        }),
        clientNotes.list({
          pageSize: 25,
          sortBy: 'createdAt',
          sortDirection: 'desc',
          filters: { clientId },
        }),
      ])

      const activities = clientActivities.readState().items.filter((entry) => entry?.clientId === clientId)
      const notes = clientNotes.readState().items.filter((entry) => entry?.clientId === clientId)

      return {
        ...client,
        activities,
        notes,
      }
    } catch (error) {
      throw normalizeClientError(error, 'Failed to load the client.', context)
    }
  }

  /**
   * @param {string} clientId
   * @param {Record<string, any>} [payload={}]
   * @returns {Promise<Record<string, any>>}
   */
  async function logActivity(clientId, payload = {}) {
    try {
      context.assertPermission('clients.read')
      context.requireAuthenticated()

      if (!clientId) {
        throw context.createError('A client id is required.', {
          code: 'CLIENT_ID_REQUIRED',
        })
      }

      return await logActivityRecord({
        ...payload,
        clientId,
      })
    } catch (error) {
      throw normalizeClientError(error, 'Failed to log the client activity.', context)
    }
  }

  /**
   * @param {Record<string, any>} [payload={}]
   * @returns {Promise<Record<string, any>|null>}
   */
  async function createClient(payload = {}) {
    try {
      context.assertPermission('clients.create')
      context.requireAuthenticated()

      const client = buildClientRecord(payload, context)

      return await withActivityLog(
        async () => {
          const created = await clients.create(client)
          return getClient(created?.id || created?.docId || created?._id)
        },
        {
          log: async (result) => {
            await logActivity(result?.id, {
              type: 'note',
              action: 'client_created',
              description: `Client ${client.clientNumber} created.`,
              priority: 'medium',
            })
          },
        },
      )
    } catch (error) {
      throw normalizeClientError(error, 'Failed to create the client.', context)
    }
  }

  /**
   * @param {string} clientId
   * @param {Record<string, any>} [updates={}]
   * @returns {Promise<Record<string, any>|null>}
   */
  async function updateClient(clientId, updates = {}) {
    try {
      context.assertPermission('clients.update')

      const current = await clients.getById(clientId)
      if (!current) {
        throw context.createError('Client not found.', {
          code: 'CLIENT_NOT_FOUND',
          meta: { clientId },
        })
      }

      await withActivityLog(
        async () => {
          await clients.update(clientId, {
            ...updates,
            metadata: {
              ...(current.metadata || {}),
              version: Number(current.metadata?.version || 1) + 1,
              updatedBy: context.getCurrentUserId() || null,
            },
            ...context.buildUpdatedAudit(),
          })
        },
        {
          log: async () => {
            await logActivity(clientId, {
              type: 'edit',
              action: 'client_updated',
              description: 'Client profile updated.',
              priority: 'medium',
              metadata: {
                updatedFields: Object.keys(updates || {}),
              },
            })
          },
        },
      )

      return getClient(clientId)
    } catch (error) {
      throw normalizeClientError(error, 'Failed to update the client.', context)
    }
  }

  /**
   * @param {string} clientId
   * @returns {Promise<Record<string, any>|null>}
   */
  async function archiveClient(clientId) {
    try {
      context.assertPermission('clients.delete')

      await withActivityLog(
        async () => {
          await clients.update(clientId, {
            status: 'inactive',
            metadata: {
              archivedBy: context.getCurrentUserId() || null,
            },
            ...context.buildUpdatedAudit(),
          })
        },
        {
          log: async () => {
            await logActivity(clientId, {
              type: 'status_change',
              action: 'client_archived',
              description: 'Client archived.',
              priority: 'high',
            })
          },
        },
      )

      return getClient(clientId)
    } catch (error) {
      throw normalizeClientError(error, 'Failed to archive the client.', context)
    }
  }

  /**
   * @param {string} clientId
   * @param {Record<string, any>} [payload={}]
   * @returns {Promise<Record<string, any>>}
   */
  async function addContact(clientId, payload = {}) {
    try {
      context.assertPermission('clients.update')

      if (!clientId) {
        throw context.createError('A client id is required.', {
          code: 'CLIENT_ID_REQUIRED',
        })
      }

      const contactId = payload.id || generateStableId('contact', { now: context.now })
      const contact = {
        clientId,
        firstName:  asText(payload.firstName),
        lastName:  asText(payload.lastName),
        title:  asText(payload.title),
        department:  asText(payload.department),
        email:  asText(payload.email),
        phone:  asText(payload.phone),
        mobile:  asText(payload.mobile),
        role:  asText(payload.role) || 'other',
        isPrimary: Boolean(payload.isPrimary),
        receivesNotifications: payload.receivesNotifications !== false,
        preferences: {
          email: true,
          sms: false,
          phone: true,
          ...(payload.preferences || {}),
        },
        notes:  asText(payload.notes),
        ...context.buildCreatedAudit(),
      }

      await clientContacts.upsert(contactId, contact)

      if (contact.isPrimary) {
        await clients.update(clientId, {
          primaryContactId: contactId,
          firstName: contact.firstName,
          lastName: contact.lastName,
          email: contact.email,
          phone: contact.phone,
          ...context.buildUpdatedAudit(),
        })
      }

      await logActivity(clientId, {
        type: 'note',
        action: 'contact_added',
        description: `${contact.firstName} ${contact.lastName}`.trim() || 'Client contact added.',
        metadata: { contactId },
      })

      return { id: contactId, ...contact }
    } catch (error) {
      throw normalizeClientError(error, 'Failed to add the client contact.', context)
    }
  }

  /**
   * @param {string} clientId
   * @param {Record<string, any>} [payload={}]
   * @returns {Promise<Record<string, any>>}
   */
  async function addNote(clientId, payload = {}) {
    try {
      context.assertPermission('clients.update')
      const currentUser = context.requireAuthenticated()

      const noteId = payload.id || generateStableId('note', { now: context.now })
      const note = {
        clientId,
        userId: currentUser.uid,
        content:  asText(payload.content),
        type:  asText(payload.type) || 'general',
        isPublic: payload.isPublic !== false,
        ...context.buildCreatedAudit(),
      }

      await clientNotes.upsert(noteId, note)
      await clients.update(clientId, {
        lastActivityAt: context.getNow(),
        ...context.buildUpdatedAudit(),
      })

      await logActivity(clientId, {
        type: 'note',
        action: 'note_added',
        description: note.content || 'Client note added.',
        metadata: { noteId },
      })

      return { id: noteId, ...note }
    } catch (error) {
      throw normalizeClientError(error, 'Failed to add the client note.', context)
    }
  }

  return {
    fetchClients,
    getClient,
    createClient,
    updateClient,
    archiveClient,
    addContact,
    addNote,
    logActivity,
    generateClientNumber,
  }
}

export default createClientService
