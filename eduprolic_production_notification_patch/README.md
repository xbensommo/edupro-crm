# EduProLIC Production Notification Patch

This package contains a production-ready notification patch for EduProLIC:

- notification domain rewrite
- CRM notification bridge patch
- Firebase Functions Zoho email queue worker
- Firestore index/rules patches
- implementation guide

Start with `docs/IMPLEMENTATION_GUIDE.md`.

The patch is additive where possible. It does not require rewriting CRM pages. Existing calls such as:

```js
service.syncAssignmentDecisionNotification(...)
service.syncFinalSubmissionNotifications(...)
```

keep working, but they now emit canonical notification events instead of writing raw notification rows directly.
