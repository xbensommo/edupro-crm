/**
 * @file src/apps/finance/services/financeReportService.js
 * @description Ledger-derived finance reporting helpers.
 */

import { DEFAULT_SYSTEM_ACCOUNTS, mergeAccountCatalog, normalizeSystemAccountKey } from './financeChartOfAccounts.js'

function createAccountMap(accounts = DEFAULT_SYSTEM_ACCOUNTS) {
  const map = new Map()

  for (const account of mergeAccountCatalog(accounts)) {
    const keys = [account?.id, account?.systemKey, account?.accountCode, account?.code]
    for (const key of keys) {
      const normalized = normalizeSystemAccountKey(key)
      if (normalized) map.set(normalized, account)
      if (key) map.set(String(key), account)
    }
  }

  return map
}

function toDateKey(value) {
  if (!value) return ''
  if (typeof value === 'string') return value.slice(0, 10)
  if (typeof value?.toDate === 'function') {
    const date = value.toDate()
    return Number.isNaN(date.getTime()) ? '' : date.toISOString().slice(0, 10)
  }
  const date = value instanceof Date ? value : new Date(value)
  return Number.isNaN(date.getTime()) ? '' : date.toISOString().slice(0, 10)
}

export function filterEntriesByRange(entries, range = {}) {
  const from = range.from || null
  const to = range.to || null

  return entries.filter((entry) => {
    const postedAt = toDateKey(entry.postedAt)
    if (!postedAt) return false
    if (from && postedAt < from) return false
    if (to && postedAt > to) return false
    return entry.status === 'posted' || entry.status === 'reversal'
  })
}

function toSignedAmount(line, account) {
  return line.side === account.normalSide ? Number(line.amount || 0) : -Number(line.amount || 0)
}

function bucketToRows(bucket) {
  return [...bucket.entries()]
    .map(([accountId, entry]) => ({
      accountId,
      code: entry.account.code || entry.account.accountCode,
      name: entry.account.name,
      amount: Number(entry.amount.toFixed(2)),
    }))
    .filter((row) => row.amount !== 0)
    .sort((a, b) => String(a.code || '').localeCompare(String(b.code || '')))
}

function resolveLineAccount(accountMap, accountId) {
  const direct = String(accountId || '').trim()
  if (!direct) return null
  return accountMap.get(direct) || accountMap.get(normalizeSystemAccountKey(direct)) || null
}

export function buildTrialBalance(entries, accounts = DEFAULT_SYSTEM_ACCOUNTS) {
  const accountMap = createAccountMap(accounts)
  const totals = new Map()

  for (const entry of entries) {
    for (const line of entry.lines || []) {
      const account = resolveLineAccount(accountMap, line.accountId) || { id: line.accountId, code: line.accountId, name: line.accountId }
      const accountKey = account.id || account.accountCode || account.code || line.accountId
      const current = totals.get(accountKey) || { debit: 0, credit: 0, account }
      current[line.side] += Number(line.amount || 0)
      totals.set(accountKey, current)
    }
  }

  const rows = [...totals.entries()].map(([accountId, amounts]) => ({
    accountId,
    code: amounts.account.code || amounts.account.accountCode,
    name: amounts.account.name,
    debit: Number(amounts.debit.toFixed(2)),
    credit: Number(amounts.credit.toFixed(2)),
  }))

  const totalDebit = Number(rows.reduce((sum, row) => sum + row.debit, 0).toFixed(2))
  const totalCredit = Number(rows.reduce((sum, row) => sum + row.credit, 0).toFixed(2))

  return { rows, totalDebit, totalCredit }
}

export function buildIncomeStatement(entries, accounts = DEFAULT_SYSTEM_ACCOUNTS) {
  const accountMap = createAccountMap(accounts)
  const revenueBucket = new Map()
  const expenseBucket = new Map()

  for (const entry of entries) {
    for (const line of entry.lines || []) {
      const account = resolveLineAccount(accountMap, line.accountId)
      if (!account) continue

      const bucketKey = account.id || account.accountCode || account.code

      if (account.type === 'revenue') {
        const current = revenueBucket.get(bucketKey) || { amount: 0, account }
        current.amount += line.side === 'credit' ? Number(line.amount || 0) : -Number(line.amount || 0)
        revenueBucket.set(bucketKey, current)
      }

      if (account.type === 'expense') {
        const current = expenseBucket.get(bucketKey) || { amount: 0, account }
        current.amount += line.side === 'debit' ? Number(line.amount || 0) : -Number(line.amount || 0)
        expenseBucket.set(bucketKey, current)
      }
    }
  }

  const revenueRows = bucketToRows(revenueBucket)
  const expenseRows = bucketToRows(expenseBucket)
  const revenue = Number(revenueRows.reduce((sum, row) => sum + row.amount, 0).toFixed(2))
  const expenses = Number(expenseRows.reduce((sum, row) => sum + row.amount, 0).toFixed(2))

  return {
    revenue,
    expenses,
    netIncome: Number((revenue - expenses).toFixed(2)),
    revenueRows,
    expenseRows,
  }
}

