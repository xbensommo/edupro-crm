/**
 * @file src/core/services/collections/createCollectionAdapter.js
 * @description Normalize root-store collection actions into one stable service API.
 */

import { normalizeServiceError } from '../errors/normalizeServiceError.js'
import {
  getRecordId,
  normalizeCollectionItems,
} from '../normalizers/value.normalizers.js'

/**
 * @typedef {object} CollectionAdapter
 * @property {string} collectionName
 * @property {() => Record<string, Function>} getActions
 * @property {() => { items: any[], hasMore: boolean, raw: any }} readState
 * @property {(params?: Record<string, any>) => Promise<any[]>} list
 * @property {(query: string|Record<string, any>, options?: Record<string, any>) => Promise<any[]>} search
 * @property {(id: string) => Promise<any>} getById
 * @property {(payload: Record<string, any>, options?: Record<string, any>) => Promise<any>} create
 * @property {(id: string, payload: Record<string, any>) => Promise<any>} update
 * @property {(id: string, payload: Record<string, any>) => Promise<any>} upsert
 * @property {(id: string, ...args: any[]) => Promise<any>} remove
 */

/**
 * Create a stable adapter around one collection name.
 *
 * Supported action names are normalized from the different patterns found in
 * Totistack services: fetchInitialPage, list, search, getById, create, add,
 * setById, update, remove, delete, removePermanently.
 *
 * @param {object} options
 * @param {ReturnType<import('../context/createServiceContext.js').createServiceContext>} options.context
 * @param {string} options.collectionName
 * @param {string} [options.stateKey]
 * @param {Record<string, any>} [options.defaultListParams={}]
 * @returns {CollectionAdapter}
 */
