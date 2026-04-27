/**
 * @file auth/stores/useTeamAccessStore.js
 * @description Thin Pinia store for the team access administration pages.
 */

import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

export const useTeamAccessStore = defineStore('teamAccessStore', () => {
  const snapshot = ref({ users: [], invites: [], metrics: {} })
  const loading = ref(false)
  const error = ref(null)

  const pendingInvites = computed(() => snapshot.value.invites.filter((item) => item.status === 'pending'))
  const acceptedInvites = computed(() => snapshot.value.invites.filter((item) => item.status === 'accepted'))
  const expiredInvites = computed(() => snapshot.value.invites.filter((item) => item.status === 'expired'))
  const revokedInvites = computed(() => snapshot.value.invites.filter((item) => item.status === 'revoked'))
  const suspendedUsers = computed(() => snapshot.value.users.filter((item) => item.status === 'suspended'))

  /**
   * @param {object} service
   * @returns {Promise<Record<string, any>>}
   */
  async function load(service) {
    loading.value = true
    error.value = null
    try {
      snapshot.value = await service.loadTeamAccessSnapshot()
      return snapshot.value
    } catch (err) {
      error.value = err
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * @param {object} service
   * @param {Record<string, any>} payload
   * @returns {Promise<Record<string, any>>}
   */
  async function createInvite(service, payload) {
    loading.value = true
    error.value = null
    try {
      const created = await service.createInvite(payload)
      await load(service)
      return created
    } catch (err) {
      error.value = err
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * @param {object} service
   * @param {string} inviteId
   * @returns {Promise<void>}
   */
  async function revokeInvite(service, inviteId) {
    await service.revokeInvite(inviteId)
    await load(service)
  }

  /**
   * @param {object} service
   * @param {string} inviteId
   * @param {Date|string|number} expiresAt
   * @returns {Promise<void>}
   */
  async function extendInvite(service, inviteId, expiresAt) {
    await service.extendInvite(inviteId, expiresAt)
    await load(service)
  }

  /**
   * @param {object} service
   * @param {string} user_id 
   * @param {string} reason
   * @returns {Promise<void>}
   */
  async function suspendUser(service, user_id , reason) {
    await service.suspendUser(user_id , reason)
    await load(service)
  }

  /**
   * @param {object} service
   * @param {string} user_id 
   * @returns {Promise<void>}
   */
  async function reactivateUser(service, user_id ) {
    await service.reactivateUser(user_id )
    await load(service)
  }

  return {
    snapshot,
    loading,
    error,
    pendingInvites,
    acceptedInvites,
    expiredInvites,
    revokedInvites,
    suspendedUsers,
    load,
    createInvite,
    revokeInvite,
    extendInvite,
    suspendUser,
    reactivateUser,
  }
})

export default useTeamAccessStore
