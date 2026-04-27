/**
 * @file auth/services/createInviteAccessService.js
 * @description Invite lifecycle and access enforcement service for invite-only onboarding.
 */

import {  
  createUserWithEmailAndPassword,
  sendEmailVerification,
  signOut,
  updateProfile as updateFirebaseProfile,
} from 'firebase/auth'

import { auth } from '@app/firebase'

import { normalizeAuthError } from '../utils/auth.errors.js'
import { resolveAccessProfile } from '../utils/resolve-access-profile.js'
import {
  ACCESS_STATUSES,
  INVITE_STATUSES,
  assertProfileCanAccess,
  createAccessError,
  generateInviteToken,
  hashInviteToken,
  isInviteUsable,
  normalizeEmail,
  resolveInviteExpiry,
} from '../utils/inviteAccess.helpers.js'

import config from '@config/access.config.js'

import {
  createActivityLogger,
  createCollectionAdapter,
  createSequence,
  createServiceContext,
  generateStableId,
  getRecordId,
  asStringArray,
  normalizeDate,
   asNumber,
   asText,
  asMoney,
  withActivityLog,
} from '@core_services/index.js'

/**
 * Stable collection names owned by the AUTH app.
 */
export const AUTH_COLLECTIONS = Object.freeze({
  users: 'users',
  user_invites: 'user_invites',
  roles: 'roles',
  sessions: 'sessions',
  activities: 'activities',
  passwordResetTokens: 'password-reset-tokens',
  notifications: 'notifications',
})

/**
 * @param {unknown} error
 * @param {string} fallbackMessage
 * @param {ReturnType<typeof createServiceContext>} context
 * @returns {Error}
 */
function normalizeInviteAccessError(error, fallbackMessage, context) {
  return context.normalizeError(error, fallbackMessage, {
    code: error?.code || 'INVITE_SERVICE_ERROR',
    domain: 'auth',
  })
}

/**
 * @param {unknown} value
 * @returns {Array<Record<string, any>>}
 */
function normalizeListResult(value) {
  if (Array.isArray(value)) return value
  if (Array.isArray(value?.items)) return value.items
  if (Array.isArray(value?.data)) return value.data
  if (Array.isArray(value?.value?.items)) return value.value.items
  return []
}

/**
 * Build invite/access operations over the `users` and `user_invites` collections.
 *
 * @param {object} params
 * @param {object} [params.store]
 * @param {{ disableAuthUser?: (uid: string) => Promise<any>, enableAuthUser?: (uid: string) => Promise<any> }} [params.serverBridge]
 * @returns {object}
 */
