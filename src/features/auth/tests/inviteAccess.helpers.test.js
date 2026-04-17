import test from 'node:test'
import assert from 'node:assert/strict'
import {
  ACCESS_STATUSES,
  INVITE_STATUSES,
  assertProfileCanAccess,
  isInviteUsable,
  normalizeEmail,
  normalizeStringArray,
  resolveInviteExpiry,
} from '../utils/inviteAccess.helpers.js'

test('normalizeEmail trims and lowercases', () => {
  assert.equal(normalizeEmail('  USER@Example.COM '), 'user@example.com')
})

test('normalizeStringArray removes blanks and duplicates', () => {
  assert.deepEqual(asStringArray(['admin', 'admin', '', ' receptionist ']), ['admin', 'receptionist'])
})

test('resolveInviteExpiry returns a future date', () => {
  const now = new Date('2026-01-01T00:00:00Z')
  const result = resolveInviteExpiry('24h', now)
  assert.equal(result.toISOString(), '2026-01-02T00:00:00.000Z')
})

test('isInviteUsable validates pending non-expired invite', () => {
  assert.equal(isInviteUsable({ status: INVITE_STATUSES.PENDING, expiresAt: '2030-01-01T00:00:00Z' }, new Date('2026-01-01T00:00:00Z')), true)
  assert.equal(isInviteUsable({ status: INVITE_STATUSES.REVOKED, expiresAt: '2030-01-01T00:00:00Z' }, new Date('2026-01-01T00:00:00Z')), false)
})

test('assertProfileCanAccess rejects suspended users', () => {
  assert.throws(() => {
    assertProfileCanAccess({ status: ACCESS_STATUSES.SUSPENDED })
  }, /suspended/i)
})

test('assertProfileCanAccess allows active users', () => {
  assert.doesNotThrow(() => {
    assertProfileCanAccess({ status: ACCESS_STATUSES.ACTIVE })
  })
})
