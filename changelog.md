# Finance Automation Changelog

## 2026-07-08

### Added
- **`useFinanceAppStore.createInvoiceForEngagement`** – Automatically creates a draft invoice from an engagement.
- **`useFinanceAppStore.autoAllocatePayment`** – Allocates a payment to the oldest open invoices for the client.
- **`useFinanceAppStore.updateClientBalance`** – Recalculates and saves the client's outstanding balance in `clients.outstandingBalance` and `financeSummary.amountDue`.
- **`useFinanceAppStore.logClientPayment`** now accepts an `autoAllocate` option to trigger auto-allocation immediately after payment logging.

### Modified
- **`crmService.createEngagements`** – Calls `createInvoiceForEngagement` after engagement creation, ensuring an invoice is always generated.
- **`createFinanceCommandBus.logClientPayment`** – Accepts `autoAllocate` flag to perform allocation in the command layer.

### New File (Skeleton)
- **`server/triggers/updateOverdueInvoices.js`** – Example Cloud Function to mark invoices overdue daily.

### Impact
- Invoices are created automatically when a new work item is added, eliminating manual invoice creation.
- Payments are automatically allocated to open invoices, keeping invoice statuses (`paid`, `partially_paid`) accurate.
- Client balances are always up‑to‑date, improving dashboard accuracy.
- Overdue status can be automated with the provided skeleton.