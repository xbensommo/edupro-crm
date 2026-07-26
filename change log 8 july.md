# Firebase Functions Changelog

## 2026-07-08

### Added
- **`financeTriggers.js`** – New Cloud Functions for finance automation:
  - `onEngagementCreate`: Auto-creates a draft invoice when an engagement is created.
  - `onPaymentCreate`: Auto-allocates a payment to the oldest open invoices and updates client balance.
  - `scheduleUpdateOverdueInvoices`: Daily cron to mark invoices as overdue when past due date.

### Modified
- **`index.js`** – Exports the new finance triggers.
- **`notificationEmailWorker.js`** – Added finance events to `EMAIL_EVENTS` so that finance notifications are sent via email.

### Impact
- Invoices are generated automatically on engagement creation, eliminating manual steps.
- Payments are automatically allocated, keeping invoice statuses and client balances in real time.
- Overdue invoices are updated daily, enabling automated reminders.
- All finance events now trigger email notifications to the relevant recipients.