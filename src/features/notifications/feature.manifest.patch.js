/** @file src/features/notifications/feature.manifest.patch.js */

// Add 'notification_push_tokens' to notificationsFeatureManifest.collections.
// Add browserPush: true and fcm: true to notificationsFeatureManifest.capabilities.

export const notificationManifestPatch = {
  collectionsToAdd: ['notification_push_tokens'],
  capabilitiesToAdd: {
    browserPush: true,
    fcm: true,
  },
}