export function createInviteAccessService( store, serverBridge = null ) {


  const context = createServiceContext({
    store,
    domain: 'auth',
  })

  const adapters = Object.freeze(
    Object.fromEntries(
      Object.values(AUTH_COLLECTIONS).map((collectionName) => [
        collectionName,
        createCollectionAdapter({
          context,
          collectionName,
          stateKey: collectionName,
        }),
      ]),
    ),
  )


  const invitePath = config?.invitePath || '/accept-invite'
  const appBaseUrl = String(config?.appBaseUrl || globalThis?.location?.origin || '').replace(/\/$/, '')


  async function createNotification(payload = {}) {
    const notificationsActions = store.notificationsActions

    if (!notificationsActions) return null

    const timestamp = new Date()
    const baseRecord = {
      user_id: String(payload?.user_id || payload?.uid || '').trim(),
      title: payload.title || 'Notification',
      message: payload.message || '',
      event: payload.event || 'auth.event',
      type: payload.type || 'info',
      domain: 'auth',
      sourceModule: 'auth',
      channel: 'in_app',
      status: 'unread',
      priority: payload.priority || 'medium',
      actionUrl: payload.actionUrl || '',
      actionLabel: payload.actionLabel || '',
      isActionRequired: Boolean(payload.isActionRequired),
      entityType: payload.entityType || 'user',
      entityId: payload.entityId || '',
      entityLabel: payload.entityLabel || '',
      roleScope: payload.roleScope || '',
      actorId: store?.currentUser?.uid || '',
      actorName: [store?.currentUser?.firstName, store?.currentUser?.lastName].filter(Boolean).join(' ') || store?.currentUser?.displayName || store?.currentUser?.email || 'System',
      meta: payload.meta || {},
      createdAt: timestamp,
      updatedAt: timestamp,
    }

    if (!baseRecord.user_id ) return null
    console.log(notificationsActions())
    await notificationsActions.add(baseRecord)

    return null
  }

  async function notifyRoleTargets(role, payload = {}) {
    const users = normalizeListResult(await fetchCollection(AUTH_COLLECTIONS.users));
    const targets = users.filter((entry) => {
      const data = entry?.data || entry
      const roles = Array.isArray(data?.roles) ? data.roles : [data?.role].filter(Boolean)
      return data?.status !== ACCESS_STATUSES.SUSPENDED && roles.includes(role)
    })

    await Promise.allSettled(targets.map((entry) => {
      const data = entry?.data || entry
      const uid = data?.uid || entry?.id || entry?.docId || entry?._id || ''
      return createNotification({ ...payload, user_id: uid, roleScope: role })
    }))
  }

  /**
   * @param {string} collectionName
   * @param {Record<string, any>} [params={}]
   * @returns {Promise<any[]>}
   */
  async function fetchCollection(collectionName, params = {}) {
    return adapters[collectionName].list(params)
  }

  /**
   * @param {string} collectionName
   * @param {string} id
   * @returns {Promise<any>}
   */
  async function getById(collectionName, id) {
    return adapters[collectionName].getById(id)
  }

  /**
   * @param {string} collectionName
   * @param {Record<string, any>} payload
   * @returns {Promise<any>}
   */
  async function add(collectionName, payload) {
    return adapters[collectionName].create(payload)
  }

  /**
   * @param {string} collectionName
   * @param {Record<string, any>} payload
   * @returns {Promise<any>}
   */
  async function setWithId(collectionName, id, payload) {
    return adapters[collectionName].createWithID(id, payload)
  }

  /**
   * @param {string} collectionName
   * @param {string} id
   * @param {Record<string, any>} payload
   * @returns {Promise<any>}
   */
  async function update(collectionName, id, payload) {
    return adapters[collectionName].update(id, payload)
  }

  /**
   * @param {string} token
   * @returns {Promise<Record<string, any>|null>}
   */
  async function findInviteByToken(token) {
    const tokenHash = await hashInviteToken(token)
    try { 
      const invites = await getById(AUTH_COLLECTIONS.user_invites, tokenHash) 
      
      return (invites.data.tokenHash === tokenHash) ? invites : null
    } 
    catch (error) { 
      throw normalizeInviteAccessError(error, 'Failed to load user invites.', context) 
    }
  }

  /**
   * @param {string} token
   * @returns {Promise<Record<string, any>>}
   */
  async function validateInviteToken(token) {
    try {
      if (!token) {
        throw createAccessError('auth/invite-invalid', 'An invite token is required.')
      }

      const invite = await findInviteByToken(token)
      if (!invite) {
        throw createAccessError('auth/invite-invalid', 'Invitation not found.')
      }

      if (!isInviteUsable(invite)) {
        throw createAccessError('auth/invite-expired', 'This invitation is no longer valid.')
      }

      return invite
    } catch (error) {
      throw normalizeAuthError(error)
    }
  }

  /**
   * @param {object} payload
   * @param {string} payload.email
   * @param {string} [payload.firstName]
   * @param {string} [payload.lastName]
   * @param {string} [payload.role]
   * @param {string[]} [payload.roles]
   * @param {string[]} [payload.permissions]
   * @param {string} [payload.department]
   * @param {string} [payload.jobTitle]
   * @param {Date|string|number} [payload.expiresAt]
   * @returns {Promise<Record<string, any>>}
   */
  async function createInvite(payload = {}) {
    try {
      const email = normalizeEmail(payload.email)
      if (!email) {
        throw createAccessError('auth/invite-invalid', 'Invite email is required.')
      }

      const timestamp = new Date()
      const token = await generateInviteToken()
      const tokenHash = await hashInviteToken(token)
      const expiresAt = resolveInviteExpiry(payload.expiresAt || config?.defaultInviteTtlMs)
      const inviteId = payload.id || `invite_${Date.now()}`
      /*const role = payload.role || config?.rbac?.defaultRole || 'user'
      const roles = asStringArray(payload.roles?.length ? payload.roles : [role])
      const permissions = asStringArray(payload.permissions)*/

      const resolvedAccess = resolveAccessProfile({
          role: payload.role,
          roles: payload.roles,
          permissions: payload.permissions,
          deniedPermissions: payload.deniedPermissions,
          defaultRole: config?.rbac?.defaultRole || 'user',
        })

      const inviteRecord = {
        email,
        firstName: payload.firstName || '',
        lastName: payload.lastName || '',
        /*role,
        roles,
        permissions,*/
        
        role: resolvedAccess.role,
        roles: resolvedAccess.roles,
        permissions: resolvedAccess.permissionKeys,
        permissionKeys: resolvedAccess.permissionKeys,
        directPermissionKeys: resolvedAccess.directPermissionKeys,
        deniedPermissionKeys: resolvedAccess.deniedPermissionKeys,

        department: payload.department || '',
        jobTitle: payload.jobTitle || '',
        tokenHash,
        status: INVITE_STATUSES.PENDING,
        inviteUrl: `${appBaseUrl}${invitePath}?token=${encodeURIComponent(token)}`,
        expiresAt,
        createdAt: timestamp,
        updatedAt: timestamp,
        invitedBy: store?.currentUser?.uid || '',
      }

      await setWithId(AUTH_COLLECTIONS.user_invites, tokenHash, inviteRecord)

      await Promise.allSettled([
        notifyRoleTargets('admin', {
          title: 'New staff invite created',
          message: `${inviteRecord.firstName || inviteRecord.email} was invited as ${inviteRecord.role}.`,
          event: 'auth.user_invited',
          type: 'info',
          actionUrl: '/admin/team-access',
          actionLabel: 'Open user management',
          entityType: 'user_invite',
          entityId: tokenHash,
          entityLabel: inviteRecord.email,
        }),
        notifyRoleTargets('receptionist', {
          title: 'New staff invite created',
          message: `${inviteRecord.firstName || inviteRecord.email} was invited as ${inviteRecord.role}.`,
          event: 'auth.user_invited',
          type: 'info',
          actionUrl: '/admin/team-access',
          actionLabel: 'Open user management',
          entityType: 'user_invite',
          entityId: tokenHash,
          entityLabel: inviteRecord.email,
        }),
      ])

      return {
        id: inviteId,
        token,
        ...inviteRecord,
      }
    } catch (error) {
      throw normalizeAuthError(error)
    }
  }

  /**
   * @param {{ token?: string, password?: string, profileData?: Record<string, any> }} [payload={}]
   * @returns {Promise<Record<string, any>>}
   */
  async function acceptInviteRegistration({ token, password, profileData = {} } = {}) {
    try {
      const invite = await validateInviteToken(token)
      const email = normalizeEmail(invite.data.email)

      if (!password) {
        throw createAccessError('auth/password-required', 'A password is required to accept the invitation.')
      }

      const credential = await createUserWithEmailAndPassword(auth, email, password)
      const firebaseUser = credential.user
      const timestamp = new Date()
      const displayName = `${profileData.firstName || invite.data.firstName || ''} ${profileData.lastName || invite.data.lastName || ''}`.trim()

      if (displayName) {
        await updateFirebaseProfile(firebaseUser, { displayName })
      }

      const resolvedAccess = resolveAccessProfile({
        role: invite.data?.role || invite.role,
        roles: invite.data?.roles || invite.roles,
        permissions: invite.data?.directPermissionKeys?.length
          ? invite.data.directPermissionKeys
          : invite.data?.permissions || invite.permissions,
        deniedPermissions: invite.data?.deniedPermissionKeys || invite.deniedPermissionKeys,
        defaultRole: config?.rbac?.defaultRole || 'user',
      })

      const profile = {
        uid: firebaseUser.uid,
        email,
        displayName,
        firstName: profileData.firstName || invite.firstName || '',
        lastName: profileData.lastName || invite.lastName || '',
        phoneNumber: profileData.phoneNumber || '',
        photoURL: firebaseUser.photoURL || '',
        
        /*role: invite.role || config?.rbac?.defaultRole || 'user',
        roles: asStringArray(invite.roles?.length ? invite.roles : [invite.role || config?.rbac?.defaultRole || 'user']),
        permissions: asStringArray(invite.permissions),*/

        role: resolvedAccess.role,
        roles: resolvedAccess.roles,
        permissions: resolvedAccess.permissionKeys,
        permissionKeys: resolvedAccess.permissionKeys,
        directPermissionKeys: resolvedAccess.directPermissionKeys,
        deniedPermissionKeys: resolvedAccess.deniedPermissionKeys,
        
        department: invite.department || '',
        jobTitle: invite.jobTitle || '',
        status: ACCESS_STATUSES.ACTIVE,
        emailVerified: firebaseUser.emailVerified,
        inviteId: invite.id || null,
        joinedAt: timestamp,
        lastLoginAt: timestamp,
        createdAt: timestamp,
        updatedAt: timestamp,
        suspendedAt: null,
        suspendedBy: null,
        suspensionReason: '',
      }

      await setWithId(AUTH_COLLECTIONS.users, firebaseUser.uid, profile)

      await update(AUTH_COLLECTIONS.user_invites, invite.id, {
        status: INVITE_STATUSES.ACCEPTED,
        acceptedAt: timestamp,
        acceptedByUid: firebaseUser.uid,
        acceptedEmail: email,
        //updatedAt: timestamp,
      })

      await sendEmailVerification(firebaseUser).catch(() => undefined)

      await Promise.allSettled([
        createNotification({
          user_id: firebaseUser.uid,
          title: 'Account ready',
          message: 'Your EduProLIC account has been created successfully.',
          event: 'auth.account_accepted',
          type: 'success',
          actionUrl: '/account/profile',
          actionLabel: 'Open profile',
          entityId: firebaseUser.uid,
          entityLabel: profile.displayName || profile.email,
        }),
        notifyRoleTargets('admin', {
          title: 'New user joined',
          message: `${profile.displayName || profile.email} accepted an invitation.`,
          event: 'auth.user_joined',
          type: 'success',
          actionUrl: '/admin/team-access',
          actionLabel: 'Open user management',
          entityId: firebaseUser.uid,
          entityLabel: profile.displayName || profile.email,
        }),
        notifyRoleTargets('receptionist', {
          title: 'New user joined',
          message: `${profile.displayName || profile.email} accepted an invitation.`,
          event: 'auth.user_joined',
          type: 'success',
          actionUrl: '/admin/team-access',
          actionLabel: 'Open user management',
          entityId: firebaseUser.uid,
          entityLabel: profile.displayName || profile.email,
        }),
      ])
      return profile
    } catch (error) {
      throw normalizeAuthError(error)
    }
  }

  /**
   * @param {string} inviteId
   * @returns {Promise<void>}
   */
  async function revokeInvite(inviteId) {
    try {
      const timestamp = new Date()
      await update( AUTH_COLLECTIONS.user_invites, inviteId, {
        status: INVITE_STATUSES.REVOKED,
        revokedAt: timestamp,
        revokedBy: store?.currentUser?.uid || '',
      })
    } catch (error) {
      throw normalizeAuthError(error)
    }
  }

  /**
   * @param {string} inviteId
   * @param {Date|string|number} expiresAt
   * @returns {Promise<void>}
   */
  async function extendInvite(inviteId, expiresAt) {
    try {
      await update( AUTH_COLLECTIONS.user_invites, inviteId, {
        expiresAt: new Date(expiresAt),
        //updatedAt: new Date(),
      })
    } catch (error) {
      throw normalizeAuthError(error)
    }
  }

  /**
   * @param {string} userId
   * @param {string} [reason='']
   * @returns {Promise<void>}
   */
  async function suspendUser(user_id , reason = '') {
    try {
      const timestamp = new Date()
      await update(AUTH_COLLECTIONS.users, user_id, {
        status: ACCESS_STATUSES.SUSPENDED,
        suspendedAt: timestamp,
        suspendedBy: store.currentUser?.uid || '',
        suspensionReason: reason || 'Suspended by administrator.',
        //updatedAt: timestamp,
      })

      if (typeof serverBridge?.disableAuthUser === 'function') {
        await serverBridge.disableAuthUser(user_id )
      }

      await Promise.allSettled([
        createNotification({
          user_id,
          title: 'Access suspended',
          message: reason || 'Your EduProLIC account access has been suspended.',
          event: 'auth.user_suspended',
          type: 'warning',
          actionUrl: '/account/profile',
          actionLabel: 'Review account',
          isActionRequired: true,
          entityId: user_id,
        }),
        notifyRoleTargets('admin', {
          title: 'User suspended',
          message: `A user account was suspended.`,
          event: 'auth.user_suspended',
          type: 'warning',
          actionUrl: '/admin/team-access',
          actionLabel: 'Open user management',
          entityId: user_id,
        }),
      ])
    } catch (error) {
      throw normalizeAuthError(error)
    }
  }

  /**
   * @param {string} userId
   * @returns {Promise<void>}
   */
  async function reactivateUser(user_id ) {
    try {
      const timestamp = new Date()
      await update(AUTH_COLLECTIONS.users, user_id, {
        status: ACCESS_STATUSES.ACTIVE,
        suspendedAt: null,
        suspendedBy: null,
        suspensionReason: '',
        updatedAt: timestamp,
      })

      if (typeof serverBridge?.enableAuthUser === 'function') {
        await serverBridge.enableAuthUser(user_id )
      }

      await Promise.allSettled([
        createNotification({
          user_id,
          title: 'Access restored',
          message: 'Your EduProLIC account access has been restored.',
          event: 'auth.user_reactivated',
          type: 'success',
          actionUrl: '/account/profile',
          actionLabel: 'Open profile',
          entityId: user_id,
        }),
        notifyRoleTargets('admin', {
          title: 'User reactivated',
          message: `A user account was restored.`,
          event: 'auth.user_reactivated',
          type: 'success',
          actionUrl: '/admin/team-access',
          actionLabel: 'Open user management',
          entityId: user_id,
        }),
      ])
    } catch (error) {
      throw normalizeAuthError(error)
    }
  }

  /**
   * @param {{ uid?: string }|null|undefined} firebaseUser
   * @returns {Promise<Record<string, any>>}
   */
  async function assertUserCanAccess(firebaseUser) {
    try {
      if (!firebaseUser?.uid) {
        throw createAccessError('auth/no-session', 'An authenticated session is required.')
      }

      const profile = await getById(AUTH_COLLECTIONS.users, firebaseUser.uid)
      assertProfileCanAccess(profile)
      return profile
    } catch (error) {
      throw normalizeAuthError(error)
    }
  }

  /**
   * @param {{ uid?: string }|null|undefined} firebaseUser
   * @returns {Promise<boolean>}
   */
  async function forceLogoutIfBlocked(firebaseUser) {
    try {
      await assertUserCanAccess(firebaseUser)
      return false
    } catch (error) {
      await signOut(auth).catch(() => undefined)
      store?.clearAccessState?.()
      throw normalizeAuthError(error)
    }
  }

  /**
   * @returns {Promise<{ users: Array<Record<string, any>>, invites: Array<Record<string, any>>, metrics: Record<string, number> }>}
   */
  async function loadTeamAccessSnapshot() {
    try {
      const [users, invites] = await Promise.all([
        fetchCollection(AUTH_COLLECTIONS.users),
        fetchCollection(AUTH_COLLECTIONS.user_invites)
      ])
      

      const now = Date.now()
      const hydratedInvites = invites.map((invite) => {
        if (invite.status === INVITE_STATUSES.PENDING && new Date(invite.expiresAt || 0).getTime() <= now) {
          return { ...invite, status: INVITE_STATUSES.EXPIRED }
        }
        return invite
      })
      return {
        users,
        invites: hydratedInvites,
        metrics: {
          pendingInvites: hydratedInvites.filter((invite) => invite.status === INVITE_STATUSES.PENDING).length,
          acceptedInvites: hydratedInvites.filter((invite) => invite.status === INVITE_STATUSES.ACCEPTED).length,
          expiredInvites: hydratedInvites.filter((invite) => invite.status === INVITE_STATUSES.EXPIRED).length,
          suspendedUsers: users.filter((user) => user.status === ACCESS_STATUSES.SUSPENDED).length,
        },
      }
    } catch (error) {
      throw normalizeAuthError(error)
    }
  }

  return {
    createInvite,
    validateInviteToken,
    acceptInviteRegistration,
    revokeInvite,
    extendInvite,
    suspendUser,
    reactivateUser,
    assertUserCanAccess,
    forceLogoutIfBlocked,
    loadTeamAccessSnapshot,
  }
}

export default createInviteAccessService
