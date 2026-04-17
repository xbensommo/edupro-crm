/**
 * @file auth/services/create-auth-access-service.js
 * @description Auth access service with invite-only registration and suspended-user enforcement.
 */

import {
  EmailAuthProvider,
  FacebookAuthProvider,
  GithubAuthProvider,
  GoogleAuthProvider,
  OAuthProvider,
  browserLocalPersistence,
  confirmPasswordReset,
  onAuthStateChanged,
  reauthenticateWithCredential,
  sendEmailVerification,
  sendPasswordResetEmail,
  setPersistence,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updatePassword,
  updateProfile as updateFirebaseProfile,
} from 'firebase/auth'
import { createShardedActions } from '@xbensommo/shard-provider'
import { normalizeAuthError } from '../utils/auth.errors.js'

import {
  assertProfileCanAccess,
  createAccessError,
  normalizeEmail,
} from '../utils/inviteAccess.helpers.js'

import { resolveAccessProfile } from '../utils/resolve-access-profile.js'

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
 * Create a provider instance for popup-based social auth.
 *
 * @param {string} providerName
 * @returns {GoogleAuthProvider|GithubAuthProvider|FacebookAuthProvider|OAuthProvider}
 */
function createProvider(providerName) {
  switch ((providerName || '').toLowerCase()) {
    case 'google':
      return new GoogleAuthProvider()
    case 'github':
      return new GithubAuthProvider()
    case 'facebook':
      return new FacebookAuthProvider()
    case 'microsoft':
      return new OAuthProvider('microsoft.com')
    default:
      throw new Error(`Unsupported provider: ${providerName}`)
  }
}

/**
 * Convert roles into boolean claims.
 *
 * @param {string[]} [roles=[]]
 * @returns {Record<string, boolean>}
 */
function buildClaims(roles = []) {
  return roles.reduce((claims, role) => {
    claims[role] = true
    return claims
  }, {})
}

/**
 * @param {unknown} error
 * @returns {boolean}
 */
function isNotFoundError(error) {
  const code = String(error?.code || '').toUpperCase()
  const message = String(error?.message || '').toLowerCase()
  return code === 'NOT_FOUND' || code === 'AUTH/USER-NOT-FOUND' || message.includes('not found')
}

/**
 * Build the merged profile shape used for access-state synchronization.
 *
 * @param {Record<string, any>} firebaseUser
 * @param {Record<string, any>|null} existing
 * @param {Record<string, any>} [profileData={}]
 * @param {Record<string, any>} [config={}]
 * @returns {Record<string, any>}
 */

function buildProfileSnapshot(firebaseUser, existing, profileData = {}, config = {}) {
  const existingData = existing?.data || {}
  const fallbackRole = config?.rbac?.defaultRole || 'user'

  const resolvedAccess = resolveAccessProfile({
    role: existingData.role || profileData.role,
    roles: existingData.roles?.length ? existingData.roles : profileData.roles,
    permissions: existingData.directPermissionKeys?.length
      ? existingData.directPermissionKeys
      : existingData.permissions?.length
        ? existingData.permissions
        : profileData.permissions,
    deniedPermissions: existingData.deniedPermissionKeys || profileData.deniedPermissionKeys,
    defaultRole: fallbackRole,
  })

  return {
    uid: firebaseUser.uid,
    email: normalizeEmail(firebaseUser.email),
    displayName: profileData.displayName || firebaseUser.displayName || existingData.displayName || '',
    firstName: profileData.firstName || existingData.firstName || '',
    lastName: profileData.lastName || existingData.lastName || '',
    photoURL: firebaseUser.photoURL || existingData.photoURL || '',
    phoneNumber: profileData.phoneNumber || existingData.phoneNumber || '',
    role: resolvedAccess.role,
    roles: resolvedAccess.roles,
    permissions: resolvedAccess.permissionKeys,
    permissionKeys: resolvedAccess.permissionKeys,
    directPermissionKeys: resolvedAccess.directPermissionKeys,
    deniedPermissionKeys: resolvedAccess.deniedPermissionKeys,
    status: existingData.status || profileData.status || 'pending',
    emailVerified: firebaseUser.emailVerified,
    department: existingData.department || profileData.department || '',
    jobTitle: existingData.jobTitle || profileData.jobTitle || '',
    inviteId: existingData.inviteId || profileData.inviteId || null,
    createdAt: existingData.createdAt || profileData.createdAt || null,
    joinedAt: existingData.joinedAt || profileData.joinedAt || null,
    lastLoginAt: profileData.lastLoginAt || existingData.lastLoginAt || null,
    suspendedAt: existingData.suspendedAt || null,
    suspendedBy: existingData.suspendedBy || null,
    suspensionReason: existingData.suspensionReason || '',
  }
}

