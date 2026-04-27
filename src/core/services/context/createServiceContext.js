/**
 * @file src/core/services/context/createServiceContext.js
 * @description Shared composition context for Totistack feature and app services.
 */

import { buildCreatedAuditFields, buildUpdatedAuditFields } from '../audit/audit.fields.js'
import { createServiceError } from '../errors/ServiceError.js'
import { normalizeServiceError } from '../errors/normalizeServiceError.js'
import {
  normalizeCollectionState,
  unwrapValue,
} from '../normalizers/value.normalizers.js'

/**
 * Resolve collection actions from the root store.
 *
 * @param {Record<string, any>} store
 * @param {string} collectionName
 * @returns {Record<string, Function>|null}
 */
export function resolveStoreCollectionActions(store, collectionName) {
  if (!store || !collectionName) return null

  return (
    store.getCollectionActions?.(collectionName) ||
    store?.[`${collectionName}Actions`] ||
    store?.collectionsActions?.[collectionName] ||
    null
  )
}

/**
 * Create a reusable service context.
 *
 * The context stays composition-first. It never extends the root store.
 * It only standardizes the repeated runtime concerns that every service needs.
 *
 * @param {object} [options={}]
 * @param {Record<string, any>|null} [options.store=null]
 * @param {{ can?: (permission: string) => boolean }|null} [options.access=null]
 * @param {() => Date} [options.now]
 * @param {string} [options.domain='service']
 * @returns {object}
 */
export function createServiceContext({
  store = null,
  access = null,
  now = () => new Date(),
  domain = 'service',
} = {}) {
  /**
   * @returns {Record<string, any>}
   */
  function requireStore() {
    if (!store) {
      throw createServiceError('Root app store is required.', {
        code: 'STORE_REQUIRED',
        domain,
      })
    }

    return store
  }

  /**
   * @returns {Date}
   */
  function getNow() {
    return now()
  }

  /**
   * @returns {any|null}
   */
  function getCurrentUser() {
    const appStore = requireStore()
    return unwrapValue(appStore.currentUser) || null
  }

  /**
   * @returns {string}
   */
  function getCurrentUserId() {
    return getCurrentUser()?.uid || ''
  }

  /**
   * @returns {string}
   */
  function getCurrentUserEmail() {
    return getCurrentUser()?.email || ''
  }

  /**
   * @returns {boolean}
   */
  function isAuthenticated() {
    return Boolean(getCurrentUserId())
  }

  /**
   * @param {string} [message='Authentication required.']
   * @returns {any}
   */
  function requireAuthenticated(message = 'Authentication required.') {
    const currentUser = getCurrentUser()
    if (!currentUser?.uid) {
      throw createServiceError(message, {
        code: 'AUTH_REQUIRED',
        domain,
      })
    }

    return currentUser
  }

  /**
   * @param {string} permission
   * @returns {boolean}
   */
  function hasPermission(permission) {
    if (!permission) return true

    if (access && typeof access.can === 'function') {
      return Boolean(access.can(permission))
    }

    const appStore = requireStore()
    const rbacEnabled = Boolean(unwrapValue(appStore.rbacEnabled))
    if (!rbacEnabled) return true
    if (typeof appStore.hasPermission !== 'function') return true
    return Boolean(appStore.hasPermission(permission))
  }

  /**
   * @param {string} permission
   * @param {object} [options={}]
   * @param {string} [options.message]
   * @param {string} [options.code='FORBIDDEN']
   * @returns {void}
   */
  function assertPermission(permission, options = {}) {
    if (hasPermission(permission)) return

     createServiceError(
      options.message || `Access denied for permission "${permission}".`,
      {
        code: options.code || 'FORBIDDEN',
        domain,
        meta: { permission },
      },
    )
  }

  /**
   * Resolve collection actions from the root store.
   *
   * @param {string} collectionName
   * @returns {Record<string, Function>}
   */
  function getCollectionActions(collectionName) {
    const appStore = requireStore()
    const actions = resolveStoreCollectionActions(appStore, collectionName)

    if (!actions || typeof actions !== 'object') {
      throw createServiceError(
        `Collection actions for "${collectionName}" are not available on the root store.`,
        {
          code: 'COLLECTION_ACTIONS_UNAVAILABLE',
          domain,
          meta: { collectionName },
        },
      )
    }

    return actions
  }

  /**
   * @param {string} collectionName
   * @returns {boolean}
   */
  function hasCollectionActions(collectionName) {
    const appStore = requireStore()
    return Boolean(resolveStoreCollectionActions(appStore, collectionName))
  }

  /**
   * Safely read collection state.
   *
   * @param {string} collectionName
   * @returns {{ items: any[], hasMore: boolean, raw: any }}
   */
  function getCollectionState(collectionName) {
    const appStore = requireStore()
    return normalizeCollectionState(appStore?.[collectionName])
  }

  /**
   * @param {object} [options={}]
   * @returns {{ createdAt: Date, createdBy: string|null, updatedAt?: Date, updatedBy?: string|null }}
   */
  function buildCreatedAudit(options = {}) {
    return buildCreatedAuditFields({
      now,
      user_id: options.user_id  ?? (getCurrentUserId() || null),
      includeUpdatedAt: Boolean(options.includeUpdatedAt),
    })
  }

  /**
   * @param {object} [options={}]
   * @returns {{ updatedAt: Date, updatedBy: string|null }}
   */
  function buildUpdatedAudit(options = {}) {
    return buildUpdatedAuditFields({
      now,
      user_id: options.user_id  ?? (getCurrentUserId() || null),
    })
  }

  return {
    domain,
    now,
    requireStore,
    getStore: requireStore,
    getNow,
    getCurrentUser,
    getCurrentUserId,
    getCurrentUserEmail,
    isAuthenticated,
    requireAuthenticated,
    hasPermission,
    assertPermission,
    getCollectionActions,
    hasCollectionActions,
    getCollectionState,
    buildCreatedAudit,
    buildUpdatedAudit,
    createError(message, options = {}) {
      return createServiceError(message, {
        ...options,
        domain: options.domain || domain,
      })
    },
    normalizeError(error, fallbackMessage, options = {}) {
      return normalizeServiceError(error, fallbackMessage, {
        ...options,
        domain: options.domain || domain,
      })
    },
  }
}

export default createServiceContext
