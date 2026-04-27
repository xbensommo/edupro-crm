/**
 * @file src/apps/finance/index.js
 * @description EduProLIC finance barrel exports.
 */

export { default as manifest } from './app.manifest.js'
export { default as routes } from './routes.js'
export { default as navigation } from './navigation.js'
export { default as permissions } from './permissions.js'
export * from './permissions/finance.permissions.js'
export { useFinanceAppStore } from './stores/useFinanceAppStore.js'
export { createFinanceModule } from './services/createFinanceModule.js'
export { default as financeCollections } from './collections/index.js'
export { default as financeAccounts } from './collections/finance_accounts.definitions.js'
export { default as financeTransactions } from './collections/finance_transactions.definitions.js'
export { default as financeJournalEntries } from './collections/finance_journal_entries.definitions.js'
export { default as financePeriods } from './collections/finance_periods.definitions.js'
export { default as payments } from './collections/payments.definitions.js'
export { default as refunds } from './collections/refunds.definitions.js'
export { default as expenses } from './collections/expenses.definitions.js'
export { default as consultantPayouts } from './collections/consultant_payouts.definitions.js'
export { default as shareRules } from './collections/share_rules.definitions.js'

export { default as invoices } from './collections/invoices.definitions.js'
export { default as invoiceItems } from './collections/invoice_items.definitions.js'
export { default as paymentAllocations } from './collections/payment_allocations.definitions.js'
export { default as financeAuditLogs } from './collections/finance_audit_logs.definitions.js'