export function buildBalanceSheet(entries, accounts = DEFAULT_SYSTEM_ACCOUNTS) {
  const accountMap = createAccountMap(accounts)
  const buckets = { asset: new Map(), liability: new Map(), equity: new Map() }

  for (const entry of entries) {
    for (const line of entry.lines || []) {
      const account = resolveLineAccount(accountMap, line.accountId)
      if (!account) continue
      if (!buckets[account.type]) continue

      const bucketKey = account.id || account.accountCode || account.code
      const current = buckets[account.type].get(bucketKey) || { amount: 0, account }
      current.amount += toSignedAmount(line, account)
      buckets[account.type].set(bucketKey, current)
    }
  }

  const assets = bucketToRows(buckets.asset)
  const liabilities = bucketToRows(buckets.liability)
  const equity = bucketToRows(buckets.equity)
  const totalAssets = Number(assets.reduce((sum, row) => sum + row.amount, 0).toFixed(2))
  const totalLiabilities = Number(liabilities.reduce((sum, row) => sum + row.amount, 0).toFixed(2))
  const totalEquity = Number(equity.reduce((sum, row) => sum + row.amount, 0).toFixed(2))

  return {
    assets,
    liabilities,
    equity,
    totalAssets,
    totalLiabilities,
    totalEquity,
    liabilitiesAndEquity: Number((totalLiabilities + totalEquity).toFixed(2)),
  }
}

export function buildExpenseStatement(entries, accounts = DEFAULT_SYSTEM_ACCOUNTS) {
  const expenseRows = buildIncomeStatement(entries, accounts).expenseRows
  return {
    rows: expenseRows,
    totalExpenses: Number(expenseRows.reduce((sum, row) => sum + row.amount, 0).toFixed(2)),
  }
}

export function buildBalanceSnapshot(entries, accounts = DEFAULT_SYSTEM_ACCOUNTS) {
  const balanceSheet = buildBalanceSheet(entries, accounts)
  return {
    assets: balanceSheet.totalAssets,
    liabilities: balanceSheet.totalLiabilities,
    equity: balanceSheet.totalEquity,
  }
}

function invoiceBalance(invoice) {
  const total = Number(invoice?.totalAmount || 0)
  const allocated = Number(invoice?.allocatedAmount ?? invoice?.paidAmount ?? 0)
  const storedBalance = invoice?.balanceAmount
  return Number(Math.max(Number(storedBalance ?? (total - allocated)), 0).toFixed(2))
}

export function buildReceivablesReport(invoices = [], allocations = []) {
  const activeInvoices = invoices.filter((invoice) => !['cancelled', 'reversed'].includes(String(invoice?.status || '').toLowerCase()))
  const activeAllocations = allocations.filter((allocation) => String(allocation?.status || 'active').toLowerCase() === 'active')
  const allocatedByInvoice = new Map()

  for (const allocation of activeAllocations) {
    const invoiceId = allocation.invoiceId
    if (!invoiceId) continue
    allocatedByInvoice.set(invoiceId, Number(((allocatedByInvoice.get(invoiceId) || 0) + Number(allocation.amount || 0)).toFixed(2)))
  }

  const rows = activeInvoices.map((invoice) => {
    const allocatedAmount = Number((allocatedByInvoice.get(invoice.id) ?? invoice.allocatedAmount ?? invoice.paidAmount ?? 0).toFixed(2))
    const balanceAmount = Number(Math.max(Number(invoice.totalAmount || 0) - allocatedAmount, 0).toFixed(2))
    return {
      invoiceId: invoice.id,
      invoiceCode: invoice.invoiceCode,
      clientId: invoice.clientId,
      clientLabel: invoice.clientLabel || invoice.clientId,
      engagementId: invoice.engagementId || null,
      engagementCode: invoice.engagementCode || '',
      issueDate: invoice.issueDate || null,
      dueDate: invoice.dueDate || null,
      status: balanceAmount === 0 ? 'paid' : invoice.status,
      totalAmount: Number(Number(invoice.totalAmount || 0).toFixed(2)),
      allocatedAmount,
      balanceAmount,
      currency: invoice.currency || 'NAD',
    }
  })

  const openRows = rows.filter((row) => row.balanceAmount > 0)
  return {
    rows: rows.sort((a, b) => String(b.issueDate || '').localeCompare(String(a.issueDate || ''))),
    openRows: openRows.sort((a, b) => String(a.dueDate || '').localeCompare(String(b.dueDate || ''))),
    totalInvoiced: Number(rows.reduce((sum, row) => sum + row.totalAmount, 0).toFixed(2)),
    totalAllocated: Number(rows.reduce((sum, row) => sum + row.allocatedAmount, 0).toFixed(2)),
    totalOutstanding: Number(openRows.reduce((sum, row) => sum + row.balanceAmount, 0).toFixed(2)),
    overdueCount: openRows.filter((row) => row.dueDate && row.dueDate.slice(0, 10) < new Date().toISOString().slice(0, 10)).length,
  }
}
