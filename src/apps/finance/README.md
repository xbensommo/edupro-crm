# EduProLIC Finance App

Production-oriented Totistack finance app for EduProLIC operations. It is no longer a payment tracker. It now has the missing accounting layer required for real finance work: invoices, receivables, payment allocations, audit logs, double-entry posting, reports, RBAC, notifications, and guarded action confirmation.

## What changed in this version

- Added `invoices` collection.
- Added `invoice_items` collection.
- Added `payment_allocations` collection.
- Added `finance_audit_logs` collection.
- Restored the broken `collections/index.js` barrel export.
- Removed old duplicate `journal_entries` and `journal_lines` definitions from the package output.
- Added invoice commands: create, issue, cancel.
- Added payment allocation command.
- Added audit writes for guarded finance commands.
- Added receivables report logic.
- Added invoice, receivables, and audit pages.
- Added invoice and allocation forms.
- Added permissions for invoice, allocation, receivables, and audit workflows.
- Replaced the fake `confirm: async () => true` store behavior with a host action-modal adapter.
- Kept all collections on `shard: { type: 'none' }`.

## Required collections

```txt
finance_accounts
finance_transactions
finance_journal_entries
finance_periods
payments
refunds
expenses
consultant_payouts
share_rules
invoices
invoice_items
payment_allocations
finance_audit_logs
notifications
```

## Finance lifecycle

### Invoice lifecycle

```txt
draft → issued → partially_paid → paid
              ↘ cancelled
```

### Transaction lifecycle

```txt
draft → reviewed → posted → reversed
```

### Expense lifecycle

```txt
recorded → posted → reversed
```

### Payout lifecycle

```txt
pending → partially_paid → paid
```

## Critical rule

Finance must not hard-delete accounting records after they affect money. Use cancellation or reversal.

- Draft transactions may be deleted.
- Issued invoices may be cancelled only if no money is allocated.
- Posted transactions must be reversed through a reversal journal entry.
- Payment allocations are immutable except for explicit reversal metadata.
- Audit logs are append-only.

## Command API

```js
const store = useFinanceAppStore()

await store.createInvoice({
  clientId: 'client_1',
  clientLabel: 'Client Name',
  engagementId: 'engagement_1',
  engagementCode: 'EDU-2026-001',
  issueDate: new Date().toISOString(),
  dueDate: '2026-05-31T00:00:00.000Z',
  lineItems: [
    { description: 'Academic writing service', quantity: 1, unitPrice: 1500 },
  ],
})

await store.issueInvoice(invoice)

await store.logClientPayment({
  clientId: 'client_1',
  engagementId: 'engagement_1',
  amount: 1000,
  paymentMethod: 'bank_transfer',
  referenceNumber: 'BANK-REF-001',
})

await store.allocatePaymentToInvoice({
  paymentId: 'payment_doc_id',
  invoiceId: 'invoice_doc_id',
  amount: 1000,
})
```

## Action modal integration

The store now uses `createFinanceConfirmHandler(hostStore)`. It attempts these host APIs in order:

```txt
rootStore.confirmAction
rootStore.requestActionConfirmation
rootStore.requestConfirmation
rootStore.openConfirm
rootStore.confirm
rootStore.actionModal.confirm
rootStore.modals.confirm
window.confirm fallback
```

For proper Totistack usage, expose one global action modal method from the root app store, preferably:

```js
await rootStore.confirmAction({
  title: 'Post transaction',
  message: 'This will create a ledger entry and affect reports and balances.',
  confirmText: 'Post transaction',
  tone: 'danger',
  domain: 'finance',
})
```

Do not bypass this with `async () => true` in production.

## Routes added

```txt
/finance/invoices
/finance/receivables
/finance/audit
```

## Permissions added

```txt
finance.invoice.read
finance.invoice.create
finance.invoice.issue
finance.invoice.cancel
finance.payment.allocate
finance.receivables.read
finance.audit.read
```

## Reports

Existing ledger reports remain:

```txt
trial balance
income statement
balance sheet
expense statement
```

New operational report:

```txt
receivables report
```

Receivables is derived from active invoices and active payment allocations. It answers the real business question:

```txt
Who owes us money, how much, against which invoice, and what payment has been applied?
```

## Firestore index pattern

Every collection keeps the standard practical index pattern:

```txt
isDeleted + createdAt DESC
```

Finance-specific date indexes are also included, for example:

```txt
invoice.status + dueDate
payment_allocations.invoiceId + allocatedAt
finance_audit_logs.entityType + entityId + occurredAt
```

## Testing

Run the provided Node tests:

```bash
node --test finance/tests/*.test.js
```

Covered test areas:

- draft review
- posting
- confirmation cancellation
- invoice creation
- invoice issuing
- payment allocation
- over-allocation rejection
- trial balance
- income statement
- balance sheet
- expense statement
- receivables report

## Server-action note

The app-layer command bus is production-structured, but the strongest deployment is to run these commands through Firebase Functions or your Totistack server-action layer for critical writes:

```txt
post transaction
reverse journal entry
close period
issue invoice
cancel invoice
allocate payment
settle payout
```

Do not server-action every finance read or every simple draft save. Use server actions only where business integrity, automation, or security requires it.
