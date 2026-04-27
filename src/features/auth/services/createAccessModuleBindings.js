/**
 * @file auth/services/createAccessModuleBindings.js
 * @description Optional root-store bindings for invite access features.
 */

/**
 * Expose invite-access actions through the root app store or another shared facade.
 *
 * @param {{ authAccessService: object, inviteAccessService: object }} params
 * @returns {Record<string, Function>}
 */
export function createAccessModuleBindings({ authAccessService, inviteAccessService }) {
  return {
    validateInviteToken(token) {
      return inviteAccessService.validateInviteToken(token)
    },
    acceptInviteRegistration(payload) {
      return authAccessService.acceptInviteRegistration(payload)
    },
    createInvite(payload) {
      return inviteAccessService.createInvite(payload)
    },
    loadTeamAccessSnapshot() {
      return inviteAccessService.loadTeamAccessSnapshot()
    },
    revokeInvite(inviteId) {
      return inviteAccessService.revokeInvite(inviteId)
    },
    extendInvite(inviteId, expiresAt) {
      return inviteAccessService.extendInvite(inviteId, expiresAt)
    },
    suspendUser(user_id , reason) {
      return inviteAccessService.suspendUser(user_id , reason)
    },
    reactivateUser(user_id ) {
      return inviteAccessService.reactivateUser(user_id )
    },
  }
}

export default createAccessModuleBindings