/**
 * Resolve the users collection actions.
 *
 * @param {object} options
 * @param {string} options.userCollectionName
 * @param {(collectionName: string) => object} [options.collectionActions]
 * @param {object} options.state
 * @param {object} options.shardProvider
 * @returns {object}
 */
function resolveUsersActions({ userCollectionName, collectionActions, state, shardProvider }) {
  const resolved = typeof collectionActions === 'function'
    ? collectionActions(userCollectionName)
    : null

  return resolved || createShardedActions(userCollectionName, state, shardProvider)
}

/**
 * Build the auth access service used by the root access runtime.
 *
 * @param {object} params
 * @param {import('firebase/auth').Auth} params.auth
 * @param {object} params.state
 * @param {object} params.shardProvider
 * @param {(collectionName: string) => object} [params.collectionActions]
 * @param {Record<string, any>} [params.config]
 * @param {{ resolveAccessContext?: Function }} [params.accessControl]
 * @param {{ clearAccessState: Function, syncAccessState: Function, setError: Function, setAuthInitialized: Function }} params.storeApi
 * @param {object} [params.inviteAccessService]
 * @returns {object}
 */
export function createAuthAccessService({
  auth,
  state,
  shardProvider,
  collectionActions,
  config = {},
  accessControl,
  storeApi,
  inviteAccessService,
}) {
  const userCollectionName = config?.profileCollection || 'users'
  const usersActions = resolveUsersActions({
    userCollectionName,
    collectionActions,
    state,
    shardProvider,
  })

  let initialized = false
  let initializePromise = null

  /**
   * @param {Record<string, any>} firebaseUser
   * @returns {Promise<Record<string, any>|null>}
   */
  async function getExistingProfile(firebaseUser) {
    try {
      return await usersActions.getById(firebaseUser.uid)
    } catch (error) {
      if (isNotFoundError(error)) {
        return null
      }
      throw error
    }
  }

  /**
   * @param {Record<string, any>} firebaseUser
   * @param {Record<string, any>} [profileData={}]
   * @returns {Promise<Record<string, any>>}
   */
  async function ensureUserProfile(firebaseUser, profileData = {}) {
    const existing = await getExistingProfile(firebaseUser)
    return buildProfileSnapshot(firebaseUser, existing, profileData, config)
  }

  /**
   * Open registration is disabled. Profiles must come from invite redemption.
   *
   * @param {Record<string, any>} firebaseUser
   * @param {Record<string, any>} [profileData={}]
   * @returns {Promise<Record<string, any>>}
   */
  async function createUserProfileIfMissing(firebaseUser, profileData = {}) {
    const existing = await getExistingProfile(firebaseUser)

    if (existing) {
      return buildProfileSnapshot(firebaseUser, existing, profileData, config)
    }

    throw createAccessError(
      'auth/invite-required',
      'Open registration is disabled. Use your invitation link to create an account.',
    )
  }

  /**
   * @param {Record<string, any>|null} firebaseUser
   * @returns {Promise<Record<string, any>|null>}
   */
  async function syncAuthenticatedUser(firebaseUser) {
    if (!firebaseUser) {
      state._profileCache.value = { uid: null, timestamp: 0, data: null }
      storeApi.clearAccessState()
      return null
    }

    const cached = state._profileCache.value
    const cacheAge = Date.now() - (cached?.timestamp || 0)
    if (cached?.uid === firebaseUser.uid && cacheAge < (config?.cacheTtlMs || 0) && cached?.data) {
      storeApi.syncAccessState(cached.data)
      return cached.data
    }

    const profile = await ensureUserProfile(firebaseUser, { lastLoginAt: new Date() })
    assertProfileCanAccess(profile)

    const accessContext = accessControl?.resolveAccessContext
      ? await accessControl.resolveAccessContext({ firebaseUser, profile })
      : {
          roles: Array.isArray(profile.roles) ? profile.roles : [profile.role || 'user'],
          permissions: Array.isArray(profile.permissions) ? profile.permissions : [],
          claims: buildClaims(Array.isArray(profile.roles) ? profile.roles : [profile.role || 'user']),
        }

    const userData = {
      uid: firebaseUser.uid,
      email: firebaseUser.email,
      emailVerified: firebaseUser.emailVerified,
      displayName: profile.displayName || firebaseUser.displayName || '',
      photoURL: firebaseUser.photoURL || profile.photoURL || '',
      ...profile,
      roles: accessContext.roles,
      permissions: accessContext.permissions,
      claims: accessContext.claims,
    }

    state._profileCache.value = {
      uid: firebaseUser.uid,
      timestamp: Date.now(),
      data: userData,
    }

    await usersActions.update(firebaseUser.uid, {
      lastLoginAt: new Date(),
      //updatedAt: new Date(),
    }).catch(() => undefined)

    storeApi.syncAccessState(userData)
    return userData
  }

  /**
   * @returns {Promise<any>}
   */
  async function initialize() {
    if (initializePromise) {
      return initializePromise
    }

    state.authStatus.value = 'syncing'
    initializePromise = new Promise((resolve) => {
      state._sessionStart.value = Date.now()
      state._authUnsubscribe.value = onAuthStateChanged(auth, async (firebaseUser) => {
        try {
          if (firebaseUser) {
            await syncAuthenticatedUser(firebaseUser)
          } else {
            storeApi.clearAccessState()
          }
        } catch (error) {
          await signOut(auth).catch(() => undefined)
          storeApi.clearAccessState()
          storeApi.setError(normalizeAuthError(error))
        } finally {
          initialized = true
          storeApi.setAuthInitialized(true)
          resolve(firebaseUser)
        }
      })
    })

    return initializePromise
  }

  /**
   * @param {string} email
   * @param {string} password
   * @returns {Promise<Record<string, any>>}
   */
  async function login(email, password) {
    try {
      await setPersistence(auth, browserLocalPersistence)
      const credential = await signInWithEmailAndPassword(auth, email, password)
      return syncAuthenticatedUser(credential.user)
    } catch (error) {
      throw normalizeAuthError(error)
    }
  }

  /**
   * Public sign-up is intentionally disabled for invite-only onboarding.
   *
   * @returns {Promise<never>}
   */
  async function signUp() {
    throw normalizeAuthError(
      createAccessError(
        'auth/invite-required',
        'Open registration is disabled. Use your invitation link to create an account.',
      ),
    )
  }

  /**
   * @param {{ token?: string, password?: string, profileData?: Record<string, any> }} [payload={}]
   * @returns {Promise<Record<string, any>>}
   */
  async function acceptInviteRegistration({ token, password, profileData = {} } = {}) {
    try {
      if (!inviteAccessService?.acceptInviteRegistration) {
        throw createAccessError('auth/invite-required', 'Invite registration is not configured.')
      }

      await setPersistence(auth, browserLocalPersistence)
      const profile = await inviteAccessService.acceptInviteRegistration({ token, password, profileData })
      return syncAuthenticatedUser(auth.currentUser || { uid: profile.uid, email: profile.email })
    } catch (error) {
      throw normalizeAuthError(error)
    }
  }

  /**
   * @returns {Promise<void>}
   */
  async function logout() {
    try {
      state._profileCache.value = { uid: null, timestamp: 0, data: null }
      await signOut(auth)
      storeApi.clearAccessState()
    } catch (error) {
      throw normalizeAuthError(error)
    }
  }

  /**
   * @param {string} email
   * @returns {Promise<void>}
   */
  async function sendPasswordReset(email) {
    try {
      await sendPasswordResetEmail(auth, email)
    } catch (error) {
      throw normalizeAuthError(error)
    }
  }

  /**
   * @param {string} code
   * @param {string} newPassword
   * @returns {Promise<void>}
   */
  async function resetPassword(code, newPassword) {
    try {
      await confirmPasswordReset(auth, code, newPassword)
    } catch (error) {
      throw normalizeAuthError(error)
    }
  }

  /**
   * @param {Record<string, any>} [profileData={}]
   * @returns {Promise<Record<string, any>>}
   */
  async function updateProfile(profileData = {}) {
    try {
      if (!auth.currentUser) {
        throw new Error('No active session.')
      }

      if (profileData.displayName) {
        await updateFirebaseProfile(auth.currentUser, {
          displayName: profileData.displayName,
        })
      }

      await usersActions.update(auth.currentUser.uid, {
        ...profileData,
        updatedAt: new Date(),
      })

      state._profileCache.value = { uid: null, timestamp: 0, data: null }
      return syncAuthenticatedUser(auth.currentUser)
    } catch (error) {
      throw normalizeAuthError(error)
    }
  }

  /**
   * @param {string} currentPassword
   * @param {string} newPassword
   * @returns {Promise<void>}
   */
  async function changePassword(currentPassword, newPassword) {
    try {
      if (!auth.currentUser?.email) {
        throw new Error('An active session is required to change password.')
      }

      const credential = EmailAuthProvider.credential(auth.currentUser.email, currentPassword)
      await reauthenticateWithCredential(auth.currentUser, credential)
      await updatePassword(auth.currentUser, newPassword)
    } catch (error) {
      throw normalizeAuthError(error)
    }
  }

  /**
   * Social login remains allowed only for existing invited profiles.
   * It must not create a profile automatically.
   *
   * @param {string} providerName
   * @returns {Promise<Record<string, any>>}
   */
  async function loginWithSocial(providerName) {
    try {
      await setPersistence(auth, browserLocalPersistence)
      const provider = createProvider(providerName)
      const result = await signInWithPopup(auth, provider)
      const existingProfile = await getExistingProfile(result.user)

      if (!existingProfile) {
        await signOut(auth).catch(() => undefined)
        throw createAccessError(
          'auth/invite-required',
          'Social sign-up is disabled. Ask an administrator for an invitation.',
        )
      }

      assertProfileCanAccess(existingProfile)
      return syncAuthenticatedUser(result.user)
    } catch (error) {
      throw normalizeAuthError(error)
    }
  }

  /**
   * @returns {Promise<void>}
   */
  async function resendVerificationEmail() {
    try {
      if (!auth.currentUser) {
        throw new Error('No active session.')
      }
      await sendEmailVerification(auth.currentUser)
    } catch (error) {
      throw normalizeAuthError(error)
    }
  }

  /**
   * @returns {Promise<Record<string, boolean>>}
   */
  async function refreshUserClaims() {
    if (!auth.currentUser) {
      return {}
    }

    const user = await syncAuthenticatedUser(auth.currentUser)
    return user?.claims || {}
  }

  return {
    initialize,
    login,
    signUp,
    acceptInviteRegistration,
    logout,
    sendPasswordReset,
    resetPassword,
    updateProfile,
    changePassword,
    loginWithSocial,
    resendVerificationEmail,
    refreshUserClaims,
    syncAuthenticatedUser,
    ensureUserProfile,
    createUserProfileIfMissing,
    get initialized() {
      return initialized
    },
  }
}

export default createAuthAccessService
