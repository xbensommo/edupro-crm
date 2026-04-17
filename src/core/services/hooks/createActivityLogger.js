/**
 * @file src/core/services/hooks/createActivityLogger.js
 * @description Shared activity logger for service-layer write hooks.
 */

import { createCollectionAdapter } from '../collections/createCollectionAdapter.js'
import { generateStableId } from '../ids/id.generators.js'

/**
 * Create a reusable logger for activity/timeline-style collections.
 *
 * The logger handles the repeated pattern of:
 * - requiring an authenticated actor
 * - stamping actor and audit fields
 * - writing through the normalized collection adapter
 *
 * Domain-specific activity fields still stay in the feature or app service.
 *
 * @param {object} options
 * @param {ReturnType<import('../context/createServiceContext.js').createServiceContext>} options.context
 * @param {string} options.collectionName
 * @param {string} [options.idPrefix='activity']
 * @param {(payload: Record<string, any>, runtime: { currentUser: any, context: any }) => Record<string, any>} [options.buildRecord]
 * @returns {(payload?: Record<string, any>) => Promise<Record<string, any>>}
 */
export function createActivityLogger({
  context,
  collectionName,
  idPrefix = 'activity',
  buildRecord,
} = {}) {
  if (!context) {
    throw new Error('createActivityLogger requires a service context.')
  }

  if (!collectionName) {
    throw context.createError('Activity collection name is required.', {
      code: 'ACTIVITY_COLLECTION_REQUIRED',
    })
  }

  const adapter = createCollectionAdapter({ context, collectionName })

  /**
   * @param {Record<string, any>} [payload={}]
   * @returns {Promise<Record<string, any>>}
   */
  return async function logActivity(payload = {}) {
    const currentUser = context.requireAuthenticated()
    const resolved =
      typeof buildRecord === 'function'
        ? buildRecord(payload, { currentUser, context })
        : { ...payload }

    const record = {
      ...resolved,
      ...(resolved?.createdAt ? {} : context.buildCreatedAudit()),
    }

    const id = payload.id || generateStableId(idPrefix, { now: context.now })
    return adapter.create(record, { id, generateId: () => id })
  }
}

export default createActivityLogger
