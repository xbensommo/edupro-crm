/**
 * @file src/features/auth/feature.manifest.js
 * @description Declarative authentication feature manifest.
 */

export default {
  id: 'auth',
  name: 'Authentication',
  version: '2.2.0',
  description: 'EduProLIC invite-only authentication with user management, suspension, and notification integration.',
  dependencies: {
    features: ['notifications'],
  },
  collections: ['users', 'sessions', 'roles', 'password-reset-tokens', 'user_invites'],
}
