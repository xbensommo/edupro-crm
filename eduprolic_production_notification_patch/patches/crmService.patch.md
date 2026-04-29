# CRM Service Patch

Apply the included `src/features/crm/services/crmService.js` over the current file, or patch manually:

1. Add import:

```js
import { createCrmNotificationBridge } from './createCrmNotificationBridge.js'
```

2. Replace these old internal functions:

```text
createInAppNotifications
notifyRoles
notifyWorkAssignment
notifyAssignmentDecision
notifyFinalSubmission
```

with the bridge-backed block from the included `crmService.js`.

3. Add the new file:

```text
src/features/crm/services/createCrmNotificationBridge.js
```

Result: CRM no longer writes raw notification rows directly. It emits canonical events. Email is queued only where the notification event policy allows it.
