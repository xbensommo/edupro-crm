/**
 * @file src/apps/finance/app.manifest.js
 * @description EduProLIC finance app manifest.
 */

export default {
  id: 'finance',
  type: 'app',
  name: 'Finance',
  description: 'EduProLIC finance operations for invoices, receivables, payments, refunds, consultant commissions, payouts, expenses, audit, posting, and reports.',
  version: '3.0.0',
  navigation: {
    label: 'Finance',
    icon: 'book',
    priority: 20,
    roles: ['admin', 'receptionist', 'consultant'],
  },
  collections: [
    'finance_accounts',
    'finance_transactions',
    'finance_journal_entries',
    'finance_periods',
    'payments',
    'refunds',
    'expenses',
    'consultant_payouts',
    'share_rules',
    'invoices',
    'invoice_items',
    'payment_allocations',
    'finance_audit_logs',
    'notifications',
  ],
  dependencies: {
    features: ['auth', 'rbac', 'notifications'],
    apps: ['crm'],
  },
  capabilities: [
    'eduprolic-finance-operations',
    'client-invoicing',
    'payment-allocation',
    'receivables-control',
    'finance-audit-trail',
    'client-payment-ledger-posting',
    'client-refund-control',
    'consultant-commission-accrual',
    'consultant-payout-tracking',
    'expense-posting',
    'balance-sheet',
    'income-statement',
    'expense-statement',
    'notifications-integration',
    'crm-finance-handoff',
  ],
}
