# Auth feature

Firebase authentication feature for Totistack with invite-only onboarding.

## What changed

- Public registration is closed.
- New users must activate through `/accept-invite?token=...`.
- Admin and receptionist users can manage invitations from `/admin/team-access`.
- Suspended users are blocked during auth sync and lose access to the whole system.

## Included pieces

- `services/create-auth-access-service.js` for sign-in, sync, and suspended-user enforcement
- `services/createInviteAccessService.js` for invite creation, validation, acceptance, suspension, and reactivation
- `services/createAccessModuleBindings.js` for exposing invite methods on the root app store
- `pages/accept-invite.vue` for invite redemption
- `pages/team-access.vue` for admin or receptionist access management
- `stores/useTeamAccessStore.js` for the team-access dashboard state
- `collections/user_invites.definitions.js` and updated `collections/users.definitions.js`

## Expected root store bindings

The app store used by the pages should expose these methods:

- `login(email, password)`
- `loginWithSocial(provider)`
- `validateInviteToken(token)`
- `acceptInviteRegistration(payload)`
- `createInvite(payload)`
- `loadTeamAccessSnapshot()`
- `revokeInvite(inviteId)`
- `extendInvite(inviteId, expiresAt)`
- `suspendUser(userId, reason)`
- `reactivateUser(userId)`

## Recommended service wiring

Create both services, then merge them into the root store facade:

```js
const inviteAccessService = createInviteAccessService({
  auth,
  state,
  shardProvider,
  collectionActions,
  config,
  storeApi,
  serverBridge,
})

const authAccessService = createAuthAccessService({
  auth,
  state,
  shardProvider,
  collectionActions,
  config,
  accessControl,
  storeApi,
  inviteAccessService,
})

Object.assign(appStore, createAccessModuleBindings({
  authAccessService,
  inviteAccessService,
}))
```

## Hard suspension

UI and Firestore suspension are already handled here.
For hard account lockout at Firebase Auth level, provide optional server hooks:

- `serverBridge.disableAuthUser(uid)`
- `serverBridge.enableAuthUser(uid)`

## Test

Run:

```bash
node --test auth/tests/inviteAccess.helpers.test.js
```
