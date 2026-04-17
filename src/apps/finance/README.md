# Totistack Finance App

Enterprise-grade finance app for Totistack apps.

## What changed

- collection definitions were rebuilt to the `defineCollection` + `FIELD_TYPES` contract format
- UI now uses the shared theme token style built around:
  - `--color-primary`
  - `--color-secondary`
  - `--color-accent`
  - `--color-text`
  - `--color-text-light`
  - `--color-neutral`
  - `--color-neutral-dark`
  - `--color-background`
- reports now include:
  - balance sheet
  - income statement
  - expense statement
  - trial balance
- transactions page now includes a reusable built-in action modal
- action modal can run in two modes:
  - local fallback modal out of the box
  - host-driven confirm flow by adapting your core `useActionExecutor`

## Action modal integration

The finance action panel accepts an optional `confirmAction` prop.

Example host wiring:

```js
// Adjust the core import path to your project structure.
import { useActionExecutor } from '@core/...'

const { confirmAction } = useActionExecutor()
```

```vue
<FinanceActionPanel
  :transaction="row"
  :confirm-action="confirmAction"
  @review="reviewTransaction"
  @post="postTransaction"
/>
```

If you do not pass `confirmAction`, the component uses its own built-in modal.

## Collections

- `finance_accounts`
- `finance_transactions`
- `finance_journal_entries`
- `finance_periods`

## Domain rule

Reports are derived from posted ledger entries only.

## Roles

- `admin`
- `accountant`
- `receptionist`
- `consultant`

## Pages

- `/finance`
- `/finance/transactions`
- `/finance/accounts`
- `/finance/reports`
- `/finance/reports/balance-sheet`
- `/finance/reports/income-statement`
- `/finance/reports/expense-statement`

## Notes

- the included Pinia store seeds realistic demo finance data so the app renders immediately
- swap the demo store data with shard-provider-backed repositories when wiring the app into the host runtime
- service-layer posting and reversal utilities remain reusable for the real Firestore path

## Test

```bash
node --test ./tests/*.test.js
```
