/**
 * @file src/features/auth/feature.manifest.js
 * @description Declarative authentication feature manifest.
 */

export default {
  id: 'auth',
  name: 'Authentication',
  version: '2.1.0',
  description: 'Firebase auth feature with invite-only onboarding, suspension, and root-access integration.',
  dependencies: {
    features: [],
  },
  collections: ['users', 'sessions', 'roles', 'password-reset-tokens', 'user_invites'],
}
