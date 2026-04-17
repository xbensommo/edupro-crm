# Totistack Notifications Feature

Production-ready Totistack notifications feature built for the current framework shape.

## What is included

- `feature.manifest.js`
- `routes.js`
- `collections.definitions.js`
- `permissions.js`
- event-driven notification orchestration
- in-app, email, and WhatsApp adapter contracts
- bell, drawer, list, filters, preferences, templates, logs UI
- Pinia store + composables
- runtime registration helpers
- Node tests

## Install into Totistack

Copy this folder into:

```txt
src/features/notifications/
```

Then make sure Totistack discovers:

- `src/features/*/feature.manifest.js`
- `src/features/*/routes.js`
- `src/features/*/collections.definitions.js`

## Runtime wiring

At app boot, register the feature:

```js
import { registerNotificationsFeature } from '@/features/notifications'

registerNotificationsFeature({
  app,
  pinia,
  router,
  shardProvider,
  eventBus,
  serviceRegistry,
  currentUser: () => authStore.user,
})
```

In the app shell, mount the bell and drawer:

```vue
<NotificationBell />
<NotificationDrawer />
```

## Event-first usage

Business modules should emit domain events, not call channels directly.

Examples:

- `lead.created`
- `lead.assigned`
- `booking.confirmed`
- `form.submitted`
- `document.generated`
- `user.role.changed`
- `invoice.overdue`

The notifications feature listens and decides:

- recipients
- channel
- template
- persistence
- delivery log

## Collections

- `notifications`
- `notification_preferences`
- `notification_templates`
- `notification_logs`

## Permissions

- `notifications.view`
- `notifications.manage`
- `notifications.preferences.manage`
- `notifications.templates.manage`
- `notifications.logs.view`
- `notifications.dispatch`

## Theme

The UI inherits the host Totistack theme through CSS variables such as:

- `--color-primary`
- `--color-secondary`
- `--color-accent`
- `--color-text`
- `--color-muted`
- `--color-surface`
- `--color-surface-muted`
- `--color-border`

No feature-level theme override is required.

## Notes

- This feature uses `@xbensommo/shard-provider` collection definitions.
- Runtime adapter hooks are intentionally thin so you do not need to rewrite every feature.
- Channel adapters accept provider functions, so email and WhatsApp can be swapped later without changing business modules.
