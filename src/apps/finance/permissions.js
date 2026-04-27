/**
 * @file src/apps/finance/permissions.js
 * @description Flat permission registry for RBAC generators that consume a simple list.
 */

export default {
  module: 'finance',
  permissions: [
    { key: 'finance.dashboard.read', resource: 'dashboard', action: 'read', description: 'View the finance dashboard.' },
    { key: 'finance.account.read', resource: 'accounts', action: 'read', description: 'View finance accounts.' },
    { key: 'finance.transaction.create', resource: 'transactions', action: 'create', description: 'Create finance transactions.' },
    { key: 'finance.transaction.read', resource: 'transactions', action: 'read', description: 'View finance transactions.' },
    { key: 'finance.transaction.edit_draft', resource: 'transactions', action: 'update', description: 'Edit finance draft transactions.' },
    { key: 'finance.transaction.delete_draft', resource: 'transactions', action: 'delete', description: 'Delete finance draft transactions.' },
    { key: 'finance.transaction.review', resource: 'transactions', action: 'review', description: 'Review finance transactions.' },
    { key: 'finance.transaction.post', resource: 'transactions', action: 'post', description: 'Post finance transactions.' },
    { key: 'finance.journal.reverse', resource: 'journal_entries', action: 'reverse', description: 'Reverse finance journal entries.' },
    { key: 'finance.report.read', resource: 'reports', action: 'read', description: 'Read finance reports.' },
    { key: 'finance.period.close', resource: 'periods', action: 'close', description: 'Close accounting periods.' },
    { key: 'finance.payment.read', resource: 'payments', action: 'read', description: 'Read payment records.' },
    { key: 'finance.payment.log', resource: 'payments', action: 'create', description: 'Log payment records.' },
    { key: 'finance.payment.allocate', resource: 'payment_allocations', action: 'create', description: 'Allocate received payments to issued invoices.' },
    { key: 'finance.expense.read', resource: 'expenses', action: 'read', description: 'Read expense records.' },
    { key: 'finance.expense.manage', resource: 'expenses', action: 'manage', description: 'Manage expense records.' },
    { key: 'finance.payout.read', resource: 'consultant_payouts', action: 'read', description: 'Read payout records.' },
    { key: 'finance.payout.manage', resource: 'consultant_payouts', action: 'manage', description: 'Manage payout records.' },
    { key: 'finance.refund.read', resource: 'refunds', action: 'read', description: 'Read refund records.' },
    { key: 'finance.refund.manage', resource: 'refunds', action: 'manage', description: 'Create and manage refund records.' },
    { key: 'finance.invoice.read', resource: 'invoices', action: 'read', description: 'Read invoices.' },
    { key: 'finance.invoice.create', resource: 'invoices', action: 'create', description: 'Create draft invoices.' },
    { key: 'finance.invoice.issue', resource: 'invoices', action: 'issue', description: 'Issue invoices and create receivable transactions.' },
    { key: 'finance.invoice.cancel', resource: 'invoices', action: 'cancel', description: 'Cancel unposted or unpaid invoices.' },
    { key: 'finance.receivables.read', resource: 'receivables', action: 'read', description: 'Read client receivables and outstanding balances.' },
    { key: 'finance.audit.read', resource: 'finance_audit_logs', action: 'read', description: 'Read finance audit logs.' },
    { key: 'finance.own_payout.read', resource: 'consultant_payouts', action: 'read_own', description: 'Read only the consultant\'s own payout records.' },
  ],
}
