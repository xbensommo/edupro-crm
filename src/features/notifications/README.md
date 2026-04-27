# EduProLIC Notifications Feature

Production-ready Totistack notifications feature adapted for the EduProLIC business flow.

## What it covers

This version is built for these domains:

- `auth`
- `finance`
- `crm`
- `client-records`

It supports EduProLIC workflow events such as:

- client record created / updated
- work created
- work assigned to consultant
- consultant accepted / denied assignment
- final delivery submitted
- consultant-editor approved / denied work
- payment logged
- commission ready / deducted / paid
- user invited / suspended / role changed

## Core idea

Other features should emit domain events.
The notifications feature decides:

- who receives the notification
- which channel is allowed
- what template to use
- what gets stored in-app
- what gets logged for delivery history

## Install into Totistack

Copy this folder into:

```txt
src/features/notifications/
```

## Runtime wiring

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
  userDirectory,
})
```

## Example domain events

```js
await eventBus.emit('crm.work.assigned', {
  entityId: engagementId,
  entityType: 'engagement',
  entityLabel: engagementCode,
  clientName,
  assignedConsultantId,
  actorId: currentUser.uid,
  actorName: currentUser.displayName,
  actionUrl: `/crm/work/v/${engagementId}`,
  actionLabel: 'Open work',
  isActionRequired: true,
})
```

```js
await eventBus.emit('finance.commission.paid', {
  entityId: payoutId,
  entityType: 'commission_payout',
  entityLabel: engagementCode,
  consultantId,
  amountPaid,
  actorId: currentUser.uid,
  actorName: currentUser.displayName,
})
```

## Role behavior

- `admin`: full visibility and management
- `receptionist`: operational notifications and payment/workflow visibility
- `consultant`: own work and own commission notifications
- `consultant_editor`: review workflow notifications

## Collections

- `notifications`
- `notification_preferences`
- `notification_templates`
- `notification_logs`

## Notes

- This feature is EduProLIC-specific in event design, but reusable across Totistack features.
- It is intended to be emitted from auth, finance, crm, and client-records without duplicating notification logic.
