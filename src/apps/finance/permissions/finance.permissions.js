/**
 * @file src/apps/finance/permissions/finance.permissions.js
 * @description RBAC helpers for EduProLIC finance.
 */

export const FINANCE_ROLES = Object.freeze({
  ADMIN: 'admin',
  RECEPTIONIST: 'receptionist',
  CONSULTANT: 'consultant',
})

export const FINANCE_ACTIONS = Object.freeze({
  DASHBOARD_READ: 'finance.dashboard.read',
  ACCOUNT_READ: 'finance.account.read',
  TRANSACTION_CREATE: 'finance.transaction.create',
  TRANSACTION_READ: 'finance.transaction.read',
  TRANSACTION_EDIT_DRAFT: 'finance.transaction.edit_draft',
  TRANSACTION_DELETE_DRAFT: 'finance.transaction.delete_draft',
  TRANSACTION_REVIEW: 'finance.transaction.review',
  TRANSACTION_POST: 'finance.transaction.post',
  JOURNAL_REVERSE: 'finance.journal.reverse',
  REPORT_READ: 'finance.report.read',
  PERIOD_CLOSE: 'finance.period.close',
  PAYMENT_READ: 'finance.payment.read',
  PAYMENT_LOG: 'finance.payment.log',
  PAYMENT_ALLOCATE: 'finance.payment.allocate',
  EXPENSE_READ: 'finance.expense.read',
  EXPENSE_MANAGE: 'finance.expense.manage',
  PAYOUT_READ: 'finance.payout.read',
  PAYOUT_MANAGE: 'finance.payout.manage',
  REFUND_READ: 'finance.refund.read',
  REFUND_MANAGE: 'finance.refund.manage',
  INVOICE_READ: 'finance.invoice.read',
  INVOICE_CREATE: 'finance.invoice.create',
  INVOICE_ISSUE: 'finance.invoice.issue',
  INVOICE_CANCEL: 'finance.invoice.cancel',
  RECEIVABLES_READ: 'finance.receivables.read',
  AUDIT_READ: 'finance.audit.read',
  OWN_PAYOUT_READ: 'finance.own_payout.read',
})

export const FINANCE_ROLE_MATRIX = Object.freeze({
  [FINANCE_ROLES.ADMIN]: new Set(Object.values(FINANCE_ACTIONS)),
  [FINANCE_ROLES.RECEPTIONIST]: new Set([
    FINANCE_ACTIONS.DASHBOARD_READ,
    FINANCE_ACTIONS.ACCOUNT_READ,
    FINANCE_ACTIONS.TRANSACTION_CREATE,
    FINANCE_ACTIONS.TRANSACTION_READ,
    FINANCE_ACTIONS.TRANSACTION_EDIT_DRAFT,
    FINANCE_ACTIONS.TRANSACTION_DELETE_DRAFT,
    FINANCE_ACTIONS.TRANSACTION_REVIEW,
    FINANCE_ACTIONS.TRANSACTION_POST,
    FINANCE_ACTIONS.JOURNAL_REVERSE,
    FINANCE_ACTIONS.REPORT_READ,
    FINANCE_ACTIONS.PERIOD_CLOSE,
    FINANCE_ACTIONS.PAYMENT_READ,
    FINANCE_ACTIONS.PAYMENT_LOG,
    FINANCE_ACTIONS.PAYMENT_ALLOCATE,
    FINANCE_ACTIONS.EXPENSE_READ,
    FINANCE_ACTIONS.EXPENSE_MANAGE,
    FINANCE_ACTIONS.PAYOUT_READ,
    FINANCE_ACTIONS.PAYOUT_MANAGE,
    FINANCE_ACTIONS.REFUND_READ,
    FINANCE_ACTIONS.REFUND_MANAGE,
    FINANCE_ACTIONS.INVOICE_READ,
    FINANCE_ACTIONS.INVOICE_CREATE,
    FINANCE_ACTIONS.INVOICE_ISSUE,
    FINANCE_ACTIONS.INVOICE_CANCEL,
    FINANCE_ACTIONS.RECEIVABLES_READ,
    FINANCE_ACTIONS.AUDIT_READ,
  ]),
  [FINANCE_ROLES.CONSULTANT]: new Set([
    FINANCE_ACTIONS.OWN_PAYOUT_READ,
  ]),
})

export function userIdOf(value) {
  return value?.id || value?.uid || value?.user_id || null
}

export function getFinanceRoles(user) {
  const directRole = user?.role ? [user.role] : []
  const collectionRoles = Array.isArray(user?.roles) ? user.roles.filter(Boolean) : []
  return [...new Set([...collectionRoles, ...directRole])]
}

export function canFinance(user, action, record = null) {
  const roles = getFinanceRoles(user)

  for (const role of roles) {
    const allowed = FINANCE_ROLE_MATRIX[role]
    if (!allowed?.has(action)) continue

    if (role === FINANCE_ROLES.CONSULTANT && action === FINANCE_ACTIONS.OWN_PAYOUT_READ) {
      const consultantId = record?.consultantId || null
      return Boolean(consultantId && consultantId === userIdOf(user))
    }

    return true
  }

  return false
}

export function requireFinance(user, action, record = null) {
  if (!canFinance(user, action, record)) {
    const error = new Error(`Not allowed to perform action '${action}'.`)
    error.code = 'FINANCE_FORBIDDEN'
    throw error
  }

  return true
}