export function createCollectionAdapter({
  context,
  collectionName,
  stateKey = '',
  defaultListParams = {},
} = {}) {
  if (!context) {
    throw new Error('createCollectionAdapter requires a service context.')
  }

  if (!collectionName) {
    throw context.createError('Collection name is required for the adapter.', {
      code: 'COLLECTION_NAME_REQUIRED',
    })
  }

  const resolvedStateKey = stateKey || collectionName

  /**
   * @returns {Record<string, Function>}
   */
  function getActions() {
    return context.getCollectionActions(collectionName)
  }

  /**
   * @returns {{ items: any[], hasMore: boolean, raw: any }}
   */
  function readState() {
    return context.getCollectionState(resolvedStateKey)
  }

  /**
   * @param {string} operation
   * @returns {never}
   */
  function throwUnsupported(operation) {
    throw context.createError(
      `Collection "${collectionName}" does not support the "${operation}" operation.`,
      {
        code: 'COLLECTION_OPERATION_NOT_SUPPORTED',
        meta: { collectionName, operation },
      },
    )
  }

  /**
   * @param {unknown} result
   * @returns {any[]}
   */
  function normalizeListResult(result) {
    const items = normalizeCollectionItems(result)
    if (items.length > 0) return items
    return readState().items
  }

  return {
    collectionName,
    getActions,
    readState,

    async list(params = {}) {
      try {
        const actions = getActions()
        const merged = { ...defaultListParams, ...(params || {}) }

        if (typeof actions.fetchInitialPage === 'function') {
          const result = await actions.fetchInitialPage(merged)
          return normalizeListResult(result)
        }

        if (typeof actions.list === 'function') {
          const result = await actions.list(merged)
          return normalizeListResult(result)
        }

        throwUnsupported('list')
      } catch (error) {
        throw normalizeServiceError(error, `Failed to list ${collectionName}.`, {
          domain: context.domain,
          code: error?.code || 'LIST_FAILED',
          meta: { collectionName, params },
        })
      }
    },

    async search(query, options = {}) {
      try {
        const actions = getActions()
        if (typeof actions.search !== 'function') {
          throwUnsupported('search')
        }

        const payload =
          typeof query === 'string'
            ? { ...options, search: query }
            : { ...(query || {}) }

        const result = await actions.search(payload)
        return normalizeListResult(result)
      } catch (error) {
        throw normalizeServiceError(error, `Failed to search ${collectionName}.`, {
          domain: context.domain,
          code: error?.code || 'SEARCH_FAILED',
          meta: { collectionName, query, options },
        })
      }
    },

    async getById(id) {
      if (!id) {
        throw context.createError('Record id is required.', {
          code: 'RECORD_ID_REQUIRED',
          meta: { collectionName },
        })
      }

      try {
        const actions = getActions()
        if (typeof actions.getById !== 'function') {
          throwUnsupported('getById')
        }

        return await actions.getById(id)
      } catch (error) {
        throw normalizeServiceError(error, `Failed to load ${collectionName} record.`, {
          domain: context.domain,
          code: error?.code || 'GET_BY_ID_FAILED',
          meta: { collectionName, id },
        })
      }
    },

    async create(payload, options = {}) {
      try {
        const actions = getActions()

        if (typeof actions.create === 'function') {
          return await actions.create(payload, options)
        }

        if (typeof actions.add === 'function') {
          return await actions.add(payload, options)
        }

        if (typeof actions.setById === 'function') {
          const id = options.id || getRecordId(payload) || options.generateId?.()
          if (!id) {
            throw context.createError(
              `setById for "${collectionName}" requires an explicit id.`,
              {
                code: 'CREATE_ID_REQUIRED',
                meta: { collectionName },
              },
            )
          }

          await actions.setById(id, payload, options)
          return { id, ...payload }
        }

        throwUnsupported('create')
      } catch (error) {
        throw normalizeServiceError(error, `Failed to create ${collectionName} record.`, {
          domain: context.domain,
          code: error?.code || 'CREATE_FAILED',
          meta: { collectionName },
        })
      }
    }, 

    async createWithID(id, payload, options = {}) {
      try {
        const actions = getActions()
          await actions.setById(id, payload, options)
          return { id, ...payload }
        throwUnsupported('create')
      } catch (error) {
        throw normalizeServiceError(error, `Failed to create ${collectionName} record.`, {
          domain: context.domain,
          code: error?.code || 'CREATE_FAILED',
          meta: { collectionName },
        })
      }
    },

    async update(id, payload) {
      if (!id) {
        throw context.createError('Record id is required.', {
          code: 'RECORD_ID_REQUIRED',
          meta: { collectionName },
        })
      }

      try {
        const actions = getActions()
        if (typeof actions.update !== 'function') {
          throwUnsupported('update')
        }

        const result = await actions.update(id, payload)
        return result ?? { id, ...payload }
      } catch (error) {
        throw normalizeServiceError(error, `Failed to update ${collectionName} record.`, {
          domain: context.domain,
          code: error?.code || 'UPDATE_FAILED',
          meta: { collectionName, id },
        })
      }
    },

    async upsert(id, payload) {
      if (!id) {
        throw context.createError('Record id is required.', {
          code: 'RECORD_ID_REQUIRED',
          meta: { collectionName },
        })
      }

      try {
        const actions = getActions()

        if (typeof actions.setById === 'function') {
          await actions.setById(id, payload)
          return { id, ...payload }
        }

        if (typeof actions.upsert === 'function') {
          return await actions.upsert(id, payload)
        }

        if (typeof actions.update === 'function') {
          return await actions.update(id, payload)
        }

        throwUnsupported('upsert')
      } catch (error) {
        throw normalizeServiceError(error, `Failed to upsert ${collectionName} record.`, {
          domain: context.domain,
          code: error?.code || 'UPSERT_FAILED',
          meta: { collectionName, id },
        })
      }
    },

    async remove(id, ...args) {
      if (!id) {
        throw context.createError('Record id is required.', {
          code: 'RECORD_ID_REQUIRED',
          meta: { collectionName },
        })
      }

      try {
        const actions = getActions()

        if (typeof actions.remove === 'function') {
          return await actions.remove(id, ...args)
        }

        if (typeof actions.delete === 'function') {
          return await actions.delete(id, ...args)
        }

        if (typeof actions.removePermanently === 'function') {
          return await actions.removePermanently(id, ...args)
        }

        throwUnsupported('remove')
      } catch (error) {
        throw normalizeServiceError(error, `Failed to remove ${collectionName} record.`, {
          domain: context.domain,
          code: error?.code || 'REMOVE_FAILED',
          meta: { collectionName, id },
        })
      }
    },
  }
}

export default createCollectionAdapter
