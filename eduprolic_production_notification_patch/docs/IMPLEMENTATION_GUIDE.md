# EduProLIC Notification Production Patch

## What this patch changes

This patch implements the five-phase plan:

1. Keep existing CRM flow working.
2. Add a notification bridge between CRM and the notifications domain.
3. Send email only for vital events.
4. Add a server-side delivery queue for Zoho email.
5. Add dedupe keys and server-side delivery locks.

## Files to copy

Copy these into your app:

```text
src/features/notifications/constants/*
src/features/notifications/utils/*
src/features/notifications/services/*
src/features/notifications/collections/notifications.definitions.js
src/features/notifications/collections/notification_logs.definitions.js
src/features/notifications/collections/notification_delivery_queue.definitions.js
src/features/crm/services/createCrmNotificationBridge.js
src/features/crm/services/crmService.js
```

Then apply the small export/manifest patches:

```text
src/features/notifications/index.patch.js
src/features/notifications/feature.manifest.patch.js
```

## Firebase Functions

Copy the `functions/` folder into your Firebase functions package, or merge these files into the existing functions package:

```text
functions/config.js
functions/emailSender.js
functions/emailTemplates.js
functions/notificationEmailWorker.js
functions/index.js
functions/package.json
```

## Required Firebase secrets / environment variables

Required:

```bash
firebase functions:secrets:set EMAIL_PASS
```

Recommended environment variables:

```text
EMAIL_USER=info@eduprolic.com
EMAIL_FROM=info@eduprolic.com
EMAIL_PASS=<zoho-app-password>
APP_DOMAIN=https://www.eduprolic.com
COMPANY_EMAIL=info@eduprolic.com
COMPANY_PHONE=+264 81 448 9950
```

## Vital email events only

Email is queued only for:

```text
crm.work.assigned
crm.assignment.denied
crm.final_delivery.submitted
crm.review.denied
finance.commission.deducted
finance.commission.paid
auth.user.invited
auth.user.suspended
```

Everything else remains in-app unless you explicitly change the event policy.

## Cost-control behavior

- One in-app notification row per recipient/event.
- Email creates one queue row, not immediate SMTP traffic.
- Firebase Function triggers only on `notification_delivery_queue` creates.
- Server-side dedupe lock prevents duplicate email sends.
- CRM does not directly send mail.
- Recipient role lookup uses already-loaded `users` state first, then falls back to one filtered query only when needed.

## Deployment order

1. Add collection definitions and rebuild Totistack generated registries.
2. Add CRM bridge and patched CRM service.
3. Deploy Firestore indexes.
4. Deploy Firestore rules patch.
5. Deploy functions.
6. Test these flows:
   - create engagement with assigned consultant
   - consultant accepts
   - consultant denies
   - consultant submits final work
   - editor denies final work

## Non-negotiable testing

Check Firestore after each flow:

```text
notifications
notification_delivery_queue
notification_logs
_notification_delivery_locks
engagements.notificationFeedStatus
```

If email does not send, inspect `notification_delivery_queue.lastError` first.
