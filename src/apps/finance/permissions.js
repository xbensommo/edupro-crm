/**
 * @file permissions.js
 * @description Declarative permission registry for the finance app.
 */

export default {
  module: 'finance',
  permissions: [
    { key: 'finance.invoices.read', resource: 'invoices', action: 'read', description: 'View invoices.' },
    { key: 'finance.invoices.create', resource: 'invoices', action: 'create', description: 'Create invoices.' },
    { key: 'finance.invoices.update', resource: 'invoices', action: 'update', description: 'Update invoices.' },
    { key: 'finance.invoices.delete', resource: 'invoices', action: 'delete', description: 'Delete invoices.' },
    { key: 'finance.invoices.approve', resource: 'invoices', action: 'approve', description: 'Approve invoices.' },
    { key: 'finance.invoices.send', resource: 'invoices', action: 'send', description: 'Send invoices.' },
    { key: 'finance.invoices.mark_paid', resource: 'invoices', action: 'mark_paid', description: 'Mark invoices as paid.' },
    { key: 'finance.invoices.export', resource: 'invoices', action: 'export', description: 'Export invoices.' },
    { key: 'finance.invoices.manage', resource: 'invoices', action: 'manage', description: 'Full control over invoices.' },

    { key: 'finance.quotes.read', resource: 'quotes', action: 'read', description: 'View quotes.' },
    { key: 'finance.quotes.create', resource: 'quotes', action: 'create', description: 'Create quotes.' },
    { key: 'finance.quotes.update', resource: 'quotes', action: 'update', description: 'Update quotes.' },
    { key: 'finance.quotes.delete', resource: 'quotes', action: 'delete', description: 'Delete quotes.' },
    { key: 'finance.quotes.approve', resource: 'quotes', action: 'approve', description: 'Approve quotes.' },
    { key: 'finance.quotes.send', resource: 'quotes', action: 'send', description: 'Send quotes.' },
    { key: 'finance.quotes.convert', resource: 'quotes', action: 'convert', description: 'Convert quotes to invoices.' },
    { key: 'finance.quotes.export', resource: 'quotes', action: 'export', description: 'Export quotes.' },
    { key: 'finance.quotes.manage', resource: 'quotes', action: 'manage', description: 'Full control over quotes.' },

    { key: 'finance.receipts.read', resource: 'receipts', action: 'read', description: 'View receipts.' },
    { key: 'finance.receipts.create', resource: 'receipts', action: 'create', description: 'Create receipts.' },
    { key: 'finance.receipts.update', resource: 'receipts', action: 'update', description: 'Update receipts.' },
    { key: 'finance.receipts.delete', resource: 'receipts', action: 'delete', description: 'Delete receipts.' },
    { key: 'finance.receipts.export', resource: 'receipts', action: 'export', description: 'Export receipts.' },
    { key: 'finance.receipts.manage', resource: 'receipts', action: 'manage', description: 'Full control over receipts.' },

    { key: 'finance.expenses.read', resource: 'expenses', action: 'read', description: 'View expenses.' },
    { key: 'finance.expenses.create', resource: 'expenses', action: 'create', description: 'Create expenses.' },
    { key: 'finance.expenses.update', resource: 'expenses', action: 'update', description: 'Update expenses.' },
    { key: 'finance.expenses.delete', resource: 'expenses', action: 'delete', description: 'Delete expenses.' },
    { key: 'finance.expenses.approve', resource: 'expenses', action: 'approve', description: 'Approve expenses.' },
    { key: 'finance.expenses.export', resource: 'expenses', action: 'export', description: 'Export expenses.' },
    { key: 'finance.expenses.manage', resource: 'expenses', action: 'manage', description: 'Full control over expenses.' },

    { key: 'finance.payments.read', resource: 'payments', action: 'read', description: 'View payments.' },
    { key: 'finance.payments.create', resource: 'payments', action: 'create', description: 'Create payments.' },
    { key: 'finance.payments.update', resource: 'payments', action: 'update', description: 'Update payments.' },
    { key: 'finance.payments.delete', resource: 'payments', action: 'delete', description: 'Delete payments.' },
    { key: 'finance.payments.reconcile', resource: 'payments', action: 'reconcile', description: 'Reconcile payments.' },
    { key: 'finance.payments.export', resource: 'payments', action: 'export', description: 'Export payments.' },
    { key: 'finance.payments.manage', resource: 'payments', action: 'manage', description: 'Full control over payments.' },

    { key: 'finance.ledger.read', resource: 'ledger', action: 'read', description: 'View ledger data.' },
    { key: 'finance.ledger.audit', resource: 'ledger', action: 'audit', description: 'Audit ledger records.' },
    { key: 'finance.reports.read', resource: 'reports', action: 'read', description: 'View finance reports.' },
    { key: 'finance.reports.export', resource: 'reports', action: 'export', description: 'Export finance reports.' },
    { key: 'finance.reports.manage', resource: 'reports', action: 'manage', description: 'Full control over finance reports.' },
  ],
  roleTemplates: {
    admin: ['finance.invoices.manage', 'finance.quotes.manage', 'finance.receipts.manage', 'finance.expenses.manage', 'finance.payments.manage', 'finance.ledger.audit', 'finance.reports.manage'],
    receptionist: ['finance.invoices.read', 'finance.quotes.read', 'finance.receipts.read'],
    consultant: ['finance.quotes.read', 'finance.quotes.create', 'finance.quotes.update', 'finance.invoices.read'],
    finance_officer: ['finance.invoices.manage', 'finance.quotes.manage', 'finance.receipts.manage', 'finance.expenses.manage', 'finance.payments.manage', 'finance.ledger.read', 'finance.ledger.audit', 'finance.reports.manage'],
    viewer: ['finance.invoices.read', 'finance.quotes.read', 'finance.receipts.read', 'finance.expenses.read', 'finance.payments.read', 'finance.ledger.read', 'finance.reports.read'],
  },
}