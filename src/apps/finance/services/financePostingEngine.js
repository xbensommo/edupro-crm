/**
 * @file src/apps/finance/services/financePostingEngine.js
 * @description EduProLIC finance posting helpers.
 */

import { DEFAULT_SYSTEM_ACCOUNTS, SYSTEM_ACCOUNT_KEYS, createAccountResolver } from './financeChartOfAccounts.js'

function createId(prefix = 'je') {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`
}

function nowIso(nowFactory) {
  return typeof nowFactory === 'function' ? nowFactory() : new Date().toISOString()
}

function createPeriodKey(isoString) {
  return String(isoString || '').slice(0, 7)
}

function ledgerLine(accountId, side, amount, memo = '') {
  return { accountId, side, amount: Number(amount || 0), memo }
}

function normalizeLines(lines = []) {
  const normalized = lines.filter((line) => Number(line?.amount || 0) > 0)
  const totalDebit = normalized.filter((line) => line.side === 'debit').reduce((sum, line) => sum + Number(line.amount || 0), 0)
  const totalCredit = normalized.filter((line) => line.side === 'credit').reduce((sum, line) => sum + Number(line.amount || 0), 0)

  if (Number(totalDebit.toFixed(2)) !== Number(totalCredit.toFixed(2))) {
    const error = new Error('Transaction is not balanced.')
    error.code = 'FINANCE_UNBALANCED_TRANSACTION'
    throw error
  }

  return {
    lines: normalized,
    totalDebit: Number(totalDebit.toFixed(2)),
    totalCredit: Number(totalCredit.toFixed(2)),
  }
}

function buildLinesForTransaction(transaction, accounts = DEFAULT_SYSTEM_ACCOUNTS) {
  const resolveAccount = createAccountResolver(accounts)
  const amount = Number(transaction?.amount || transaction?.grossServiceAmount || transaction?.paidAmount || 0)
  const consultantShareAmount = Number(transaction?.consultantShareAmount || transaction?.consultantShareAmountCached || 0)
  const deductionAmount = Number(transaction?.deductionAmount || 0)

  if (Array.isArray(transaction?.lines) && transaction.lines.length) {
    return normalizeLines(transaction.lines)
  }

  switch (transaction?.type) {
    case 'client_payment':
    case 'payment':
      return normalizeLines([
        ledgerLine(resolveAccount(SYSTEM_ACCOUNT_KEYS.CASH)?.id || SYSTEM_ACCOUNT_KEYS.CASH, 'debit', amount, 'Client payment received'),
        ledgerLine(resolveAccount(SYSTEM_ACCOUNT_KEYS.ACCOUNTS_RECEIVABLE)?.id || SYSTEM_ACCOUNT_KEYS.ACCOUNTS_RECEIVABLE, 'credit', amount, 'Reduce receivable'),
      ])

    case 'refund':
      return normalizeLines([
        ledgerLine(transaction?.accountOverrides?.refundAccountId || resolveAccount(SYSTEM_ACCOUNT_KEYS.SERVICE_REVENUE)?.id || SYSTEM_ACCOUNT_KEYS.SERVICE_REVENUE, 'debit', amount, 'Client refund issued'),
        ledgerLine(resolveAccount(SYSTEM_ACCOUNT_KEYS.CASH)?.id || SYSTEM_ACCOUNT_KEYS.CASH, 'credit', amount, 'Cash refunded to client'),
      ])

    case 'consultant_commission_accrual':
      return normalizeLines([
        ledgerLine(resolveAccount(SYSTEM_ACCOUNT_KEYS.CONSULTANT_COST)?.id || SYSTEM_ACCOUNT_KEYS.CONSULTANT_COST, 'debit', consultantShareAmount || amount, 'Consultant commission expense'),
        ledgerLine(resolveAccount(SYSTEM_ACCOUNT_KEYS.CONSULTANT_PAYABLE)?.id || SYSTEM_ACCOUNT_KEYS.CONSULTANT_PAYABLE, 'credit', consultantShareAmount || amount, 'Consultant payable'),
      ])

    case 'consultant_payout':
    case 'payout':
      return normalizeLines([
        ledgerLine(resolveAccount(SYSTEM_ACCOUNT_KEYS.CONSULTANT_PAYABLE)?.id || SYSTEM_ACCOUNT_KEYS.CONSULTANT_PAYABLE, 'debit', amount, 'Consultant payout settlement'),
        ledgerLine(resolveAccount(SYSTEM_ACCOUNT_KEYS.CASH)?.id || SYSTEM_ACCOUNT_KEYS.CASH, 'credit', amount, 'Cash paid out'),
      ])

    case 'commission_deduction':
      return normalizeLines([
        ledgerLine(resolveAccount(SYSTEM_ACCOUNT_KEYS.CONSULTANT_PAYABLE)?.id || SYSTEM_ACCOUNT_KEYS.CONSULTANT_PAYABLE, 'debit', deductionAmount || amount, 'Reduce consultant payable after review deduction'),
        ledgerLine(resolveAccount(SYSTEM_ACCOUNT_KEYS.SERVICE_REVENUE)?.id || SYSTEM_ACCOUNT_KEYS.SERVICE_REVENUE, 'credit', deductionAmount || amount, 'Commission deduction retained by company'),
      ])

    case 'expense':
      return normalizeLines([
        ledgerLine(transaction?.accountOverrides?.expenseAccountId || SYSTEM_ACCOUNT_KEYS.OPERATING_EXPENSE, 'debit', amount, transaction?.memo || 'Operating expense'),
        ledgerLine(resolveAccount(SYSTEM_ACCOUNT_KEYS.CASH)?.id || SYSTEM_ACCOUNT_KEYS.CASH, 'credit', amount, 'Cash paid for expense'),
      ])

    case 'work_revenue':
    case 'invoice_revenue':
      return normalizeLines([
        ledgerLine(resolveAccount(SYSTEM_ACCOUNT_KEYS.ACCOUNTS_RECEIVABLE)?.id || SYSTEM_ACCOUNT_KEYS.ACCOUNTS_RECEIVABLE, 'debit', amount, 'Recognize receivable'),
        ledgerLine(resolveAccount(SYSTEM_ACCOUNT_KEYS.SERVICE_REVENUE)?.id || SYSTEM_ACCOUNT_KEYS.SERVICE_REVENUE, 'credit', amount, 'Recognize work revenue'),
      ])

    case 'adjustment':
      return normalizeLines([
        ledgerLine(resolveAccount(SYSTEM_ACCOUNT_KEYS.CASH)?.id || SYSTEM_ACCOUNT_KEYS.CASH, 'debit', amount, transaction?.memo || 'Adjustment'),
        ledgerLine(resolveAccount(SYSTEM_ACCOUNT_KEYS.OWNER_EQUITY)?.id || SYSTEM_ACCOUNT_KEYS.OWNER_EQUITY, 'credit', amount, transaction?.memo || 'Adjustment'),
      ])

    default:
      return normalizeLines([
        ledgerLine(resolveAccount(SYSTEM_ACCOUNT_KEYS.CASH)?.id || SYSTEM_ACCOUNT_KEYS.CASH, 'debit', amount, transaction?.memo || 'Transaction'),
        ledgerLine(resolveAccount(SYSTEM_ACCOUNT_KEYS.SERVICE_REVENUE)?.id || SYSTEM_ACCOUNT_KEYS.SERVICE_REVENUE, 'credit', amount, transaction?.memo || 'Transaction'),
      ])
  }
}

export function createPostedJournalEntry({ transaction, accounts = DEFAULT_SYSTEM_ACCOUNTS, actor = null, idFactory = createId, nowFactory = null }) {
  const { lines, totalDebit, totalCredit } = buildLinesForTransaction(transaction, accounts)
  const postedAt = nowIso(nowFactory)

  return {
    id: idFactory('je'),
    transactionId: transaction?.id || transaction?.transactionId || null,
    transactionType: transaction?.type || 'adjustment',
    status: 'posted',
    postedAt,
    periodKey: createPeriodKey(postedAt),
    createdBy: actor?.id || actor?.uid || null,
    memo: transaction?.memo || transaction?.reference || null,
    reference: transaction?.reference || null,
    currency: transaction?.currency || 'NAD',
    entityId: transaction?.engagementId || transaction?.clientId || transaction?.consultantId || null,
    lines,
    totalDebit,
    totalCredit,
  }
}

export function createReversalJournalEntry({ postedEntry, actor = null, reason = 'Manual reversal', idFactory = createId, nowFactory = null }) {
  const postedAt = nowIso(nowFactory)
  const lines = (postedEntry?.lines || []).map((line) => ({
    ...line,
    side: line.side === 'debit' ? 'credit' : 'debit',
    memo: reason,
  }))
  const { totalDebit, totalCredit } = normalizeLines(lines)

  return {
    id: idFactory('je'),
    transactionId: postedEntry?.transactionId || null,
    transactionType: 'reversal',
    status: 'posted',
    postedAt,
    periodKey: createPeriodKey(postedAt),
    createdBy: actor?.id || actor?.uid || null,
    memo: reason,
    reference: postedEntry?.id || null,
    reversedEntryId: postedEntry?.id || null,
    currency: postedEntry?.currency || 'NAD',
    entityId: postedEntry?.entityId || null,
    lines,
    totalDebit,
    totalCredit,
  }
}
