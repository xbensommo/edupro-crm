/**
 * @file src/features/auth/utils/auth.errors.js
 * @description Shared auth feature error helpers.
 */

export class AuthFeatureError extends Error {
  /**
   * @param {string} message
   * @param {{ code?: string, cause?: unknown, meta?: any, kind?: string }} [options]
   */
  constructor(message, options = {}) {
    super(message)
    this.name = 'AuthFeatureError'
    this.code = options.code || 'AUTH_FEATURE_ERROR'
    this.kind = options.kind || 'UNKNOWN_ERROR'
    this.cause = options.cause
    this.meta = options.meta || null
  }
}

const AUTH_ERROR_MAP = {
  'auth/invalid-email': {
    kind: 'INVALID_EMAIL',
    message: 'Please enter a valid email address.',
  },
  'auth/user-disabled': {
    kind: 'ACCOUNT_DISABLED',
    message: 'This account has been disabled. Please contact support.',
  },
  'auth/user-not-found': {
    kind: 'INVALID_CREDENTIALS',
    message: 'Invalid email or password.',
  },
  'auth/wrong-password': {
    kind: 'INVALID_CREDENTIALS',
    message: 'Invalid email or password.',
  },
  'auth/invalid-credential': {
    kind: 'INVALID_CREDENTIALS',
    message: 'Invalid email or password.',
  },
  'auth/email-already-in-use': {
    kind: 'EMAIL_ALREADY_IN_USE',
    message: 'An account with this email already exists.',
  },
  'auth/weak-password': {
    kind: 'WEAK_PASSWORD',
    message: 'Your password is too weak. Use a stronger password.',
  },
  'auth/too-many-requests': {
    kind: 'TOO_MANY_ATTEMPTS',
    message: 'Too many attempts. Please wait a moment and try again.',
  },
  'auth/network-request-failed': {
    kind: 'NETWORK_ERROR',
    message: 'Unable to connect right now. Please check your internet and try again.',
  },
  'auth/popup-closed-by-user': {
    kind: 'POPUP_CLOSED',
    message: 'The sign-in popup was closed before completion.',
  },
  'auth/cancelled-popup-request': {
    kind: 'POPUP_CANCELLED',
    message: 'The sign-in popup request was cancelled.',
  },
  'auth/operation-not-allowed': {
    kind: 'OPERATION_NOT_ALLOWED',
    message: 'This sign-in method is not enabled right now.',
  },
  'auth/account-exists-with-different-credential': {
    kind: 'ACCOUNT_EXISTS',
    message: 'An account already exists with a different sign-in method.',
  },
  'auth/invite-required': {
    kind: 'INVITE_REQUIRED',
    message: 'Open registration is disabled. Use your invitation link to activate your account.',
  },
  'auth/invite-not-found': {
    kind: 'INVITE_NOT_FOUND',
    message: 'This invitation could not be found.',
  },
  'auth/invite-expired': {
    kind: 'INVITE_EXPIRED',
    message: 'This invitation has expired.',
  },
  'auth/invite-unavailable': {
    kind: 'INVITE_UNAVAILABLE',
    message: 'This invitation is no longer available.',
  },
  'auth/invite-email-required': {
    kind: 'INVITE_EMAIL_REQUIRED',
    message: 'An email address is required to create an invitation.',
  },
  'auth/invite-already-pending': {
    kind: 'INVITE_ALREADY_PENDING',
    message: 'This email already has a pending invitation.',
  },
  'auth/invalid-invite-token': {
    kind: 'INVALID_INVITE_TOKEN',
    message: 'The invitation token is invalid.',
  },
  'auth/profile-missing': {
    kind: 'PROFILE_MISSING',
    message: 'Your user profile was not found. Contact an administrator.',
  },
  'auth/account-suspended': {
    kind: 'ACCOUNT_SUSPENDED',
    message: 'Your account has been suspended. Contact an administrator.',
  },
  'auth/account-disabled': {
    kind: 'ACCOUNT_DISABLED',
    message: 'Your account has been disabled. Contact an administrator.',
  },
  'auth/access-denied': {
    kind: 'ACCESS_DENIED',
    message: 'Your account is not active yet. Contact an administrator.',
  },
}

/**
 * Normalize any auth-related error into a consistent feature-safe shape.
 *
 * @param {unknown} error
 * @returns {AuthFeatureError}
 */
export function normalizeAuthError(error) {
  if (error instanceof AuthFeatureError) {
    return error
  }

  const code = error?.code || 'AUTH_UNKNOWN'
  const mapped = AUTH_ERROR_MAP[code]

  return new AuthFeatureError(mapped?.message || error?.message || 'Authentication failed. Please try again.', {
    code,
    kind: mapped?.kind || 'UNKNOWN_ERROR',
    cause: error,
    meta: error?.meta || null,
  })
}
