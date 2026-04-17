/**
 * @file auth/utils/inviteAccess.helpers.js
 * @description Pure helpers for invite-only onboarding, invitation lifecycle,
 * and profile access enforcement.
 */

/**
 * Canonical user access states used by the auth feature.
 *
 * @type {Readonly<{ACTIVE: string, PENDING_INVITE: string, SUSPENDED: string, DISABLED: string}>}
 */
export const ACCESS_STATUSES = Object.freeze({
  ACTIVE: 'active',
  PENDING_INVITE: 'pending_invite',
  SUSPENDED: 'suspended',
  DISABLED: 'disabled',
})

/**
 * Canonical invitation states used by the auth feature.
 *
 * @type {Readonly<{PENDING: string, ACCEPTED: string, REVOKED: string, EXPIRED: string}>}
 */
export const INVITE_STATUSES = Object.freeze({
  PENDING: 'pending',
  ACCEPTED: 'accepted',
  REVOKED: 'revoked',
  EXPIRED: 'expired',
})

/**
 * Normalize an email address for comparisons.
 *
 * @param {string} email
 * @returns {string}
 */
export function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase()
}

/**
 * Normalize a scalar or array into a unique array of trimmed strings.
 *
 * @param {string|string[]|null|undefined} value
 * @returns {string[]}
 */
export function asStringArray(value) {
  const values = Array.isArray(value) ? value : [value]
  return [...new Set(values.map((item) => String(item || '').trim()).filter(Boolean))]
}

/**
 * Build a stable feature error object with a code and optional metadata.
 *
 * @param {string} code
 * @param {string} message
 * @param {Record<string, any>} [meta={}]
 * @returns {Error & { code: string, meta: Record<string, any> }}
 */
export function createAccessError(code, message, meta = {}) {
  const error = new Error(message)
  error.code = code
  error.meta = meta
  return error
}

/**
 * Generate a raw invite token for URL distribution.
 *
 * @returns {string}
 */
export function generateInviteToken() {
  const bytes = globalThis.crypto?.getRandomValues
    ? globalThis.crypto.getRandomValues(new Uint8Array(32))
    : Array.from({ length: 32 }, () => Math.floor(Math.random() * 256))

  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('')
}

/**
 * Hash an invite token for safe storage.
 *
 * Falls back to returning the raw normalized token when SubtleCrypto is not
 * available. That keeps local tests and non-browser runtimes functional.
 *
 * @param {string} token
 * @returns {Promise<string>}
 */
export async function hashInviteToken(token) {
  const normalized = String(token || '').trim()

  if (!normalized) {
    throw createAccessError('auth/invalid-invite-token', 'The invitation token is invalid.')
  }

  if (globalThis.crypto?.subtle) {
    const encoded = new TextEncoder().encode(normalized)
    const digest = await globalThis.crypto.subtle.digest('SHA-256', encoded)
    return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('')
  }

  return normalized
}

/**
 * Resolve an invite expiry date from a preset.
 *
 * @param {string} [preset='72h']
 * @param {Date} [now=new Date()]
 * @returns {Date}
 */
export function resolveInviteExpiry(preset = '72h', now = new Date()) {
  const base = new Date(now)
  const hoursByPreset = {
    '24h': 24,
    '48h': 48,
    '72h': 72,
    '7d': 24 * 7,
    '14d': 24 * 14,
  }

  base.setHours(base.getHours() + (hoursByPreset[preset] || hoursByPreset['72h']))
  return base
}

/**
 * Determine whether an invite is still redeemable.
 *
 * @param {Record<string, any>|null|undefined} invite
 * @param {Date} [now=new Date()]
 * @returns {boolean}
 */
/**
 * Determine whether an invite is still redeemable.
 * Handles Firestore Timestamp objects.
 */
export function isInviteUsable(invite, now = new Date()) {
  if (!invite || !invite.data.expiresAt) return false;

  let expiresAt;

  // Check if it's a Firestore Timestamp object (has .toDate() method)
  if (typeof invite.data.expiresAt.toDate === 'function') {
    expiresAt = invite.data.expiresAt.toDate();
  } 
  // Fallback if it's already a Date object
  else if (invite.data.expiresAt instanceof Date) {
    expiresAt = invite.data.expiresAt;
  }
  // Fallback for raw Firestore object structure (seconds/nanoseconds)
  else if (invite.data.expiresAt.seconds) {
    expiresAt = new Date(invite.data.expiresAt.seconds * 1000);
  } else {
    expiresAt = new Date(invite.data.expiresAt);
  }

  const nowTime = now instanceof Date ? now.getTime() : new Date(now).getTime();

  return invite.data.status === 'pending' && expiresAt.getTime() > nowTime;
}

/**
 * Resolve the effective user access status.
 *
 * @param {Record<string, any>|null|undefined} profile
 * @returns {string}
 */
export function resolveAccessStatus(profile) {
  return profile?.status || ACCESS_STATUSES.PENDING_INVITE
}

/**
 * Determine whether a profile is fully active.
 *
 * @param {Record<string, any>|null|undefined} profile
 * @returns {boolean}
 */
export function isActiveProfile(profile) {
  return resolveAccessStatus(profile) === ACCESS_STATUSES.ACTIVE
}

/**
 * Throw when a profile must not be allowed into the application.
 *
 * @param {Record<string, any>|null|undefined} profile
 * @returns {void}
 */
export function assertProfileCanAccess(profile) {
  if (!profile) {
    throw createAccessError('auth/profile-missing', 'Your user profile was not found. Contact an administrator.')
  }

  const status = resolveAccessStatus(profile)

  if (status === ACCESS_STATUSES.SUSPENDED) {
    throw createAccessError('auth/account-suspended', 'Your account has been suspended. Contact an administrator.')
  }

  if (status === ACCESS_STATUSES.DISABLED) {
    throw createAccessError('auth/account-disabled', 'Your account has been disabled. Contact an administrator.')
  }

  if (status !== ACCESS_STATUSES.ACTIVE) {
    throw createAccessError('auth/access-denied', 'Your account is not active yet. Contact an administrator.')
  }
}

export default {
  ACCESS_STATUSES,
  INVITE_STATUSES,
  normalizeEmail,
  createAccessError,
  generateInviteToken,
  hashInviteToken,
  resolveInviteExpiry,
  isInviteUsable,
  resolveAccessStatus,
  isActiveProfile,
  assertProfileCanAccess,
}
